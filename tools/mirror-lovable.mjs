import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const origin = "https://ecliptix-growth-engine.lovable.app";
const root = process.cwd();
const crawledRoutes = new Set();
const queuedAssets = new Set();
const downloadedAssets = new Set();

const routeAllowlist = new Set([
  "/",
  "/about",
  "/portfolio",
  "/blog",
  "/reviews",
  "/contact",
  "/privacy",
  "/terms",
  "/services",
  "/hire-developers",
  "/hire/web-developers",
  "/hire/full-stack-developers",
  "/hire/ui-ux-designers",
  "/hire/graphic-designers",
  "/hire/digital-marketing-experts",
  "/hire/ecommerce-managers",
  "/hire/ai-automation-experts",
  "/hire/crm-experts",
  "/case-studies/mangoholicks",
  "/case-studies/mahavir-clinic",
  "/case-studies/homenest",
]);

const queuedRoutes = Array.from(routeAllowlist);

function cleanPathname(value) {
  const url = new URL(value, origin);
  if (url.origin !== origin) return null;
  if (url.pathname.startsWith("/assets/")) return null;
  if (url.pathname.startsWith("/~") || url.pathname.startsWith("/__")) return null;
  return url.pathname.replace(/\/$/, "") || "/";
}

function routeFile(route) {
  if (route === "/") return path.join(root, "index.html");
  return path.join(root, route.slice(1), "index.html");
}

async function writeRoute(route, html) {
  const file = routeFile(route);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, html, "utf8");
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 EcliptixLocalMirror/1.0",
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed ${response.status} ${url}`);
  }

  return response.text();
}

async function fetchBytes(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 EcliptixLocalMirror/1.0",
      "accept": "*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed ${response.status} ${url}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

function queueAssetsFromText(text) {
  const patterns = [
    /(?:href|src)=["'](\/assets\/[^"']+)["']/g,
    /(?:href|src)=["'](https:\/\/ecliptix-growth-engine\.lovable\.app\/assets\/[^"']+)["']/g,
    /url\(["']?(\/assets\/[^)"']+)["']?\)/g,
    /["'`](\/assets\/[^"'`\\\s)]+)["'`]/g,
    /["'`](assets\/[^"'`\\\s)]+)["'`]/g,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const asset = new URL(match[1], origin).pathname;
      queuedAssets.add(asset);
    }
  }
}

function queueRoutesFromHtml(html) {
  const hrefPattern = /href=["']([^"']+)["']/g;
  for (const match of html.matchAll(hrefPattern)) {
    const route = cleanPathname(match[1]);
    if (!route || crawledRoutes.has(route) || queuedRoutes.includes(route)) continue;
    if (routeAllowlist.has(route)) queuedRoutes.push(route);
  }
}

async function crawlRoutes() {
  while (queuedRoutes.length > 0) {
    const route = queuedRoutes.shift();
    if (crawledRoutes.has(route)) continue;

    const html = await fetchText(`${origin}${route}`);
    crawledRoutes.add(route);
    queueRoutesFromHtml(html);
    queueAssetsFromText(html);
    await writeRoute(route, html);
    console.log(`Saved route ${route}`);
  }
}

async function downloadAssets() {
  while (queuedAssets.size > 0) {
    const asset = queuedAssets.values().next().value;
    queuedAssets.delete(asset);
    if (downloadedAssets.has(asset)) continue;
    downloadedAssets.add(asset);

    const bytes = await fetchBytes(`${origin}${asset}`);
    const file = path.join(root, asset.slice(1));
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, bytes);
    console.log(`Saved asset ${asset}`);

    if (/\.(css|js|mjs)$/i.test(asset)) {
      const text = await readFile(file, "utf8");
      queueAssetsFromText(text);
    }
  }
}

async function createLocalStubs() {
  await mkdir(path.join(root, "__l5e"), { recursive: true });
  await writeFile(path.join(root, "~flock.js"), "", "utf8");
  await writeFile(path.join(root, "__l5e", "events.js"), "", "utf8");
}

await crawlRoutes();
await downloadAssets();
await createLocalStubs();

console.log(
  `Mirrored ${crawledRoutes.size} routes and ${downloadedAssets.size} assets from ${origin}`,
);
