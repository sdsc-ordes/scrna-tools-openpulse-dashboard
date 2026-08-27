# Dashboard plan — scRNA-seq / spatial transcriptomics tool comparison

## Scope & audience

A comparison dashboard evaluating alternatives to CELLxGENE for single-cell RNA-seq and
spatial transcriptomics visualisation, for an internal project/team audience (mixed:
researchers, developers, and decision-makers). Posture: **stats reference, but sparse** —
a clean comparison table with a handful of well-chosen metrics, minimal prose, no dense
filters or analytics-console feel. Secondary metrics only in tool-detail views.

Shortlist (user-provided, 27 entries → 24 in scope after recon):

- **Dropped**: `stratton-lab` (no repo specified — not a valid entry), `chanzuckerberg/cellxgene`
  (see Data reconnaissance — effectively unindexed in this Open Pulse hub snapshot; excluded
  from the live data comparison entirely, not referenced anywhere in the built site).
- **16 well-covered** (main comparison table): vitessce/vitessce, haniffalab/webatlas-app,
  haniffalab/webatlas-pipeline, jianhong/scRNAseqApp, lilab-bcb/cirrocumulus, FredPont/spatial,
  kanaverse/kana, pughlab/crescent, biolab/orange3-single-cell, iSEE/iSEE, immcore/iS-CellR,
  romanhaa/Cerebro, euxhenh/cellar, MonashBioinformaticsPlatform/ShinyCellModular,
  longrw/OmniCellX, Taylor-CCB-Group/MDV.
- **8 thin repos** (no-data side list): ucscGenomeBrowser/cellBrowser, kharchenkolab/pagoda2,
  chaichontat/samui, DeplanckeLab/asap_web, spatial-research/semla, kanaverse/bakana,
  romanhaa/cerebroApp, pughlab/crescent-frontend.

16 + 8 = 24 total in scope.

## Themes (site structure)

| Page | Answers | Content |
|---|---|---|
| **Compare** (landing) | "How do these tools stack up, at a glance?" | Sortable table, one row per tool (16), one column per headline metric (5 below). Links each row into its Tool detail page. |
| **Tool detail** (×16) | "What do I need to know about this specific tool?" | Secondary metrics (below) + the standard provenance disclosure (source/method/refresh/caveats) per data card. |
| **Methodology** | "How is this measured, and can I trust it?" | Plain-language explanation of the 5 headline metrics, what CHAOSS/Open Pulse computes them from, refresh cadence, and known caveats (see Data reconnaissance). |
| **Not yet indexed** (required coverage panel) | "What's missing?" | The 8 thin repos: name + GitHub link + "not yet indexed by Open Pulse" badge only — no fabricated metrics. Framed as an actionable gap, with a note that a crawl/extraction pass (`op-crawler`/`op-extractor`) could close it. |

### Headline metrics (Compare table — one per dimension, non-redundant)

| Dimension | Metric | Source | Coverage (of 16) |
|---|---|---|---|
| Sustainability/health | Bus factor (`absence_factor`) | CHAOSS | 16/16 |
| Community activity | Contributors, last 12 months (`contributors`) | CHAOSS | 16/16 |
| Popularity/adoption | GitHub stars (raw, freshest available store) | SPARQL / OpenSearch | 16/16 |
| Quality/maturity | Docs discoverability score (`docs_discoverability`, /4) | CHAOSS | 16/16 |
| Recent development activity | Monthly commit sparkline, last 12 months (`activity_dates` series) | CHAOSS | 16/16 |

### Detail-view metrics (per tool, not in the main table)

| Dimension | Extras |
|---|---|
| Sustainability/health | Contributor pool breakdown — core / recent / dormant (`project_demographics`, stacked bar) |
| Community activity | Committers, last 90 days (`committers`); occasional contributors, ≤4 commits (`occasional_contributors`) |
| Popularity/adoption | Forks |
| Quality/maturity | License (`license_coverage` + SPDX id), upstream dependency count (`upstream_dependencies`) |
| Recent development activity | Commit rhythm (`burstiness`); code churn (`code_lines`, see caveat below); PR closure ratio / review count / median time to close / self-merge rate (`closure_ratio`, `cr_reviews`, `pr_time_to_close`, `self_merge`) — shown only for the 12/16 repos with PR-tracker coverage; omitted (not dashed) for the other 4 |

**Advanced-metric addition (post-launch, verified live against all 16 well-covered repos across the
full 35-metric CHAOSS catalogue — featured + advanced):**

- `burstiness` (16/16, real spread −1…+1) — Goh–Barabási commit-rhythm index; complements the
  monthly sparkline with a steady-vs-bursty read.
- `occasional_contributors` (16/16, real spread 0–55%) — share of contributors with ≤4 commits;
  complements bus factor / demographics with an openness-to-drive-by-contribution signal.
- `pr_time_to_close` (12/16, same PR-tracker subset as `closure_ratio`) — median days a PR stays
  open; pairs with the existing closure ratio.
- `self_merge` (11/16, same PR-tracker subset, one repo undefined with 0 merged PRs) — share of
  merged PRs the author merged themselves; a review-culture signal, real spread 0–100%.
- `code_lines` (16/16, real spread) — total line churn (added + removed). **Caveat:** a few repos
  (`romanhaa/Cerebro`, `biolab/orange3-single-cell`) show implausible lines-per-commit averages
  (tens of thousands), almost certainly from vendored/data files bundled into single commits, not
  hand-written code. Shown with an explicit disclaimer on the tool-detail card rather than
  silently treated as a clean signal.

