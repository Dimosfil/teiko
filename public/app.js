const state = {
  settings: {},
  slides: [],
  products: [],
  category: "Все",
  query: "",
  activeSlide: 0,
  slideTimer: 0,
  isHeroPaused: false,
  revealObserver: null
};

const backgroundDebugDefaults = {
  background: {
    base: "#ffffff",
    tint: "#eff7ee"
  },
  glass: {
    alpha: 0.46,
    blur: 18
  },
  text: {
    color: "#050505",
    scale: 1,
    x: 0,
    y: 0
  },
  grid: {
    color: "#48b45a",
    scale: 1,
    x: 0,
    y: 0
  }
};

const backgroundDebugStorageKey = "teiko-background-debug-settings";

const $ = (selector) => document.querySelector(selector);
const money = (value) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(value || 0);

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value || "";
}

function imageUrl(path) {
  return path || "/assets/logo-back.jpg";
}

function isPublicHref(href) {
  if (!href) return false;
  return !href.startsWith("/admin") && !href.includes("admin-teiko");
}

function isPublicSlide(slide) {
  const text = [slide.eyebrow, slide.title, slide.text, slide.ctaLabel, slide.ctaHref].join(" ").toLowerCase();
  return !text.includes("админ") && !text.includes("admin") && isPublicHref(slide.ctaHref || "#");
}

function categories() {
  return ["Все", ...new Set(state.products.map((product) => product.category).filter(Boolean))];
}

function filteredProducts() {
  const query = state.query.trim().toLowerCase();
  return state.products.filter((product) => {
    const categoryMatches = state.category === "Все" || product.category === state.category;
    const textMatches = [product.title, product.description, product.shortDescription, product.brand, product.category, product.sku]
      .join(" ")
      .toLowerCase()
      .includes(query);
    return categoryMatches && textMatches;
  });
}

function renderSettings() {
  document.title = state.settings.siteName || "TEIKO";
  $("#headerLogo").src = state.settings.logo || "/assets/logo.jpg";
  $("#heroBack").src = state.settings.logoBack || "/assets/logo-back-motif.png";
  setText("aboutTitle", state.settings.aboutTitle);
  setText("aboutText", state.settings.aboutText);
  setText("contactsTitle", state.settings.contactsTitle);
  setText("contactsText", state.settings.contactsText);
}

function transparentHeroSlide() {
  return {
    id: "transparent-background-slide",
    isTransparent: true
  };
}

function buildHeroSlides(slides) {
  return [...slides, transparentHeroSlide()];
}

function heroSlideCard(slide, index) {
  if (slide.isTransparent) {
    return `
      <article class="hero-slide-card hero-slide-transparent" aria-roledescription="slide" aria-label="Slide ${index + 1}">
        <div class="hero-card is-transparent" aria-hidden="true"></div>
      </article>
    `;
  }
  const cta = slide.ctaLabel && isPublicHref(slide.ctaHref)
    ? `<a class="button primary" href="${slide.ctaHref}">${slide.ctaLabel}</a>`
    : "";
  const eyebrow = (slide.eyebrow || "").trim();
  const title = (slide.title || "").trim();
  const text = (slide.text || "").trim();
  const hasCopy = Boolean(eyebrow || title || text || cta);
  return `
    <article class="hero-slide-card" aria-roledescription="slide" aria-label="Slide ${index + 1}">
      <div class="hero-card ${hasCopy ? "has-copy" : "is-poster"}">
        <img src="${imageUrl(slide.image || state.settings.logoBack)}" alt="" loading="${index === 0 ? "eager" : "lazy"}" />
        ${
          hasCopy
            ? `
              <div class="hero-card-copy">
                ${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ""}
                ${title ? `<h1>${title}</h1>` : ""}
                ${text ? `<p>${text}</p>` : ""}
                ${cta ? `<div class="hero-actions">${cta}</div>` : ""}
              </div>
            `
            : ""
        }
      </div>
    </article>
  `;
}

function renderHeroPosition() {
  const track = $("#heroTrack");
  if (!track) return;
  track.style.transform = `translateX(${-state.activeSlide * 100}%)`;
  $("#heroDots").innerHTML = state.slides
    .map(
      (_, index) => `
        <button class="${index === state.activeSlide ? "active" : ""}" type="button" data-hero-slide="${index}" aria-label="Slide ${index + 1}"></button>
      `
    )
    .join("");
  updateHeroPauseButton();
  const progress = $("#heroProgress");
  if (progress) {
    progress.classList.remove("is-running");
    progress.classList.toggle("is-paused", state.isHeroPaused);
    if (state.isHeroPaused) return;
    void progress.offsetWidth;
    progress.classList.add("is-running");
  }
}

