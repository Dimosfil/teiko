import { initStorefrontEffects } from "./storefront-effects.js?v=20260915-motion4";

(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const reducedMotion = createMotionPolicy();
  const currency = new Intl.NumberFormat("ru-RU", {
    style: "currency", currency: "RUB", maximumFractionDigits: 0
  });
  const state = {
    products: [], slides: [], category: "", query: "", activeStory: 0,
    storyTimer: 0, storyPaused: false, storyHovered: false, storyFocused: false,
    revealObserver: null, productTrigger: null
  };
  // Retire only the previous seed copy; a custom admin value still takes precedence.
  const legacyCopy = {
    heroTitle: "TEIKO: витрина товаров с переходом на маркетплейсы",
    heroText: "Сайт совмещает лаконичную визитку бренда и каталог: выбирайте товар, изучайте описание и переходите к покупке на Ozon, Wildberries или другую площадку.",
    aboutTitle: "Без корзины и оплаты на сайте",
    aboutText: "Карточки товаров ведут на внешние площадки. Контент, слайды, описания и товары управляются через отдельную закрытую рабочую зону.",
    contactsTitle: "Покупка на удобной площадке",
    contactsText: "Откройте карточку товара и нажмите кнопку нужного маркетплейса."
  };
  // Accessible descriptions for image-only promotions already present in the catalogue.
  const promotionDescriptions = {
    "krytex-perfume-blue-sky.png": "KRYTEX Parfume Pro: аромат Синее небо",
    "krytex-perfume-narcotic-flower.png": "KRYTEX Parfume Pro: аромат Наркотический цветок",
    "krytex-mega-glass.png": "KRYTEX MEGA Glass: водоотталкивающее покрытие для стёкол",
    "krytex-parfume-3-male-soul-hero.png": "KRYTEX Parfume Pro: аромат Мужская душа",
    "krytex-parfume-10-gold-dust-hero.png": "KRYTEX Parfume Pro: аромат Золотая пыль",
    "ftorsic-antirain-standard-kit-hero.png": "FTORSiC: комплект антидождь",
    "krytex-parfume-2-sea-breeze-hero.png": "KRYTEX Parfume Pro: аромат Морской бриз"
  };

  function createMotionPolicy() {
    const changes = new EventTarget();
    // Every visit starts with the full presentation, even if an earlier visit
    // stored an off state. The control only changes the current page session.
    let preference = "full";
    const policy = {
      get matches() { return preference === "reduced"; },
      addEventListener: (...args) => changes.addEventListener(...args),
      removeEventListener: (...args) => changes.removeEventListener(...args)
    };
    const apply = () => {
      document.documentElement.dataset.motion = policy.matches ? "reduced" : "full";
      const toggle = $("#motionToggle");
      if (toggle) {
        toggle.textContent = policy.matches ? "Анимации выключены — включить" : "Анимации включены";
        toggle.setAttribute("aria-label", policy.matches ? "Включить анимации" : "Выключить анимации");
        toggle.setAttribute("aria-pressed", String(!policy.matches));
      }
    };
    $("#motionToggle")?.addEventListener("click", () => {
      preference = policy.matches ? "full" : "reduced";
      apply();
      changes.dispatchEvent(new Event("change"));
    });
    apply();
    return policy;
  }

  function initEntrance() {
    const root = document.documentElement;
    const prepare = () => {
      root.dataset.motionStage = reducedMotion.matches || window.scrollY > 100 ? "done" : "waiting";
      start();
    };
    const start = () => {
      if (root.dataset.motionStage === "waiting" && !document.hidden && !reducedMotion.matches) {
        root.dataset.motionStage = "running";
      }
    };
    prepare();
    document.addEventListener("visibilitychange", start);
    reducedMotion.addEventListener("change", prepare);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function safeUrl(value, { publicOnly = false } = {}) {
    if (typeof value !== "string" || !value.trim()) return "";
    try {
      const url = new URL(value.trim(), window.location.href);
      if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return "";
      if (publicOnly && /(?:\/admin(?:\/|$)|admin-teiko)/i.test(url.pathname)) return "";
      return url.href;
    } catch {
      return "";
    }
  }

  function imageUrl(value) {
    const source = safeUrl(value) || safeUrl("/assets/logo-alpha.png");
    const url = new URL(source);
    if (url.origin === window.location.origin && url.pathname.startsWith("/uploads/")) {
      url.searchParams.set("asset", "20260915-motion4");
    }
    return url.href;
  }

  function price(value) {
    return value !== null && value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0
      ? currency.format(Number(value)) : "";
  }

  function writeText(id, value) {
    const element = document.getElementById(id);
    if (element && typeof value === "string" && value.trim()) element.textContent = value.trim();
  }

  async function loadJson(url) {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data || !Array.isArray(data.products) || !Array.isArray(data.slides)) {
      throw new Error("Invalid storefront response");
    }
    return data;
  }

  async function loadStorefront() {
    try {
      return await loadJson("/api/storefront");
    } catch {
      return loadJson("/storefront.json");
    }
  }

  function applySettings(settings) {
    if (settings.siteName?.trim()) document.title = settings.siteName.trim();
    const logo = safeUrl(settings.logo);
    if (logo) ["headerLogo", "footerLogo"].forEach((id) => {
      const element = document.getElementById(id);
      if (element) element.src = logo;
    });
    Object.keys(legacyCopy).forEach((id) => {
      if (typeof settings[id] === "string" && settings[id].trim() !== legacyCopy[id]) writeText(id, settings[id]);
    });
  }

  function renderCategories() {
    const root = $("#categories");
    if (!root) return;
    const categories = [...new Set(state.products.map((product) => product.category).filter(Boolean))];
    root.innerHTML = ["", ...categories].map((category) => `
      <button class="category-filter${category === state.category ? " is-active" : ""}" type="button"
        data-category="${escapeHtml(category)}" aria-pressed="${category === state.category}">
        ${escapeHtml(category || "Все товары")}
      </button>`).join("");
  }

  function productCard(product) {
    const formattedPrice = price(product.price);
    return `<article class="product-card" data-reveal>
      <button class="product-open" type="button" data-product="${escapeHtml(product.id)}"
        aria-label="${escapeHtml(`Подробнее: ${product.title || "товар"}`)}">
        <img class="product-image" src="${escapeHtml(imageUrl(product.image))}"
          alt="${escapeHtml(product.title)}" loading="lazy" decoding="async" />
        <span class="product-body">
          <span class="product-category">${escapeHtml(product.category || product.brand)}</span>
          <span class="product-title">${escapeHtml(product.title)}</span>
          <span class="product-description">${escapeHtml(product.shortDescription || product.description)}</span>
          <span class="product-bottom">
            <span class="product-price">${escapeHtml(formattedPrice)}</span>
            <span class="product-arrow" aria-hidden="true">↗</span>
          </span>
        </span>
      </button>
    </article>`;
  }

  function renderProducts() {
    const root = $("#products");
    if (!root) return;
    root.querySelectorAll("[data-reveal]").forEach((element) => state.revealObserver?.unobserve(element));
    const query = state.query.trim().toLocaleLowerCase("ru-RU");
    const products = state.products.filter((product) => {
      const matchesCategory = !state.category || product.category === state.category;
      const haystack = [product.title, product.description, product.shortDescription, product.brand, product.category, product.sku]
        .join(" ").toLocaleLowerCase("ru-RU");
      return matchesCategory && (!query || haystack.includes(query));
    });
    root.innerHTML = products.length ? products.map(productCard).join("")
      : '<p class="empty-state" role="status">Товары не найдены. Попробуйте изменить поиск или категорию.</p>';
    const count = products.length;
    const ending = count % 100 >= 11 && count % 100 <= 14 ? "товаров"
      : count % 10 === 1 ? "товар" : count % 10 >= 2 && count % 10 <= 4 ? "товара" : "товаров";
    writeText("productCount", `${count} ${ending}`);
    observeReveal(root);
  }

  function productImages(product) {
    const extra = Array.isArray(product.images) ? product.images : [];
    return [...new Set([product.image, ...extra.map((item) => typeof item === "string" ? item : item?.url)]
      .map((value) => safeUrl(value)).filter(Boolean))];
  }

  function openProduct(id, trigger) {
    const product = state.products.find((item) => String(item.id) === String(id));
    const dialog = $("#productDialog");
    const details = $("#productDetails");
    if (!product || !dialog || !details) return;
    const images = productImages(product);
    const links = (Array.isArray(product.marketplaceLinks) ? product.marketplaceLinks : [])
      .map((link) => ({ label: link?.label, url: safeUrl(link?.url, { publicOnly: true }) })).filter((link) => link.url);
    const specs = Array.isArray(product.specs) ? product.specs : [];
    details.innerHTML = `<div class="detail-grid">
      <div class="detail-gallery">
        <img class="detail-image" src="${escapeHtml(images[0] || imageUrl())}" alt="${escapeHtml(product.title)}" decoding="async" />
        ${images.length > 1 ? `<div class="detail-thumbnails" aria-label="Фотографии товара">${images.map((url, index) => `
          <button class="detail-thumb${index === 0 ? " is-active" : ""}" type="button"
            data-detail-image="${escapeHtml(url)}" aria-label="Фото ${index + 1}" aria-pressed="${index === 0}">
            <img src="${escapeHtml(url)}" alt="" loading="lazy" />
          </button>`).join("")}</div>` : ""}
      </div>
      <div class="detail-copy">
        <p class="detail-category">${escapeHtml(product.brand || product.category)}</p>
        <h2 class="detail-title" id="productDetailTitle">${escapeHtml(product.title)}</h2>
        <p class="detail-description">${escapeHtml(product.description || product.shortDescription)}</p>
        <div class="detail-prices">
          <strong class="detail-price">${escapeHtml(price(product.price))}</strong>
          ${Number(product.oldPrice) > Number(product.price) ? `<s class="detail-old-price">${escapeHtml(price(product.oldPrice))}</s>` : ""}
        </div>
        ${specs.length ? `<dl class="detail-specs">${specs.map((spec) => `<div><dt>${escapeHtml(spec?.label)}</dt><dd>${escapeHtml(spec?.value)}</dd></div>`).join("")}</dl>` : ""}
        <div class="detail-marketplaces">${links.map((link) => `<a class="button button-primary" href="${escapeHtml(link.url)}"
          target="_blank" rel="noopener noreferrer">${escapeHtml(link.label || "Купить")} <span aria-hidden="true">↗</span></a>`).join("")}</div>
      </div>
    </div>`;
    state.productTrigger = trigger;
    dialog.setAttribute("aria-labelledby", "productDetailTitle");
    dialog.showModal();
    document.body.classList.add("dialog-open");
    $("#closeDialog")?.focus({ preventScroll: true });
  }

  function initCatalogEvents() {
    $("#searchInput")?.addEventListener("input", (event) => {
      state.query = event.currentTarget.value;
      renderProducts();
    });
    document.addEventListener("click", (event) => {
      const category = event.target.closest("[data-category]");
      if (category) {
        state.category = category.dataset.category;
        renderCategories();
        renderProducts();
        $("#categories")?.querySelectorAll("[data-category]").forEach((button) => {
          if (button.dataset.category === state.category) button.focus({ preventScroll: true });
        });
      }
      const product = event.target.closest("[data-product]");
      if (product) openProduct(product.dataset.product, product);
      const thumbnail = event.target.closest("[data-detail-image]");
      if (thumbnail) {
        const image = $("#productDetails .detail-image");
        if (image) image.src = thumbnail.dataset.detailImage;
        $("#productDetails")?.querySelectorAll("[data-detail-image]").forEach((button) => {
          button.classList.toggle("is-active", button === thumbnail);
          button.setAttribute("aria-pressed", String(button === thumbnail));
        });
      }
    });
    const dialog = $("#productDialog");
    $("#closeDialog")?.addEventListener("click", () => dialog?.close());
    dialog?.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    dialog?.addEventListener("close", () => {
      document.body.classList.remove("dialog-open");
      if (state.productTrigger?.isConnected) state.productTrigger.focus({ preventScroll: true });
    });
  }

  function publicSlide(slide) {
    return slide && slide.isActive !== false
      && !/админ|admin/i.test([slide.eyebrow, slide.title, slide.text, slide.ctaLabel, slide.ctaHref].join(" "));
  }

  function renderStories() {
    const track = $("#storyTrack");
    if (!track) return;
    track.innerHTML = state.slides.map((slide, index) => {
      const href = safeUrl(slide.ctaHref, { publicOnly: true });
      const copy = [slide.eyebrow, slide.title, slide.text].some((text) => String(text || "").trim()) || (href && slide.ctaLabel);
      const description = String(slide.title || "").trim() || String(slide.eyebrow || "").trim()
        || promotionDescriptions[String(slide.image || "").split("/").pop()] || `Коллекция TEIKO — предложение ${index + 1}`;
      return `<article class="story-slide" aria-roledescription="слайд" aria-label="${index + 1} из ${state.slides.length}">
        <img class="story-image" src="${escapeHtml(imageUrl(slide.image))}" alt="${escapeHtml(description)}"
          loading="${index === 0 ? "eager" : "lazy"}" decoding="async" />
        ${copy ? `<div class="story-copy">
          ${slide.eyebrow?.trim() ? `<p class="story-eyebrow">${escapeHtml(slide.eyebrow)}</p>` : ""}
          ${slide.title?.trim() ? `<h3 class="story-title">${escapeHtml(slide.title)}</h3>` : ""}
          ${slide.text?.trim() ? `<p class="story-text">${escapeHtml(slide.text)}</p>` : ""}
          ${href && slide.ctaLabel ? `<a class="story-link" href="${escapeHtml(href)}">${escapeHtml(slide.ctaLabel)} <span aria-hidden="true">↗</span></a>` : ""}
        </div>` : ""}
      </article>`;
    }).join("");
    if (!state.slides.length) {
      const section = $("#storyCarousel")?.closest("section");
      if (section) section.hidden = true;
    }
    const dots = $("#storyDots");
    if (dots) dots.innerHTML = state.slides.map((_, index) => `<button class="story-dot" type="button"
      data-story-index="${index}" aria-label="Слайд ${index + 1}" aria-pressed="false"></button>`).join("");
    ["storyPrev", "storyNext", "storyPause"].forEach((id) => {
      const button = document.getElementById(id);
      if (button) button.disabled = state.slides.length < 2;
    });
    updateStory();
  }

  function updateStory() {
    const track = $("#storyTrack");
    if (!track) return;
    track.style.transform = `translate3d(${-100 * state.activeStory}%, 0, 0)`;
    track.querySelectorAll(".story-slide").forEach((slide, index) => {
      const active = index === state.activeStory;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
      slide.inert = !active;
      if (active) slide.querySelector("img")?.setAttribute("loading", "eager");
    });
    $("#storyDots")?.querySelectorAll("button").forEach((button, index) => {
      button.classList.toggle("is-active", index === state.activeStory);
      button.setAttribute("aria-pressed", String(index === state.activeStory));
    });
    const pause = $("#storyPause");
    if (pause) {
      pause.setAttribute("aria-pressed", String(state.storyPaused));
      pause.setAttribute("aria-label", state.storyPaused ? "Продолжить смену слайдов" : "Остановить смену слайдов");
      pause.textContent = state.storyPaused ? "Продолжить" : "Пауза";
    }
    scheduleStory();
  }

  function scheduleStory() {
    window.clearTimeout(state.storyTimer);
    if (state.slides.length < 2 || state.storyPaused || state.storyHovered || state.storyFocused || reducedMotion.matches || document.hidden) return;
    const delay = Number($("#storyCarousel")?.dataset.interval) || 5200;
    state.storyTimer = window.setTimeout(() => moveStory(state.activeStory + 1), Math.max(1000, delay));
  }

  function moveStory(index) {
    if (!state.slides.length) return;
    state.activeStory = (index + state.slides.length) % state.slides.length;
    updateStory();
  }

  function initStories() {
    $("#storyPrev")?.addEventListener("click", () => moveStory(state.activeStory - 1));
    $("#storyNext")?.addEventListener("click", () => moveStory(state.activeStory + 1));
    $("#storyDots")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-story-index]");
      if (button) moveStory(Number(button.dataset.storyIndex));
    });
    $("#storyPause")?.addEventListener("click", () => {
      state.storyPaused = !state.storyPaused;
      updateStory();
    });
    const carousel = $("#storyCarousel");
    carousel?.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "touch") return;
      state.storyHovered = true;
      scheduleStory();
    });
    carousel?.addEventListener("pointerleave", () => {
      state.storyHovered = false;
      scheduleStory();
    });
    carousel?.addEventListener("focusin", () => {
      state.storyFocused = true;
      scheduleStory();
    });
    carousel?.addEventListener("focusout", () => {
      queueMicrotask(() => {
        state.storyFocused = carousel.contains(document.activeElement);
        scheduleStory();
      });
    });
    document.addEventListener("visibilitychange", scheduleStory);
    reducedMotion.addEventListener("change", scheduleStory);
  }

  function initVideo() {
    const video = $("#heroVideo");
    const toggle = $("#videoToggle");
    if (!video) return;
    let resumeWhenVisible = false;
    let userPaused = false;
    const automaticPlaybackAllowed = () => !reducedMotion.matches && !navigator.connection?.saveData;
    const updateToggle = () => {
      if (!toggle) return;
      toggle.setAttribute("aria-pressed", String(!video.paused));
      toggle.setAttribute("aria-label", video.paused ? "Включить фоновое видео" : "Приостановить фоновое видео");
      toggle.textContent = video.paused ? "Включить видео" : "Пауза видео";
      toggle.classList.toggle("is-playing", !video.paused);
    };
    const playVideo = async () => {
      if (!video.getAttribute("src") && video.dataset.src) {
        const source = safeUrl(video.dataset.src);
        if (source) video.src = source;
      }
      try { await video.play(); } catch { /* Poster remains visible when playback is unavailable. */ }
      updateToggle();
    };
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    // Playback is explicit so reduced-motion/data-saving users do not download the video.
    video.autoplay = false;
    video.addEventListener("play", updateToggle);
    video.addEventListener("pause", updateToggle);
    video.addEventListener("error", updateToggle);
    if (automaticPlaybackAllowed() && !document.hidden) void playVideo();
    else video.pause();
    toggle?.addEventListener("click", () => {
      if (video.paused) {
        userPaused = false;
        void playVideo();
      } else {
        userPaused = true;
        resumeWhenVisible = false;
        video.pause();
      }
    });
    reducedMotion.addEventListener("change", () => {
      if (!automaticPlaybackAllowed()) {
        resumeWhenVisible = false;
        video.pause();
      } else if (!userPaused) {
        if (document.hidden) resumeWhenVisible = true;
        else void playVideo();
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        resumeWhenVisible = !video.paused;
        video.pause();
      } else if (!userPaused && (resumeWhenVisible || (automaticPlaybackAllowed() && !video.getAttribute("src")))) {
        resumeWhenVisible = false;
        void playVideo();
      }
    });
    updateToggle();
  }

  function observeReveal(root = document) {
    const elements = root.querySelectorAll("[data-reveal]");
    if (!state.revealObserver || reducedMotion.matches) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    elements.forEach((element) => {
      if (element.classList.contains("is-visible")) return;
      element.classList.add("reveal-ready");
      state.revealObserver.observe(element);
    });
  }

  function initReveal() {
    if ("IntersectionObserver" in window) {
      state.revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          state.revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -60px 0px" });
    }
    observeReveal();
    reducedMotion.addEventListener("change", () => {
      state.revealObserver?.disconnect();
      document.querySelectorAll("[data-reveal]").forEach((element) => {
        // Keep content already on screen stable; stage only content still below it.
        if (reducedMotion.matches || element.getBoundingClientRect().top < window.innerHeight) {
          element.classList.add("is-visible");
        } else {
          element.classList.remove("is-visible");
        }
      });
      observeReveal();
    });
  }

  function initNavigation() {
    document.addEventListener("click", (event) => {
      const anchor = event.target.closest("a[href^='#']");
      if (!anchor || anchor.classList.contains("skip-link") || event.defaultPrevented
        || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const id = anchor.getAttribute("href").slice(1);
      const target = id && document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      history.pushState(null, "", `#${id}`);
      target.scrollIntoView({ behavior: reducedMotion.matches ? "instant" : "smooth", block: "start" });
    });
    const marqueeToggle = $("#marqueeToggle");
    marqueeToggle?.addEventListener("click", () => {
      const paused = marqueeToggle.getAttribute("aria-pressed") !== "true";
      marqueeToggle.setAttribute("aria-pressed", String(paused));
      marqueeToggle.setAttribute("aria-label", paused ? "Продолжить ленту брендов" : "Приостановить ленту брендов");
      marqueeToggle.textContent = paused ? "▶" : "Ⅱ";
      $("#brandMarquee")?.classList.toggle("is-paused", paused);
    });
    const toggle = $("#menuToggle");
    const nav = $("#mainNav");
    const setOpen = (open) => {
      if (!toggle || !nav) return;
      nav.classList.toggle("is-open", open);
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
      if (open) nav.querySelector("a")?.focus({ preventScroll: true });
    };
    toggle?.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    nav?.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && toggle?.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
    document.addEventListener("click", (event) => {
      if (nav && toggle && !nav.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
    });
    writeText("year", String(new Date().getFullYear()));
  }

  function initProductImageRecovery() {
    $("#products")?.addEventListener("error", (event) => {
      const image = event.target;
      if (!(image instanceof HTMLImageElement) || !image.classList.contains("product-image")) return;
      if (!image.dataset.retry) {
        image.dataset.retry = "1";
        const retry = new URL(image.src);
        retry.searchParams.set("retry", String(Date.now()));
        image.src = retry.href;
        return;
      }
      const fallback = document.createElement("div");
      fallback.className = "product-image image-fallback";
      fallback.setAttribute("role", "img");
      fallback.setAttribute("aria-label", image.alt || "Товар TEIKO");
      fallback.innerHTML = '<span>TEIKO</span><i></i><small>Искусство ухода</small>';
      image.replaceWith(fallback);
    }, true);
  }

  async function init() {
    initEntrance();
    initNavigation();
    initProductImageRecovery();
    initVideo();
    initReveal();
    initCatalogEvents();
    initStories();
    initStorefrontEffects(reducedMotion);
    try {
      const data = await loadStorefront();
      state.products = data.products.filter((product) => product && product.isActive !== false);
      state.slides = data.slides.filter(publicSlide);
      applySettings(data.settings || {});
      renderCategories();
      renderProducts();
      renderStories();
    } catch {
      const products = $("#products");
      if (products) products.innerHTML = '<p class="empty-state" role="status">Не удалось загрузить каталог. Обновите страницу, чтобы повторить попытку.</p>';
      writeText("productCount", "—");
    }
  }

  void init();
})();
