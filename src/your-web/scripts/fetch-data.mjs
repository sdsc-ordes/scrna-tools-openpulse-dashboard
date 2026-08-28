#!/usr/bin/env node
// Build-time data snapshot for the scRNA-seq / spatial transcriptomics tool
// comparison dashboard. Queries Open Pulse (CHAOSS + SPARQL) with the same
// .env conventions and HTTP transports as the `query-*` skill scripts —
// credentials stay here, at build time; the browser never talks to the stores.
// Recipe: .claude/SKILLS.md §10. Plan: DASHBOARD.md.

import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = join(HERE, '..');
const DATA_DIR = join(APP_ROOT, 'src', 'data');

async function loadDotenv() {
	for (let dir of [process.cwd(), HERE]) {
		for (let i = 0; i < 10; i++) {
			const envPath = join(dir, '.env');
			try {
				await stat(envPath);
				const text = await readFile(envPath, 'utf8');
				for (const line of text.split('\n')) {
					const trimmed = line.trim();
					if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
					const idx = trimmed.indexOf('=');
					const key = trimmed.slice(0, idx).trim();
					const value = trimmed.slice(idx + 1).trim();
					if (process.env[key] === undefined) process.env[key] = value;
				}
				return;
			} catch {
				const parent = dirname(dir);
				if (parent === dir) break;
				dir = parent;
			}
		}
	}
}

function authHeader() {
	const auth = process.env.OPENPULSE_AUTH;
	if (!auth || !auth.includes('/')) {
		throw new Error('OPENPULSE_AUTH (user/password) must be set in .env');
	}
	const [user, ...rest] = auth.split('/');
	const token = Buffer.from(`${user}:${rest.join('/')}`).toString('base64');
	return `Basic ${token}`;
}

function endpoint() {
	const ep = process.env.OPENPULSE_ENDPOINT;
	if (!ep) throw new Error('OPENPULSE_ENDPOINT must be set in .env');
	return ep.replace(/\/$/, '');
}

async function chaossRepo(owner, repo, window) {
	const url = `${endpoint()}/api/v1/metrics/chaoss/repositories/github.com/${owner}/${repo}/metrics${window ? `?window=${window}` : ''}`;
	const res = await fetch(url, { headers: { Authorization: authHeader(), Accept: 'application/json' } });
	const text = await res.text();
	if (!res.ok) throw new Error(`CHAOSS ${owner}/${repo}${window ? ` (window=${window})` : ''}: http ${res.status}: ${text.slice(0, 300)}`);
	const data = JSON.parse(text);
	const bySlug = {};
	for (const m of data.metrics ?? []) bySlug[m.slug] = m;
	return bySlug;
}

// The bulk /metrics call has NO per-metric default window — omitting `window`
// snaps every time-based metric to the API's own ceiling (3650 days, i.e.
// ~lifetime), not sensible per-metric defaults (verified live: vitessce
// contributors read "38" unwindowed vs the true 365d value of "10"). Every
// metric this dashboard shows with a "12 months" label is requested at
// window=365 explicitly; everything else here is a true snapshot (window has
// no effect — verified byte-identical for docs_discoverability,
// upstream_dependencies, project_popularity, license_coverage).
async function chaossRepoAllWindows(owner, repo) {
	const [lifetime, w365] = await Promise.all([chaossRepo(owner, repo), chaossRepo(owner, repo, 365)]);
	return { lifetime, w365 };
}

async function chaossActivitySeries(owner, repo) {
	// activity_dates alone, pinned to window=365 (the plan's "last 12 months"
	// sparkline) — the whole-repo call above defaults this to a 10-year
	// window instead (verified: window_days snaps to 3650 with no override).
	const url = `${endpoint()}/api/v1/metrics/chaoss/repositories/github.com/${owner}/${repo}/metrics/activity_dates?include=series&window=365`;
	const res = await fetch(url, { headers: { Authorization: authHeader(), Accept: 'application/json' } });
	const text = await res.text();
	if (!res.ok) throw new Error(`CHAOSS activity_dates ${owner}/${repo}: http ${res.status}: ${text.slice(0, 300)}`);
	return JSON.parse(text);
}

