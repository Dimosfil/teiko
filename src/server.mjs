import fs from "node:fs";
import path from "node:path";
import express from "express";
import multer from "multer";
import {
  deleteProduct,
  deleteSlide,
  getSettings,
  hasSeedData,
  initDb,
  listProducts,
  listSlides,
  saveSettings,
  seedDatabase,
  upsertProduct,
  upsertSlide
} from "./db.mjs";
import { seedPayload } from "./seed-data.mjs";

const app = express();
const port = Number(process.env.PORT || 3000);
const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
const adminPath = process.env.ADMIN_PATH || "/test-admin-teiko";
const publicDir = path.resolve("public");
const adminDir = path.resolve("admin-console");
const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.join(publicDir, "uploads"));
const visualSettingsPath = path.join(publicDir, "visual-settings.json");

fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => {
      const safeName = file.originalname.toLowerCase().replace(/[^a-z0-9а-яё.]+/giu, "-");
      cb(null, `${Date.now()}-${safeName}`);
    }
  }),
  limits: { fileSize: 8 * 1024 * 1024 }
});

function requireAdmin(req, res, next) {
  const header = req.get("x-admin-password");
  if (header !== adminPassword) {
    res.status(401).json({ error: "Admin password is invalid" });
    return;
  }
  next();
}

function normalizeLinks(value) {
  if (Array.isArray(value)) return value.filter((link) => link.label && link.url);
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((link) => link.label && link.url) : [];
  } catch {
    return [];
  }
}

function normalizeSpecs(value) {
  if (Array.isArray(value)) return value.filter((item) => item.label || item.value);
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => item.label || item.value) : [];
  } catch {
    return [];
  }
}

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadDir));
app.use(express.static(publicDir));

app.put("/api/visual-settings", (req, res) => {
  if (process.env.NODE_ENV === "production" && process.env.VISUAL_SETTINGS_WRITE !== "1") {
    res.status(403).json({ error: "Visual settings write is disabled in production" });
    return;
  }
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    res.status(400).json({ error: "Visual settings payload must be an object" });
    return;
  }
  fs.writeFileSync(visualSettingsPath, `${JSON.stringify(req.body, null, 2)}\n`, "utf8");
  res.json(req.body);
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "teiko-showcase" });
});

app.get(adminPath, (_req, res) => {
  res.sendFile(path.join(adminDir, "index.html"));
});

app.use(adminPath, express.static(adminDir));

app.get("/api/storefront", (_req, res) => {
  res.json({
    settings: getSettings(),
    slides: listSlides({ activeOnly: true }),
    products: listProducts({ activeOnly: true })
  });
});

app.get("/api/admin/content", requireAdmin, (_req, res) => {
  res.json({
    settings: getSettings(),
    slides: listSlides(),
    products: listProducts()
  });
});

app.put("/api/admin/settings", requireAdmin, (req, res) => {
  res.json(saveSettings(req.body));
});

app.post("/api/admin/slides", requireAdmin, (req, res) => {
  res.json(upsertSlide({ ...req.body, isActive: req.body.isActive !== false }));
});

app.delete("/api/admin/slides/:id", requireAdmin, (req, res) => {
  deleteSlide(req.params.id);
  res.json({ ok: true });
});

app.post("/api/admin/products", requireAdmin, (req, res) => {
  res.json(
    upsertProduct({
      ...req.body,
      marketplaceLinks: normalizeLinks(req.body.marketplaceLinks),
      specs: normalizeSpecs(req.body.specs),
      isActive: req.body.isActive !== false
    })
  );
});

app.delete("/api/admin/products/:id", requireAdmin, (req, res) => {
  deleteProduct(req.params.id);
  res.json({ ok: true });
});

app.post("/api/admin/uploads", requireAdmin, upload.single("image"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  res.json({ path: `/uploads/${req.file.filename}` });
});

await initDb();
if (!hasSeedData()) seedDatabase(seedPayload);

app.listen(port, () => {
  console.log(`TEIKO showcase listening on http://localhost:${port}`);
  console.log(`TEIKO admin listening on http://localhost:${port}${adminPath}`);
});
