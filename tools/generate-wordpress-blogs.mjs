import { chromium } from "playwright";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const SITE_ORIGIN = "https://ecliptixsolutions.com";
const WP_ORIGIN = "https://ecliptixsolutions.com";
const USER_AGENT = "Ecliptix blog migration";
const ROOT = process.cwd();
const BLOG_IMAGE_DIR = path.join(ROOT, "assets", "blogs");
const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "blogs.json");
const TRACKING_HEAD = `<meta name="facebook-domain-verification" content="nrk7mjhqkkjd4016zcik9kvifyvxxn" />
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-PKC0BPJ9NH"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-PKC0BPJ9NH');
</script>
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1311660327503356');
fbq('track', 'PageView');
</script>
<!-- End Meta Pixel Code -->`;
const TRACKING_NOSCRIPT = `<!-- Meta Pixel NoScript -->
<noscript>
  <img
    height="1"
    width="1"
    style="display:none"
    src="https://www.facebook.com/tr?id=1311660327503356&ev=PageView&noscript=1"
    alt=""
  />
</noscript>
<!-- End Meta Pixel NoScript -->`;
const CRITICAL_CHROME_STYLE = `<style id="ecliptix-critical-chrome">
header nav > a[href="/"]:first-child,
header nav > a[href="./"]:first-child,
header nav > a[href="/index.html"]:first-child{display:inline-flex!important;flex:0 0 auto;align-items:center;justify-content:center;width:clamp(11rem,22vw,16rem);height:clamp(2.75rem,5vw,3.5rem);border-radius:.85rem;overflow:hidden;color:transparent!important;font-size:0!important;line-height:0!important;text-indent:-9999px;white-space:nowrap;background:transparent url("/assets/ecliptix-solutions-logo.png") center/contain no-repeat}
footer > .container-x:first-child > div:first-child > div:first-child{display:inline-flex!important;width:clamp(11rem,30vw,16rem);height:clamp(2.75rem,5vw,3.7rem);overflow:hidden;color:transparent!important;font-size:0!important;line-height:0!important;text-indent:-9999px;white-space:nowrap;background:transparent url("/assets/ecliptix-solutions-logo.png") left center/contain no-repeat}
[id^="project-"] > :first-child:not(.ecliptix-project-media){display:none!important}
</style>`;

const SLUGS = [
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

const FEATURED_FILENAMES = {
  "why-your-business-isnt-ranking-on-google-and-how-to-fix-it-a-complete-seo-guide-for-2026": "seo-guide-2026.webp",
  "how-manufacturing-companies-can-grow-through-digital-presence-in-2026": "manufacturing-digital-presence-2026.webp",
  "how-ai-is-transforming-digital-marketing-in-2026": "ai-digital-marketing-2026.webp",
  "how-custom-software-development-helps-businesses-scale-faster": "custom-software-development.webp",
  "why-every-ecommerce-business-needs-a-high-performance-website-in-2026": "ecommerce-high-performance-website.webp",
  "top-ui-ux-design-trends-businesses-must-follow-in-2026": "ui-ux-trends-2026.webp",
  "why-every-business-needs-a-crm-system-in-2026": "crm-system-2026.webp",
  "how-ai-agents-are-revolutionizing-business-automation-in-2026": "ai-agents-business-automation.webp",
  "the-future-of-e-commerce-how-ai-and-automation-are-redefining-online-shopping-in-2025": "future-ecommerce-ai-automation.webp",
  "transforming-business-in-the-digital-era-the-power-of-ecommerce-digital-marketing-and-software-development": "digital-business-transformation.webp",
};

const FEATURED_IMAGE_FALLBACKS = {
  "why-your-business-isnt-ranking-on-google-and-how-to-fix-it-a-complete-seo-guide-for-2026": "/assets/blogs/seo-guide-2026.webp",
};

function decodeEntities(value = "") {
  const named = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: "\"",
    apos: "'",
    nbsp: " ",
    ndash: "-",
    mdash: "-",
    hellip: "...",
    rsquo: "'",
    lsquo: "'",
    rdquo: "\"",
    ldquo: "\"",
  };

  return String(value)
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match);
}

