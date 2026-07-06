const state = {
  settings: {},
  slides: [],
  products: [],
  category: "Все",
  query: "",
  activeSlide: 0,
  slideTimer: 0,
  slideStartedAt: 0,
  slideRemaining: 5200,
  isHeroPaused: false,
  isHeroHoverPaused: false,
  heroAutoPause: "on",
  heroLayout: "background",
  heroSlidesTone: "color",
  heroMotion: "fade",
  textMotion: "on",
  textHighlightVariant: "knife",
  rimRepeat: 1,
  gridMotion: "on",
  gridVariant: "original",
  heroCarouselCards: 5,
  heroTransitionTimer: 0,
  rimPulseTimer: 0,
  visualPresets: [{ id: "default", name: "Default" }],
  currentVisualPreset: "default",
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
  carousel: {
    scale: 1,
    x: 0,
    y: 0,
    cards: 5,
    gap: 48
  },
  catalog: {
    scale: 1,
    x: 0,
    y: 0
  },
  info: {
    scale: 1,
    x: 0,
    y: 0
  },
  text: {
    colorLight: "#050505",
    colorDark: "#ffffff",
    scale: 1,
    frequency: 1,
    repeat: 1,
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

const visualSettingsPath = "/visual-settings/default.json";
const visualSettingsLegacyPath = "/visual-settings.json";
const visualSettingsIndexPath = "/visual-settings/index.json";
const visualSettingsApiPath = "/api/visual-settings";
const storefrontStaticPath = "/storefront.json";
const visualSettingsStorageKey = "teiko.visualSettings.v1";
const defaultVisualPreset = { id: "default", name: "Default" };
const heroSlideDelay = 5200;
const debugSectionDefaultOrder = ["mode", "background", "text", "grid", "carousel", "glass", "catalog", "info"];
const textHighlightVariants = ["knife", "soft", "split", "edge", "wipe"];
const gridVariants = ["original", "dense", "wave"];

const $ = (selector) => document.querySelector(selector);
const money = (value) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(value || 0);
const escapeHtml = (value) =>
  String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[char]);

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
  return slides;
}

function wrapSlideIndex(index) {
  if (!state.slides.length) return 0;
  return (index + state.slides.length) % state.slides.length;
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, Number(value)));
}

function carouselCardCount(value = state.heroCarouselCards) {
  const maxCards = Math.max(1, Math.min(9, state.slides.length || 9));
  const minCards = Math.min(3, maxCards);
  return Math.round(clampNumber(value || 5, minCards, maxCards));
}

function carouselGapValue(value) {
  return Math.round(clampNumber(value || 0, 0, 120));
}

function rimFrequencyValue(value) {
  return clampNumber(value || 1, 0.25, 3);
}

function rimRepeatValue(value) {
  return clampNumber(value || 1, 0.2, 4);
}

function heroCarouselOffsets() {
  const count = carouselCardCount();
  const before = Math.floor((count - 1) / 2);
  return Array.from({ length: count }, (_, index) => index - before);
}

function syncHeroCarouselCardCount() {
  const carousel = $("#heroCarousel");
  if (!carousel) return;
  carousel.dataset.cardCount = String(state.heroCarouselCards);
  carousel.style.setProperty("--hero-carousel-cards", String(state.heroCarouselCards));
}

