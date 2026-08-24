import { escapeHtml, fmt, sparklineSvg, provenance, badge } from './helpers.mjs';

const TONE_VAR = {
	good: 'var(--op-success)',
	info: 'var(--op-blue-light)',
	warn: 'var(--op-warning)',
	danger: 'var(--op-error)',
};

function demographicsBar(demographics) {
	if (!demographics || !demographics.segments?.length) {
		return `<p class="op-sm muted">Not computable — no commit history indexed for this repo's contributor pool.</p>`;
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
	// Deliberately not rendering demographics.secondary here: on at least one
	// tool (iS-CellR) its freeform text ("dormant 1") disagreed with this same
	// API response's own visual.segments ("dormant: 0") even though segments
	// sum to the total correctly — an upstream CHAOSS inconsistency. The
	// legend below is generated from segments alone, so it can't contradict
	// the bar it labels.
	return `<div class="op-stackbar">${bars}</div>
    <div class="op-stackbar-legend">${legend}</div>`;
}

export function toolBody(tool) {
	const { owner, repo, githubUrl, metrics, detail } = tool;

	const prSection = detail.prReview
		? `<div class="op-flex-between">
        <div><div class="value" style="font-family:var(--op-font-heading);font-size:24px;font-weight:700;color:var(--op-text)">${fmt(detail.prReview.closureRatio)}</div><div class="op-caption muted uppercase">PR closure ratio (30d)</div></div>
        <div><div class="value" style="font-family:var(--op-font-heading);font-size:24px;font-weight:700;color:var(--op-text)">${fmt(detail.prReview.reviews)}</div><div class="op-caption muted uppercase">Reviewed PRs (30d)</div></div>
      </div>`
		: `<p class="op-sm muted">Not computable — this repo isn't covered by Open Pulse's GitHub pull-request tracker yet (12 of 16 tools are). Absence here does not mean no PR activity.</p>`;

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
      <div class="op-stat"><div class="value">${fmt(metrics.busFactor)}</div><div class="label">Bus factor</div></div>
      <div class="op-stat"><div class="value">${fmt(metrics.contributors)}</div><div class="label">Contributors (12mo)</div></div>
      <div class="op-stat"><div class="value">${fmt(metrics.stars)}</div><div class="label">Stars</div></div>
      <div class="op-stat"><div class="value">${fmt(metrics.docsScore)}</div><div class="label">Docs score</div></div>
      <div class="op-stat"><div class="value">${fmt(metrics.commitsTotal)}</div><div class="label">Commits (12mo)</div></div>
    </div>
  </div>

  <div class="op-section op-grid-2">
    <div class="op-card">
      <h3>Sustainability &amp; health</h3>
      <p class="op-sm muted" style="margin-top:8px">
        Bus factor of ${fmt(metrics.busFactor)}: this many contributors account for at least
        half of all commits. The breakdown below splits the full contributor pool into
        core (top 80% of commits), recently arrived, and dormant (no commit in 180 days).
      </p>
      <div style="margin-top:16px">${demographicsBar(detail.demographics)}</div>
      ${provenance({
				source: 'OpenSearch (GrimoireLab commit index)',
				method: 'CHAOSS metrics API — Contributor Absence Factor, Project Demographics',
				refresh: 'Live-computed per request from the underlying commit index; index itself refreshed on the hub’s crawl cadence',
				caveats: 'Bus factor and demographics only cover commits Open Pulse has indexed for this repo — not necessarily every commit on GitHub.',
			})}
    </div>

    <div class="op-card">
      <h3>Community activity</h3>
      <p class="op-sm muted" style="margin-top:8px">
        ${fmt(metrics.contributors)} distinct people committed in the last 12 months;
        ${fmt(detail.committers)} landed commits in the last 90 days (a narrower measure —
        it excludes authors whose commits were merged in by someone else).
      </p>
      ${provenance({
				source: 'OpenSearch (GrimoireLab commit index)',
				method: 'CHAOSS metrics API — Contributors, Committers',
				refresh: 'Live-computed per request; underlying index refreshed on the hub’s crawl cadence',
				caveats: 'Counts identities Open Pulse could resolve from commit authorship; the same person under multiple aliases may be undercounted.',
			})}
    </div>
  </div>

  <div class="op-section op-grid-2">
    <div class="op-card">
      <h3>Popularity &amp; adoption</h3>
      <div class="op-flex-between" style="margin-top:8px">
        <div><div class="value" style="font-family:var(--op-font-heading);font-size:24px;font-weight:700;color:var(--op-text)">${fmt(metrics.stars)}</div><div class="op-caption muted uppercase">Stars</div></div>
        <div><div class="value" style="font-family:var(--op-font-heading);font-size:24px;font-weight:700;color:var(--op-text)">${fmt(detail.forks)}</div><div class="op-caption muted uppercase">Forks</div></div>
      </div>
      ${provenance({
				source: 'SPARQL (Oxigraph RDF metadata graph)',
				method: 'Direct query — MAX(op:githubRepoStars), MAX(op:githubRepoForks)',
				refresh: 'Snapshot from the most recent crawl landed in the metadata graph; lags live GitHub by an unspecified amount',
				caveats: 'Stars/forks are read from whichever crawl last touched this repo’s metadata — treat as approximate, not real-time.',
			})}
    </div>

    <div class="op-card">
      <h3>Quality &amp; maturity</h3>
      <div class="op-flex-between" style="margin-top:8px">
        <div><div class="value" style="font-family:var(--op-font-heading);font-size:24px;font-weight:700;color:var(--op-text)">${fmt(metrics.docsScore)}</div><div class="op-caption muted uppercase">Docs score</div></div>
        <div><div class="value" style="font-family:var(--op-font-heading);font-size:24px;font-weight:700;color:var(--op-text)">${fmt(detail.license)}</div><div class="op-caption muted uppercase">License</div></div>
        <div><div class="value" style="font-family:var(--op-font-heading);font-size:24px;font-weight:700;color:var(--op-text)">${fmt(detail.dependencies)}</div><div class="op-caption muted uppercase">Direct dependencies</div></div>
      </div>
      ${provenance({
				source: 'SPARQL (Oxigraph RDF metadata graph) + Neo4j (dependency graph)',
				method: 'CHAOSS metrics API — Documentation Discoverability, License Coverage; Neo4j DEPENDS_ON edge count',
				refresh: 'Snapshot from the most recent metadata crawl',
				caveats: 'Docs score checks for README/homepage/wiki/GitHub Pages signals only, not documentation quality. Test coverage and release-cadence signals are not yet populated for this tool category and are omitted rather than shown as zero.',
			})}
    </div>
  </div>

  <div class="op-section">
    <div class="op-card">
      <h3>Recent development activity</h3>
      <div style="margin-top:12px">${sparklineSvg(metrics.commitSparkline, { width: 480, height: 64 })}</div>
      <p class="op-sm muted" style="margin-top:8px">${fmt(metrics.commitsTotal)} commits in the last 12 months.</p>
      <div style="margin-top:16px">${prSection}</div>
      ${provenance({
				source: 'OpenSearch (GrimoireLab commit + pull-request indices)',
				method: 'CHAOSS metrics API — Activity Dates and Times, Change Request Closure Ratio, Change Request Reviews',
				refresh: 'Live-computed per request; underlying index refreshed on the hub’s crawl cadence',
				caveats: 'PR-based metrics require this repo to be covered by Open Pulse’s GitHub pull-request tracker (12 of the 16 compared tools are, as of this build).',
			})}
    </div>
  </div>`;
}