async function sparqlStarsForksLicenses(repoUrls) {
	const values = repoUrls.map((u) => `<${u}>`).join(' ');
	const query = `PREFIX op: <https://open-pulse.epfl.ch/ontology#>
PREFIX gme: <https://openpulse.science/git-metadata-extractor#>
SELECT ?r (MAX(?stars) AS ?maxstars) (MAX(?forks) AS ?maxforks) (SAMPLE(?license) AS ?anylicense) WHERE {
  VALUES ?r { ${values} }
  OPTIONAL { ?r op:githubRepoStars ?stars }
  OPTIONAL { ?r op:githubRepoForks ?forks }
  OPTIONAL { ?r gme:license_name ?license }
} GROUP BY ?r`;
	const res = await fetch(`${endpoint()}/sparql/query`, {
		method: 'POST',
		headers: {
			Authorization: authHeader(),
			'Content-Type': 'application/sparql-query',
			Accept: 'application/sparql-results+json',
		},
		body: query,
	});
	const text = await res.text();
	if (!res.ok) throw new Error(`SPARQL: http ${res.status}: ${text.slice(0, 300)}`);
	const json = JSON.parse(text);
	const out = {};
	for (const row of json.results.bindings) {
		out[row.r.value] = {
			stars: row.maxstars ? Number(row.maxstars.value) : null,
			forks: row.maxforks ? Number(row.maxforks.value) : null,
			license: row.anylicense ? row.anylicense.value : null,
		};
	}
	return out;
}

// Running all 16 repos' cohort queries (2 OpenSearch requests each) fully in
// parallel — on top of the existing CHAOSS/SPARQL calls — pushed simultaneous
// outbound requests past what the gateway/proxy reliably holds open and
// intermittently failed with a bare "fetch failed". Cap concurrency instead.
async function mapLimit(items, limit, fn) {
	const results = new Array(items.length);
	let next = 0;
	async function worker() {
		while (next < items.length) {
			const i = next++;
			results[i] = await fn(items[i], i);
		}
	}
	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
	return results;
}

