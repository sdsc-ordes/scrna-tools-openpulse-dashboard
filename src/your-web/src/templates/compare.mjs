import { fmt, sparklineSvg, docsScoreFraction } from './helpers.mjs';

export function compareBody({ tools, coverageCount }) {
	const sorted = [...tools].sort((a, b) => a.repo.localeCompare(b.repo));

	const rows = sorted
		.map((t) => {
			const docsFraction = docsScoreFraction(t.metrics.docsScore);
			return `<tr
          data-busfactor="${t.metrics.busFactor ?? ''}"
          data-contributors="${t.metrics.contributors ?? ''}"
          data-stars="${t.metrics.stars ?? ''}"
          data-docs="${docsFraction ?? ''}"
          data-commits="${t.metrics.commitsTotal ?? ''}"
        >
          <td class="op-tool-name">
            <a href="tools/${t.slug}.html">${t.repo}</a>
            <span class="owner">${t.owner}</span>
          </td>
          <td class="num">${fmt(t.metrics.busFactor)}</td>
          <td class="num">${fmt(t.metrics.contributors)}</td>
          <td class="num">${fmt(t.metrics.stars)}</td>
          <td class="num">${fmt(t.metrics.docsScore)}</td>
          <td class="sparkline-cell">${sparklineSvg(t.metrics.commitSparkline)}</td>
        </tr>`;
		})
		.join('\n');

	return `<div class="op-section">
    <div class="op-label"><span class="ring">〇</span> COMPARE</div>
    <h1>Single-cell &amp; spatial transcriptomics visualisation tools</h1>
    <p class="op-lg" style="margin-top:12px;color:var(--op-text-2);max-width:64ch">
      Five metrics, one row per tool. Click a column to rank by it — the table opens
      alphabetically, not pre-ranked by any single measure.
    </p>
  </div>

  <div class="op-section">
    <div class="op-table-scroll">
      <table class="op-table" id="compare-table">
        <thead>
          <tr>
            <th>Tool</th>
            <th data-sort="busfactor" title="Fewest contributors covering ≥50% of commits — higher means less concentrated, more resilient">Bus factor</th>
            <th data-sort="contributors" title="Distinct people who committed in the last 12 months">Contributors (12mo)</th>
            <th data-sort="stars" title="GitHub stars, freshest available source">Stars</th>
            <th data-sort="docs" title="README / homepage / wiki / GitHub Pages signals present, out of 4">Docs score</th>
            <th data-sort="commits" title="Monthly commits, last 12 months">Recent activity</th>
          </tr>
        </thead>
        <tbody>
${rows}
        </tbody>
      </table>
    </div>
  </div>

  <div class="op-section op-flex-between">
    <p class="op-sm muted">
      ${coverageCount} more repositories from the original shortlist aren't indexed by
      Open Pulse yet and can't be scored — see <a href="coverage.html">Not yet indexed</a>.
    </p>
    <p class="op-sm"><a href="methodology.html">How are these metrics computed? →</a></p>
  </div>`;
}
