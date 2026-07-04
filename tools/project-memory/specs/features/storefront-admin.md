# Storefront And Admin Feature

## Product Intent

TEIKO is a hybrid brand-card and product-showcase site. It presents car-care
products, descriptions, images, and marketplace links. Users do not buy on the
site; each product card sends them to external marketplaces such as Ozon,
Wildberries, Yandex Market, or another configured URL.

## Public Workflow

1. Visitor opens the public site.
2. Hero section shows brand copy and uses `logo-back` as the visual brand layer.
3. The public hero supports two local visual layouts: the current layered
   background mode and a header mode. Header mode keeps only the Back layer as
   the page background, moves the Text logo and Grid/molecule layers into the
   hero header above the carousel, and shifts the carousel lower.
4. Hero slides render as a closed carousel: the active slide is centered, nearby
   previous/next slides stay visible, and navigation wraps from the last slide
   back to the first without exposing an empty edge. The carousel has a
   browser-local color/mono tone toggle for slide imagery and a motion toggle:
   `Fade` keeps the soft whole-window appearance, while `Focus` animates the
   central card shrinking into a neighbor slot as the incoming neighbor grows
   into the center.
   Hovering an actual slide card temporarily pauses autoplay and freezes the
   progress bar at the current point; moving into the gap between cards or
   leaving the card resumes from the remaining time instead of restarting or
   letting the bar finish while the slide is held.
   The debug panel also controls the number of visible carousel cards and the
   non-negative gap between them; the card count is capped by the number of
   available active slides, and card widths are recalculated from that count so
   a wider carousel window does not require overlapping cards.
5. Visitor selects a slide, filters by category, searches products, or opens a
   product card.
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
  Text, Grid, carousel transform, carousel visible-card count and gap, catalog
  panel transform, info/about transform, selected hero layout, slide color/mono
  tone, carousel motion mode, Text contour-glint motion on/off mode, Grid
  motion on/off mode, and the drag-reordered debug menu section order are
  previewed immediately. They become durable when the debug panel writes a named
  preset through the local backend. `public/visual-settings/index.json` stores
  the active preset and preset list; each preset lives as
  `public/visual-settings/<preset-id>.json`. `public/visual-settings.json`
  remains a backward-compatible default fallback only. The preset folder is the
  source of truth for git commits and FTP uploads.