async function neo4jQuery(cypher) {
	const res = await fetch(`${endpoint()}/api/databases/cypher/query`, {
		method: 'POST',
		headers: { Authorization: authHeader(), 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify({ query: cypher }),
	});
	const text = await res.text();
	if (!res.ok) throw new Error(`Neo4j: http ${res.status}: ${text.slice(0, 300)}`);
	const json = JSON.parse(text);
	return (json.rows ?? []).map((r) => Object.fromEntries(json.columns.map((c, i) => [c, r[i]])));
}

// CHAOSS's project_popularity/upstream_dependencies only expose a headline
// count plus a handful of capped examples (8 max, regardless of the true
// total) — not enough to let a reader see the full list. Query Neo4j directly
// for the complete inbound/outbound DEPENDS_ON sets instead; the count is
// then this list's own length, so value and list can never disagree the way
// a CHAOSS count vs its truncated `examples[]` could.
async function repoDependencyLists(githubUrl) {
	const [dependents, dependencies] = await Promise.all([
		neo4jQuery(
			`MATCH (dep:Repo)-[:DEPENDS_ON]->(r:Repo {full_name: '${githubUrl}'}) RETURN dep.full_name AS name ORDER BY name LIMIT 1000`
		),
		neo4jQuery(
			`MATCH (r:Repo {full_name: '${githubUrl}'})-[:DEPENDS_ON]->(dep:Repo) RETURN dep.full_name AS name ORDER BY name LIMIT 1000`
		),
	]);
	return {
		dependents: dependents.map((r) => r.name),
		dependencies: dependencies.map((r) => r.name),
	};
}

async function opensearchDsl(index, body) {
	const res = await fetch(`${endpoint()}/api/databases/opensearch/query`, {
		method: 'POST',
		headers: { Authorization: authHeader(), 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify({ mode: 'dsl', query: { ...body, index } }),
	});
	const text = await res.text();
	if (!res.ok) throw new Error(`OpenSearch ${index}: http ${res.status}: ${text.slice(0, 300)}`);
	const json = JSON.parse(text);
	return (json.rows ?? []).map((r) => Object.fromEntries(json.columns.map((c, i) => [c, r[i]])));
}

// No CHAOSS metric gives per-author identity over time: project_demographics
// is an all-time snapshot with no per-author identity in its response (and
// its dormancy cutoff — 180 days — isn't the 12-month one this dashboard
// wants), and new_contributors is a bare count with no series. So this
// queries the raw commit index (same git_demo_enriched CHAOSS itself reads
// for absence_factor/demographics) directly and computes two views from one
// underlying per-author aggregation (each author's all-time commit total,
// first-ever commit date, and last commit date):
//
//   1. `demographics` — total contributor count plus a 4-bucket lifespan
//      classification: core (fewest contributors covering 80% of all-time
//      commits — CHAOSS's own threshold), recent (first commit in the last
//      90 days), dormant (not core/recent, no commit in the last 12 months —
//      this dashboard's own cutoff, not CHAOSS's 180-day one), active
//      (everyone else — committed within 12 months, not core, not a newcomer).
//   2. `cohortSeries` — monthly commits over the tool's FULL lifespan (first
//      commit month through now), stacked by "new" (debut month), "core", or
//      "other" (returning, non-core) — mutually exclusive, new wins.
async function contributorLifespanData(owner, repo, referenceDate = new Date()) {
	const githubUrl = `https://github.com/${owner}/${repo}`;

	const allTime = await opensearchDsl('git_demo_enriched', {
		size: 0,
		query: { term: { repo_name: githubUrl } },
		aggs: {
			authors: {
				terms: { field: 'author_uuid', size: 500 },
				aggs: {
					first: { min: { field: 'grimoire_creation_date' } },
					last: { max: { field: 'grimoire_creation_date' } },
				},
			},
		},
	});

	if (!allTime.length) return { demographics: null, cohortSeries: null, cohortTotals: null }; // no commit history indexed under this exact repo_name

	const totalCommits = allTime.reduce((sum, a) => sum + a.doc_count, 0);
	const ranked = [...allTime].sort((a, b) => b.doc_count - a.doc_count);
	let cumulative = 0;
	const coreIds = new Set();
	for (const a of ranked) {
		if (cumulative >= totalCommits * 0.8) break;
		coreIds.add(a.authors);
		cumulative += a.doc_count;
	}

	const RECENT_ARRIVAL_DAYS = 90;
	const DORMANT_DAYS = 365; // 12 months — this dashboard's cutoff, not CHAOSS's default 180
	const MS_PER_DAY = 24 * 60 * 60 * 1000;
	const recentCutoff = referenceDate.getTime() - RECENT_ARRIVAL_DAYS * MS_PER_DAY;
	const dormantCutoff = referenceDate.getTime() - DORMANT_DAYS * MS_PER_DAY;

	let core = 0;
	let recent = 0;
	let dormant = 0;
	let active = 0;
	for (const a of allTime) {
		if (coreIds.has(a.authors)) {
			core++;
		} else if (new Date(a.first).getTime() >= recentCutoff) {
			recent++;
		} else if (new Date(a.last).getTime() < dormantCutoff) {
			dormant++;
		} else {
			active++;
		}
	}
	const demographics = {
		total: allTime.length,
		segments: [
			{ label: 'core', value: core, tone: 'good' },
			{ label: 'active', value: active, tone: 'info' },
			{ label: 'recent', value: recent, tone: 'warn' },
			{ label: 'dormant', value: dormant, tone: 'danger' },
		],
	};

	const firstCommitMonth = new Map(allTime.map((a) => [a.authors, a.first.slice(0, 7)]));
	const earliestCommit = allTime.reduce((min, a) => (a.first < min ? a.first : min), allTime[0].first);
	const start = new Date(earliestCommit);
	const monthsSpan =
		(referenceDate.getUTCFullYear() - start.getUTCFullYear()) * 12 + (referenceDate.getUTCMonth() - start.getUTCMonth()) + 1;

	const windowed = await opensearchDsl('git_demo_enriched', {
		size: 0,
		query: { term: { repo_name: githubUrl } },
		aggs: {
			months: {
				date_histogram: { field: 'grimoire_creation_date', calendar_interval: 'month' },
				aggs: { authors: { terms: { field: 'author_uuid', size: 200 } } },
			},
		},
	});

	const grid = new Map();
	for (let i = monthsSpan - 1; i >= 0; i--) {
		const d = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() - i, 1));
		const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
		grid.set(key, { date: key, core: 0, other: 0, new: 0 });
	}
	for (const row of windowed) {
		const bucket = grid.get(row.months.slice(0, 7));
		if (!bucket) continue;
		if (firstCommitMonth.get(row.authors) === row.months.slice(0, 7)) bucket.new += row.doc_count;
		else if (coreIds.has(row.authors)) bucket.core += row.doc_count;
		else bucket.other += row.doc_count;
	}

	// Person-level counts for the histogram's own three categories (distinct
	// from the commit-level "core"/"other"/"new" per bar): everyone in
	// coreIds is "core"; "new this month" is whoever's debut fell in the
	// chart's final (most recent, i.e. current) month — the histogram's own
	// definition of "new," not "ever been new" (which would just be everyone);
	// everyone else is "other returning". Mutually exclusive, sums to total.
	const mostRecentMonth = [...grid.keys()].at(-1);
	let newThisMonth = 0;
	for (const month of firstCommitMonth.values()) {
		if (month === mostRecentMonth) newThisMonth++;
	}
	const cohortTotals = {
		total: allTime.length,
		core: coreIds.size,
		new: newThisMonth,
		other: allTime.length - coreIds.size - newThisMonth,
	};

	return { demographics, cohortSeries: [...grid.values()], cohortTotals };
}

