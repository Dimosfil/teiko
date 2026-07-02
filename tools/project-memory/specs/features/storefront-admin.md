# Storefront And Admin Feature

## Product Intent

TEIKO is a hybrid brand-card and product-showcase site. It presents car-care
products, descriptions, images, and marketplace links. Users do not buy on the
site; each product card sends them to external marketplaces such as Ozon,
Wildberries, Yandex Market, or another configured URL.

## Public Workflow

1. Visitor opens the public site.
2. Hero section shows brand copy and uses `logo-back` as the visual brand layer.
3. Visitor selects a slide, filters by category, searches products, or opens a
   product card.
4. Product details show description, price, specs, and all configured
   marketplace links.
5. Visitor clicks a marketplace link and leaves the site to complete purchase.

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
