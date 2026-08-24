#!/usr/bin/env node
// Zero-dependency static file server for dist/ — no framework dev server
// needed for a plain HTML/CSS/JS build. Port matches the Playwright MCP
// config locked to 5173/4173 (see CLAUDE.md).

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(HERE, '..', 'dist');
const PORT = process.env.PORT ? Number(process.env.PORT) : 5173;

const MIME = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.woff2': 'font/woff2',
	'.woff': 'font/woff',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
};

const server = createServer(async (req, res) => {
	try {
		let urlPath = decodeURIComponent(req.url.split('?')[0]);
		if (urlPath === '/') urlPath = '/index.html';
		let filePath = join(DIST_DIR, urlPath);

		let st;
		try {
			st = await stat(filePath);
		} catch {
			filePath = join(DIST_DIR, urlPath, 'index.html');
			try {
				st = await stat(filePath);
			} catch {
				res.writeHead(404, { 'Content-Type': 'text/plain' });
				res.end('404 Not Found');
				return;
			}
		}
		if (st.isDirectory()) filePath = join(filePath, 'index.html');

		const body = await readFile(filePath);
		res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
		res.end(body);
	} catch (e) {
		res.writeHead(500, { 'Content-Type': 'text/plain' });
		res.end(`500: ${e.message}`);
	}
});

server.listen(PORT, () => {
	console.log(`Serving dist/ at http://localhost:${PORT}`);
});
