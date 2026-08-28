import { escapeHtml, fmt, activityOrNone, provenance, badge, disclosureList } from './helpers.mjs';

const TONE_VAR = {
	good: 'var(--op-success)',
	info: 'var(--op-blue-light)',
	warn: 'var(--op-warning)',
	danger: 'var(--op-error)',
};

// Full-lifespan contributor classification (core/active/recent/dormant) —
// see contributorLifespanData() in fetch-data.mjs. Dormant here means no
// commit in the last 12 months, not CHAOSS's own 180-day default.
function demographicsBar(demographics) {
	if (!demographics || !demographics.segments?.length) {
		return `<p class="op-sm muted">Not computable — no commit history indexed for this repo.</p>`;
	}
	const total = demographics.segments.reduce((sum, s) => sum + s.value, 0) || 1;
	const bars = demographics.segments
		.map((s) => `<div style="width:${((s.value / total) * 100).toFixed(1)}%;background:${TONE_VAR[s.tone] ?? 'var(--op-text-faint)'}"></div>`)
		.join('');
	const legend = demographics.segments
		.map(
			(s) =>
				`<span><span class="swatch" style="background:${TONE_VAR[s.tone] ?? 'var(--op-text-faint)'}"></span>${escapeHtml(s.label)}: ${s.value}</span>`
		)
		.join('');
	return `<div class="op-stackbar">${bars}</div>
    <div class="op-stackbar-legend">${legend}</div>`;
}

// Bus factor alone can't distinguish "one person, 90% of commits" from "one
// person at 51%, runner-up at 49%" — both compute to a factor of 1. This
// renders the actual per-contributor commit share behind that number.
function contributorSharesList(bars) {
	if (!bars || !bars.length) {
		return `<p class="op-sm muted">Not computable — no commit history indexed for this repo's contributor pool.</p>`;
	}
	const rows = bars
		.map(
			(b) => `<div class="op-sharebar-row">
        <span class="op-sharebar-label">${escapeHtml(b.label)}</span>
        <span class="op-sharebar-track"><span class="op-sharebar-fill" style="width:${(b.share * 100).toFixed(1)}%"></span></span>
        <span class="op-sharebar-value mono">${(b.share * 100).toFixed(0)}% <span class="muted">(${fmt(b.commits)})</span></span>
      </div>`
		)
		.join('');
	return `<div class="op-sharebar-list">${rows}</div>`;
}

// Colors reuse the same tone convention as the demographics stackbar above:
// core = good/green (mirrors "core" there), new-this-month = warn/amber
// (mirrors "recent arrivals" there — both mean "showed up recently").
const COHORT_COLOR = { core: TONE_VAR.good, other: TONE_VAR.info, new: TONE_VAR.warn };

// Monthly commit histogram stacked by author cohort, spanning the tool's
// FULL lifespan (not just 12 months) — a month that's all-core reads very
// differently from one driven mostly by one-off newcomers, even at the same
// total commit count. Columns have a fixed min-width and the container
// scrolls horizontally once history is longer than the card is wide (some
// of these repos span 100+ months).
// "YYYY-MM" -> "MM.YY", to label the histogram's time range without needing
// a label per column (impractical at 100+ months).
function monthYearLabel(dateKey) {
	const [y, m] = dateKey.split('-');
	return `${m}.${y.slice(2)}`;
}

function cohortBars(series) {
	if (!series || !series.some((m) => m.core + m.other + m.new > 0)) {
		return `<p class="op-sm muted">Not computable — no commit history indexed for this repo.</p>`;
	}
	const max = Math.max(...series.map((m) => m.core + m.other + m.new), 1);
	// Height in px, not %: a lone commit in a month can round to under 1px of
	// a 64px-tall column (matching .op-cohort-bars in main.css) and vanish
	// entirely against the tall bars beside it. Floor any nonzero segment to
	// a visible sliver instead.
	const BAR_HEIGHT_PX = 64;
	const MIN_VISIBLE_PX = 2;
	const scale = (n) => `${Math.max((n / max) * BAR_HEIGHT_PX, n > 0 ? MIN_VISIBLE_PX : 0).toFixed(1)}px`;
	const cols = series
		.map((m) => {
			const total = m.core + m.other + m.new;
			const seg = (n, key, label) =>
				n > 0 ? `<div style="height:${scale(n)};background:${COHORT_COLOR[key]}" title="${escapeHtml(m.date)} — ${label}: ${n}"></div>` : '';
			return `<div class="op-cohort-col" title="${escapeHtml(m.date)}: ${total} commits">${seg(m.core, 'core', 'core')}${seg(m.other, 'other', 'other returning')}${seg(m.new, 'new', 'new this month')}</div>`;
		})
		.join('');
	return `<div class="op-cohort-bars">${cols}</div>
    <div class="op-flex-between" style="margin-top:6px">
      <span class="op-micro muted mono">${monthYearLabel(series[0].date)}</span>
      <span class="op-micro muted mono">${monthYearLabel(series[series.length - 1].date)}</span>
    </div>`;
}

