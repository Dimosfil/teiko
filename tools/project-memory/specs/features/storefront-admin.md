# Storefront And Admin Feature

## Product Intent

TEIKO is a hybrid brand-card and product-showcase site. It presents car-care
products, descriptions, images, and marketplace links. Users do not buy on the
site; each product card sends them to external marketplaces such as Ozon,
Wildberries, Yandex Market, or another configured URL.

## Public Workflow

1. Visitor opens the public site.
2. The public shell uses a store-style structure: dark service topbar, main
   header with logo, catalog search, and buyer links, then the promo hero.
   Do not render a second header-level category navigation row because category
   entry points now live in the image-card section before the product module.
3. Main content is constrained by a Grass-like centered container so wide
   screens keep side margins instead of stretching every section edge to edge.
4. Hero slides render as a single large Leraton-style promo banner inside that
   constrained container. The carousel is a plain full-width horizontal track:
   each slide is exactly one viewport of the hero, and changing slides only
   translates the track by one slide width. Navigation wraps from the last slide
   back to the first without scaling, focus-card animation, neighboring cards,
   or other visual carousel effects.
   The legacy debug motion controls may still exist in the tool panel, but the
   public hero layout must ignore scale/focus-card effects.
   Hovering an actual slide card temporarily pauses autoplay and freezes the
   progress bar at the current point; moving into the gap between cards or
   leaving the card resumes from the remaining time instead of restarting or
   letting the bar finish while the slide is held.
   The debug panel also controls the number of visible carousel cards and the
   non-negative gap between them; the card count is capped by the number of
   available active slides, and card widths are recalculated from that count so
   a wider carousel window does not require overlapping cards.
   The active first promo slide is the KRYTEX Blue Sky mountain/car banner
   (`/uploads/hero/krytex-perfume-blue-sky.png`) unless the admin changes slide
   ordering.
5. Visitor selects a slide, filters by category, searches products from the
   header or catalog search fields, or opens a
   product card.
   Before the product module, category entry points render as Grass-like image
   cards with generated thematic images only; category names and counts remain
   in the compact pill filters inside the product module so the text is not
   duplicated. The debug/settings panel can switch category image cards between
   the default `original` image mode and a `tinted` mode with the colored overlay
   effect.
   The catalog heading is controlled by visual settings: users can change the
   heading text, color, and font mode. `default` keeps the current heading
   typography; `TEIKO` style keeps regular text readable and renders `TEIKO`
   substrings with the transparent logo asset.
6. Product details show description, price, specs, and all configured
   marketplace links.
7. Visitor clicks a marketplace link and leaves the site to complete purchase.

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
- Hero debug settings are project-file-backed preview controls. Back, Glass,
  Text, Grid, header-logo width/height/scale/offset, carousel transform,
  carousel visible-card count and gap, category image style, catalog-title text,
  catalog-title color/font, catalog panel transform, info/about transform,
  selected hero layout, slide color/mono tone, carousel motion mode, Text
  contour-glint motion on/off mode, Grid motion on/off mode, and the
  drag-reordered debug menu section order are previewed immediately. They become
  durable when the debug panel writes a named preset through the local backend.
  `public/visual-settings/index.json` stores the active preset and preset list;
  each preset lives as
  `public/visual-settings/<preset-id>.json`. `public/visual-settings.json`
  remains a backward-compatible default fallback only. The preset folder is the
  source of truth for git commits and FTP uploads.
- Visual preset management and site theme publishing are separate actions. The
  Save button inside the Preset section writes only the named preset and does
  not change the active site theme. The top Save button publishes the current
  selected preset/settings as the active theme used after refresh and by static
  deploys. The backend accepts `activate=0` for preset-only writes and keeps
  `index.activePreset` unchanged in that case.