function renderHeroCarousel() {
  const track = $("#heroTrack");
  if (!track) return;
  track.innerHTML = state.slides.map(heroSlideCard).join("");
  renderHeroPosition();
}

function setActiveSlide(index) {
  if (!state.slides.length) return;
  state.activeSlide = (index + state.slides.length) % state.slides.length;
  renderHeroPosition();
}

function startHeroCarousel() {
  window.clearInterval(state.slideTimer);
  if (state.isHeroPaused) {
    renderHeroPosition();
    return;
  }
  if (state.slides.length < 2) return;
  state.slideTimer = window.setInterval(() => setActiveSlide(state.activeSlide + 1), 5200);
}

function pauseHeroCarousel() {
  state.isHeroPaused = true;
  window.clearInterval(state.slideTimer);
  renderHeroPosition();
}

function resumeHeroCarousel() {
  state.isHeroPaused = false;
  startHeroCarousel();
}

function toggleHeroCarouselPause() {
  if (state.isHeroPaused) {
    resumeHeroCarousel();
  } else {
    pauseHeroCarousel();
  }
}

function updateHeroPauseButton() {
  const button = $("#heroPause");
  if (!button) return;
  button.textContent = state.isHeroPaused ? "Play" : "Pause";
  button.setAttribute("aria-pressed", String(state.isHeroPaused));
}

function renderCategories() {
  $("#categories").innerHTML = categories()
    .map(
      (category) => `
        <button class="${category === state.category ? "active" : ""}" type="button" data-category="${category}">
          ${category}
        </button>
      `
    )
    .join("");
}

function productCard(product) {
  const primaryLink = product.marketplaceLinks?.[0];
  return `
    <article class="product-card">
      <button class="product-image" type="button" data-product="${product.id}">
        <img src="${imageUrl(product.image)}" alt="${product.title}" loading="lazy" />
      </button>
      <div class="product-copy">
        <div class="badge-row">
          <span>${product.badge || product.category}</span>
          ${product.rating ? `<small>${product.rating.toFixed(1)}</small>` : ""}
        </div>
        <button class="product-title" type="button" data-product="${product.id}">${product.title}</button>
        <p>${product.shortDescription || product.description}</p>
        <div class="price-row">
          <strong>${money(product.price)}</strong>
          ${product.oldPrice ? `<span>${money(product.oldPrice)}</span>` : ""}
        </div>
        <div class="market-row">
          ${primaryLink ? `<a class="button primary" href="${primaryLink.url}" target="_blank" rel="noreferrer">Купить на ${primaryLink.label}</a>` : ""}
          <button class="button secondary" type="button" data-product="${product.id}">Подробнее</button>
        </div>
      </div>
    </article>
  `;
}

function renderProducts() {
  const products = filteredProducts();
  $("#products").innerHTML = products.length
    ? products.map(productCard).join("")
    : `<div class="empty-state">Товары не найдены. Попробуйте изменить фильтр или поиск.</div>`;
}

function refreshReveal() {
  const nodes = document.querySelectorAll(".section-head, .category-row, .product-card, .about > div");
  if (!state.revealObserver) {
    state.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          state.revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
  }
  nodes.forEach((node, index) => {
    node.classList.add("reveal-item");
    node.style.setProperty("--reveal-delay", `${Math.min(index % 9, 8) * 45}ms`);
    if (node.classList.contains("is-visible")) return;
    state.revealObserver.observe(node);
  });
}

function openProduct(id) {
  const product = state.products.find((item) => String(item.id) === String(id));
  if (!product) return;
  $("#productDetails").innerHTML = `
    <div class="detail-grid">
      <img src="${imageUrl(product.image)}" alt="${product.title}" />
      <div>
        <span class="eyebrow">${product.brand || product.category}</span>
        <h2>${product.title}</h2>
        <p>${product.description}</p>
        <div class="price-row large">
          <strong>${money(product.price)}</strong>
          ${product.oldPrice ? `<span>${money(product.oldPrice)}</span>` : ""}
        </div>
        <dl class="specs">
          ${(product.specs || []).map((spec) => `<div><dt>${spec.label}</dt><dd>${spec.value}</dd></div>`).join("")}
        </dl>
        <div class="market-row wrap">
          ${(product.marketplaceLinks || [])
            .map((link) => `<a class="button primary" href="${link.url}" target="_blank" rel="noreferrer">${link.label}</a>`)
            .join("")}
        </div>
      </div>
    </div>
  `;
  $("#productDialog").showModal();
}

