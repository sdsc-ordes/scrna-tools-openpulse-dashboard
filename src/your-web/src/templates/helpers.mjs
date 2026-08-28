export function escapeHtml(str) {
	if (str === null || str === undefined) return '';
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

export function fmt(value, fallback = '—') {
	return value === null || value === undefined || value === '' ? fallback : escapeHtml(value);
}

// A tiny inline sparkline — canvas/SVG drawing code is the one place the
// design system allows raw hex (frontend-dev §5); it can't read CSS custom
// properties, so the blue below is copied from --op-blue-light verbatim.
export function sparklineSvg(series, { width = 130, height = 34 } = {}) {
	if (!series || series.length === 0) {
		return `<svg width="${width}" height="${height}" class="sparkline" role="img" aria-label="No recent commit data"></svg>`;
	}
	const values = series.map((p) => p.value);
	const max = Math.max(...values, 1);
	const stepX = width / Math.max(values.length - 1, 1);
	const points = values
		.map((v, i) => {
			const x = i * stepX;
			const y = height - (v / max) * (height - 4) - 2;
			return `${x.toFixed(1)},${y.toFixed(1)}`;
		})
		.join(' ');
	const areaPoints = `0,${height} ${points} ${width},${height}`;
	const label = `Monthly commits, last 12 months: ${values.join(', ')}`;
	return `<svg width="${width}" height="${height}" class="sparkline" role="img" aria-label="${escapeHtml(label)}">
    <polygon points="${areaPoints}" fill="#8a94c9" fill-opacity="0.18" stroke="none"></polygon>
    <polyline points="${points}" fill="none" stroke="#8a94c9" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"></polyline>
  </svg>`;
}

// Wraps sparklineSvg with an explicit "No activity" state instead of a flat,
// empty-looking chart — a genuinely quiet window should read as quiet, not
// as a rendering glitch.
export function activityOrNone(series, opts) {
	const hasActivity = (series ?? []).some((p) => p.value > 0);
	if (!hasActivity) return `<span class="op-sm muted">No activity</span>`;
	return sparklineSvg(series, opts);
}

// A collapsed, scrollable list for "see all N" — dependency lists in
// particular can run into the hundreds (MDV has 291), too many to show
// inline. `urls` are full GitHub URLs; the visible label strips the host.
export function disclosureList(summaryLabel, urls) {
	if (!urls || !urls.length) return '';
	const items = urls
		.map((u) => `<li><a href="${escapeHtml(u)}">${escapeHtml(u.replace('https://github.com/', ''))}</a></li>`)
		.join('');
	return `<details class="op-disclosure">
    <summary>${escapeHtml(summaryLabel)}</summary>
    <ul class="op-disclosure-list">${items}</ul>
  </details>`;
}

// Required shared component (frontend-dev §7): same four fixed fields on
// every data card, never bespoke per-section text.
export function provenance({ source, method, refresh, caveats }) {
	// dt/dd must be direct children of the grid (see .op-provenance dl in
	// main.css) — wrapping each pair in its own <div> made THAT div the grid
	// item, so `max-content 1fr` columnized the four (label+value) pairs into
	// a cramped 2x2 block instead of one label column beside one wide value
	// column, and long values wrapped badly as a result.
	return `<details class="op-provenance">
    <summary><span aria-hidden="true">ⓘ</span> How is this computed?</summary>
    <dl>
      <dt>Source</dt><dd class="mono">${escapeHtml(source)}</dd>
      <dt>Method</dt><dd class="mono">${escapeHtml(method)}</dd>
      <dt>Refresh</dt><dd>${escapeHtml(refresh)}</dd>
      <dt>Caveats</dt><dd>${escapeHtml(caveats)}</dd>
    </dl>
  </details>`;
}

export function badge(text, variant = 'neutral') {
	return `<span class="op-badge op-badge--${variant}">${escapeHtml(text)}</span>`;
}

export function docsScoreFraction(docsScore) {
	if (!docsScore || !docsScore.includes('/')) return null;
	const [num, den] = docsScore.split('/').map(Number);
	if (!den) return null;
	return num / den;
}