**Checked and dropped in the same pass** (technically returned a value on most/all of the 16, but
uninformative or redundant):

- `licenses_declared` — flat `✗` (no) on all 16, contradicting `license_coverage` (already shown),
  which correctly reports MIT etc. for most. Looks like a data-quality quirk on this specific
  metric for this tool category, not a real "no license" signal.
- `technical_fork` — flat (`0` on 15/16, `1` on iSEE only). This is the Neo4j *in-graph* fork
  count, not the real GitHub fork count already shown from SPARQL — uninformative on its own.
- `bot_activity` — nearly flat (`0%` on 13/16, low single digits on the rest) — too little
  variance to be worth a card.
- `cr_accepted` / `cr_declined` — redundant with the "merged vs declined" split already surfaced
  in `closure_ratio`'s secondary text, and risky as standalone numbers: the 4 repos without
  PR-tracker coverage silently report `0` instead of `—`, which would misrepresent "no data" as
  "zero merges" if shown directly.

## Data reconnaissance

Connectivity: all 5 stores reachable (`npm run check-connectivity` — Neo4j 3.85M nodes, SPARQL
reachable, OpenSearch 2.56M commit docs, CHAOSS API reachable, hub reachable).

| Check | Finding |
|---|---|
| Neo4j | 24/25 valid shortlist repos exist as `Repo` stubs (thin metadata only — no stars/license here). `chanzuckerberg/cellxgene` exists as a stub with 0 contributor edges. No forks (`FORK_OF`) detected among the shortlist. |
| OpenSearch (`git_demo_enriched`, commits) | 15/25 repos have commit history (256–4,427 docs). `chanzuckerberg/cellxgene`: **0**. |
| OpenSearch (`github_repositories`, star/fork snapshots) | 16/25 covered. |
| OpenSearch (`github_pull_requests`) | 12/25 covered; `github_issues`: **0/25** — issue-response metrics excluded entirely. |
| SPARQL (stars/forks/license) | 16/25 covered with real values (one, `jianhong/scRNAseqApp`, genuinely has no declared license — real signal, not a gap). |
| op-collections (`github_repos` DuckDB) | `chanzuckerberg/cellxgene` absent; only unrelated forks/mirrors under other owners found. |
| CHAOSS spot-check | `chanzuckerberg/cellxgene` returns `0`/`—` on all 35 metrics — confirms it is unindexed, not inactive. Full 35-metric fetch run against all 16 well-covered repos to verify coverage before committing to the metric set (see table below). |

**CHAOSS metrics excluded entirely** (checked live, 0/16 or near-0 coverage across the whole
tool category, not just this shortlist): `academic_impact` (0 everywhere — no ORCID-linked
citations for these tools), `project_popularity` (stale composite, only 3/16; using raw
stars/forks instead), `release_frequency` (0/16), `test_coverage` (0/16),
`programming_languages` (0/16), `org_diversity` (empty even on well-covered repos),
`new_contributors` (near-duplicate of `contributors` — window-handling quirk, not real signal),
`inactive_contributors` (flat 0 across all 16 — uninformative), all issue-response metrics
(`first_response`, `issue_response_time`, `issue_resolution`, `issues_*` — 0/25 issue-tracker
coverage for this shortlist). A second pass (see *Advanced-metric addition* below) found five
more usable advanced metrics and four more that technically return a value but are flat or
redundant (`licenses_declared`, `technical_fork`, `bot_activity`, `cr_accepted`/`cr_declined`).

**Known caveats to carry into the Methodology page:**
- `chanzuckerberg/cellxgene` is excluded from the entire comparison (not shown, not mentioned)
  because Open Pulse has not indexed it — a live crawl (`op-crawler`/`op-extractor`) could close
  this gap in a future iteration, out of scope for v1.
- The 8 thin repos show only name + link + a "not yet indexed" badge — never a zero or dash
  standing in for missing data.
- PR-based metrics (closure ratio, reviews) are shown for only 12/16 tools; omit the row rather
  than showing "—" for the other 4.
- Star/fork/license figures are read from whichever store has them (SPARQL primarily, OpenSearch
  `github_repositories` where available) — these lag live GitHub by an unspecified amount;
  the Methodology page should say so plainly rather than implying real-time accuracy.

## Stack & publishing

- **Framework**: plain HTML/CSS/JS — lightest fit for a small static comparison site (one table
  template + one tool-detail template + two static pages).
- **Publishing**: static, GitHub Pages. Build-time snapshot script (`scripts/fetch-data.mjs`)
  queries Neo4j/SPARQL/OpenSearch/CHAOSS with the same transports as the `query-*` skills and
  bakes typed JSON into `src/data/` (per-tool metric objects, one `coverage.json` for the
  not-yet-indexed list). Credentials stay build-time only; the browser never talks to Open Pulse.

## Design system

Active design skill: **`openpulse-dark-theme`** (over the `sdsc-ui-kit` base brand) — the SDSC
default. No custom brand skill needed.

## Open framing calls

- Whether/when to attempt crawling `chanzuckerberg/cellxgene` and the 8 thin repos via
  `op-crawler`/`op-extractor` is deliberately deferred past v1 — noted as a follow-up, not
  decided here.
- Sort order / default sort column for the Compare table is not yet decided — propose defaulting
  to alphabetical or to bus factor descending during scaffolding, flag for a quick confirmation.