function heroSlideCard(slide, index, offset = 0, edge = "") {
  const distance = Math.abs(offset);
  const positionClass = offset === 0
    ? "is-active"
    : distance === 1
      ? "is-near"
      : "is-far";
  if (slide.isTransparent) {
    const fallbackImage = imageUrl(state.settings.logoBack);
    return `
      <article class="hero-slide-card hero-slide-transparent ${positionClass}" data-offset="${offset}" data-edge="${edge}" aria-roledescription="slide" aria-label="Slide ${index + 1}">
        <div class="hero-card is-poster is-background-preview">
          <img src="${fallbackImage}" alt="" loading="lazy" />
        </div>
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
    <article class="hero-slide-card ${positionClass}" data-offset="${offset}" data-edge="${edge}" aria-roledescription="slide" aria-label="Slide ${index + 1}">
      <div class="hero-card ${hasCopy ? "has-copy" : "is-poster"}">
        <img src="${imageUrl(slide.image || state.settings.logoBack)}" alt="" loading="${offset === 0 ? "eager" : "lazy"}" />
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
  $("#heroDots").innerHTML = state.slides
    .map(
      (_, index) => `
        <button class="${index === state.activeSlide ? "active" : ""}" type="button" data-hero-slide="${index}" aria-label="Slide ${index + 1}"></button>
      `
    )
    .join("");
  updateHeroPauseButton();
  updateHeroProgressPaused();
}

function renderHeroCarousel() {
  const track = $("#heroTrack");
  if (!track) return;
  syncHeroCarouselCardCount();
  const offsets = heroCarouselOffsets();
  const leftEdge = offsets[0];
  const rightEdge = offsets[offsets.length - 1];
  track.innerHTML = offsets
    .map((offset) => {
      const slideIndex = wrapSlideIndex(state.activeSlide + offset);
      const edge = offset === leftEdge ? "left" : offset === rightEdge ? "right" : "";
      return heroSlideCard(state.slides[slideIndex], slideIndex, offset, edge);
    })
    .join("");
  renderHeroPosition();
}

function heroSlideDirection(fromIndex, toIndex) {
  if (!state.slides.length || fromIndex === toIndex) return "jump";
  const forward = wrapSlideIndex(toIndex - fromIndex);
  const backward = wrapSlideIndex(fromIndex - toIndex);
  return forward <= backward ? "next" : "prev";
}

function animateHeroSlideChange(direction) {
  const carousel = $("#heroCarousel");
  if (!carousel) return;
  window.clearTimeout(state.heroTransitionTimer);
  carousel.classList.remove("is-sliding-next", "is-sliding-prev", "is-sliding-jump");
  void carousel.offsetWidth;
  carousel.classList.add(`is-sliding-${direction}`);
  state.heroTransitionTimer = window.setTimeout(() => {
    carousel.classList.remove("is-sliding-next", "is-sliding-prev", "is-sliding-jump");
  }, 680);
}

function setActiveSlide(index) {
  if (!state.slides.length) return;
  const nextSlide = wrapSlideIndex(index);
  const direction = heroSlideDirection(state.activeSlide, nextSlide);
  state.activeSlide = nextSlide;
  renderHeroCarousel();
  animateHeroSlideChange(direction);
  startHeroCarousel(true);
}

function isHeroAutoplayPaused() {
  return state.isHeroPaused || state.isHeroHoverPaused;
}

function updateHeroProgressPaused() {
  const progress = $("#heroProgress");
  if (!progress) return;
  progress.classList.toggle("is-paused", isHeroAutoplayPaused());
}

function restartHeroProgress(duration = heroSlideDelay) {
  const progress = $("#heroProgress");
  if (!progress) return;
  progress.style.setProperty("--hero-progress-duration", `${duration}ms`);
  progress.classList.remove("is-running", "is-paused");
  void progress.offsetWidth;
  progress.classList.add("is-running");
}

function holdHeroCarousel() {
  window.clearTimeout(state.slideTimer);
  if (state.slideStartedAt) {
    const elapsed = Date.now() - state.slideStartedAt;
    state.slideRemaining = Math.max(250, state.slideRemaining - elapsed);
  }
  updateHeroProgressPaused();
}

function startHeroCarousel(resetProgress = true) {
  window.clearTimeout(state.slideTimer);
  if (isHeroAutoplayPaused()) {
    renderHeroPosition();
    return;
  }
  if (state.slides.length < 2) return;
  state.slideRemaining = resetProgress ? heroSlideDelay : Math.max(250, state.slideRemaining || heroSlideDelay);
  state.slideStartedAt = Date.now();
  if (resetProgress) {
    restartHeroProgress(state.slideRemaining);
  } else {
    updateHeroProgressPaused();
  }
  state.slideTimer = window.setTimeout(() => {
    state.slideRemaining = heroSlideDelay;
    setActiveSlide(state.activeSlide + 1);
  }, state.slideRemaining);
}

function pauseHeroCarousel() {
  state.isHeroPaused = true;
  holdHeroCarousel();
  renderHeroPosition();
}

function resumeHeroCarousel() {
  state.isHeroPaused = false;
  startHeroCarousel(false);
}

function setHeroSlideHoverPause(isPaused) {
  if (state.heroAutoPause !== "on") {
    if (state.isHeroHoverPaused) {
      state.isHeroHoverPaused = false;
      startHeroCarousel(false);
    }
    return;
  }
  if (state.isHeroHoverPaused === isPaused) return;
  state.isHeroHoverPaused = isPaused;
  if (isPaused) {
    holdHeroCarousel();
  } else {
    startHeroCarousel(false);
  }
}

function toggleHeroCarouselPause() {
  if (state.isHeroPaused) {
    resumeHeroCarousel();
  } else {
    pauseHeroCarousel();
  }
}

function normalizeHeroAutoPause(value) {
  return value === "off" ? "off" : "on";
}

function updateHeroAutoPauseButton() {
  const button = $("#heroAutoPauseToggle");
  if (!button) return;
  const isOn = state.heroAutoPause === "on";
  button.textContent = isOn ? "Auto Pause" : "Auto Pause Off";
  button.setAttribute("aria-pressed", String(isOn));
}

function applyHeroAutoPause(value) {
  state.heroAutoPause = normalizeHeroAutoPause(value);
  if (state.heroAutoPause !== "on" && state.isHeroHoverPaused) {
    state.isHeroHoverPaused = false;
    startHeroCarousel(false);
  }
  updateHeroAutoPauseButton();
  updateHeroProgressPaused();
}

function toggleHeroAutoPause() {
  const nextValue = state.heroAutoPause === "on" ? "off" : "on";
  applyHeroAutoPause(nextValue);
  setDebugSaveStatus("Preview changed. Save to keep.");
}

function updateHeroPauseButton() {
  const button = $("#heroPause");
  if (!button) return;
  button.textContent = state.isHeroPaused ? "Play" : "Pause";
  button.setAttribute("aria-pressed", String(state.isHeroPaused));
}

function normalizeHeroLayout(value) {
  return value === "header" ? "header" : "background";
}

function updateHeroLayoutButton() {
  const button = $("#heroLayoutToggle");
  if (!button) return;
  const isHeader = state.heroLayout === "header";
  button.textContent = isHeader ? "Mode: Header" : "Mode: Current";
  button.setAttribute("aria-pressed", String(isHeader));
}

function applyHeroLayout(layout) {
  state.heroLayout = normalizeHeroLayout(layout);
  const hero = $(".hero");
  if (hero) {
    hero.classList.toggle("hero-layout-header", state.heroLayout === "header");
    hero.classList.toggle("hero-layout-background", state.heroLayout !== "header");
  }
  updateHeroLayoutButton();
}

function toggleHeroLayout() {
  const nextLayout = state.heroLayout === "header" ? "background" : "header";
  applyHeroLayout(nextLayout);
  setDebugSaveStatus("Preview changed. Save to keep.");
}

function normalizeHeroSlidesTone(value) {
  return value === "mono" ? "mono" : "color";
}

function updateHeroSlidesToneButton() {
  const button = $("#slideToneToggle");
  if (!button) return;
  const isMono = state.heroSlidesTone === "mono";
  button.textContent = isMono ? "Slides: Mono" : "Slides: Color";
  button.setAttribute("aria-pressed", String(isMono));
}

function applyHeroSlidesTone(tone) {
  state.heroSlidesTone = normalizeHeroSlidesTone(tone);
  const hero = $(".hero");
  if (hero) hero.classList.toggle("hero-slides-mono", state.heroSlidesTone === "mono");
  updateHeroSlidesToneButton();
}

function toggleHeroSlidesTone() {
  const nextTone = state.heroSlidesTone === "mono" ? "color" : "mono";
  applyHeroSlidesTone(nextTone);
  setDebugSaveStatus("Preview changed. Save to keep.");
}

function normalizeHeroMotion(value) {
  return value === "focus" ? "focus" : "fade";
}

function updateHeroMotionButton() {
  const button = $("#slideMotionToggle");
  if (!button) return;
  const isFocus = state.heroMotion === "focus";
  button.textContent = isFocus ? "Motion: Focus" : "Motion: Fade";
  button.setAttribute("aria-pressed", String(isFocus));
}

function applyHeroMotion(motion) {
  state.heroMotion = normalizeHeroMotion(motion);
  const hero = $(".hero");
  if (hero) {
    hero.classList.toggle("hero-motion-focus", state.heroMotion === "focus");
    hero.classList.toggle("hero-motion-fade", state.heroMotion !== "focus");
  }
  updateHeroMotionButton();
}

function toggleHeroMotion() {
  const nextMotion = state.heroMotion === "focus" ? "fade" : "focus";
  applyHeroMotion(nextMotion);
  setDebugSaveStatus("Preview changed. Save to keep.");
}

function normalizeTextMotion(value) {
  return value === "off" ? "off" : "on";
}

function updateTextMotionButton() {
  const button = $("#textMotionToggle");
  if (!button) return;
  const isOn = state.textMotion === "on";
  button.textContent = isOn ? "Rim Light" : "Rim Light Off";
  button.setAttribute("aria-pressed", String(isOn));
}

function triggerRimPulse() {
  const hero = $(".hero");
  if (!hero || state.textMotion !== "on") return;
  hero.classList.remove("hero-rim-pulse");
  void hero.offsetWidth;
  hero.classList.add("hero-rim-pulse");
}

function scheduleRimPulse() {
  window.clearInterval(state.rimPulseTimer);
  const hero = $(".hero");
  if (!hero || state.textMotion !== "on") {
    if (hero) hero.classList.remove("hero-rim-pulse");
    return;
  }
  triggerRimPulse();
  const cycleMs = Math.round(4200 / rimRepeatValue(state.rimRepeat));
  state.rimPulseTimer = window.setInterval(triggerRimPulse, Math.max(700, cycleMs));
}

function applyTextMotion(motion) {
  state.textMotion = normalizeTextMotion(motion);
  const hero = $(".hero");
  if (hero) {
    hero.classList.toggle("hero-text-motion-on", state.textMotion === "on");
    hero.classList.toggle("hero-text-motion-off", state.textMotion !== "on");
  }
  updateTextMotionButton();
  scheduleRimPulse();
}

function toggleTextMotion() {
  const nextMotion = state.textMotion === "on" ? "off" : "on";
  applyTextMotion(nextMotion);
  setDebugSaveStatus("Preview changed. Save to keep.");
}

function normalizeTextHighlightVariant(value) {
  return textHighlightVariants.includes(value) ? value : "knife";
}

function updateTextHighlightVariantButtons() {
  document.querySelectorAll("[data-text-highlight-variant]").forEach((button) => {
    const isActive = button.dataset.textHighlightVariant === state.textHighlightVariant;
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function applyTextHighlightVariant(variant) {
  state.textHighlightVariant = normalizeTextHighlightVariant(variant);
  const hero = $(".hero");
  if (hero) {
    textHighlightVariants.forEach((value) => {
      hero.classList.toggle(`hero-rim-variant-${value}`, value === state.textHighlightVariant);
    });
    hero.dataset.textHighlightVariant = state.textHighlightVariant;
  }
  updateTextHighlightVariantButtons();
  scheduleRimPulse();
}

function setTextHighlightVariant(variant) {
  applyTextHighlightVariant(variant);
  setDebugSaveStatus("Preview changed. Save to keep.");
}

function normalizeGridMotion(value) {
  return value === "off" ? "off" : "on";
}

function updateGridMotionButton() {
  const button = $("#gridMotionToggle");
  if (!button) return;
  const isOn = state.gridMotion === "on";
  button.textContent = isOn ? "Grid: Motion" : "Grid: Static";
  button.setAttribute("aria-pressed", String(isOn));
}

function applyGridMotion(motion) {
  state.gridMotion = normalizeGridMotion(motion);
  const hero = $(".hero");
  if (hero) {
    hero.classList.toggle("hero-grid-motion-on", state.gridMotion === "on");
    hero.classList.toggle("hero-grid-motion-off", state.gridMotion !== "on");
  }
  updateGridMotionButton();
}

function toggleGridMotion() {
  const nextMotion = state.gridMotion === "on" ? "off" : "on";
  applyGridMotion(nextMotion);
  setDebugSaveStatus("Preview changed. Save to keep.");
}

function normalizeGridVariant(value) {
  return gridVariants.includes(value) ? value : "original";
}

function updateGridVariantButtons() {
  document.querySelectorAll("[data-grid-variant]").forEach((button) => {
    const isActive = button.dataset.gridVariant === state.gridVariant;
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function applyGridVariant(variant) {
  state.gridVariant = normalizeGridVariant(variant);
  const hero = $(".hero");
  if (hero) {
    gridVariants.forEach((value) => {
      hero.classList.toggle(`hero-grid-variant-${value}`, value === state.gridVariant);
    });
    hero.dataset.gridVariant = state.gridVariant;
  }
  updateGridVariantButtons();
}

function setGridVariant(variant) {
  applyGridVariant(variant);
  setDebugSaveStatus("Preview changed. Save to keep.");
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
  if (["base", "color", "colorLight", "colorDark", "tint"].includes(prop)) return value.toLowerCase();
  if (prop === "cards") return String(carouselCardCount(value));
  if (prop === "gap") return `${carouselGapValue(value)}px`;
  if (prop === "frequency") return `${rimFrequencyValue(value).toFixed(2)}x`;
  if (prop === "repeat") return `${rimRepeatValue(value).toFixed(2)}x`;
  if (prop === "alpha") return Number(value).toFixed(2);
  if (prop === "scale") return Number(value).toFixed(2);
  return `${Math.round(Number(value))}px`;
}

function updateDebugReadout(layer, prop, value) {
  const readout = document.querySelector(`[data-debug-readout="${layer}-${prop}"]`);
  if (readout) readout.textContent = debugReadoutValue(prop, value);
  if (!["base", "color", "colorLight", "colorDark", "tint"].includes(prop)) return;
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
  const aboutSection = $(".about");
  const heroCarousel = $("#heroCarousel");
  if (["carousel", "catalog", "info"].includes(layer)) {
    const target = layer === "carousel"
      ? heroCarousel
      : layer === "catalog"
        ? catalogPanel
        : aboutSection;
    if (!target) return;
    const numericValue = Number(value);
    if (layer === "carousel" && prop === "cards") {
      state.heroCarouselCards = carouselCardCount(numericValue);
      syncHeroCarouselCardCount();
      updateDebugReadout(layer, prop, state.heroCarouselCards);
      renderHeroCarousel();
      return;
    }
    const safeNumericValue = layer === "carousel" && prop === "gap"
      ? carouselGapValue(numericValue)
      : numericValue;
    const cssValue = prop === "scale" ? String(safeNumericValue) : `${safeNumericValue}px`;
    const cssPrefix = layer === "carousel"
      ? "hero-carousel"
      : layer === "info"
        ? "about"
        : "catalog";
    target.style.setProperty(`--${cssPrefix}-${prop}`, cssValue);
    updateDebugReadout(layer, prop, value);
    return;
  }
  if (layer === "glass") {
    if (!catalogPanel) return;
    const numericValue = Number(value);
    const cssValue = prop === "blur" ? `${numericValue}px` : String(numericValue);
    catalogPanel.style.setProperty(`--catalog-glass-${prop}`, cssValue);
    updateDebugReadout(layer, prop, value);
    return;
  }
  if (!hero) return;
  if (["base", "color", "colorLight", "colorDark", "tint"].includes(prop)) {
    const color = value.toLowerCase();
    if (layer === "text") {
      const cssVar = prop === "colorDark" ? "--hero-logo-color-dark" : "--hero-logo-color-light";
      hero.style.setProperty(cssVar, color);
      if (prop === "color" || prop === "colorLight") hero.style.setProperty("--hero-logo-color", color);
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
  if (layer === "text" && prop === "frequency") {
    const speed = rimFrequencyValue(numericValue);
    hero.style.setProperty("--rim-speed", String(speed));
    updateDebugReadout(layer, prop, speed);
    scheduleRimPulse();
    return;
  }
  if (layer === "text" && prop === "repeat") {
    state.rimRepeat = rimRepeatValue(numericValue);
    updateDebugReadout(layer, prop, state.rimRepeat);
    scheduleRimPulse();
    return;
  }
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
  if (input.text && typeof input.text === "object" && input.text.color !== undefined && input.text.colorLight === undefined) {
    input = {
      ...input,
      text: {
        ...input.text,
        colorLight: input.text.color
      }
    };
  }
  Object.entries(backgroundDebugDefaults).forEach(([layer, props]) => {
    if (!input[layer] || typeof input[layer] !== "object") return;
    Object.keys(props).forEach((prop) => {
      if (input[layer][prop] !== undefined) preset[layer][prop] = input[layer][prop];
    });
  });
  preset.carousel.cards = carouselCardCount(preset.carousel.cards);
  preset.carousel.gap = carouselGapValue(preset.carousel.gap);
  return preset;
}

function normalizeDebugSectionOrder(order) {
  const values = Array.isArray(order) ? order : [];
  const known = values.filter((section) => debugSectionDefaultOrder.includes(section));
  return [
    ...known.filter((section, index) => known.indexOf(section) === index),
    ...debugSectionDefaultOrder.filter((section) => !known.includes(section))
  ];
}

function getCurrentDebugSectionOrder(panel) {
  return [...panel.querySelectorAll(".debug-layer[data-debug-section]")]
    .map((section) => section.dataset.debugSection)
    .filter(Boolean);
}

function applyDebugSectionOrder(order) {
  const panel = $("#backgroundDebug");
  if (!panel) return;
  normalizeDebugSectionOrder(order).forEach((sectionName) => {
    const section = panel.querySelector(`.debug-layer[data-debug-section="${sectionName}"]`);
    if (section) panel.append(section);
  });
}

function normalizePresetId(value, fallback = "") {
  const id = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return id || fallback || `preset-${Date.now()}`;
}

function normalizePresetName(value, fallback = "Preset") {
  return String(value || "").trim().slice(0, 48) || fallback;
}

function uniquePresetId(baseId) {
  const safeBase = normalizePresetId(baseId, "preset");
  let candidate = safeBase;
  let suffix = 2;
  while (state.visualPresets.some((preset) => preset.id === candidate)) {
    candidate = `${safeBase}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function normalizePresetList(index = {}) {
  const incoming = Array.isArray(index.presets) ? index.presets : [];
  const presets = [
    defaultVisualPreset,
    ...incoming
      .map((preset) => ({
        id: normalizePresetId(preset.id || preset.name),
        name: normalizePresetName(preset.name || preset.id, preset.id || "Preset")
      }))
      .filter((preset) => preset.id && preset.id !== defaultVisualPreset.id)
  ];
  return presets.filter((preset, index, list) => list.findIndex((item) => item.id === preset.id) === index);
}

function mergeVisualPresetIndexes(...indexes) {
  const presets = normalizePresetList({
    presets: indexes.flatMap((index) => Array.isArray(index?.presets) ? index.presets : [])
  });
  const activePreset = indexes
    .map((index) => normalizePresetId(index?.activePreset, ""))
    .find((id) => presets.some((preset) => preset.id === id)) || defaultVisualPreset.id;
  return { activePreset, presets };
}

function setVisualPresets(index = {}, selectedPresetId) {
  state.visualPresets = normalizePresetList(index);
  const selectedPreset = normalizePresetId(selectedPresetId ?? index.activePreset, defaultVisualPreset.id);
  state.currentVisualPreset = state.visualPresets.some((preset) => preset.id === selectedPreset)
    ? selectedPreset
    : defaultVisualPreset.id;
  renderVisualPresetControls();
}

function selectVisualPreset(preset = currentVisualPreset(), index = {}) {
  const presetId = normalizePresetId(preset.id, defaultVisualPreset.id);
  const presetName = normalizePresetName(preset.name, presetId);
  const nextIndex = mergeVisualPresetIndexes(
    index,
    { presets: [{ id: presetId, name: presetName }] },
    { activePreset: state.currentVisualPreset, presets: state.visualPresets }
  );
  setVisualPresets(nextIndex, presetId);
  return currentVisualPreset();
}

function readStoredVisualSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(visualSettingsStorageKey) || "null");
    if (!stored || typeof stored !== "object") return null;
    const presets = normalizePresetList(stored.index || stored);
    const activePreset = normalizePresetId(stored.index?.activePreset || stored.activePreset, defaultVisualPreset.id);
    const settingsByPreset = stored.settingsByPreset && typeof stored.settingsByPreset === "object"
      ? stored.settingsByPreset
      : {};
    return { index: { activePreset, presets }, settingsByPreset };
  } catch {
    return null;
  }
}