function stripTags(value = "") {
  return decodeEntities(String(value).replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function absoluteUrl(pathname) {
  return `${SITE_ORIGIN}${pathname}`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function estimateReadingTime(html) {
  const words = stripTags(html).split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

function extractHeadMeta(html) {
  const title = decodeEntities(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const description =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] ??
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)?.[1] ??
    "";

  return {
    seoTitle: title,
    metaDescription: decodeEntities(description),
  };
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
}

async function fetchBuffer(url) {
  const response = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  const contentType = response.headers.get("content-type") || "application/octet-stream";
  return {
    contentType,
    buffer: Buffer.from(await response.arrayBuffer()),
  };
}

async function convertImageToWebp(page, imageUrl, destination) {
  const { contentType, buffer } = await fetchBuffer(imageUrl);
  const dataUrl = `data:${contentType};base64,${buffer.toString("base64")}`;

  const webpBase64 = await page.evaluate(async ({ dataUrl: src }) => {
    const image = new Image();
    image.decoding = "async";
    const loaded = new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });
    image.src = src;
    await loaded;

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    return canvas.toDataURL("image/webp", 0.86).split(",", 2)[1];
  }, { dataUrl });

  await writeFile(destination, Buffer.from(webpBase64, "base64"));
}

async function localizeImages(page, post, content) {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  const featuredUrl = media?.source_url || "";
  let featuredImage = "";

  if (featuredUrl) {
    const filename = FEATURED_FILENAMES[post.slug];
    const destination = path.join(BLOG_IMAGE_DIR, filename);
    await convertImageToWebp(page, featuredUrl, destination);
    featuredImage = `/assets/blogs/${filename}`;
  } else if (FEATURED_IMAGE_FALLBACKS[post.slug]) {
    featuredImage = FEATURED_IMAGE_FALLBACKS[post.slug];
  }

  const imgSrcs = [...content.matchAll(/<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1]);
  let localizedContent = content;

  for (const [index, src] of imgSrcs.entries()) {
    if (!src.startsWith(WP_ORIGIN)) continue;
    const filename = `${post.slug}-inline-${index + 1}.webp`;
    const destination = path.join(BLOG_IMAGE_DIR, filename);
    await convertImageToWebp(page, src, destination);
    localizedContent = localizedContent.replaceAll(src, `/assets/blogs/${filename}`);
  }

  return { featuredImage, content: localizedContent };
}

function cleanArticleContent(html, allSlugs) {
  let content = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\sclass=["'][^"']*wp-[^"']*["']/g, "")
    .replace(/\sstyle=["'][^"']*["']/g, "")
    .replace(/\sloading=["'][^"']*["']/g, "")
    .replace(/\sdecoding=["'][^"']*["']/g, "")
    .replace(/<h1\b/gi, "<h2")
    .replace(/<\/h1>/gi, "</h2>")
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/\n{3,}/g, "\n\n");

  for (const slug of allSlugs) {
    content = content.replaceAll(`${WP_ORIGIN}/${slug}/`, `/${slug}/`);
    content = content.replaceAll(`${WP_ORIGIN}/${slug}`, `/${slug}/`);
  }

  content = content
    .replace(/<img\b([^>]*)>/gi, '<img$1 loading="lazy" decoding="async">')
    .replace(/<a\s+href=["']https?:\/\/(?!ecliptixsolutions\.com)([^"']+)["']([^>]*)>/gi, '<a href="https://$1" target="_blank" rel="noopener noreferrer"$2>');

  return content.trim();
}

function makeBlogCard(post) {
  const image = post.featuredImage
    ? `<div class="es-blog-card__media"><img src="${post.featuredImage}" alt="${escapeHtml(post.imageAlt)}" loading="lazy" decoding="async" class="es-blog-card__image"></div>`
    : "";

  return `
    <a class="es-blog-card${post.featuredImage ? "" : " es-blog-card--text-only"}" href="/${post.slug}/" aria-label="Read ${escapeHtml(post.title)}">
      ${image}
      <div class="es-blog-card__body">
        <div class="es-blog-card__meta">
          <span>${escapeHtml(post.category)}</span>
          <span aria-hidden="true">·</span>
          <span>${escapeHtml(post.readingTime)}</span>
        </div>
        <h2>${escapeHtml(post.title)}</h2>
        <p>${escapeHtml(post.excerpt)}</p>
        <time datetime="${escapeHtml(post.publishedDate)}">${escapeHtml(post.displayDate)}</time>
      </div>
    </a>`;
}

function makeRelatedPosts(current, posts) {
  return posts
    .filter((post) => post.slug !== current.slug)
    .slice(0, 3)
    .map((post) => `
      <a class="es-related-card" href="/${post.slug}/">
        <span>${escapeHtml(post.category)} · ${escapeHtml(post.readingTime)}</span>
        <strong>${escapeHtml(post.title)}</strong>
      </a>`)
    .join("");
}

function makeShareUrl(network, post) {
  const url = encodeURIComponent(absoluteUrl(`/${post.slug}/`));
  const text = encodeURIComponent(post.title);
  if (network === "linkedin") return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
  if (network === "x") return `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
  return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
}

function makeHead({ title, description, canonical, image, type = "website", publishedDate, author, structuredData }) {
  const absoluteImage = image?.startsWith("http") ? image : absoluteUrl(image || "/assets/ecliptix-solutions-logo.png");
  const jsonLd = structuredData
    ? `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`
    : "";

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="dark light">${CRITICAL_CHROME_STYLE}<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"><link rel="preload" as="image" href="/assets/ecliptix-solutions-logo.png"><link rel="stylesheet" href="/assets/styles-CEI0Acq9.css"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=Plus+Jakarta+Sans:wght@600;700;800&amp;display=swap"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="/assets/ecliptix-custom.css"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="author" content="${escapeHtml(author || "Ecliptix Solutions")}"><link rel="canonical" href="${escapeHtml(canonical)}"><meta property="og:type" content="${type}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(canonical)}"><meta property="og:image" content="${escapeHtml(absoluteImage)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${escapeHtml(absoluteImage)}">${publishedDate ? `<meta property="article:published_time" content="${escapeHtml(publishedDate)}">` : ""}${jsonLd}${TRACKING_HEAD}</head>`;
}

function makePage({ head, header, main, footer }) {
  return `${head}<body>${TRACKING_NOSCRIPT}<div class="min-h-screen flex flex-col bg-white/[0.04] text-[#050a17]">${header}<main class="flex-1">${main}</main>${footer}</div><script defer src="/assets/ecliptix-custom.js"></script></body></html>`;
}

function makeBlogIndex(posts, chrome) {
  const head = makeHead({
    title: "Insights - Ecliptix Solutions",
    description: "Read the latest Ecliptix Solutions articles on SEO, manufacturing growth, AI, custom software, eCommerce, UI/UX, CRM, automation, and digital transformation.",
    canonical: absoluteUrl("/blog/"),
    image: posts.find((post) => post.featuredImage)?.featuredImage,
  });

  const main = `
    <section class="es-blog-hero">
      <div class="container-x">
        <nav class="es-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span>Blog</span></nav>
        <p class="es-eyebrow">Insights</p>
        <h1>Real growth notes from Ecliptix Solutions.</h1>
        <p class="es-hero-copy">Complete articles migrated from the original Ecliptix Solutions blog, refreshed inside the current website experience.</p>
      </div>
    </section>
    <section class="container-x es-blog-listing" aria-label="Blog posts">
      <div class="es-blog-grid">${posts.map(makeBlogCard).join("")}</div>
    </section>`;

  return makePage({ head, header: chrome.header, main, footer: chrome.footer });
}

function makeArticlePage(post, posts, chrome) {
  const canonical = absoluteUrl(`/${post.slug}/`);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription,
    image: absoluteUrl(post.openGraphImage),
    author: {
      "@type": "Organization",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Ecliptix Solutions",
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/assets/ecliptix-solutions-logo.png"),
      },
    },
    datePublished: post.publishedDate,
    dateModified: post.modifiedDate,
    mainEntityOfPage: canonical,
  };

  const head = makeHead({
    title: post.seoTitle,
    description: post.metaDescription,
    canonical,
    image: post.openGraphImage,
    type: "article",
    publishedDate: post.publishedDate,
    author: post.author,
    structuredData,
  });

  const heroImage = post.featuredImage
    ? `<figure class="es-article-featured"><img src="${post.featuredImage}" alt="${escapeHtml(post.imageAlt)}" width="1400" height="850" decoding="async"><figcaption>${escapeHtml(post.imageAlt)}</figcaption></figure>`
    : "";

  const main = `
    <article class="es-article">
      <header class="es-article-header">
        <nav class="es-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/blog/">Blog</a><span>/</span><span>${escapeHtml(post.title)}</span></nav>
        <div class="es-article-meta"><span>${escapeHtml(post.category)}</span><span aria-hidden="true">·</span><span>${escapeHtml(post.author)}</span><span aria-hidden="true">·</span><time datetime="${escapeHtml(post.publishedDate)}">${escapeHtml(post.displayDate)}</time><span aria-hidden="true">·</span><span>${escapeHtml(post.readingTime)}</span></div>
        <h1>${escapeHtml(post.title)}</h1>
        <p>${escapeHtml(post.excerpt)}</p>
        ${heroImage}
      </header>
      <div class="es-article-shell">
        <aside class="es-share" aria-label="Share this article">
          <span>Share</span>
          <a href="${makeShareUrl("linkedin", post)}" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href="${makeShareUrl("x", post)}" target="_blank" rel="noopener noreferrer">X</a>
          <a href="${makeShareUrl("facebook", post)}" target="_blank" rel="noopener noreferrer">Facebook</a>
        </aside>
        <div class="es-article-content">${post.content}</div>
      </div>
      <footer class="es-article-footer">
        <a class="es-back-link" href="/blog/">Back to Blogs</a>
        <section class="es-related" aria-labelledby="related-posts-title">
          <p class="es-eyebrow">Related posts</p>
          <h2 id="related-posts-title">Keep reading</h2>
          <div class="es-related-grid">${makeRelatedPosts(post, posts)}</div>
        </section>
      </footer>
    </article>`;

  return makePage({ head, header: chrome.header, main, footer: chrome.footer });
}