// CHAOSS's activity_dates series only lists months with >=1 commit — sparse,
// not a dense monthly grid. Plotted as-is, a repo with e.g. one nonzero month
// draws as a single point stretched across the whole sparkline width, which
// reads as a trend that never happened. Fill the full 12-month calendar grid
// with zeros so spacing on the x-axis is always honest.
function monthlyGrid(series, months = 12, referenceDate = new Date()) {
	const byMonth = new Map((series ?? []).map((p) => [p.date, p.value]));
	const grid = [];
	for (let i = months - 1; i >= 0; i--) {
		const d = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() - i, 1));
		const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
		grid.push({ date: key, value: byMonth.get(key) ?? 0 });
	}
	return grid;
}

// --- Shortlist, per DASHBOARD.md ---------------------------------------

const WELL_COVERED = [
	['vitessce', 'vitessce'],
	['haniffalab', 'webatlas-app'],
	['haniffalab', 'webatlas-pipeline'],
	['jianhong', 'scRNAseqApp'],
	['lilab-bcb', 'cirrocumulus'],
	['FredPont', 'spatial'],
	['kanaverse', 'kana'],
	['pughlab', 'crescent'],
	['biolab', 'orange3-single-cell'],
	['iSEE', 'iSEE'],
	['immcore', 'iS-CellR'],
	['romanhaa', 'Cerebro'],
	['euxhenh', 'cellar'],
	['MonashBioinformaticsPlatform', 'ShinyCellModular'],
	['longrw', 'OmniCellX'],
	['Taylor-CCB-Group', 'MDV'],
];

const THIN = [
	['ucscGenomeBrowser', 'cellBrowser'],
	['kharchenkolab', 'pagoda2'],
	['chaichontat', 'samui'],
	['DeplanckeLab', 'asap_web'],
	['spatial-research', 'semla'],
	['kanaverse', 'bakana'],
	['romanhaa', 'cerebroApp'],
	['pughlab', 'crescent-frontend'],
];