export function toolBody(tool) {
	const { owner, repo, githubUrl, metrics, detail } = tool;

	function statTile(value, label) {
		return `<div><div class="value" style="font-family:var(--op-font-heading);font-size:24px;font-weight:700;color:var(--op-text)">${fmt(value)}</div><div class="op-caption muted uppercase">${escapeHtml(label)}</div></div>`;
	}

	const hasBusFactor = metrics.busFactor !== null;

	// Everything in "Recent development activity" now shares the same
	// 12-month window; if none of it has data, the whole card collapses to
	// one disclaimer rather than a chart plus a wall of "not computable" tiles.
	const hasRecentActivity = !!(detail.burstiness || detail.codeLines || detail.prReview);
	const activityTiles = [
		detail.burstiness ? statTile(detail.burstiness.value, 'Commit rhythm (burstiness)') : '',
		detail.codeLines ? statTile(detail.codeLines.value, 'Lines changed') : '',
		...(detail.prReview
			? [
					statTile(detail.prReview.closureRatio, 'PR closure ratio'),
					statTile(detail.prReview.reviews, 'Reviewed PRs'),
					statTile(detail.prReview.timeToClose, 'Median time to close'),
					statTile(detail.prReview.selfMerge, 'Self-merge rate'),
			  ]
			: []),
	].join('');
	const prNote = detail.prReview
		? ''
		: `<p class="op-sm muted" style="margin-top:12px">No merged or reviewed pull request in the last 12 months for this repo.</p>`;

	return `<div class="op-section">
    <div class="op-label"><span class="ring">〇</span> TOOL DETAIL</div>
    <div class="op-flex-between">
      <h1>${escapeHtml(repo)}</h1>
      ${badge(owner, 'neutral')}
    </div>
    <p class="op-sm" style="margin-top:8px"><a href="${escapeHtml(githubUrl)}">${escapeHtml(githubUrl.replace('https://', ''))} ↗</a></p>
  </div>

  <div class="op-section">
    <div class="op-stat-row">
      <div class="op-stat"><div class="value">${fmt(metrics.busFactor)}</div><div class="label">Bus factor (12mo)</div></div>
      <div class="op-stat"><div class="value">${fmt(metrics.contributors)}</div><div class="label">Contributors (12mo)</div></div>
      <div class="op-stat"><div class="value">${fmt(metrics.stars)}</div><div class="label">Stars</div></div>
      <div class="op-stat"><div class="value">${fmt(metrics.docsScore)}</div><div class="label">Docs score</div></div>
      <div class="op-stat"><div class="value">${fmt(metrics.commitsTotal)}</div><div class="label">Commits (12mo)</div></div>
    </div>
  </div>

  <div class="op-section op-grid-2">
    <div class="op-card">
      <h3>Sustainability &amp; health</h3>
      ${hasBusFactor
				? `<p class="op-sm muted" style="margin-top:8px">
        Bus factor of ${fmt(metrics.busFactor)}: this many contributors account for at least
        half of commits in the last 12 months.
      </p>
      <p class="op-sm muted" style="margin-top:16px">
        Commit share per contributor over the same 12-month window — the breakdown behind the
        bus factor above. A factor of 1 can mean one person carries 90% of commits, or a
        near-even 51/49 split with a runner-up who could plausibly take over; the bars below
        show which one this project actually is.
      </p>
      <div style="margin-top:12px">${contributorSharesList(detail.contributorShares)}</div>`
				: `<p class="op-sm muted" style="margin-top:8px">
        No commits in the last 12 months, so bus factor and commit share aren't computable for
        a quiet window like this.
      </p>`}
      <p class="op-sm muted" style="margin-top:24px">
        ${fmt(detail.demographics?.total)} contributors over this project's full history, split
        into core (fewest contributors covering 80% of all-time commits), active, recently
        arrived (first commit in the last 90 days), and dormant (no commit in the last 12
        months).
      </p>
      <div style="margin-top:12px">${demographicsBar(detail.demographics)}</div>
      ${provenance({
				source: 'OpenSearch (GrimoireLab commit index)',
				method: 'Bus factor and commit-share bars: CHAOSS Contributor Absence Factor at a 12-month window. Contributor classification (core/active/recent/dormant) and total: direct aggregation over the full commit history, not a CHAOSS metric — see methodology.',
				refresh: 'Live-computed per request from the underlying commit index; index itself refreshed on the hub’s crawl cadence',
				caveats: 'Only covers commits Open Pulse has indexed for this repo — not necessarily every commit on GitHub. Commit-share bars shown for up to the top 8 contributors by share. Two different time scopes on this card: bus factor and the share bars are 12-month, the core/active/recent/dormant breakdown is all-time — a project can look concentrated in one and diffuse in the other without contradiction.',
			})}
    </div>

    <div class="op-card">
      <h3>Quality &amp; maturity</h3>
      <div class="op-flex-between" style="margin-top:8px">
        <div><div class="value" style="font-family:var(--op-font-heading);font-size:24px;font-weight:700;color:var(--op-text)">${fmt(metrics.docsScore)}</div><div class="op-caption muted uppercase">Docs score</div></div>
        <div><div class="value" style="font-family:var(--op-font-heading);font-size:24px;font-weight:700;color:var(--op-text)">${fmt(detail.license)}</div><div class="op-caption muted uppercase">License</div></div>
        <div><div class="value" style="font-family:var(--op-font-heading);font-size:24px;font-weight:700;color:var(--op-text)">${fmt(detail.dependencies.value)}</div><div class="op-caption muted uppercase">Direct dependencies</div></div>
      </div>
      ${disclosureList(`See all ${fmt(detail.dependencies.value)} direct dependencies`, detail.dependencies.examples)}
      ${provenance({
				source: 'SPARQL (Oxigraph RDF metadata graph) + Neo4j (dependency graph)',
				method: 'CHAOSS metrics API — Documentation Discoverability, License Coverage; Neo4j — full outbound DEPENDS_ON edge list (this repo → other repos)',
				refresh: 'Snapshot from the most recent metadata crawl',
				caveats: 'Docs score checks for README/homepage/wiki/GitHub Pages signals only, not documentation quality. 0 dependencies more often means "not yet resolved in the graph" than "genuinely zero" — read it as a lower bound.',
			})}
    </div>
  </div>

  <div class="op-section op-grid-2">
    <div class="op-card">
      <h3>Community activity</h3>
      <p class="op-sm muted" style="margin-top:8px">
        ${fmt(detail.contributorCohortTotals?.total)} contributors have committed to this tool
        over its full history. Monthly commits below, split by who's landing them — see
        <a href="../methodology.html#commits-by-cohort">methodology</a> for how core/other/new
        are defined.
      </p>
      <div style="margin-top:12px">${cohortBars(detail.contributorCohorts)}</div>
      <div class="op-stackbar-legend" style="margin-top:10px">
        <span><span class="swatch" style="background:${TONE_VAR.good}"></span>Core: ${fmt(detail.contributorCohortTotals?.core)}</span>
        <span><span class="swatch" style="background:${TONE_VAR.info}"></span>Other returning: ${fmt(detail.contributorCohortTotals?.other)}</span>
        <span><span class="swatch" style="background:${TONE_VAR.warn}"></span>New this month: ${fmt(detail.contributorCohortTotals?.new)}</span>
      </div>
      ${provenance({
				source: 'OpenSearch (GrimoireLab commit index)',
				method: 'Direct aggregation over the commit index (not a single CHAOSS metric — see methodology), spanning the repo\'s first commit month through today',
				refresh: 'Live-computed per request from the underlying commit index; index itself refreshed on the hub’s crawl cadence',
				caveats: 'Counts identities Open Pulse could resolve from commit authorship; the same person under multiple aliases may be split across categories or undercounted. Older, longer-lived repos scroll horizontally — this chart can span 100+ months.',
			})}
    </div>

    <div class="op-card">
      <h3>Popularity &amp; adoption</h3>
      <div class="op-flex-between" style="margin-top:8px">
        <div><div class="value" style="font-family:var(--op-font-heading);font-size:24px;font-weight:700;color:var(--op-text)">${fmt(metrics.stars)}</div><div class="op-caption muted uppercase">Stars</div></div>
        <div><div class="value" style="font-family:var(--op-font-heading);font-size:24px;font-weight:700;color:var(--op-text)">${fmt(detail.forks)}</div><div class="op-caption muted uppercase">Forks</div></div>
        <div><div class="value" style="font-family:var(--op-font-heading);font-size:24px;font-weight:700;color:var(--op-text)">${fmt(detail.dependents.value)}</div><div class="op-caption muted uppercase">Downstream dependents</div></div>
      </div>
      ${disclosureList(`See all ${fmt(detail.dependents.value)} downstream dependents`, detail.dependents.examples)}
      ${provenance({
				source: 'SPARQL (Oxigraph RDF metadata graph) + Neo4j (dependency graph)',
				method: 'Direct query — MAX(op:githubRepoStars), MAX(op:githubRepoForks); Neo4j — full inbound DEPENDS_ON edge list (other repos → this repo)',
				refresh: 'Snapshot from the most recent crawl landed in the metadata/dependency graph; lags live GitHub by an unspecified amount',
				caveats: 'Stars/forks are read from whichever crawl last touched this repo’s metadata — treat as approximate, not real-time. Dependents only count manifests (npm, pypi, cargo, go.mod, …) Open Pulse’s crawl pipeline has actually resolved — 0 is a lower bound, not proof nothing depends on this repo.',
			})}
    </div>
  </div>

  <div class="op-section">
    <div class="op-card">
      <h3>Recent development activity</h3>
      ${hasRecentActivity
				? `<div style="margin-top:12px">${activityOrNone(metrics.commitSparkline, { width: 480, height: 64 })}</div>
      <p class="op-sm muted" style="margin-top:8px">${fmt(metrics.commitsTotal)} commits in the last 12 months.</p>
      <div class="op-flex-between" style="margin-top:16px">${activityTiles}</div>
      ${prNote}
      ${detail.burstiness?.secondary
					? `<p class="op-caption muted" style="margin-top:16px">
        Burstiness: ${escapeHtml(detail.burstiness.secondary)}. Near 0 reads as steady/random, positive
        values trend bursty, negative values trend periodic.
      </p>`
					: ''}
      ${detail.codeLines?.secondary
					? `<p class="op-caption muted" style="margin-top:4px">
        Lines changed: ${escapeHtml(detail.codeLines.secondary)}. <strong>Caveat:</strong> a handful of
        large data or vendored-file commits can inflate this figure well beyond hand-written code churn —
        read it as a rough activity-volume signal, not a codebase-quality measure.
      </p>`
					: ''}`
				: `<p class="op-sm muted" style="margin-top:12px">No activity in the last 12 months — commit rhythm, code churn, and pull-request metrics aren't computable for a quiet window.</p>`}
      ${provenance({
				source: 'OpenSearch (GrimoireLab commit + pull-request indices)',
				method: 'CHAOSS metrics API — Activity Dates and Times, Burstiness, Code Changes Lines, Change Request Closure Ratio, Change Request Reviews, Time to Close, Self Merge Rate, all requested at a 12-month window',
				refresh: 'Live-computed per request; underlying index refreshed on the hub’s crawl cadence',
				caveats: 'A quiet 12-month window (no commits at all) means none of these are computable, shown as one disclaimer rather than several separate "not computable" tiles. When there IS commit activity but no merged/reviewed pull request in that window, only the four PR-based tiles are individually omitted. Code Changes Lines counts raw line churn and can be skewed by large non-code commits (vendored assets, generated or data files) — treat it as an activity-volume signal, not a measure of hand-written code.',
			})}
    </div>
  </div>`;
}