async function getChrome() {
  const source = await readFile(path.join(ROOT, "blog", "index.html"), "utf8");
  const header = source.match(/<header[\s\S]*?<\/header>/i)?.[0];
  const footerWithWhatsApp = source.match(/<footer[\s\S]*?<\/footer><a[\s\S]*?WhatsApp<\/a>/i)?.[0];

  if (!header || !footerWithWhatsApp) {
    throw new Error("Could not extract existing header/footer from blog page.");
  }

  return { header, footer: footerWithWhatsApp };
}

async function buildPosts() {
  await mkdir(BLOG_IMAGE_DIR, { recursive: true });
  await mkdir(DATA_DIR, { recursive: true });

  let browser;
  let page;
  try {
    browser = await chromium.launch();
    page = await browser.newPage();
  } catch (error) {
    throw new Error(`Could not start Playwright for image conversion: ${error.message}`);
  }

  const posts = [];
  for (const slug of SLUGS) {
    const [post] = await fetchJson(`${WP_ORIGIN}/wp-json/wp/v2/posts?slug=${slug}&_embed=1`);
    if (!post) throw new Error(`WordPress post not found: ${slug}`);

    const publicHtml = await fetchText(`${WP_ORIGIN}/${slug}/`);
    const headMeta = extractHeadMeta(publicHtml);
    const category = post._embedded?.["wp:term"]?.[0]?.[0]?.name || "Uncategorized";
    const media = post._embedded?.["wp:featuredmedia"]?.[0];
    const originalContent = cleanArticleContent(post.content.rendered, SLUGS);
    const localized = await localizeImages(page, post, originalContent);
    const title = stripTags(post.title.rendered);
    const excerpt = stripTags(post.excerpt.rendered);
    const imageAlt = media?.alt_text?.trim() || media?.title?.rendered ? stripTags(media?.alt_text || media?.title?.rendered) : `${title} featured image`;

    posts.push({
      id: post.id,
      slug,
      title,
      excerpt,
      category: decodeEntities(category),
      publishedDate: new Date(post.date).toISOString(),
      modifiedDate: new Date(post.modified || post.date).toISOString(),
      displayDate: formatDate(post.date),
      author: post._embedded?.author?.[0]?.name || "Ecliptix Solutions",
      readingTime: estimateReadingTime(originalContent),
      featuredImage: localized.featuredImage,
      imageAlt,
      seoTitle: headMeta.seoTitle || `${title} - Ecliptix Solutions`,
      metaDescription: headMeta.metaDescription || excerpt,
      openGraphImage: localized.featuredImage || "/assets/ecliptix-solutions-logo.png",
      sourceUrl: `${WP_ORIGIN}/${slug}/`,
      canonicalUrl: absoluteUrl(`/${slug}/`),
      content: localized.content,
    });
  }

  await browser.close();
  return posts.sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));
}

