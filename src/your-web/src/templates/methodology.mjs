export function methodologyBody() {
	return `<div class="op-section">
    <div class="op-label"><span class="ring">〇</span> METHODOLOGY</div>
    <h1>How these metrics are computed</h1>
    <p class="op-lg" style="margin-top:12px;color:var(--op-text-2);max-width:64ch">
      Five headline metrics, one per evaluation dimension, chosen for being reliably computable
      across the compared tools and non-redundant with each other. Everything here is sourced
      from the <a href="https://openpulse.science">Open Pulse</a> platform — no figure on this
      site is hand-entered.
    </p>
  </div>

  <div class="op-section op-grid-2">
    <div class="op-card">
      <h4>Bus factor <span class="op-caption muted">— sustainability &amp; health</span></h4>
      <p class="op-sm muted" style="margin-top:8px">
        The fewest contributors whose combined commits cover at least half of the repository's
        history. A bus factor of 1 means a single person carries the project — if they left,
        continuity is at risk. Computed by CHAOSS's Contributor Absence Factor metric from the
        commit index (OpenSearch/GrimoireLab). This is a measure of <em>concentration</em>, not
        activity — a very active project can still have a low bus factor.
      </p>
    </div>
    <div class="op-card">
      <h4>Contributors, 12 months <span class="op-caption muted">— community activity</span></h4>
      <p class="op-sm muted" style="margin-top:8px">
        Distinct people who committed in the last 12 months, from CHAOSS's Contributors metric.
        The tool-detail pages also show Committers (90 days) — a narrower count that excludes
        authors whose commits were merged in by someone else.
      </p>
    </div>
  </div>

  <div class="op-section op-grid-2">
    <div class="op-card">
      <h4>GitHub stars <span class="op-caption muted">— popularity &amp; adoption</span></h4>
      <p class="op-sm muted" style="margin-top:8px">
        Read directly from the SPARQL metadata graph rather than CHAOSS's Project Popularity
        composite score, which mixes stars, forks, and dependents into one number and — as
        measured during this dashboard's data checks — visibly lags the live GitHub API. A raw
        star count is more legible and easier to sanity-check by eye.
      </p>
    </div>
    <div class="op-card">
      <h4>Documentation discoverability <span class="op-caption muted">— quality &amp; maturity</span></h4>
      <p class="op-sm muted" style="margin-top:8px">
        A score out of 4, from CHAOSS's Documentation Discoverability metric: does the repo have
        a README, a homepage/docs link, a wiki, and/or GitHub Pages? It checks for the
        <em>presence</em> of these signals, not the quality of the documentation itself.
      </p>
    </div>
  </div>

  <div class="op-section">
    <div class="op-card">
      <h4>Monthly commit activity <span class="op-caption muted">— recent development activity</span></h4>
      <p class="op-sm muted" style="margin-top:8px">
        A 12-month sparkline of monthly commit counts, from CHAOSS's Activity Dates and Times
        metric. This is deliberately a separate dimension from bus factor: a project can be
        very active month-to-month while still depending on one person (several of the compared
        tools are exactly this shape), or the reverse. Neither metric implies the other.
      </p>
    </div>
  </div>

  <div class="op-section">
    <h3>What's excluded, and why</h3>
    <p class="op-sm muted" style="margin-top:8px;max-width:72ch">
      A number of CHAOSS metrics were checked against this specific set of tools and dropped
      because they returned no usable data for this tool category, not because they're
      uninteresting in general: academic citation impact (no ORCID-linked publications found
      for any tool checked), release frequency, static test-coverage badges, and
      programming-language byte-shares (all empty across every tool checked), organisational
      diversity (empty even for the best-covered tools), and issue-response-time metrics (Open
      Pulse's GitHub issue tracker doesn't yet cover any repository in this comparison — pull
      requests are covered for 12 of the 16). Where a metric is missing for a specific tool, the
      dashboard says so explicitly rather than showing a zero.
    </p>
  </div>

  <div class="op-section">
    <h3>Refresh cadence</h3>
    <p class="op-sm muted" style="margin-top:8px;max-width:72ch">
      This site is a static build: every number is fetched from Open Pulse once, at build time,
      and baked into the page (see the timestamp in the bar at the very top). Re-running the
      build re-fetches current values; the page itself never queries Open Pulse from your
      browser.
    </p>
  </div>`;
}