function writeStoredVisualSettings(index, settingsByPreset) {
  localStorage.setItem(visualSettingsStorageKey, JSON.stringify({ index, settingsByPreset }));
}

function cacheVisualSettings(settings, preset = currentVisualPreset(), options = {}) {
  const stored = readStoredVisualSettings();
  const presetId = normalizePresetId(preset.id, defaultVisualPreset.id);
  const presetName = normalizePresetName(preset.name, presetId);
  const activateTheme = options.activateTheme !== false;
  const activePreset = activateTheme
    ? presetId
    : normalizePresetId(options.index?.activePreset || stored?.index?.activePreset, defaultVisualPreset.id);
  const index = mergeVisualPresetIndexes(
    { activePreset, presets: [{ id: presetId, name: presetName }] },
    options.index,
    { activePreset: state.currentVisualPreset, presets: state.visualPresets },
    stored?.index
  );
  const settingsByPreset = {
    ...(stored?.settingsByPreset || {}),
    [presetId]: normalizeVisualSettings(settings)
  };
  writeStoredVisualSettings(index, settingsByPreset);
  selectVisualPreset({ id: presetId, name: presetName }, index);
  return settingsByPreset[presetId];
}

function storeVisualSettings(settings, preset = currentVisualPreset(), options = {}) {
  const stored = readStoredVisualSettings();
  const presetId = normalizePresetId(preset.id, defaultVisualPreset.id);
  const presetName = normalizePresetName(preset.name, presetId);
  const activateTheme = options.activateTheme !== false;
  const activePreset = activateTheme
    ? presetId
    : normalizePresetId(stored?.index?.activePreset, defaultVisualPreset.id);
  const index = mergeVisualPresetIndexes(
    { activePreset, presets: [{ id: presetId, name: presetName }] },
    stored?.index,
    { activePreset: state.currentVisualPreset, presets: state.visualPresets }
  );
  const settingsByPreset = {
    ...(stored?.settingsByPreset || {}),
    [presetId]: normalizeVisualSettings(settings)
  };
  writeStoredVisualSettings(index, settingsByPreset);
  setVisualPresets(index, presetId);
  return settingsByPreset[presetId];
}

