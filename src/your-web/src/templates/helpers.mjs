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

// Required shared component (frontend-dev §7): same four fixed fields on
// every data card, never bespoke per-section text.
export function provenance({ source, method, refresh, caveats }) {
	return `<details class="op-provenance">
    <summary><span aria-hidden="true">ⓘ</span> How is this computed?</summary>
    <dl>
      <div><dt>Source</dt><dd class="mono">${escapeHtml(source)}</dd></div>
      <div><dt>Method</dt><dd class="mono">${escapeHtml(method)}</dd></div>
      <div><dt>Refresh</dt><dd>${escapeHtml(refresh)}</dd></div>
      <div><dt>Caveats</dt><dd>${escapeHtml(caveats)}</dd></div>
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
