const state = {
  password: sessionStorage.getItem("teiko-admin-password") || "",
  tab: "settings",
  settings: {},
  slides: [],
  products: [],
  editing: null
};

const $ = (selector) => document.querySelector(selector);

function adminHeaders() {
  return {
    "Content-Type": "application/json",
    "x-admin-password": state.password
  };
}

function setStatus(message) {
  $("#status").textContent = message || "";
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...adminHeaders(),
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `HTTP ${response.status}`);
  }
  return response.json();
}

function field(name, label, value = "", type = "text") {
  return `
    <label>
      ${label}
      <input name="${name}" type="${type}" value="${String(value ?? "").replaceAll('"', "&quot;")}" />
    </label>
  `;
}

function textarea(name, label, value = "") {
  return `
    <label>
      ${label}
      <textarea name="${name}">${value || ""}</textarea>
    </label>
  `;
}

function checkbox(name, label, checked = true) {
  return `
    <label>
      ${label}
      <select name="${name}">
        <option value="true" ${checked ? "selected" : ""}>Опубликовано</option>
        <option value="false" ${!checked ? "selected" : ""}>Скрыто</option>
      </select>
    </label>
  `;
}

function settingsForm() {
  $("#formTitle").textContent = "Шапка и тексты";
  $("#editorForm").innerHTML = `
    ${field("siteName", "Название сайта", state.settings.siteName)}
    ${field("headerTitle", "Название в шапке", state.settings.headerTitle)}
    ${textarea("headerText", "Текст шапки", state.settings.headerText)}
    ${textarea("heroTitle", "Заголовок первого экрана", state.settings.heroTitle)}
    ${textarea("heroText", "Текст первого экрана", state.settings.heroText)}
    ${textarea("aboutTitle", "Заголовок описания", state.settings.aboutTitle)}
    ${textarea("aboutText", "Описание", state.settings.aboutText)}
    ${textarea("contactsTitle", "Заголовок блока покупки", state.settings.contactsTitle)}
    ${textarea("contactsText", "Текст блока покупки", state.settings.contactsText)}
    ${field("phone", "Телефон", state.settings.phone)}
    ${field("email", "Email", state.settings.email)}
    ${field("logo", "Логотип", state.settings.logo)}
    ${field("logoBack", "Logo-back", state.settings.logoBack)}
    <button class="button primary" type="submit">Сохранить</button>
  `;
}

function slideForm(slide = {}) {
  state.editing = slide.id ? { type: "slide", id: slide.id } : { type: "slide" };
  $("#formTitle").textContent = slide.id ? "Редактировать слайд" : "Новый слайд";
  $("#editorForm").innerHTML = `
    <input name="id" type="hidden" value="${slide.id || ""}" />
    ${field("eyebrow", "Надзаголовок", slide.eyebrow)}
    ${textarea("title", "Заголовок", slide.title)}
    ${textarea("text", "Текст", slide.text)}
    ${field("ctaLabel", "Текст кнопки", slide.ctaLabel)}
    ${field("ctaHref", "Ссылка кнопки", slide.ctaHref || "#catalog")}
    ${field("image", "Изображение", slide.image || "/assets/logo-back.jpg")}
    ${field("sortOrder", "Порядок", slide.sortOrder || 0, "number")}
    ${checkbox("isActive", "Статус", slide.isActive !== false)}
    <button class="button primary" type="submit">Сохранить слайд</button>
  `;
}

function productForm(product = {}) {
  state.editing = product.id ? { type: "product", id: product.id } : { type: "product" };
  $("#formTitle").textContent = product.id ? "Редактировать товар" : "Новый товар";
  $("#editorForm").innerHTML = `
    <input name="id" type="hidden" value="${product.id || ""}" />
    ${field("title", "Название", product.title)}
    ${field("slug", "Slug", product.slug)}
    ${textarea("shortDescription", "Короткое описание", product.shortDescription)}
    ${textarea("description", "Полное описание", product.description)}
    ${field("brand", "Бренд", product.brand)}
    ${field("category", "Категория", product.category)}
    ${field("badge", "Бейдж", product.badge)}
    ${field("sku", "Артикул", product.sku)}
    ${field("price", "Цена", product.price || 0, "number")}
    ${field("oldPrice", "Старая цена", product.oldPrice || 0, "number")}
    ${field("rating", "Рейтинг", product.rating || 0, "number")}
    ${field("image", "Фото товара", product.image)}
    <label>
      Загрузить фото
      <input name="upload" type="file" accept="image/*" />
    </label>
    ${textarea("marketplaceLinks", "Маркетплейсы JSON", JSON.stringify(product.marketplaceLinks || [{ label: "Ozon", url: "" }], null, 2))}
    ${textarea("specs", "Характеристики JSON", JSON.stringify(product.specs || [], null, 2))}
    ${field("sortOrder", "Порядок", product.sortOrder || 0, "number")}
    ${checkbox("isActive", "Статус", product.isActive !== false)}
    <button class="button primary" type="submit">Сохранить товар</button>
  `;
}