function currentVisualPreset() {
  return state.visualPresets.find((preset) => preset.id === state.currentVisualPreset) || defaultVisualPreset;
}

function renderVisualPresetControls() {
  const select = document.querySelector("[data-debug-preset-select]");
  const nameInput = document.querySelector("[data-debug-preset-name]");
  const current = document.querySelector("[data-debug-preset-current]");
  const preset = currentVisualPreset();
  if (select) {
    select.innerHTML = state.visualPresets
      .map((item) => `<option value="${item.id}" ${item.id === preset.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`)
      .join("");
  }
  if (nameInput) nameInput.value = preset.name;
  if (current) current.textContent = preset.name;
}

function normalizeVisualSettings(input = {}) {
  return {
    debug: normalizeBackgroundDebugPreset(input.debug),
    heroLayout: normalizeHeroLayout(input.heroLayout),
    heroSlidesTone: normalizeHeroSlidesTone(input.heroSlidesTone),
    heroMotion: normalizeHeroMotion(input.heroMotion),
    heroAutoPause: normalizeHeroAutoPause(input.heroAutoPause),
    textMotion: normalizeTextMotion(input.textMotion),
    textHighlightVariant: normalizeTextHighlightVariant(input.textHighlightVariant),
    gridMotion: normalizeGridMotion(input.gridMotion),
    gridVariant: normalizeGridVariant(input.gridVariant),
    debugSectionOrder: normalizeDebugSectionOrder(input.debugSectionOrder)
  };
}

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Cannot load ${path}`);
  return response.json();
}

async function loadStorefront() {
  try {
    return await loadJson("/api/storefront");
  } catch {
    return loadJson(storefrontStaticPath);
  }
}

async function loadVisualPresetSettings(presetId) {
  const safeId = normalizePresetId(presetId, defaultVisualPreset.id);
  const stored = readStoredVisualSettings();
  if (stored?.settingsByPreset?.[safeId]) {
    return normalizeVisualSettings(stored.settingsByPreset[safeId]);
  }
  try {
    return normalizeVisualSettings(await loadJson(`${visualSettingsApiPath}/${safeId}`));
  } catch {
    return normalizeVisualSettings(await loadJson(`/visual-settings/${safeId}.json`));
  }
}

async function loadVisualSettings() {
  const stored = readStoredVisualSettings();
  try {
    const data = await loadJson(visualSettingsApiPath);
    const index = mergeVisualPresetIndexes(data, stored?.index);
    const activePreset = normalizePresetId(data.activePreset, index.activePreset);
    setVisualPresets({ ...index, activePreset });
    const settings = normalizeVisualSettings(data.settings);
    const settingsByPreset = {
      ...(stored?.settingsByPreset || {}),
      [state.currentVisualPreset]: settings
    };
    writeStoredVisualSettings({ activePreset: state.currentVisualPreset, presets: state.visualPresets }, settingsByPreset);
    return settings;
  } catch {
    try {
      const fileIndex = await loadJson(visualSettingsIndexPath);
      const index = mergeVisualPresetIndexes(fileIndex, stored?.index);
      const activePreset = normalizePresetId(stored?.index?.activePreset || fileIndex.activePreset, index.activePreset);
      setVisualPresets({ ...index, activePreset });
      return await loadVisualPresetSettings(state.currentVisualPreset);
    } catch {
      if (stored) {
        setVisualPresets(stored.index);
        return normalizeVisualSettings(stored.settingsByPreset[state.currentVisualPreset]);
      }
      try {
        setVisualPresets({ activePreset: defaultVisualPreset.id, presets: [defaultVisualPreset] });
        return normalizeVisualSettings(await loadJson(visualSettingsPath));
      } catch {
        try {
          return normalizeVisualSettings(await loadJson(visualSettingsLegacyPath));
        } catch {
          return normalizeVisualSettings();
        }
      }
    }
  }
}

function collectVisualSettings(panel) {
  return normalizeVisualSettings({
    debug: collectBackgroundDebugControls(panel),
    heroLayout: state.heroLayout,
    heroSlidesTone: state.heroSlidesTone,
    heroMotion: state.heroMotion,
    heroAutoPause: state.heroAutoPause,
    textMotion: state.textMotion,
    textHighlightVariant: state.textHighlightVariant,
    gridMotion: state.gridMotion,
    gridVariant: state.gridVariant,
    debugSectionOrder: getCurrentDebugSectionOrder(panel)
  });
}

async function persistVisualSettings(settings, preset = currentVisualPreset(), options = {}) {
  const presetId = normalizePresetId(preset.id, defaultVisualPreset.id);
  const presetName = normalizePresetName(preset.name, presetId);
  const activateTheme = options.activateTheme !== false;
  try {
    const response = await fetch(`${visualSettingsApiPath}/${presetId}?activate=${activateTheme ? "1" : "0"}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: presetId, name: presetName, activate: activateTheme, settings })
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Visual settings save failed");
    }
    const result = await response.json();
    const savedPreset = {
      id: normalizePresetId(result.id || presetId, presetId),
      name: normalizePresetName(result.name || presetName, presetName)
    };
    selectVisualPreset(savedPreset, result.index);
    return cacheVisualSettings(result.settings || settings, savedPreset, { activateTheme, index: result.index });
  } catch {
    return storeVisualSettings(settings, { id: presetId, name: presetName }, { activateTheme });
  }
}