function hexToRgb(hex) {
  const cleanHex = hex.replace("#", "");
  const normalized = cleanHex.length === 3
    ? cleanHex.split("").map((char) => `${char}${char}`).join("")
    : cleanHex;
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function rgbaFromHex(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function debugReadoutValue(prop, value) {
  if (["base", "color", "tint"].includes(prop)) return value.toLowerCase();
  if (prop === "alpha") return Number(value).toFixed(2);
  if (prop === "scale") return Number(value).toFixed(2);
  return `${Math.round(Number(value))}px`;
}

function updateDebugReadout(layer, prop, value) {
  const readout = document.querySelector(`[data-debug-readout="${layer}-${prop}"]`);
  if (readout) readout.textContent = debugReadoutValue(prop, value);
  if (!["base", "color", "tint"].includes(prop)) return;
  const chipName = prop === "color" ? layer : `${layer}-${prop}`;
  const chip = document.querySelector(`[data-debug-chip="${chipName}"]`);
  if (chip) chip.style.background = value;
}

function setDebugSaveStatus(message) {
  const status = document.querySelector("[data-debug-save-status]");
  if (status) status.textContent = message;
}

function applyBackgroundDebugValue(layer, prop, value) {
  const hero = $(".hero");
  const catalogPanel = $(".catalog-panel");
  if (layer === "glass") {
    if (!catalogPanel) return;
    const numericValue = Number(value);
    const cssValue = prop === "blur" ? `${numericValue}px` : String(numericValue);
    catalogPanel.style.setProperty(`--catalog-glass-${prop}`, cssValue);
    updateDebugReadout(layer, prop, value);
    return;
  }
  if (!hero) return;
  if (["base", "color", "tint"].includes(prop)) {
    const color = value.toLowerCase();
    if (layer === "text") {
      hero.style.setProperty("--hero-logo-color", color);
    } else if (layer === "grid") {
      hero.style.setProperty("--hero-grid-color", color);
      hero.style.setProperty("--hero-link-color", color);
      hero.style.setProperty("--hero-ring-color", color);
      hero.style.setProperty("--hero-back-grid-a", rgbaFromHex(color, 0.14));
      hero.style.setProperty("--hero-back-grid-b", rgbaFromHex(color, 0.08));
    } else if (layer === "background") {
      const cssVar = prop === "base" ? "--hero-bg-base" : "--hero-bg-tint";
      hero.style.setProperty(cssVar, color);
      if (prop === "base") hero.style.setProperty("--hero-back-base", color);
    }
    updateDebugReadout(layer, prop, color);
    return;
  }

  const numericValue = Number(value);
  const cssValue = prop === "scale" ? String(numericValue) : `${numericValue}px`;
  const cssVar = layer === "text"
    ? `--hero-logo-${prop}`
    : `--hero-grid-${prop}`;
  hero.style.setProperty(cssVar, cssValue);
  updateDebugReadout(layer, prop, value);
}

function collectBackgroundDebugControls(panel) {
  return Object.fromEntries(
    Object.entries(backgroundDebugDefaults).map(([layer, props]) => [
      layer,
      Object.fromEntries(
        Object.keys(props).map((prop) => {
          const input = panel.querySelector(`[data-debug-layer="${layer}"][data-debug-prop="${prop}"]`);
          return [prop, input ? input.value : props[prop]];
        })
      )
    ])
  );
}

function normalizeBackgroundDebugPreset(input) {
  const preset = JSON.parse(JSON.stringify(backgroundDebugDefaults));
  if (!input || typeof input !== "object") return preset;
  Object.entries(backgroundDebugDefaults).forEach(([layer, props]) => {
    if (!input[layer] || typeof input[layer] !== "object") return;
    Object.keys(props).forEach((prop) => {
      if (input[layer][prop] !== undefined) preset[layer][prop] = input[layer][prop];
    });
  });
  return preset;
}

function loadSavedBackgroundDebugControls() {
  try {
    const saved = localStorage.getItem(backgroundDebugStorageKey);
    return saved ? normalizeBackgroundDebugPreset(JSON.parse(saved)) : normalizeBackgroundDebugPreset();
  } catch {
    return normalizeBackgroundDebugPreset();
  }
}

function saveBackgroundDebugControls() {
  const panel = $("#backgroundDebug");
  if (!panel) return;
  const preset = collectBackgroundDebugControls(panel);
  try {
    localStorage.setItem(backgroundDebugStorageKey, JSON.stringify(preset));
    setDebugSaveStatus("Saved.");
  } catch {
    setDebugSaveStatus("Save failed.");
  }
}

function applyBackgroundDebugControls(preset) {
  const panel = $("#backgroundDebug");
  if (!panel) return;
  Object.entries(normalizeBackgroundDebugPreset(preset)).forEach(([layer, props]) => {
    Object.entries(props).forEach(([prop, value]) => {
      const input = panel.querySelector(`[data-debug-layer="${layer}"][data-debug-prop="${prop}"]`);
      if (input) input.value = value;
      applyBackgroundDebugValue(layer, prop, value);
    });
  });
}

function resetBackgroundDebugControls() {
  applyBackgroundDebugControls(backgroundDebugDefaults);
  setDebugSaveStatus("Reset preview. Save to keep.");
}

function setBackgroundDebugOpen(isOpen) {
  const panel = $("#backgroundDebug");
  const toggle = $("#backgroundDebugToggle");
  if (!panel || !toggle) return;
  panel.hidden = !isOpen;
  toggle.classList.toggle("is-active", isOpen);
  toggle.setAttribute("aria-expanded", String(isOpen));
}

function initBackgroundDebug() {
  const panel = $("#backgroundDebug");
  if (!panel) return;
  const toggle = $("#backgroundDebugToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      setBackgroundDebugOpen(panel.hidden);
    });
  }
  panel.addEventListener("input", (event) => {
    const input = event.target.closest("[data-debug-layer][data-debug-prop]");
    if (!input) return;
    applyBackgroundDebugValue(input.dataset.debugLayer, input.dataset.debugProp, input.value);
    setDebugSaveStatus("");
  });
  panel.addEventListener("click", (event) => {
    if (event.target.closest("[data-debug-save]")) {
      saveBackgroundDebugControls();
      return;
    }
    if (event.target.closest("[data-debug-reset]")) {
      resetBackgroundDebugControls();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || panel.hidden) return;
    setBackgroundDebugOpen(false);
  });
  applyBackgroundDebugControls(loadSavedBackgroundDebugControls());
  setBackgroundDebugOpen(false);
}

