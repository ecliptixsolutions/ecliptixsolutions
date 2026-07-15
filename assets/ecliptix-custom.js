(function () {
  const THEME_KEY = "ecliptix-theme";
  const GA_MEASUREMENT_ID = "G-PKC0BPJ9NH";
  const LOGO_SRC = "/assets/ecliptix-solutions-logo.png";
  const BRAND_TEXT = "ECLIPTIX SOLUTIONS";
  const PROJECT_IMAGES = {
    "project-fit-n-fyt-software": {
      src: "/assets/projects/fitnfyt-software-dashboard.webp",
      alt: "Fit.N.Fyt gym management software dashboard preview",
    },
    "project-fit-n-fyt-website": {
      src: "/assets/projects/fitnfyt-website.webp",
      alt: "Fit.N.Fyt fitness website homepage preview",
    },
    "project-janani-womens-hospital": {
      src: "/assets/projects/janani-womens-hospital.webp",
      alt: "Janani Women's Hospital homepage preview",
    },
    "project-vinayak-hospital": {
      src: "/assets/projects/vinayak-enterprise.webp",
      alt: "Vinayak Enterprise homepage preview",
    },
    "project-vinayak-enterprise": {
      src: "/assets/projects/vinayak-enterprise.webp",
      alt: "Vinayak Enterprise homepage preview",
    },
    "project-elura-jewels": {
      src: "/assets/projects/elura-jewels.webp",
      alt: "Elura Jewels jewellery showcase homepage preview",
    },
    "project-enreach-global": {
      src: "/assets/projects/enreach-global.webp",
      alt: "Enreach Global homepage hero preview",
    },
    "project-janani-careorbit": {
      src: "/assets/projects/janani-careorbit.webp",
      alt: "Janani CareOrbit healthcare platform preview",
    },
  };

  const sunIcon = '<svg class="ecliptix-theme-toggle__sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const moonIcon = '<svg class="ecliptix-theme-toggle__moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 14.4A8.6 8.6 0 0 1 9.6 3 7.2 7.2 0 1 0 21 14.4Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
  let lastTrackedPath = `${window.location.pathname}${window.location.search}`;

  function getPreferredTheme() {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === "light" || stored === "dark") return stored;
    } catch (error) {
      // Storage can be unavailable in strict privacy modes.
    }

    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function applyTheme(theme) {
    const nextTheme = theme === "light" ? "light" : "dark";
    const root = document.documentElement;
    root.dataset.theme = nextTheme;
    root.classList.toggle("dark", nextTheme === "dark");
    root.style.colorScheme = nextTheme;

    document.querySelectorAll(".ecliptix-theme-toggle").forEach((button) => {
      button.setAttribute("aria-pressed", String(nextTheme === "light"));
      button.setAttribute("aria-label", nextTheme === "light" ? "Switch to dark mode" : "Switch to light mode");
      button.setAttribute("title", nextTheme === "light" ? "Switch to dark mode" : "Switch to light mode");
    });
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      // Theme still applies for the current page even if persistence is blocked.
    }
    applyTheme(theme);
  }

  function findHeaderBrand() {
    const links = Array.from(document.querySelectorAll('header a[href="/"], header a[href="./"], header a[href="/index.html"]'));
    return links.find((link) => link.textContent.trim().toUpperCase().includes(BRAND_TEXT)) || links[0] || null;
  }

  function upgradeBrandLink(link) {
    if (!link || link.dataset.ecliptixLogoReady === "true") return;

    link.dataset.ecliptixLogoReady = "true";
    link.classList.add("ecliptix-logo-link");
    link.setAttribute("aria-label", "Ecliptix Solutions home");
    link.innerHTML = "";

    const image = document.createElement("img");
    image.src = LOGO_SRC;
    image.alt = "Ecliptix Solutions";
    image.width = 512;
    image.height = 288;
    image.decoding = "async";
    image.fetchPriority = "high";
    image.addEventListener("error", () => {
      link.classList.add("ecliptix-logo-missing");
      link.textContent = BRAND_TEXT;
    }, { once: true });

    link.appendChild(image);
  }

  function upgradeFooterBrand() {
    const candidates = Array.from(document.querySelectorAll("footer div, footer a"));
    const brand = candidates.find((node) => node.textContent.trim().toUpperCase() === BRAND_TEXT);
    if (!brand || brand.dataset.ecliptixLogoReady === "true") return;

    brand.dataset.ecliptixLogoReady = "true";
    brand.classList.add("ecliptix-logo-link");
    brand.setAttribute("aria-label", "Ecliptix Solutions");
    brand.innerHTML = `<img src="${LOGO_SRC}" alt="Ecliptix Solutions" width="512" height="288" loading="lazy" decoding="async">`;
  }

  function ensureThemeToggle() {
    const header = document.querySelector("header");
    const nav = header && header.querySelector("nav");
    if (!nav || nav.querySelector(".ecliptix-theme-toggle")) return;

    const actionGroups = Array.from(nav.children).filter((child) => child instanceof HTMLElement);
    const target = actionGroups[actionGroups.length - 1] || nav;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ecliptix-theme-toggle";
    button.innerHTML = `${sunIcon}${moonIcon}`;
    button.addEventListener("click", () => {
      const current = document.documentElement.dataset.theme === "light" ? "light" : "dark";
      saveTheme(current === "light" ? "dark" : "light");
    });

    target.insertBefore(button, target.firstElementChild || null);
    applyTheme(document.documentElement.dataset.theme || getPreferredTheme());
  }

  function ensureProjectImages() {
    let shouldRealignHash = false;

    Object.entries(PROJECT_IMAGES).forEach(([id, imageData]) => {
      const card = document.getElementById(id);
      if (!card || card.dataset.ecliptixProjectImageReady === "true") return;

      const existingImage = card.querySelector(".ecliptix-project-image");
      if (existingImage) {
        card.dataset.ecliptixProjectImageReady = "true";
        return;
      }

      const legacyHero = card.firstElementChild;
      const media = document.createElement("div");
      media.className = "ecliptix-project-media";

      const image = document.createElement("img");
      image.className = "ecliptix-project-image";
      image.src = imageData.src;
      image.alt = imageData.alt;
      image.loading = "lazy";
      image.decoding = "async";
      image.width = 1280;
      image.height = 800;

      media.appendChild(image);
      card.insertBefore(media, legacyHero);
      if (legacyHero) {
        legacyHero.classList.add("ecliptix-project-legacy-hero");
        legacyHero.setAttribute("aria-hidden", "true");
      }
      card.dataset.ecliptixProjectImageReady = "true";

      if (window.location.hash === `#${id}`) {
        shouldRealignHash = true;
      }
    });

    if (shouldRealignHash) {
      realignProjectHash();
    }
  }

  function realignProjectHash() {
    const id = window.location.hash.slice(1);
    if (!id || !PROJECT_IMAGES[id]) return;

    const card = document.getElementById(id);
    if (!card) return;

    window.requestAnimationFrame(() => {
      card.scrollIntoView({
        block: "start",
        inline: "nearest",
      });
    });
  }

  function enhanceSiteChrome() {
    applyTheme(document.documentElement.dataset.theme || getPreferredTheme());
    upgradeBrandLink(findHeaderBrand());
    upgradeFooterBrand();
    ensureThemeToggle();
    ensureProjectImages();
    realignProjectHash();
  }

  function isBlogHref(href) {
    if (!href) return false;
    try {
      const url = new URL(href, window.location.href);
      return url.origin === window.location.origin && url.pathname.replace(/\/+$/, "") === "/blog";
    } catch (error) {
      return false;
    }
  }

  function forceStaticBlogNavigation(event) {
    const link = event.target.closest && event.target.closest("a[href]");
    if (!link || !isBlogHref(link.getAttribute("href")) || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.assign("/blog/");
  }

  function trackRouteChange() {
    const nextPath = `${window.location.pathname}${window.location.search}`;
    if (nextPath === lastTrackedPath) return;
    lastTrackedPath = nextPath;

    if (typeof window.gtag === "function") {
      window.gtag("config", GA_MEASUREMENT_ID, {
        page_path: nextPath,
      });
    }

    if (typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }

  function installSpaRouteTracking() {
    if (window.__ecliptixRouteTrackingInstalled) return;
    window.__ecliptixRouteTrackingInstalled = true;

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      const result = originalPushState.apply(this, args);
      window.setTimeout(trackRouteChange, 0);
      return result;
    };

    history.replaceState = function (...args) {
      const result = originalReplaceState.apply(this, args);
      window.setTimeout(trackRouteChange, 0);
      return result;
    };

    window.addEventListener("popstate", () => window.setTimeout(trackRouteChange, 0));
    window.addEventListener("hashchange", () => window.setTimeout(trackRouteChange, 0));
  }

  document.addEventListener("click", forceStaticBlogNavigation, true);
  installSpaRouteTracking();
  applyTheme(document.documentElement.dataset.theme || getPreferredTheme());

  function scheduleEnhancement(delay = 0) {
    window.setTimeout(() => window.requestAnimationFrame(enhanceSiteChrome), delay);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => scheduleEnhancement(), { once: true });
  } else {
    scheduleEnhancement();
  }

  window.addEventListener("load", () => scheduleEnhancement(), { once: true });
  [300, 1200, 2500].forEach(scheduleEnhancement);
  window.addEventListener("hashchange", () => [0, 150, 500].forEach(scheduleEnhancement));

  const observer = new MutationObserver(() => {
    const headerReady = document.querySelector("header .ecliptix-logo-link img") && document.querySelector("header .ecliptix-theme-toggle");
    const footerReady = document.querySelector("footer .ecliptix-logo-link img");
    const projectsReady = Object.keys(PROJECT_IMAGES).every((id) => {
      const card = document.getElementById(id);
      return !card || card.dataset.ecliptixProjectImageReady === "true";
    });
    if (headerReady && footerReady && projectsReady) return;
    window.requestAnimationFrame(enhanceSiteChrome);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
