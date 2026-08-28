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
        The fewest contributors whose combined commits cover at least half of all commits in the
        last 12 months. A bus factor of 1 means a single person carries the project's recent
        activity — if they left, continuity is at risk. Computed by CHAOSS's Contributor Absence
        Factor metric from the commit index (OpenSearch/GrimoireLab), requested at an explicit
        365-day window. On a repo with no commits in that window, this is "—" rather than a
        misleading number — the detail page explains this plainly instead of a "not computable"
        tile. This is a measure of <em>concentration</em>, not activity — a very active project
        can still have a low bus factor.
      </p>
    </div>
    <div class="op-card">
      <h4>Contributors, 12 months <span class="op-caption muted">— community activity</span></h4>
      <p class="op-sm muted" style="margin-top:8px">
        Distinct people who committed in the last 12 months, from CHAOSS's Contributors metric,
        requested at an explicit 365-day window. On a repo with zero commits in that window,
        CHAOSS's own contributors metric falls back to an all-time count from a different store
        (Neo4j) rather than showing a bare zero — a real number here can occasionally mean
        "all-time," not "this year," on those specific repos.
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
        tools are exactly this shape), or the reverse. Neither metric implies the other. On the
        comparison table, a repo with zero commits in the window shows "No activity" instead of
        an empty-looking chart.
      </p>
    </div>
  </div>

  <div class="op-section">
    <h3>Detail-view metrics</h3>
    <p class="op-sm muted" style="margin-top:8px;max-width:72ch">
      Each tool's detail page adds secondary metrics beyond the headline five, grouped below in
      the same order as the cards on that page.
    </p>
  </div>

  <div class="op-section">
    <div class="op-card">
      <h4>Contributor classification &amp; total <span class="op-caption muted">— sustainability &amp; health</span></h4>
      <p class="op-sm muted" style="margin-top:8px">
        Splits everyone who ever committed, over the project's <strong>full history</strong>, into
        four buckets: core (fewest contributors covering 80% of all-time commits — CHAOSS's own
        threshold for its Project Demographics metric), recently arrived (first commit in the
        last 90 days), dormant (not core or recent, no commit in the <strong>last 12 months</strong>),
        and active (everyone else). This isn't CHAOSS's Project Demographics metric — that one
        uses a 180-day dormancy cutoff and returns no per-author identity, so it can't be
        recomputed with a different threshold. Instead this is a direct aggregation over the
        commit index: each author's all-time commit total, first commit date, and last commit
        date. The total contributor count shown alongside the bar is this same full-history
        count. Read together with bus factor: a project can have a low (12-month) bus factor but
        a healthy-looking lifetime pool if the core is small by design rather than by attrition —
        the breakdown is what tells the two apart.
      </p>
    </div>
    <div class="op-card">
      <h4>Commit share per contributor <span class="op-caption muted">— sustainability &amp; health</span></h4>
      <p class="op-sm muted" style="margin-top:8px">
        A bar per contributor showing their share of commits in the last 12 months (same window
        as bus factor above, since it's the same underlying query), for up to the top 8 by share.
        This exists because bus factor alone can't tell "one person carries 90% of commits" apart
        from a near-even 51/49 split between two people — both compute to a bus factor of 1, but
        only one is a real single point of failure. Sourced from the same <code>rank_bars</code>
        breakdown CHAOSS's Contributor Absence Factor metric uses internally to derive the bus
        factor number itself. When there's no bus factor (no commits in the last 12 months),
        there's nothing to share out either — the detail page shows one disclaimer instead of an
        empty bar list.
      </p>
    </div>
  </div>

  <div class="op-section" id="commits-by-cohort">
    <div class="op-card">
      <h4>Commits by contributor cohort <span class="op-caption muted">— community activity</span></h4>
      <p class="op-sm muted" style="margin-top:8px">
        A monthly commit histogram spanning the tool's <strong>full lifespan</strong> — from its
        first-ever commit month through today, not just the last 12 months — stacked by who
        landed each commit: <strong>core</strong> (the same all-time 80%-of-commits set as the
        classification bar above), <strong>new this month</strong> (this is the author's first
        commit to the repo, ever), or <strong>other returning</strong> (contributed before, but
        isn't part of the core set). The three are mutually exclusive and computed in that
        priority order — a debut commit counts as "new" even if it happens to make someone core
        immediately.
      </p>
      <p class="op-sm muted" style="margin-top:8px">
        This isn't a single CHAOSS metric — no catalogue entry gives a monthly breakdown by
        author identity. It's computed directly from two aggregations over the same commit index
        (<code>git_demo_enriched</code>) CHAOSS itself reads for bus factor and demographics:
        each author's all-time commit total and first commit date, and every month's commits
        bucketed by author. A month that's entirely core reads very differently from one with the
        same commit count driven mostly by a single newcomer — a plain volume sparkline can't
        show that distinction. Some of the compared tools span 100+ months of history; the chart
        scrolls horizontally rather than squeezing older months into illegibility. A lone commit
        in an otherwise-quiet month is floored to a minimum visible sliver rather than rounding
        down to nothing next to a much taller bar.
      </p>
      <p class="op-sm muted" style="margin-top:8px">
        The total and the three counts shown above the chart (core / other returning / new this
        month) are a <strong>different, person-level</strong> reading of the same underlying
        data — how many distinct contributors, not how many commits. They're mutually exclusive
        and sum to the total: core is the same all-time set as the commit-level "core"; new this
        month is whoever's first-ever commit fell in the chart's most recent month specifically
        (not "was ever new," which would just be everyone); other returning is everyone else.
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
    <div class="op-card" id="downstream-dependents">
      <h4>Downstream dependents <span class="op-caption muted">— popularity &amp; adoption</span></h4>
      <p class="op-sm muted" style="margin-top:8px">
        Count of other repositories whose package manifest names this one as a dependency — the
        mirror image of Direct dependencies below, which counts this repo's own upstream deps.
        Read directly from Neo4j: every inbound <code>DEPENDS_ON</code> edge (other repos → this
        repo), not CHAOSS's Project Popularity composite (which caps its example list at 8
        regardless of the true count). The full list is one click away on the detail page ("see
        all N downstream dependents"), so the headline number and the list can never disagree.
        This is sparse for this tool category: only 3 of the 16 compared tools have any
        dependents, since most are terminal applications (viewers, dashboards) rather than
        libraries other projects import — 0 means no inbound manifest reference has been resolved
        yet, not necessarily zero dependents. Read it as a lower bound, same as Direct
        dependencies.
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
        Count of distinct upstream repositories this project depends on. Read directly from
        Neo4j: every outbound <code>DEPENDS_ON</code> edge (this repo → other repos), the same
        source and the same "see all N" expandable list as Downstream dependents above, rather
        than CHAOSS's Upstream Code Dependencies metric (whose headline count isn't backed by a
        full example list). 7 of the 16 compared tools have at least one resolved dependency,
        ranging up to 291 for one tool — so it reflects dependencies Open Pulse has actually
        resolved into the graph, not necessarily every entry in a requirements.txt/package.json.
        0 more often means "not yet resolved in the graph" than "genuinely zero dependencies" —
        read it as a lower bound.
      </p>
    </div>
  </div>

  <div class="op-section op-grid-2">
    <div class="op-card">
      <h4>Commit rhythm (burstiness) <span class="op-caption muted">— recent development activity</span></h4>
      <p class="op-sm muted" style="margin-top:8px">
        The Goh–Barabási burstiness parameter B, computed on the gaps between commits in the last
        12 months: it ranges from −1 (perfectly periodic — commits land like clockwork) through 0
        (random/Poisson-like spacing) to +1 (bursty — long quiet stretches punctuated by intense
        activity). It's a shape metric, not a volume one: a project with few commits can still be
        "steady" (low burstiness) if those commits are evenly spaced, and a very active project
        can still be "bursty" if activity clusters around releases. Shown alongside the number of
        active days and the mean/σ gap between commits for context. From CHAOSS's Burstiness
        metric (OpenSearch/GrimoireLab), requested at a 365-day window.
      </p>
    </div>
    <div class="op-card">
      <h4>Lines changed (code churn) <span class="op-caption muted">— recent development activity</span></h4>
      <p class="op-sm muted" style="margin-top:8px">
        Total lines added plus removed in the last 12 months, with the added/removed split,
        commit count, file-change count, and an average lines-per-commit figure shown alongside
        it. From CHAOSS's Code Changes Lines metric (OpenSearch/GrimoireLab), requested at a
        365-day window. <strong>Caveat:</strong> this counts raw line churn, not meaningful code
        changes — a handful of tools in this comparison show average commits in the thousands of
        lines, almost certainly from vendored dependencies, generated files, or bulk data
        committed directly to the repo rather than hand-written code. Treat it as a rough
        activity-volume signal, not a measure of codebase size or quality.
      </p>
    </div>
  </div>

  <div class="op-section op-grid-2">
    <div class="op-card">
      <h4>PR closure ratio <span class="op-caption muted">— recent development activity</span></h4>
      <p class="op-sm muted" style="margin-top:8px">
        Share of pull requests opened or updated in the last 12 months that have since been
        closed (merged or declined), out of all PRs touched in that window. A high ratio means
        the project keeps its PR queue moving; a low one suggests PRs pile up unreviewed. As of
        this build, 8 of the 16 compared tools show any PR data at a 12-month window — for the
        rest, this dashboard says "no merged or reviewed pull request in the last 12 months"
        rather than a misleading zero, since an empty result here doesn't distinguish "not
        covered by the tracker" from "genuinely quiet." From CHAOSS's Change Request Closure
        Ratio metric (OpenSearch/GrimoireLab GitHub PR index).
      </p>
    </div>
    <div class="op-card">
      <h4>Reviewed PRs <span class="op-caption muted">— recent development activity</span></h4>
      <p class="op-sm muted" style="margin-top:8px">
        Count of pull requests in the last 12 months that received at least one non-bot review
        comment. This is a floor, not a full review count — a PR with three human reviews and a
        PR with exactly one both count once. Same 12-month window and coverage as the closure
        ratio above. From CHAOSS's Change Request Reviews metric.
      </p>
    </div>
  </div>

  <div class="op-section op-grid-2">
    <div class="op-card">
      <h4>Median time to close <span class="op-caption muted">— recent development activity</span></h4>
      <p class="op-sm muted" style="margin-top:8px">
        Median number of days a pull request stays open before it's closed, counting both merged
        and declined PRs (unlike the related "merge-only" duration metric, which this dashboard
        doesn't show), for PRs closed in the last 12 months. A low number here can mean either
        "reviewed and merged fast" or "declined fast" — it doesn't distinguish the two; pair it
        with the closure ratio's merged/declined split for that. From CHAOSS's Time to Close
        metric.
      </p>
    </div>
    <div class="op-card">
      <h4>Self-merge rate <span class="op-caption muted">— recent development activity</span></h4>
      <p class="op-sm muted" style="margin-top:8px">
        Share of pull requests merged in the last 12 months that were merged by the same person
        who authored them, rather than by a separate reviewer/maintainer. A high rate is common
        (and not necessarily bad) on projects with one or two maintainers doing all the work; on
        a larger team it's more of a review-culture signal — how often does someone else sign off
        before code lands. From CHAOSS's Self Merge Rate metric.
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
      Pulse's GitHub issue tracker doesn't yet cover any repository in this comparison). Where a
      metric is missing for a specific tool, the dashboard says so explicitly rather than showing
      a zero.
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
      merged/declined split already in the closure ratio's detail text.
    </p>
    <p class="op-sm muted" style="margin-top:8px;max-width:72ch">
      Committers (90 days) and Occasional Contributors, shown on earlier builds of this
      dashboard, were removed to keep the Community activity card focused on the full-lifespan
      cohort histogram above rather than a growing list of narrower contributor counts — both
      remain queryable via CHAOSS's own API if needed, they're just not surfaced here.
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