function renderSettingsList() {
  $("#adminList").innerHTML = `
    <article class="admin-item">
      <img src="${state.settings.logoBack || "/assets/logo-back.jpg"}" alt="" />
      <div>
        <strong>${state.settings.siteName || "TEIKO"}</strong>
        <small>${state.settings.heroTitle || ""}</small>
      </div>
      <div class="row-actions">
        <button class="icon-button" type="button" data-edit-settings>...</button>
      </div>
    </article>
  `;
}

function renderSlidesList() {
  const activeCount = state.slides.filter((slide) => slide.isActive !== false).length;
  $("#adminList").innerHTML = `
    <article class="admin-item slide-count-control">
      <div>
        <strong>Количество слайдов</strong>
        <small>Меняет число опубликованных слайдов в карусели</small>
      </div>
      <div class="row-actions">
        <input id="slideCountInput" type="number" min="1" max="12" value="${Math.max(activeCount, 1)}" />
        <button class="button secondary" type="button" data-apply-slide-count>Применить</button>
      </div>
    </article>
  ` + state.slides
    .map(
      (slide) => `
        <article class="admin-item">
          <img src="${slide.image || "/assets/logo-back.jpg"}" alt="" />
          <div>
            <strong>${slide.title}</strong>
            <small>${slide.eyebrow} · ${slide.isActive ? "опубликовано" : "скрыто"}</small>
          </div>
          <div class="row-actions">
            <button class="icon-button" type="button" data-edit-slide="${slide.id}">...</button>
            <button class="icon-button danger" type="button" data-delete-slide="${slide.id}">x</button>
          </div>
        </article>
      `
    )
    .join("");
}

async function resizeSlides(targetCount) {
  const count = Math.max(1, Math.min(12, Number(targetCount) || 1));
  const sorted = [...state.slides].sort((left, right) => (Number(left.sortOrder) || 0) - (Number(right.sortOrder) || 0) || Number(left.id) - Number(right.id));
  let slides = sorted;
  for (let index = 0; index < slides.length; index += 1) {
    const slide = slides[index];
    const shouldBeActive = index < count;
    if ((slide.isActive !== false) !== shouldBeActive) {
      slides = await api("/api/admin/slides", {
        method: "POST",
        body: JSON.stringify({ ...slide, isActive: shouldBeActive })
      });
    }
  }
  for (let index = slides.length; index < count; index += 1) {
    slides = await api("/api/admin/slides", {
      method: "POST",
      body: JSON.stringify({
        eyebrow: "TEIKO",
        title: `Slide ${index + 1}`,
        text: "",
        ctaLabel: "",
        ctaHref: "#catalog",
        image: state.settings.logoBack || "/assets/logo-back.jpg",
        sortOrder: index + 1,
        isActive: true
      })
    });
  }
  state.slides = slides;
}

function renderProductsList() {
  $("#adminList").innerHTML = state.products
    .map(
      (product) => `
        <article class="admin-item">
          <img src="${product.image || "/assets/logo-back.jpg"}" alt="" />
          <div>
            <strong>${product.title}</strong>
            <small>${product.category || "без категории"} · ${product.marketplaceLinks?.length || 0} ссылок · ${product.isActive ? "опубликовано" : "скрыто"}</small>
          </div>
          <div class="row-actions">
            <button class="icon-button" type="button" data-edit-product="${product.id}">...</button>
            <button class="icon-button danger" type="button" data-delete-product="${product.id}">x</button>
          </div>
        </article>
      `
    )
    .join("");
}

