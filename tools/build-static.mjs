import { cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const deployEntries = [
  ".htaccess",
  "about",
  "assets",
  "blog",
  "case-studies",
  "contact",
  "hire",
  "hire-developers",
  "index.html",
  "portfolio",
  "privacy",
  "reviews",
  "robots.txt",
  "services",
  "sitemap.xml",
  "terms",
  "__l5e",
  "~flock.js",
];

const articleDirs = [
  "why-your-business-isnt-ranking-on-google-and-how-to-fix-it-a-complete-seo-guide-for-2026",
  "how-manufacturing-companies-can-grow-through-digital-presence-in-2026",
  "how-ai-is-transforming-digital-marketing-in-2026",
  "how-custom-software-development-helps-businesses-scale-faster",
  "why-every-ecommerce-business-needs-a-high-performance-website-in-2026",
  "top-ui-ux-design-trends-businesses-must-follow-in-2026",
  "why-every-business-needs-a-crm-system-in-2026",
  "how-ai-agents-are-revolutionizing-business-automation-in-2026",
  "the-future-of-e-commerce-how-ai-and-automation-are-redefining-online-shopping-in-2025",
  "transforming-business-in-the-digital-era-the-power-of-ecommerce-digital-marketing-and-software-development",
];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const entry of [...deployEntries, ...articleDirs]) {
  await cp(path.join(root, entry), path.join(dist, entry), {
    recursive: true,
    force: true,
    filter: (source) => !source.includes(`${path.sep}node_modules${path.sep}`) && !source.endsWith(".log"),
  });
}

const copied = await readdir(dist);
console.log(`Static export ready in dist with ${copied.length} top-level entries.`);