function resolveEditablePresetFromName() {
  const nameInput = document.querySelector("[data-debug-preset-name]");
  const selected = currentVisualPreset();
  const presetName = normalizePresetName(nameInput?.value, selected.name);
  const typedId = normalizePresetId(presetName, selected.id);
  const presetId = selected.id === defaultVisualPreset.id && typedId !== defaultVisualPreset.id
    ? uniquePresetId(typedId)
    : selected.id;
  return { id: presetId, name: presetName };
}

async function savePresetControls() {
  const panel = $("#backgroundDebug");
  if (!panel) return;
  const preset = collectVisualSettings(panel);
  try {
    await persistVisualSettings(preset, resolveEditablePresetFromName(), { activateTheme: false });
    setDebugSaveStatus("Preset saved. Use top Save for site theme.");
  } catch {
    setDebugSaveStatus("Save failed.");
  }
}

async function saveThemeControls() {
  const panel = $("#backgroundDebug");
  if (!panel) return;
  try {
    await persistVisualSettings(collectVisualSettings(panel), resolveEditablePresetFromName(), { activateTheme: true });
    setDebugSaveStatus("Theme saved.");
  } catch {
    setDebugSaveStatus("Theme save failed.");
  }
}

async function saveNewVisualPreset() {
  const panel = $("#backgroundDebug");
  if (!panel) return;
  const nameInput = document.querySelector("[data-debug-preset-name]");
  const name = normalizePresetName(nameInput?.value, `Preset ${state.visualPresets.length + 1}`);
  const id = uniquePresetId(name);
  try {
    await persistVisualSettings(collectVisualSettings(panel), { id, name }, { activateTheme: false });
    setDebugSaveStatus("Preset created. Use top Save for site theme.");
  } catch {
    setDebugSaveStatus("Create failed.");
  }
}

