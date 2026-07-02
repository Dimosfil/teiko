const state = {
  settings: {},
  slides: [],
  products: [],
  category: "Все",
  query: "",
  activeSlide: 0,
  slideTimer: 0,
  revealObserver: null
};

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

function heroSlideCard(slide, index) {
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
  const progress = $("#heroProgress");
  if (progress) {
    progress.classList.remove("is-running");
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
  if (state.slides.length < 2) return;
  state.slideTimer = window.setInterval(() => setActiveSlide(state.activeSlide + 1), 5200);
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
    if (category) {
      state.category = category.dataset.category;
      renderCategories();
      renderProducts();
      refreshReveal();
    }
    if (product) openProduct(product.dataset.product);
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
  state.slides = data.slides.filter(isPublicSlide);
  state.products = data.products;
  renderSettings();
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
