#!/usr/bin/env node
/* Local dev server that mimics GitHub Pages' extensionless URLs:
   /field-guide → field-guide.html, / → index.html.
   (python -m http.server 404s extensionless paths — use this instead.)
   Usage: node tools/serve.mjs [port]   (default 8731) */
import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.argv[2]) || 8731;
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".woff2": "font/woff2", ".mp4": "video/mp4", ".webmanifest": "application/manifest+json",
};

http.createServer(async (req, res) => {
  try {
    let rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (rel.endsWith("/")) rel += "index.html";
    let file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    if (!path.extname(file) && existsSync(file + ".html")) file += ".html";
    const buf = await readFile(file);
    res.writeHead(200, { "content-type": MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream" });
    res.end(buf);
  } catch {
    try {
      res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
      res.end(await readFile(path.join(ROOT, "404.html")));
    } catch { res.writeHead(404).end("not found"); }
  }
}).listen(PORT, "127.0.0.1", () => console.log(`serving ${ROOT} at http://127.0.0.1:${PORT}/ (extensionless like GitHub Pages)`));