async function loadSelectedVisualPreset() {
  const select = document.querySelector("[data-debug-preset-select]");
  const presetId = normalizePresetId(select?.value, state.currentVisualPreset);
  try {
    const settings = await loadVisualPresetSettings(presetId);
    state.currentVisualPreset = presetId;
    renderVisualPresetControls();
    applyVisualSettings(settings);
    setDebugSaveStatus("Preset loaded.");
  } catch {
    setDebugSaveStatus("Load failed.");
  }
}

function applyVisualSettings(settings) {
  const visualSettings = normalizeVisualSettings(settings);
  applyHeroLayout(visualSettings.heroLayout);
  applyHeroSlidesTone(visualSettings.heroSlidesTone);
  applyHeroMotion(visualSettings.heroMotion);
  applyHeroAutoPause(visualSettings.heroAutoPause);
  applyTextMotion(visualSettings.textMotion);
  applyTextHighlightVariant(visualSettings.textHighlightVariant);
  applyGridMotion(visualSettings.gridMotion);
  applyGridVariant(visualSettings.gridVariant);
  applyDebugSectionOrder(visualSettings.debugSectionOrder);
  applyBackgroundDebugControls(visualSettings.debug);
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
  applyHeroLayout("background");
  applyHeroSlidesTone("color");
  applyHeroMotion("fade");
  applyHeroAutoPause("on");
  applyTextMotion("on");
  applyTextHighlightVariant("knife");
  applyGridMotion("on");
  applyGridVariant("original");
  applyDebugSectionOrder(debugSectionDefaultOrder);
  applyBackgroundDebugControls(backgroundDebugDefaults);
  setDebugSaveStatus("Reset preview. Save to keep.");
}

