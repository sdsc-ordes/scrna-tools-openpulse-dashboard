// Vanilla JS, no deps: click a Compare-table column header to sort by it.
// Rows carry the sortable value as a data-<key> attribute (see templates/compare.mjs);
// first click sorts descending (higher = more contributors / stars / commits /
// bus factor / docs score, so descending reads as "best first"), second click
// on the same column flips to ascending.
(function () {
	const table = document.getElementById('compare-table');
	if (!table) return;
	const tbody = table.tBodies[0];
	const headers = table.querySelectorAll('th[data-sort]');

	let activeKey = null;
	let ascending = false;

	function sortRows(key, asc) {
		const rows = Array.from(tbody.rows);
		rows.sort((a, b) => {
			const av = a.dataset[key];
			const bv = b.dataset[key];
			const an = av === '' || av === undefined ? -Infinity : parseFloat(av);
			const bn = bv === '' || bv === undefined ? -Infinity : parseFloat(bv);
			return asc ? an - bn : bn - an;
		});
		rows.forEach((r) => tbody.appendChild(r));
	}

	headers.forEach((th) => {
		th.setAttribute('data-sortable', '');
		const arrow = document.createElement('span');
		arrow.className = 'sort-arrow';
		arrow.textContent = '↕';
		th.appendChild(arrow);

		th.addEventListener('click', () => {
			const key = th.dataset.sort;
			ascending = key === activeKey ? !ascending : false;
			activeKey = key;
			headers.forEach((h) => {
				h.removeAttribute('data-sort-active');
				h.querySelector('.sort-arrow').textContent = '↕';
			});
			th.setAttribute('data-sort-active', '');
			th.querySelector('.sort-arrow').textContent = ascending ? '↑' : '↓';
			sortRows(key, ascending);
		});
	});
})();