function bindEvents() {
  $("#searchInput").addEventListener("input", (event) => {
    state.query = event.target.value;
    renderProducts();
    refreshReveal();
  });
  document.addEventListener("click", (event) => {
    const category = event.target.closest("[data-category]");
    const product = event.target.closest("[data-product]");
    const heroStep = event.target.closest("[data-hero-step]");
    const heroSlide = event.target.closest("[data-hero-slide]");
    const heroPause = event.target.closest("#heroPause");
    if (category) {
      state.category = category.dataset.category;
      renderCategories();
      renderProducts();
      refreshReveal();
    }
    if (product) openProduct(product.dataset.product);
    if (heroPause) toggleHeroCarouselPause();
    if (heroStep) {
      setActiveSlide(state.activeSlide + Number(heroStep.dataset.heroStep));
      startHeroCarousel();
    }
    if (heroSlide) {
      setActiveSlide(Number(heroSlide.dataset.heroSlide));
      startHeroCarousel();
    }
  });
  $("#heroCarousel").addEventListener("mouseenter", () => window.clearInterval(state.slideTimer));
  $("#heroCarousel").addEventListener("mouseleave", startHeroCarousel);
  $("#heroCarousel").addEventListener("focusin", () => window.clearInterval(state.slideTimer));
  $("#heroCarousel").addEventListener("focusout", startHeroCarousel);
  $("#heroCarousel").addEventListener("pointermove", (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5).toFixed(3);
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5).toFixed(3);
    event.currentTarget.style.setProperty("--hero-x", x);
    event.currentTarget.style.setProperty("--hero-y", y);
  });
  $("#heroCarousel").addEventListener("pointerleave", (event) => {
    event.currentTarget.style.setProperty("--hero-x", 0);
    event.currentTarget.style.setProperty("--hero-y", 0);
  });
  $("#closeDialog").addEventListener("click", () => $("#productDialog").close());
}

async function init() {
  const response = await fetch("/api/storefront", { cache: "no-store" });
  const data = await response.json();
  state.settings = data.settings;
  state.slides = buildHeroSlides(data.slides.filter(isPublicSlide));
  state.products = data.products;
  renderSettings();
  initBackgroundDebug();
  renderHeroCarousel();
  startHeroCarousel();
  renderCategories();
  renderProducts();
  refreshReveal();
  bindEvents();
}

init().catch((error) => {
  document.body.innerHTML = `<main class="error-page"><h1>Не удалось загрузить витрину</h1><p>${error.message}</p></main>`;
});