function render() {
  document.querySelectorAll("[data-tab]").forEach((button) => button.classList.toggle("active", button.dataset.tab === state.tab));
  $("#newButton").classList.toggle("hidden", state.tab === "settings");
  if (state.tab === "settings") {
    settingsForm();
    renderSettingsList();
  }
  if (state.tab === "slides") {
    slideForm({});
    renderSlidesList();
  }
  if (state.tab === "products") {
    productForm({});
    renderProductsList();
  }
}

async function loadAdmin() {
  const data = await api("/api/admin/content");
  state.settings = data.settings;
  state.slides = data.slides;
  state.products = data.products;
  $("#loginBox").classList.add("hidden");
  $("#adminShell").classList.remove("hidden");
  render();
}

async function uploadIfNeeded(form) {
  const file = form.upload?.files?.[0];
  if (!file) return null;
  const body = new FormData();
  body.append("image", file);
  const response = await fetch("/api/admin/uploads", {
    method: "POST",
    headers: { "x-admin-password": state.password },
    body
  });
  if (!response.ok) throw new Error("Не удалось загрузить изображение");
  return response.json();
}

function formPayload(form) {
  const payload = Object.fromEntries(new FormData(form).entries());
  payload.isActive = payload.isActive !== "false";
  delete payload.upload;
  return payload;
}

async function submitEditor(event) {
  event.preventDefault();
  setStatus("Сохраняю...");
  const form = event.currentTarget;
  const payload = formPayload(form);
  try {
    if (state.tab === "settings") {
      state.settings = await api("/api/admin/settings", { method: "PUT", body: JSON.stringify(payload) });
    } else if (state.tab === "slides") {
      state.slides = await api("/api/admin/slides", { method: "POST", body: JSON.stringify(payload) });
    } else if (state.tab === "products") {
      const uploaded = await uploadIfNeeded(form);
      if (uploaded?.path) payload.image = uploaded.path;
      payload.marketplaceLinks = JSON.parse(payload.marketplaceLinks || "[]");
      payload.specs = JSON.parse(payload.specs || "[]");
      state.products = await api("/api/admin/products", { method: "POST", body: JSON.stringify(payload) });
    }
    setStatus("Сохранено.");
    render();
  } catch (error) {
    setStatus(error.message);
  }
}

function bindEvents() {
  $("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    state.password = $("#passwordInput").value;
    sessionStorage.setItem("teiko-admin-password", state.password);
    try {
      await loadAdmin();
    } catch (error) {
      sessionStorage.removeItem("teiko-admin-password");
      $(".login-box .status").textContent = error.message;
    }
  });
  $("#editorForm").addEventListener("submit", submitEditor);
  $("#newButton").addEventListener("click", () => {
    if (state.tab === "slides") slideForm({});
    if (state.tab === "products") productForm({});
  });
  document.addEventListener("click", async (event) => {
    const tab = event.target.closest("[data-tab]");
    const editSettings = event.target.closest("[data-edit-settings]");
    const editSlide = event.target.closest("[data-edit-slide]");
    const editProduct = event.target.closest("[data-edit-product]");
    const deleteSlide = event.target.closest("[data-delete-slide]");
    const deleteProduct = event.target.closest("[data-delete-product]");
    const applySlideCount = event.target.closest("[data-apply-slide-count]");
    if (tab) {
      state.tab = tab.dataset.tab;
      render();
    }
    if (editSettings) settingsForm();
    if (editSlide) slideForm(state.slides.find((slide) => String(slide.id) === editSlide.dataset.editSlide));
    if (editProduct) productForm(state.products.find((product) => String(product.id) === editProduct.dataset.editProduct));
    if (applySlideCount) {
      setStatus("Сохраняю количество слайдов...");
      await resizeSlides($("#slideCountInput").value);
      setStatus("Количество слайдов обновлено.");
      render();
    }
    if (deleteSlide && confirm("Удалить слайд?")) {
      await api(`/api/admin/slides/${deleteSlide.dataset.deleteSlide}`, { method: "DELETE" });
      await loadAdmin();
    }
    if (deleteProduct && confirm("Удалить товар?")) {
      await api(`/api/admin/products/${deleteProduct.dataset.deleteProduct}`, { method: "DELETE" });
      await loadAdmin();
    }
  });
}

bindEvents();
if (state.password) loadAdmin().catch(() => sessionStorage.removeItem("teiko-admin-password"));
