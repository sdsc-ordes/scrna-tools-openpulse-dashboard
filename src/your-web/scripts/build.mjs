#!/usr/bin/env node
// Static site generator for the scRNA-seq / spatial transcriptomics tool
// comparison dashboard — plain HTML/CSS/JS, no framework (per DASHBOARD.md).
// Reads the build-time snapshots from src/data/ (written by fetch-data.mjs)
// and emits a fully static dist/ ready for GitHub Pages.

import { readFile, writeFile, mkdir, copyFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { layout } from '../src/templates/layout.mjs';
import { compareBody } from '../src/templates/compare.mjs';
import { toolBody } from '../src/templates/tool.mjs';
import { methodologyBody } from '../src/templates/methodology.mjs';
import { coverageBody } from '../src/templates/coverage.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = join(HERE, '..');
const DATA_DIR = join(APP_ROOT, 'src', 'data');
const DIST_DIR = join(APP_ROOT, 'dist');

const FONT_FILES = [
	['@fontsource-variable/space-grotesk/files', 'space-grotesk-latin-wght-normal.woff2'],
	['@carrot-kpi/switzer-font/files', 'switzer-latin-400-normal.woff2'],
	['@carrot-kpi/switzer-font/files', 'switzer-latin-500-normal.woff2'],
	['@carrot-kpi/switzer-font/files', 'switzer-latin-600-normal.woff2'],
	['@carrot-kpi/switzer-font/files', 'switzer-latin-700-normal.woff2'],
	['@fontsource/jetbrains-mono/files', 'jetbrains-mono-latin-400-normal.woff2'],
	['@fontsource/jetbrains-mono/files', 'jetbrains-mono-latin-500-normal.woff2'],
];

async function copyDir(src, dest) {
	await mkdir(dest, { recursive: true });
	for (const entry of await readdir(src, { withFileTypes: true })) {
		const s = join(src, entry.name);
		const d = join(dest, entry.name);
		if (entry.isDirectory()) await copyDir(s, d);
		else await copyFile(s, d);
	}
}

async function writePage(relPath, html) {
	const full = join(DIST_DIR, relPath);
	await mkdir(dirname(full), { recursive: true });
	await writeFile(full, html);
}

async function main() {
	const tools = JSON.parse(await readFile(join(DATA_DIR, 'tools.json'), 'utf8'));
	const coverage = JSON.parse(await readFile(join(DATA_DIR, 'coverage.json'), 'utf8'));
	const buildTimestamp = new Date().toISOString();

	await mkdir(DIST_DIR, { recursive: true });

	// Static assets
	await copyDir(join(APP_ROOT, 'src', 'styles'), join(DIST_DIR, 'styles'));
	await copyDir(join(APP_ROOT, 'src', 'scripts'), join(DIST_DIR, 'scripts'));
	await mkdir(join(DIST_DIR, 'styles', 'fonts'), { recursive: true });
	for (const [pkgDir, file] of FONT_FILES) {
		await copyFile(
			join(APP_ROOT, 'node_modules', pkgDir, file),
			join(DIST_DIR, 'styles', 'fonts', file)
		);
	}

	// Compare (landing)
	await writePage(
		'index.html',
		layout({
			rootPath: '.',
			active: 'compare',
			title: 'Compare',
			description: 'Compare single-cell RNA-seq and spatial transcriptomics visualisation tools on health, activity, popularity, and maturity.',
			bodyHtml: compareBody({ tools: tools.tools, coverageCount: coverage.repos.length }),
			buildTimestamp,
			includeSort: true,
		})
	);

	// Methodology
	await writePage(
		'methodology.html',
		layout({
			rootPath: '.',
			active: 'methodology',
			title: 'Methodology',
			description: 'How the comparison metrics are computed, sourced, and what is deliberately excluded.',
			bodyHtml: methodologyBody(),
			buildTimestamp,
		})
	);

	// Coverage ("not yet indexed")
	await writePage(
		'coverage.html',
		layout({
			rootPath: '.',
			active: 'coverage',
			title: 'Not yet indexed',
			description: 'Shortlisted repositories Open Pulse has not yet indexed, and why they are excluded from the comparison.',
			bodyHtml: coverageBody({ repos: coverage.repos }),
			buildTimestamp,
		})
	);

	// Tool detail pages
	for (const tool of tools.tools) {
		await writePage(
			join('tools', `${tool.slug}.html`),
			layout({
				rootPath: '..',
				active: null,
				title: `${tool.owner}/${tool.repo}`,
				description: `Detailed Open Pulse metrics for ${tool.owner}/${tool.repo}.`,
				bodyHtml: toolBody(tool),
				buildTimestamp,
			})
		);
	}

	console.log(`Built ${1 + 1 + 1 + tools.tools.length} pages -> dist/`);
	console.log(`  index.html, methodology.html, coverage.html, tools/*.html (${tools.tools.length})`);
	console.log(`Build timestamp: ${buildTimestamp}`);
}

main().catch((e) => {
	console.error(e.stack ?? e.message);
	process.exit(1);
});
