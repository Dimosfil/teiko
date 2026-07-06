import fs from "node:fs";
import path from "node:path";
import initSqlJs from "sql.js";

const dataDir = path.resolve(process.env.DATA_DIR || "data");
const dbPath = path.join(dataDir, "teiko.sqlite");

let SQL;
let db;

function ensureDataDir() {
  fs.mkdirSync(dataDir, { recursive: true });
}

function loadDatabase() {
  ensureDataDir();
  if (fs.existsSync(dbPath)) {
    return new SQL.Database(fs.readFileSync(dbPath));
  }
  return new SQL.Database();
}

function persist() {
  ensureDataDir();
  fs.writeFileSync(dbPath, Buffer.from(db.export()));
}

function run(sql, params = []) {
  db.run(sql, params);
}

function query(sql, params = []) {
  const stmt = db.prepare(sql, params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function one(sql, params = []) {
  return query(sql, params)[0] || null;
}

function toJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function productFromRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    description: row.description,
    brand: row.brand,
    category: row.category,
    badge: row.badge,
    sku: row.sku,
    price: row.price,
    oldPrice: row.old_price,
    rating: row.rating,
    image: row.image,
    sortOrder: row.sort_order,
    isActive: Boolean(row.is_active),
    marketplaceLinks: toJson(row.marketplace_links, []),
    specs: toJson(row.specs, [])
  };
}

function slideFromRow(row) {
  return {
    id: row.id,
    eyebrow: row.eyebrow,
    title: row.title,
    text: row.text,
    ctaLabel: row.cta_label,
    ctaHref: row.cta_href,
    image: row.image,
    sortOrder: row.sort_order,
    isActive: Boolean(row.is_active)
  };
}

export async function initDb() {
  SQL = await initSqlJs();
  db = loadDatabase();
  run(`
    create table if not exists settings (
      key text primary key,
      value text not null
    )
  `);
  run(`
    create table if not exists slides (
      id integer primary key autoincrement,
      eyebrow text not null default '',
      title text not null,
      text text not null default '',
      cta_label text not null default '',
      cta_href text not null default '',
      image text not null default '',
      sort_order integer not null default 0,
      is_active integer not null default 1,
      created_at text not null default current_timestamp,
      updated_at text not null default current_timestamp
    )
  `);
  run(`
    create table if not exists products (
      id integer primary key autoincrement,
      slug text not null unique,
      title text not null,
      short_description text not null default '',
      description text not null default '',
      brand text not null default '',
      category text not null default '',
      badge text not null default '',
      sku text not null default '',
      price integer not null default 0,
      old_price integer not null default 0,
      rating real not null default 0,
      image text not null default '',
      marketplace_links text not null default '[]',
      specs text not null default '[]',
      sort_order integer not null default 0,
      is_active integer not null default 1,
      created_at text not null default current_timestamp,
      updated_at text not null default current_timestamp
    )
  `);
  persist();
}

export function getSettings() {
  const defaults = {
    siteName: "TEIKO",
    headerTitle: "TEIKO",
    headerText: "Автохимия и детейлинг с прямыми ссылками на маркетплейсы.",
    heroTitle: "TEIKO: витрина автохимии без лишнего шума",
    heroText: "Выбирайте средства для ухода за автомобилем и переходите к покупке на Ozon, Wildberries или другом маркетплейсе.",
    aboutTitle: "Витрина бренда и удобный каталог",
    aboutText: "На сайте собраны карточки товаров, описания, изображения и актуальные ссылки на площадки. Покупка на сайте пока отключена.",
    contactsTitle: "Где купить",
    contactsText: "Откройте карточку товара и выберите удобный маркетплейс.",
    phone: "",
    email: "",
    logo: "/assets/logo-alpha.png",
    logoBack: "/assets/logo-back.jpg"
  };
  const rows = query("select key, value from settings");
  return rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), defaults);
}

export function saveSettings(input) {
  Object.entries(input).forEach(([key, value]) => {
    run(
      "insert into settings (key, value) values (?, ?) on conflict(key) do update set value = excluded.value",
      [key, String(value ?? "")]
    );
  });
  persist();
  return getSettings();
}

export function listSlides({ activeOnly = false } = {}) {
  const rows = query(
    `select * from slides ${activeOnly ? "where is_active = 1" : ""} order by sort_order asc, id asc`
  );
  return rows.map(slideFromRow);
}

export function upsertSlide(input) {
  const values = [
    input.eyebrow || "",
    input.title || "Новый слайд",
    input.text || "",
    input.ctaLabel || "",
    input.ctaHref || "",
    input.image || "",
    Number(input.sortOrder || 0),
    input.isActive ? 1 : 0
  ];
  if (input.id) {
    run(
      `update slides set eyebrow=?, title=?, text=?, cta_label=?, cta_href=?, image=?, sort_order=?, is_active=?, updated_at=current_timestamp where id=?`,
      [...values, Number(input.id)]
    );
  } else {
    run(
      `insert into slides (eyebrow, title, text, cta_label, cta_href, image, sort_order, is_active) values (?, ?, ?, ?, ?, ?, ?, ?)`,
      values
    );
  }
  persist();
  return listSlides();
}

export function deleteSlide(id) {
  run("delete from slides where id = ?", [Number(id)]);
  persist();
}

export function listProducts({ activeOnly = false } = {}) {
  const rows = query(
    `select * from products ${activeOnly ? "where is_active = 1" : ""} order by sort_order asc, id asc`
  );
  return rows.map(productFromRow);
}

export function upsertProduct(input) {
  const slug = (input.slug || input.title || `product-${Date.now()}`)
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/giu, "-")
    .replace(/^-+|-+$/g, "");
  const values = [
    slug,
    input.title || "Новый товар",
    input.shortDescription || "",
    input.description || "",
    input.brand || "",
    input.category || "",
    input.badge || "",
    input.sku || "",
    Number(input.price || 0),
    Number(input.oldPrice || 0),
    Number(input.rating || 0),
    input.image || "",
    JSON.stringify(input.marketplaceLinks || []),
    JSON.stringify(input.specs || []),
    Number(input.sortOrder || 0),
    input.isActive ? 1 : 0
  ];
  if (input.id) {
    run(
      `update products set slug=?, title=?, short_description=?, description=?, brand=?, category=?, badge=?, sku=?, price=?, old_price=?, rating=?, image=?, marketplace_links=?, specs=?, sort_order=?, is_active=?, updated_at=current_timestamp where id=?`,
      [...values, Number(input.id)]
    );
  } else {
    run(
      `insert into products (slug, title, short_description, description, brand, category, badge, sku, price, old_price, rating, image, marketplace_links, specs, sort_order, is_active) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      values
    );
  }
  persist();
  return listProducts();
}

export function deleteProduct(id) {
  run("delete from products where id = ?", [Number(id)]);
  persist();
}

export function hasSeedData() {
  return Boolean(one("select id from products limit 1"));
}

export function seedDatabase({ settings, slides, products }) {
  if (settings) saveSettings(settings);
  slides.forEach((slide) => upsertSlide(slide));
  products.forEach((product) => upsertProduct(product));
  persist();
}
