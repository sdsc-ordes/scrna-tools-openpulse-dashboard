import { escapeHtml } from './helpers.mjs';

const NAV = [
	{ key: 'compare', label: 'Compare', href: 'index.html' },
	{ key: 'methodology', label: 'Methodology', href: 'methodology.html' },
	{ key: 'coverage', label: 'Not yet indexed', href: 'coverage.html' },
];

export function layout({ rootPath, active, title, description, bodyHtml, buildTimestamp, includeSort = false }) {
	const nav = NAV.map(
		(n) =>
			`<a href="${rootPath}/${n.href}"${n.key === active ? " aria-current=\"page\"" : ''}>${n.label}</a>`
	).join('\n      ');

	return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} — scRNA-seq &amp; spatial tools comparison</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="stylesheet" href="${rootPath}/styles/tokens.css">
  <link rel="stylesheet" href="${rootPath}/styles/fonts.css">
  <link rel="stylesheet" href="${rootPath}/styles/main.css">
</head>
<body>
  <div class="op-page">
    <div class="op-attribution">
      <div class="op-container">
        Built using <a href="https://openpulse.science">openpulse.science</a> at <span class="mono">${escapeHtml(buildTimestamp)}</span>
      </div>
    </div>
    <header class="op-header">
      <div class="op-container">
        <a href="${rootPath}/index.html" class="op-wordmark">scRNA-seq &amp; Spatial <span>Tools</span></a>
        <nav class="op-nav">
      ${nav}
        </nav>
      </div>
    </header>
    <main class="op-main">
      <div class="op-container">
${bodyHtml}
      </div>
    </main>
    <footer class="op-footer">
      <div class="op-container">
        <p>
          A comparison dashboard evaluating open-source single-cell RNA-seq and spatial
          transcriptomics visualisation tools, built on data from the
          <a href="https://openpulse.science">Open Pulse</a> platform (Neo4j, SPARQL,
          OpenSearch, CHAOSS). Internal team reference — not an endorsement of any tool.
        </p>
        <p><a href="${rootPath}/methodology.html">How the metrics are computed →</a></p>
      </div>
    </footer>
  </div>
  ${includeSort ? `<script src="${rootPath}/scripts/sort-table.js"></script>` : ''}
</body>
</html>
`;
}
