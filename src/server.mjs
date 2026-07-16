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
const dataDir = path.resolve(process.env.DATA_DIR || "data");
const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.join(publicDir, "uploads"));
const bundledVisualSettingsPath = path.join(publicDir, "visual-settings.json");
const bundledVisualSettingsDir = path.join(publicDir, "visual-settings");
const bundledDefaultVisualSettingsPath = path.join(bundledVisualSettingsDir, "default.json");
const visualSettingsDir = path.resolve(process.env.VISUAL_SETTINGS_DIR || path.join(dataDir, "visual-settings"));
const visualSettingsPath = path.join(visualSettingsDir, "default.json");
const visualSettingsIndexPath = path.join(visualSettingsDir, "index.json");
const defaultVisualSettingsPreset = { id: "default", name: "Default" };

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(visualSettingsDir, { recursive: true });

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

function readJsonFile(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function seedVisualSettingsStore() {
  if (!fs.existsSync(visualSettingsPath)) {
    const sourcePath = [bundledDefaultVisualSettingsPath, bundledVisualSettingsPath].find((filePath) => fs.existsSync(filePath));
    if (sourcePath) {
      fs.copyFileSync(sourcePath, visualSettingsPath);
    } else {
      fs.writeFileSync(visualSettingsPath, "{}\n", "utf8");
    }
  }
  if (!fs.existsSync(visualSettingsIndexPath)) {
    fs.writeFileSync(
      visualSettingsIndexPath,
      `${JSON.stringify({ activePreset: defaultVisualSettingsPreset.id, presets: [defaultVisualSettingsPreset] }, null, 2)}\n`,
      "utf8"
    );
  }
}

seedVisualSettingsStore();

function normalizePresetId(value, fallback = "") {
  const id = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return id || fallback || `preset-${Date.now()}`;
}

function presetPath(id) {
  return path.join(visualSettingsDir, `${normalizePresetId(id, defaultVisualSettingsPreset.id)}.json`);
}

function readVisualSettingsIndex() {
  const index = readJsonFile(visualSettingsIndexPath, null);
  const presets = Array.isArray(index?.presets) ? index.presets : [];
  const normalizedPresets = [
    defaultVisualSettingsPreset,
    ...presets
      .map((preset) => ({
        id: normalizePresetId(preset.id || preset.name),
        name: String(preset.name || preset.id || "").trim()
      }))
      .filter((preset) => preset.id && preset.id !== defaultVisualSettingsPreset.id)
  ];
  const uniquePresets = normalizedPresets.filter(
    (preset, index, list) => list.findIndex((item) => item.id === preset.id) === index
  );
  return {
    activePreset: normalizePresetId(index?.activePreset, defaultVisualSettingsPreset.id),
    presets: uniquePresets.map((preset) => ({
      id: preset.id,
      name: preset.name || preset.id
    }))
  };
}

function writeVisualSettingsIndex(index) {
  fs.writeFileSync(visualSettingsIndexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
}

function readVisualSettingsPreset(id) {
  const safeId = normalizePresetId(id, defaultVisualSettingsPreset.id);
  const preset = readJsonFile(presetPath(safeId), null);
  if (preset) return preset;
  if (safeId === defaultVisualSettingsPreset.id) {
    return readJsonFile(bundledDefaultVisualSettingsPath, readJsonFile(bundledVisualSettingsPath, {}));
  }
  return {};
}

function writeVisualSettingsPreset(id, name, settings, options = {}) {
  const safeId = normalizePresetId(id || name, defaultVisualSettingsPreset.id);
  const index = readVisualSettingsIndex();
  const existing = index.presets.find((preset) => preset.id === safeId);
  const presetName = String(name || existing?.name || safeId).trim() || safeId;
  const nextPresets = [
    ...index.presets.filter((preset) => preset.id !== safeId),
    { id: safeId, name: presetName }
  ].sort((a, b) => (a.id === defaultVisualSettingsPreset.id ? -1 : b.id === defaultVisualSettingsPreset.id ? 1 : a.name.localeCompare(b.name)));
  const currentActivePreset = normalizePresetId(index.activePreset, defaultVisualSettingsPreset.id);
  const activePreset = options.activate === false && nextPresets.some((preset) => preset.id === currentActivePreset)
    ? currentActivePreset
    : safeId;
  const nextIndex = { activePreset, presets: nextPresets };
  fs.writeFileSync(presetPath(safeId), `${JSON.stringify(settings, null, 2)}\n`, "utf8");
  if (safeId === defaultVisualSettingsPreset.id) {
    fs.writeFileSync(visualSettingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
  }
  writeVisualSettingsIndex(nextIndex);
  return { id: safeId, name: presetName, index: nextIndex, settings };
}

function visualSettingsPayload(req) {
  const settings = req.body?.settings || req.body;
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return null;
  }
  return settings;
}

function canWriteVisualSettings(res) {
  if (process.env.NODE_ENV === "production" && process.env.VISUAL_SETTINGS_WRITE !== "1") {
    res.status(403).json({ error: "Visual settings write is disabled in production" });
    return false;
  }
  return true;
}

function shouldActivateVisualSettings(req) {
  const queryValue = String(req.query?.activate ?? "").toLowerCase();
  if (queryValue === "0" || queryValue === "false" || queryValue === "no") return false;
  if (req.body?.activate === false) return false;
  return true;
}

function saveVisualSettingsRequest(req, res, presetId = req.body?.id || defaultVisualSettingsPreset.id) {
  if (!canWriteVisualSettings(res)) return;
  const settings = visualSettingsPayload(req);
  if (!settings) {
    res.status(400).json({ error: "Visual settings payload must be an object" });
    return;
  }
  const result = writeVisualSettingsPreset(presetId, req.body?.name, settings, {
    activate: shouldActivateVisualSettings(req)
  });
  res.json(result);
}

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/visual-settings", (_req, res) => {
  const index = readVisualSettingsIndex();
  res.json({
    ...index,
    settings: readVisualSettingsPreset(index.activePreset)
  });
});

app.put("/api/visual-settings", (req, res) => {
  saveVisualSettingsRequest(req, res, req.body?.id || defaultVisualSettingsPreset.id);
});

app.post("/api/visual-settings", (req, res) => {
  saveVisualSettingsRequest(req, res, req.body?.id || defaultVisualSettingsPreset.id);
});

app.get("/api/visual-settings/:presetId", (req, res) => {
  res.json(readVisualSettingsPreset(req.params.presetId));
});

app.put("/api/visual-settings/:presetId", (req, res) => {
  saveVisualSettingsRequest(req, res, req.params.presetId);
});

app.post("/api/visual-settings/:presetId", (req, res) => {
  saveVisualSettingsRequest(req, res, req.params.presetId);
});

app.put("/visual-settings/:presetFile", (req, res) => {
  const presetId = String(req.params.presetFile || "").replace(/\.json$/i, "");
  saveVisualSettingsRequest(req, res, presetId);
});

app.post("/visual-settings/:presetFile", (req, res) => {
  const presetId = String(req.params.presetFile || "").replace(/\.json$/i, "");
  saveVisualSettingsRequest(req, res, presetId);
});

app.use("/uploads", express.static(uploadDir));
app.use(express.static(publicDir));

app.get(["/teiko", "/marketplaces", "/links"], (_req, res) => {
  res.sendFile(path.join(publicDir, "teiko", "index.html"));
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
