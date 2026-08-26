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

async function chaossRepo(owner, repo) {
	// No explicit `window` here — each metric falls back to its own documented
	// default (contributors/absence_factor 365d, committers 90d, closure_ratio
	// 30d, …). A single `window=` query param would override ALL of them to
	// the same value, which is wrong for a payload mixing several windows.
	const url = `${endpoint()}/api/v1/metrics/chaoss/repositories/github.com/${owner}/${repo}/metrics`;
	const res = await fetch(url, { headers: { Authorization: authHeader(), Accept: 'application/json' } });
	const text = await res.text();
	if (!res.ok) throw new Error(`CHAOSS ${owner}/${repo}: http ${res.status}: ${text.slice(0, 300)}`);
	const data = JSON.parse(text);
	const bySlug = {};
	for (const m of data.metrics ?? []) bySlug[m.slug] = m;
	return bySlug;
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
	const repoUrls = WELL_COVERED.map(([o, r]) => `https://github.com/${o}/${r}`);
	const [chaossResults, activityResults, sparqlResults] = await Promise.all([
		Promise.all(WELL_COVERED.map(([owner, repo]) => chaossRepo(owner, repo))),
		Promise.all(WELL_COVERED.map(([owner, repo]) => chaossActivitySeries(owner, repo))),
		sparqlStarsForksLicenses(repoUrls),
	]);

	const tools = WELL_COVERED.map(([owner, repo], i) => {
		const m = chaossResults[i];
		const activity = activityResults[i];
		const githubUrl = `https://github.com/${owner}/${repo}`;
		const sparql = sparqlResults[githubUrl] ?? {};
		const closureRatio = val(m.closure_ratio);
		const crReviews = val(m.cr_reviews);
		const prDataAvailable = closureRatio !== null || crReviews !== null;

		// Advanced CHAOSS metrics added after a live 35-metric coverage check
		// across the 16 well-covered repos (see DASHBOARD.md) — each has real,
		// non-flat values for this tool category, unlike licenses_declared,
		// technical_fork, bot_activity, and cr_accepted/cr_declined, which were
		// checked at the same time and dropped for being flat or redundant.
		const withSecondary = (metric) => (metric ? { value: val(metric), secondary: metric.secondary ?? null } : null);

		return {
			slug: slugify(owner, repo),
			owner,
			repo,
			githubUrl,
			metrics: {
				busFactor: val(m.absence_factor),
				contributors: val(m.contributors),
				stars: sparql.stars,
				docsScore: val(m.docs_discoverability),
				commitSparkline: monthlyGrid(activity.series),
				commitsTotal: activity.value === '—' ? null : activity.value,
			},
			detail: {
				demographics: m.project_demographics
					? {
							total: val(m.project_demographics),
							secondary: m.project_demographics.secondary ?? null,
							segments: m.project_demographics.visual?.segments ?? [],
					  }
					: null,
				committers: val(m.committers),
				occasionalContributors: withSecondary(m.occasional_contributors),
				forks: sparql.forks,
				license: sparql.license ?? (val(m.license_coverage) === '✗' ? 'None declared' : val(m.license_coverage)),
				dependencies: val(m.upstream_dependencies),
				burstiness: withSecondary(m.burstiness),
				codeLines: withSecondary(m.code_lines),
				prReview: prDataAvailable
					? { closureRatio, reviews: crReviews, timeToClose: val(m.pr_time_to_close), selfMerge: val(m.self_merge) }
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
	const withOccasional = tools.filter((t) => t.detail.occasionalContributors !== null).length;
	const withSelfMerge = tools.filter((t) => t.detail.prReview && t.detail.prReview.selfMerge !== null).length;
	const withTimeToClose = tools.filter((t) => t.detail.prReview && t.detail.prReview.timeToClose !== null).length;
	console.log(
		`Coverage check — busFactor missing: ${missingBusFactor}/16, stars missing: ${missingStars}/16, ` +
			`docsScore missing: ${missingDocs}/16, PR review data present: ${withPrData}/16 (expect ~12/16)`
	);
	console.log(
		`Advanced metrics coverage — burstiness: ${withBurstiness}/16, codeLines: ${withCodeLines}/16, ` +
			`occasionalContributors: ${withOccasional}/16 (expect 16/16 each); self-merge: ${withSelfMerge}/16, ` +
			`PR time-to-close: ${withTimeToClose}/16 (expect ~11-12/16, same PR-tracker subset)`
	);
}

main().catch((e) => {
	console.error(e.message);
	process.exit(1);
});
