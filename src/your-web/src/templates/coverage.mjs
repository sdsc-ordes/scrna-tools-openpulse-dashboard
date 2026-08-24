import { escapeHtml } from './helpers.mjs';

export function coverageBody({ repos }) {
	const items = repos
		.map(
			(r) => `<li class="op-coverage-item">
        <span class="name"><span class="owner">${escapeHtml(r.owner)}/</span>${escapeHtml(r.repo)}</span>
        <a href="${escapeHtml(r.githubUrl)}" class="op-sm">GitHub ↗</a>
      </li>`
		)
		.join('\n');

	return `<div class="op-section">
    <div class="op-label"><span class="ring">〇</span> WHAT'S MISSING</div>
    <h1>Not yet indexed</h1>
    <p class="op-lg" style="margin-top:12px;color:var(--op-text-2);max-width:64ch">
      These ${repos.length} repositories were part of the original shortlist but Open Pulse
      hasn't crawled or extracted metadata for them yet — no commit history, star/fork counts,
      or CHAOSS metrics exist for any of them. That's a data-coverage gap, not a signal that
      the projects are inactive or low quality.
    </p>
  </div>

  <div class="op-section">
    <ul class="op-coverage-list">
${items}
    </ul>
  </div>

  <div class="op-section">
    <div class="op-card">
      <h4>Closing this gap</h4>
      <p class="op-sm muted" style="margin-top:8px">
        A crawl and metadata-extraction pass (Open Pulse's <span class="mono">op-crawler</span> /
        <span class="mono">op-extractor</span> pipeline) against these repositories would let them
        join the main comparison. That's a deliberate follow-up, not done as part of this build —
        see the plan's open framing calls in <span class="mono">DASHBOARD.md</span>.
      </p>
    </div>
  </div>`;
}