function slugify(owner, repo) {
	return `${owner}-${repo}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
}

function val(metric, fallback = null) {
	if (!metric) return fallback;
	return metric.value === '—' ? fallback : metric.value;
}

async function main() {
	await loadDotenv();
	await mkdir(DATA_DIR, { recursive: true });

	console.log(`Fetching CHAOSS metrics for ${WELL_COVERED.length} well-covered repos...`);
	const buildDate = new Date(); // pinned once so every date-anchored computation lines up
	const repoUrls = WELL_COVERED.map(([o, r]) => `https://github.com/${o}/${r}`);
	// Phase 1: CHAOSS (2 window variants per repo, see chaossRepoAllWindows)
	// alongside the commit sparkline and SPARQL stars/forks/license.
	const [chaossResults, activityResults, sparqlResults] = await Promise.all([
		mapLimit(WELL_COVERED, 4, ([owner, repo]) => chaossRepoAllWindows(owner, repo)),
		Promise.all(WELL_COVERED.map(([owner, repo]) => chaossActivitySeries(owner, repo))),
		sparqlStarsForksLicenses(repoUrls),
	]);
	// Phase 2: the heavier raw OpenSearch lifespan aggregation and the Neo4j
	// dependency-list queries, kept separate and concurrency-capped — running
	// everything in one giant Promise.all previously caused intermittent
	// connection failures under the combined load.
	const [lifespanResults, dependencyResults] = await Promise.all([
		mapLimit(WELL_COVERED, 4, ([owner, repo]) => contributorLifespanData(owner, repo, buildDate)),
		mapLimit(WELL_COVERED, 4, ([owner, repo]) => repoDependencyLists(`https://github.com/${owner}/${repo}`)),
	]);

	const tools = WELL_COVERED.map(([owner, repo], i) => {
		const { lifetime: m, w365 } = chaossResults[i];
		const activity = activityResults[i];
		const { demographics, cohortSeries, cohortTotals } = lifespanResults[i];
		const deps = dependencyResults[i];
		const githubUrl = `https://github.com/${owner}/${repo}`;
		const sparql = sparqlResults[githubUrl] ?? {};
		const closureRatio = val(w365.closure_ratio);
		const crReviews = val(w365.cr_reviews);
		const prDataAvailable = closureRatio !== null || crReviews !== null;

		// Advanced CHAOSS metrics added after a live 35-metric coverage check
		// across the 16 well-covered repos (see DASHBOARD.md) — each has real,
		// non-flat values for this tool category, unlike licenses_declared,
		// technical_fork, bot_activity, and cr_accepted/cr_declined, which were
		// checked at the same time and dropped for being flat or redundant.
		// CHAOSS's bulk response always includes every metric's envelope, even
		// when its own `value` is "—" (no data) — so `metric` itself is truthy
		// far more often than it has real data. Null out on the resolved value,
		// not the wrapper, or a "not computable" metric renders as a tile
		// reading "—" instead of being omitted (and the whole-card "no recent
		// activity" collapse below never triggers).
		const withSecondary = (metric) => {
			const value = val(metric);
			return value !== null ? { value, secondary: metric.secondary ?? null } : null;
		};

		return {
			slug: slugify(owner, repo),
			owner,
			repo,
			githubUrl,
			metrics: {
				busFactor: val(w365.absence_factor),
				contributors: val(w365.contributors),
				stars: sparql.stars,
				docsScore: val(m.docs_discoverability),
				commitSparkline: monthlyGrid(activity.series),
				commitsTotal: activity.value === '—' ? null : activity.value,
			},
			detail: {
				// Full-lifespan contributor classification (core/active/recent/
				// dormant) and total contributor count — our own computation, not
				// CHAOSS's Project Demographics (see contributorLifespanData above).
				demographics,
				// Per-contributor commit share, straight from absence_factor's own
				// rank_bars visual — the same computation that derives bus factor,
				// so a factor of 1 next to a 51/49 split reads honestly instead of
				// looking identical to a true single-maintainer project. Null
				// whenever busFactor itself is null (no commits in the window).
				contributorShares: w365.absence_factor?.visual?.bars?.length
					? w365.absence_factor.visual.bars.map((b) => ({ label: b.label, commits: b.value, share: b.share }))
					: null,
				// Monthly commits over the tool's full lifespan, split into core /
				// other (returning, non-core) / new (debut month) — see
				// contributorLifespanData() above.
				contributorCohorts: cohortSeries,
				// Person-level counts for the same three categories (not commit
				// counts) — how many distinct contributors are core, how many are
				// other/returning, how many debuted in the most recent month.
				contributorCohortTotals: cohortTotals,
				forks: sparql.forks,
				license: sparql.license ?? (val(m.license_coverage) === '✗' ? 'None declared' : val(m.license_coverage)),
				// Full inbound/outbound DEPENDS_ON lists from Neo4j directly (see
				// repoDependencyLists above) — value is just the list length, so it
				// can never disagree with what the expandable list actually shows.
				dependencies: { value: deps.dependencies.length, examples: deps.dependencies },
				dependents: { value: deps.dependents.length, examples: deps.dependents },
				burstiness: withSecondary(w365.burstiness),
				codeLines: withSecondary(w365.code_lines),
				prReview: prDataAvailable
					? { closureRatio, reviews: crReviews, timeToClose: val(w365.pr_time_to_close), selfMerge: val(w365.self_merge) }
					: null,
			},
		};
	});

	const coverage = THIN.map(([owner, repo]) => ({
		owner,
		repo,
		githubUrl: `https://github.com/${owner}/${repo}`,
	}));

	const fetchedAt = new Date().toISOString();

	await writeFile(
		join(DATA_DIR, 'tools.json'),
		JSON.stringify({ fetchedAt, source: 'Open Pulse (openpulse.epfl.ch) — CHAOSS API + SPARQL', tools }, null, 2)
	);
	await writeFile(
		join(DATA_DIR, 'coverage.json'),
		JSON.stringify(
			{
				fetchedAt,
				note: 'Repos in the original shortlist not yet indexed by Open Pulse — no commit history, star/fork data, or CHAOSS metrics available.',
				repos: coverage,
			},
			null,
			2
		)
	);

	console.log(`Wrote ${tools.length} tools -> src/data/tools.json`);
	console.log(`Wrote ${coverage.length} not-yet-indexed repos -> src/data/coverage.json`);

	// Sanity check against Stage 3 recon before calling this done.
	const missingBusFactor = tools.filter((t) => t.metrics.busFactor === null).length;
	const missingStars = tools.filter((t) => t.metrics.stars === null).length;
	const missingDocs = tools.filter((t) => t.metrics.docsScore === null).length;
	const withPrData = tools.filter((t) => t.detail.prReview !== null).length;
	const withBurstiness = tools.filter((t) => t.detail.burstiness !== null).length;
	const withCodeLines = tools.filter((t) => t.detail.codeLines !== null).length;
	const withContributorShares = tools.filter((t) => t.detail.contributorShares !== null).length;
	const withDemographics = tools.filter((t) => t.detail.demographics !== null).length;
	const withCohorts = tools.filter((t) => t.detail.contributorCohorts !== null).length;
	const withDependents = tools.filter((t) => t.detail.dependents.value > 0).length;
	const withDependencies = tools.filter((t) => t.detail.dependencies.value > 0).length;
	console.log(
		`Coverage check — busFactor missing: ${missingBusFactor}/16 (genuinely windowed to 365d — some repos ` +
			`really do have zero commits in the last year), stars missing: ${missingStars}/16, docsScore missing: ${missingDocs}/16`
	);
	console.log(
		`Recent development activity (12-month window, all metrics): PR review data present: ${withPrData}/16, ` +
			`burstiness: ${withBurstiness}/16, codeLines: ${withCodeLines}/16 — all null together on a repo with ` +
			`zero commits in the last 12 months, which the UI shows as a single disclaimer`
	);
	console.log(
		`contributorShares (12mo, tied to bus factor): ${withContributorShares}/16; demographics/cohorts ` +
			`(full lifespan, raw OpenSearch): ${withDemographics}/16 and ${withCohorts}/16 (expect all three ` +
			`16/16 except repos with literally zero indexed commits)`
	);
	console.log(
		`Full dependency lists (Neo4j, uncapped) — downstream dependents present: ${withDependents}/16 (sparse ` +
			`by nature, most of these tools are terminal apps not libraries); direct dependencies present: ` +
			`${withDependencies}/16`
	);
}

main().catch((e) => {
	console.error(e.message);
	process.exit(1);
});
