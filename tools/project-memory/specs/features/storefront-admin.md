# Storefront And Admin Feature

## Product Intent

TEIKO is a hybrid brand-card and product-showcase site. It presents car-care
products, descriptions, images, and marketplace links. Users do not buy on the
site; each product card sends them to external marketplaces such as Ozon,
Wildberries, Yandex Market, or another configured URL.

## Public Workflow

The September 2026 redesign replaces the former Grass/Leraton layout with the
Hipershield-inspired composition requested by the user. Public entrypoints are
`public/index.html`, `public/storefront.css`, and `public/storefront.js`.
The admin continues to use its original assets and APIs.

1. A dark full-width detailing video opens the page beneath an absolute header.
   TEIKO green replaces the reference's red accents. The brief CSS intro cannot
   block navigation or leave the page hidden if JavaScript fails.
2. The visitor can jump to brand information, the catalogue, or buying guidance.
   Mobile navigation is a keyboard-operable expanded/collapsed menu.
3. White brand information, benefits, a dark automotive scene and promotional
   collections lead to the catalogue. Existing admin-managed slides remain in
   their saved order, with their images, text and CTA. Indicators are below the
   image. Autoplay stops on hover, focus, explicit pause, hidden tab and reduced
   motion. Prev/next and indicators are available manually.
4. Catalogue categories and search filter the current product payload together.
   Product details use a native dialog, restore focus on close, and show price,
   description, specifications and all safe configured marketplace URLs.
5. Category images in the photographic grid link back to the filtered catalogue.
6. The buying block links to the existing `/teiko/` marketplace page. Checkout
   remains external. No cart, payment, invented partners or contact forms exist.

## Presentation And Motion

- Montserrat, white content sections, black/deep-green panels, green `#48b45a`.
- Menu underline, one-time scroll reveals, horizontal brand marquee, photo zoom,
  rising catalogue CTA, manual/automatic promotional carousel.
- Reduced motion disables decorative animations and automatic media. A poster
  remains available; video download begins only on eligible playback/manual play.
- The hidden browser tab pauses video and slides. A user-paused video stays paused.
- API content has priority over HTML copy except exact retired seed strings.
  Explicit custom hero/about/contact texts and configured logo still work.
- Previous BG visual presets remain stored and their API remains unchanged, but
  are not loaded by the redesigned public page. They belong to the legacy layout.
- Video/poster live in ignored `public/assets/cinematic/`. Source, licensing and
  reproduction are documented in `docs/hero-media.md`; they must accompany a
  deployment artifact even though Git does not contain the binary files.
- The reference analysis and adaptation map are in `docs/hipershield-redesign.md`.

## Verification — 2026-09-15

- JavaScript syntax and scoped Git whitespace checks passed.
- HTML has 36 unique IDs; all local anchors and resource references resolve.
- All 12 product and 7 slide image files exist; source text passes UTF-8 checks.
- Isolated VM checks cover URL rejection, HTML escaping, DOM IDs and the
  distinction between retired seed copy and custom administrative text.
- MP4 decodes successfully; 1920x1080, 14 seconds, no audio, approximately 3 MB.
- Following the user's request to start the site, config-service integration
  is explicitly disabled in `instruction-kit.json`; local startup uses the
  documented port 3000. Health, storefront API and encoding checks pass;
  the redesigned HTML and MP4 return HTTP 200. Startup error log is empty.
- No live browser verification or external publication has been performed.

## Admin Workflow

1. Admin opens the configured `ADMIN_PATH`, default `/test-admin-teiko`.
2. Admin enters the `ADMIN_PASSWORD`.
3. Admin edits global texts: site name, header text, hero copy, about block,
   contacts/purchase block, logo path, and `logo-back` path.
4. Admin manages slides: create, edit, hide, sort, or delete.
5. Admin manages products: create, edit, hide, sort, delete, upload image, edit
   descriptions, specs, and marketplace links.

## Data Contract

- Settings are key-value strings.
- Slides include eyebrow, title, text, CTA label/href, image, order, and active
  state.
- Products include slug, title, descriptions, brand, category, badge, SKU,
  price, old price, rating, image, marketplace links, specs, order, and active
  state.
- Marketplace links are stored as JSON arrays with `label` and `url`.
- Product specs are stored as JSON arrays with `label` and `value`.

## Constraints

- No cart, checkout, payment, or order persistence is part of this MVP.
- Public API is read-only.
- Admin API requires the configured admin password.
- The public storefront must not link to the admin path.
- Uploaded images are product/site assets, not project memory.
- Legacy visual-preset storage and API remain intact for compatibility. The new
  public layout intentionally does not apply their transforms or colours.
