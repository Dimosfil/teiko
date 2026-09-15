import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initDb, hasSeedData, seedDatabase, getSettings, listSlides, listProducts } from "../src/db.mjs";
import { seedPayload } from "../src/seed-data.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const outputDir = path.join(root, "dist");
const stagingDir = path.join(root, `.dist-next-${process.pid}`);
const requiredMedia = [
  "assets/cinematic/teiko-detailing.mp4",
  "assets/cinematic/teiko-detailing-poster.jpg"
];

if (process.cwd() !== root) {
  throw new Error(`Run the static build from ${root}`);
}

await initDb();
if (!hasSeedData()) seedDatabase(seedPayload);

const storefront = {
  settings: getSettings(),
  slides: listSlides({ activeOnly: true }),
  products: listProducts({ activeOnly: true })
};
if (!storefront.products.length || !storefront.slides.length) {
  throw new Error("The published catalog needs active products and slides.");
}

try {
  fs.cpSync(publicDir, stagingDir, {
    recursive: true,
    filter: (source) => path.basename(source) !== ".idea"
  });

  for (const relativePath of requiredMedia) {
    if (!fs.existsSync(path.join(stagingDir, relativePath))) {
      throw new Error(`Missing site media: ${relativePath}`);
    }
  }

  for (const item of [...storefront.products, ...storefront.slides]) {
    const image = item.image;
    if (typeof image !== "string" || !image.startsWith("/")) continue;
    const imagePath = path.resolve(stagingDir, `.${new URL(image, "https://teiko.unity-constructor.site").pathname}`);
    if (!imagePath.startsWith(`${stagingDir}${path.sep}`) || !fs.existsSync(imagePath)
      || fs.statSync(imagePath).size === 0) {
      throw new Error(`Catalog image is absent from the upload: ${image}`);
    }
    if (/\.jpe?g$/i.test(imagePath) && fs.readFileSync(imagePath).subarray(0, 3).toString("hex") !== "ffd8ff") {
      throw new Error(`Catalog image is not a valid JPEG: ${image}`);
    }
  }

  // The gateway rewrites literal /teiko/ paths on subdomain upload. The link
  // page really lives at that path, so keep its links relative in the artifact.
  const indexPath = path.join(stagingDir, "index.html");
  const index = fs.readFileSync(indexPath, "utf8");
  fs.writeFileSync(indexPath, index.replaceAll('href="/teiko/"', 'href="teiko/"'), "utf8");

  const json = `${JSON.stringify(storefront, null, 2)}\n`;
  if (/\?{4,}|�/.test(json)) {
    throw new Error("Catalog text appears to contain encoding damage.");
  }
  fs.mkdirSync(path.join(stagingDir, "api"), { recursive: true });
  fs.writeFileSync(path.join(stagingDir, "api", "storefront"), json, "utf8");
  fs.writeFileSync(path.join(stagingDir, "storefront.json"), json, "utf8");
  fs.writeFileSync(
    path.join(stagingDir, "health"),
    `${JSON.stringify({ ok: true, service: "teiko-showcase-static" })}\n`,
    "utf8"
  );

  const inspect = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory()) inspect(filePath);
      else if (/\.(html?|m?js|css|json|webmanifest|svg)$/i.test(entry.name)) {
        if (fs.readFileSync(filePath, "utf8").includes("/teiko/")) {
          throw new Error(`The gateway would rewrite the link page path: ${filePath}`);
        }
      }
    }
  };
  inspect(stagingDir);

  if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
  fs.renameSync(stagingDir, outputDir);
  console.log(`Static TEIKO site: ${storefront.products.length} products, ${storefront.slides.length} slides`);
  console.log(`Build output: ${outputDir}`);
} catch (error) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
  throw error;
}
