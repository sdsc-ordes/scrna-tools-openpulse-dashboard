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
    <h3>Detail-view metrics</h3>
    <p class="op-sm muted" style="margin-top:8px;max-width:72ch">
      Each tool's detail page adds secondary CHAOSS metrics beyond the headline five, grouped
      below in the same order as the cards on that page. All were checked live against all 16
      tools across the platform's full 35-metric catalogue and kept because they carry real,
      non-flat values for this tool category.
    </p>
  </div>

  <div class="op-section">
    <div class="op-card">
      <h4>Contributor pool breakdown <span class="op-caption muted">— sustainability &amp; health</span></h4>
      <p class="op-sm muted" style="margin-top:8px">
        Splits everyone who ever committed into four buckets: core (contributors covering the
        top 80% of commits), active, recently arrived (first commit in the last 90 days), and
        dormant (no commit in 180 days). Read together with bus factor: a project can have a low
        bus factor but a healthy-looking pool if the core is small by design rather than by
        attrition — the breakdown is what tells the two apart. From CHAOSS's Project
        Demographics metric (OpenSearch/GrimoireLab commit index).
      </p>
    </div>
  </div>

  <div class="op-section op-grid-2">
    <div class="op-card">
      <h4>Committers, 90 days <span class="op-caption muted">— community activity</span></h4>
      <p class="op-sm muted" style="margin-top:8px">
        Distinct people who landed a commit in the last 90 days — narrower than the 12-month
        Contributors count above, and narrower still in one specific way: it excludes people
        whose commits were authored by them but merged in by someone else (e.g. via a
        maintainer's "squash and merge"), counting only who actually pushed code. A short window
        on a small project can read as "0" or "1" without that meaning the project is dead —
        check the 12-month contributor count alongside it. From CHAOSS's Committers metric
        (OpenSearch/GrimoireLab).
      </p>
    </div>
    <div class="op-card">
      <h4>Occasional contributors <span class="op-caption muted">— community activity</span></h4>
      <p class="op-sm muted" style="margin-top:8px">
        Share of contributors with 4 or fewer commits in the window — a rough read on openness
        to drive-by contributions versus a fixed core, from CHAOSS's Occasional Contributors
        metric.
      </p>
    </div>
  </div>

  <div class="op-section">
    <div class="op-card">
      <h4>Forks <span class="op-caption muted">— popularity &amp; adoption</span></h4>
      <p class="op-sm muted" style="margin-top:8px">
        Raw GitHub fork count, read from the same SPARQL metadata graph as the star count above,
        for the same reason: CHAOSS's own fork metric (Technical Fork) reads the in-graph Neo4j
        count instead of the real GitHub number, and was checked and dropped for this dashboard
        (see "What's excluded" below) for being flat and uninformative. Like stars, this lags
        live GitHub by an unspecified amount — treat it as a snapshot, not real-time.
      </p>
    </div>
  </div>

  <div class="op-section op-grid-2">
    <div class="op-card">
      <h4>License <span class="op-caption muted">— quality &amp; maturity</span></h4>
      <p class="op-sm muted" style="margin-top:8px">
        The repository's declared license (e.g. "MIT License"), read from the SPARQL metadata
        graph. Where a tool has no declared license, the card reads "None declared" — a real
        signal about reuse terms, not a missing-data gap (one of the 16 compared tools,
        jianhong/scRNAseqApp, genuinely has none). From CHAOSS's License Coverage metric.
      </p>
    </div>
    <div class="op-card">
      <h4>Direct dependencies <span class="op-caption muted">— quality &amp; maturity</span></h4>
      <p class="op-sm muted" style="margin-top:8px">
        Count of distinct upstream repositories this project depends on, from Open Pulse's
        dependency graph (Neo4j <code>DEPENDS_ON</code> edges) rather than a package manifest —
        so it reflects dependencies Open Pulse has actually resolved into the graph, not
        necessarily every entry in a requirements.txt/package.json. A 0 here more often means
        "not yet resolved in the graph" than "genuinely zero dependencies" — read it as a lower
        bound. From CHAOSS's Upstream Code Dependencies metric.
      </p>
    </div>
  </div>

  <div class="op-section op-grid-2">
    <div class="op-card">
      <h4>Commit rhythm (burstiness) <span class="op-caption muted">— recent development activity</span></h4>
      <p class="op-sm muted" style="margin-top:8px">
        The Goh–Barabási burstiness parameter B, computed on the gaps between commits: it ranges
        from −1 (perfectly periodic — commits land like clockwork) through 0 (random/Poisson-like
        spacing) to +1 (bursty — long quiet stretches punctuated by intense activity). It's a
        shape metric, not a volume one: a project with few commits can still be "steady" (low
        burstiness) if those commits are evenly spaced, and a very active project can still be
        "bursty" if activity clusters around releases. Shown alongside the number of active days
        and the mean/σ gap between commits for context. From CHAOSS's Burstiness metric
        (OpenSearch/GrimoireLab).
      </p>
    </div>
    <div class="op-card">
      <h4>Lines changed (code churn) <span class="op-caption muted">— recent development activity</span></h4>
      <p class="op-sm muted" style="margin-top:8px">
        Total lines added plus removed over the repository's full history, with the
        added/removed split, commit count, file-change count, and an average lines-per-commit
        figure shown alongside it. From CHAOSS's Code Changes Lines metric
        (OpenSearch/GrimoireLab). <strong>Caveat:</strong> this counts raw line churn, not
        meaningful code changes — a handful of tools in this comparison show average commits in
        the thousands or tens-of-thousands of lines, almost certainly from vendored
        dependencies, generated files, or bulk data committed directly to the repo rather than
        hand-written code. Treat it as a rough activity-volume signal, not a measure of codebase
        size or quality.
      </p>
    </div>
  </div>

  <div class="op-section op-grid-2">
    <div class="op-card">
      <h4>PR closure ratio (30 days) <span class="op-caption muted">— recent development activity</span></h4>
      <p class="op-sm muted" style="margin-top:8px">
        Share of pull requests opened or updated in the last 30 days that have since been closed
        (merged or declined), out of all PRs touched in that window. A high ratio means the
        project keeps its PR queue moving; a low one suggests PRs pile up unreviewed. Only
        computable for the 12 of 16 tools Open Pulse's GitHub pull-request tracker currently
        covers — shown as "not computable" rather than a misleading zero for the other 4. From
        CHAOSS's Change Request Closure Ratio metric (OpenSearch/GrimoireLab GitHub PR index).
      </p>
    </div>
    <div class="op-card">
      <h4>Reviewed PRs (30 days) <span class="op-caption muted">— recent development activity</span></h4>
      <p class="op-sm muted" style="margin-top:8px">
        Count of pull requests in the last 30 days that received at least one non-bot review
        comment. This is a floor, not a full review count — a PR with three human reviews and a
        PR with exactly one both count once. Same 12/16 pull-request-tracker coverage as the
        closure ratio above. From CHAOSS's Change Request Reviews metric.
      </p>
    </div>
  </div>

  <div class="op-section op-grid-2">
    <div class="op-card">
      <h4>Median time to close <span class="op-caption muted">— recent development activity</span></h4>
      <p class="op-sm muted" style="margin-top:8px">
        Median number of days a pull request stays open before it's closed, counting both merged
        and declined PRs (unlike the related "merge-only" duration metric, which this dashboard
        doesn't show). A low number here can mean either "reviewed and merged fast" or "declined
        fast" — it doesn't distinguish the two; pair it with the closure ratio's merged/declined
        split for that. Same 12/16 pull-request-tracker coverage as the other PR metrics. From
        CHAOSS's Time to Close metric.
      </p>
    </div>
    <div class="op-card">
      <h4>Self-merge rate <span class="op-caption muted">— recent development activity</span></h4>
      <p class="op-sm muted" style="margin-top:8px">
        Share of merged pull requests that were merged by the same person who authored them,
        rather than by a separate reviewer/maintainer. A high rate is common (and not
        necessarily bad) on projects with one or two maintainers doing all the work; on a larger
        team it's more of a review-culture signal — how often does someone else sign off before
        code lands. Same 12/16 pull-request-tracker coverage as the other PR metrics. From
        CHAOSS's Self Merge Rate metric.
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
    <p class="op-sm muted" style="margin-top:8px;max-width:72ch">
      A second check, while adding the detail-view metrics above, found four more that
      technically return a value but aren't worth a card: Licenses Declared
      (<code>licenses_declared</code>) reads flatly "no" for all 16 tools, contradicting the
      License Coverage metric already shown (which correctly reports MIT and others) — a
      data-quality quirk on this specific metric, not a real signal. Technical Fork
      (<code>technical_fork</code>) is flat at 0 for 15 of 16 tools — it's the in-graph fork
      count from Neo4j, not the real GitHub fork count already shown. Bot Activity
      (<code>bot_activity</code>) is nearly flat (0% for 13 of 16). Change Requests
      Accepted/Declined (<code>cr_accepted</code>/<code>cr_declined</code>) duplicate the
      merged/declined split already in the closure ratio's detail text, and would silently show
      "0" rather than "no data" for the 4 tools without pull-request-tracker coverage.
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