function makeSitemap(posts) {
  const staticPaths = [
    "/",
    "/about/",
    "/services/",
    "/hire-developers/",
    "/portfolio/",
    "/blog/",
    "/reviews/",
    "/contact/",
    "/privacy/",
    "/terms/",
  ];

  const urls = [
    ...staticPaths.map((pathname) => ({ loc: absoluteUrl(pathname), lastmod: new Date().toISOString() })),
    ...posts.map((post) => ({ loc: absoluteUrl(`/${post.slug}/`), lastmod: post.modifiedDate })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url><loc>${escapeHtml(url.loc)}</loc><lastmod>${escapeHtml(url.lastmod)}</lastmod></url>`)
    .join("\n")}\n</urlset>\n`;
}

async function main() {
  const posts = process.argv.includes("--render-only")
    ? JSON.parse(await readFile(DATA_FILE, "utf8")).sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate))
    : await buildPosts();
  const chrome = await getChrome();

  await writeFile(DATA_FILE, `${JSON.stringify(posts, null, 2)}\n`, "utf8");
  await writeFile(path.join(ROOT, "blog", "index.html"), makeBlogIndex(posts, chrome), "utf8");

  for (const post of posts) {
    const directory = path.join(ROOT, post.slug);
    await rm(directory, { recursive: true, force: true });
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, "index.html"), makeArticlePage(post, posts, chrome), "utf8");
  }

  await writeFile(path.join(ROOT, "sitemap.xml"), makeSitemap(posts), "utf8");
  await writeFile(path.join(ROOT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`, "utf8");
  await writeFile(path.join(ROOT, ".htaccess"), `Options -MultiViews\nDirectoryIndex index.html\nRewriteEngine On\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteCond %{REQUEST_FILENAME}/index.html -f\nRewriteRule ^(.+?)/?$ $1/index.html [L]\n`, "utf8");

  console.log(`Migrated ${posts.length} WordPress blog posts.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