function debugSectionAfterPointer(panel, y) {
  const sections = [...panel.querySelectorAll(".debug-layer[data-debug-section]:not(.is-dragging)")];
  return sections.reduce((closest, section) => {
    const bounds = section.getBoundingClientRect();
    const offset = y - bounds.top - bounds.height / 2;
    if (offset >= 0 || offset <= closest.offset) return closest;
    return { offset, section };
  }, { offset: Number.NEGATIVE_INFINITY, section: null }).section;
}

function initDebugSectionDrag(panel) {
  let draggedSection = null;
  let dragHandleSection = null;
  let dragStartOrder = "";
  panel.addEventListener("pointerdown", (event) => {
    const title = event.target.closest(".debug-layer-title");
    dragHandleSection = title ? title.closest(".debug-layer[data-debug-section]") : null;
  });
  panel.addEventListener("dragstart", (event) => {
    const section = event.target.closest(".debug-layer[data-debug-section]");
    if (!section || dragHandleSection !== section || !panel.contains(section)) {
      event.preventDefault();
      return;
    }
    draggedSection = section;
    dragStartOrder = getCurrentDebugSectionOrder(panel).join("|");
    section.classList.add("is-dragging");
    section.setAttribute("aria-grabbed", "true");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", section.dataset.debugSection);
  });
  panel.addEventListener("dragover", (event) => {
    if (!draggedSection) return;
    event.preventDefault();
    const nextSection = debugSectionAfterPointer(panel, event.clientY);
    if (nextSection) {
      panel.insertBefore(draggedSection, nextSection);
    } else {
      panel.append(draggedSection);
    }
  });
  panel.addEventListener("drop", (event) => {
    if (!draggedSection) return;
    event.preventDefault();
    setDebugSaveStatus("Order changed. Save to keep.");
  });
  panel.addEventListener("dragend", () => {
    if (!draggedSection) return;
    draggedSection.classList.remove("is-dragging");
    draggedSection.removeAttribute("aria-grabbed");
    if (dragStartOrder && dragStartOrder !== getCurrentDebugSectionOrder(panel).join("|")) {
      setDebugSaveStatus("Order changed. Save to keep.");
    }
    draggedSection = null;
    dragHandleSection = null;
    dragStartOrder = "";
  });
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
  const layoutToggle = $("#heroLayoutToggle");
  if (layoutToggle) {
    layoutToggle.addEventListener("click", toggleHeroLayout);
  }
  const slideToneToggle = $("#slideToneToggle");
  if (slideToneToggle) {
    slideToneToggle.addEventListener("click", toggleHeroSlidesTone);
  }
  const slideMotionToggle = $("#slideMotionToggle");
  if (slideMotionToggle) {
    slideMotionToggle.addEventListener("click", toggleHeroMotion);
  }
  const heroAutoPauseToggle = $("#heroAutoPauseToggle");
  if (heroAutoPauseToggle) {
    heroAutoPauseToggle.addEventListener("click", toggleHeroAutoPause);
  }
  const textMotionToggle = $("#textMotionToggle");
  if (textMotionToggle) {
    textMotionToggle.addEventListener("click", toggleTextMotion);
  }
  const gridMotionToggle = $("#gridMotionToggle");
  if (gridMotionToggle) {
    gridMotionToggle.addEventListener("click", toggleGridMotion);
  }
  const presetSelect = document.querySelector("[data-debug-preset-select]");
  if (presetSelect) {
    presetSelect.addEventListener("change", () => {
      state.currentVisualPreset = normalizePresetId(presetSelect.value, defaultVisualPreset.id);
      renderVisualPresetControls();
      setDebugSaveStatus("Preset selected. Load to apply.");
    });
  }
  panel.querySelectorAll(".debug-layer[data-debug-section]").forEach((section) => {
    section.draggable = true;
  });
  initDebugSectionDrag(panel);
  panel.addEventListener("input", (event) => {
    const input = event.target.closest("[data-debug-layer][data-debug-prop]");
    if (!input) return;
    applyBackgroundDebugValue(input.dataset.debugLayer, input.dataset.debugProp, input.value);
    setDebugSaveStatus("");
  });
  panel.addEventListener("click", (event) => {
    const textHighlightVariantButton = event.target.closest("[data-text-highlight-variant]");
    if (textHighlightVariantButton) {
      setTextHighlightVariant(textHighlightVariantButton.dataset.textHighlightVariant);
      return;
    }
    const gridVariantButton = event.target.closest("[data-grid-variant]");
    if (gridVariantButton) {
      setGridVariant(gridVariantButton.dataset.gridVariant);
      return;
    }
    if (event.target.closest("[data-debug-save]")) {
      void saveThemeControls();
      return;
    }
    if (event.target.closest("[data-debug-preset-save]")) {
      void savePresetControls();
      return;
    }
    if (event.target.closest("[data-debug-preset-new]")) {
      void saveNewVisualPreset();
      return;
    }
    if (event.target.closest("[data-debug-preset-load]")) {
      void loadSelectedVisualPreset();
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
    }
    if (heroSlide) {
      setActiveSlide(Number(heroSlide.dataset.heroSlide));
    }
  });
  $("#heroCarousel").addEventListener("pointerover", (event) => {
    if (event.target.closest(".hero-slide-card")) {
      setHeroSlideHoverPause(true);
    }
  });
  $("#heroCarousel").addEventListener("pointerout", (event) => {
    const slideCard = event.target.closest(".hero-slide-card");
    if (!slideCard) return;
    const nextTarget = event.relatedTarget;
    if (nextTarget && slideCard.contains(nextTarget)) return;
    const nextSlideCard = nextTarget instanceof Element ? nextTarget.closest(".hero-slide-card") : null;
    setHeroSlideHoverPause(Boolean(nextSlideCard));
  });
  $("#heroCarousel").addEventListener("pointermove", (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5).toFixed(3);
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5).toFixed(3);
    event.currentTarget.style.setProperty("--hero-x", x);
    event.currentTarget.style.setProperty("--hero-y", y);
  });
  $("#heroCarousel").addEventListener("pointerleave", (event) => {
    setHeroSlideHoverPause(false);
    event.currentTarget.style.setProperty("--hero-x", 0);
    event.currentTarget.style.setProperty("--hero-y", 0);
  });
  $("#closeDialog").addEventListener("click", () => $("#productDialog").close());
}

async function init() {
  const [data, visualSettings] = await Promise.all([
    loadStorefront(),
    loadVisualSettings()
  ]);
  state.settings = data.settings;
  state.slides = buildHeroSlides(data.slides.filter(isPublicSlide));
  state.products = data.products;
  renderSettings();
  initBackgroundDebug();
  applyVisualSettings(visualSettings);
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
