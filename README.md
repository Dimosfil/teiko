# TEIKO Showcase

TEIKO Showcase is a full-stack storefront for car-care products. It combines a
brand landing page and a catalog, while checkout happens on external
marketplaces such as Ozon, Wildberries, or Yandex Market.

## Features

- Public storefront with hero slides, brand text, product filters, product
  details, and marketplace links.
- Admin panel at `/test-admin-teiko` for changing header text, hero/about copy,
  slides, product cards, product photos, descriptions, specs, and marketplace
  links. The public site does not link to this path.
- SQLite database stored as `data/teiko.sqlite`.
- Seed product images stored under `public/uploads/`; admin uploads use
  `public/uploads/` locally and `/app/data/uploads/` in Docker.
- Docker Compose setup with persistent volumes.

## Local Run

```powershell
npm install
npm start
```

Open:

- Site: `http://localhost:3000`
- Admin: `http://localhost:3000/test-admin-teiko`
- Default admin password: `admin123`

Set another password before launch:

```powershell
$env:ADMIN_PASSWORD = "change-me"
$env:ADMIN_PATH = "/test-admin-teiko"
npm start
```

## Docker

```powershell
docker compose up --build
```

To override the admin password:

```powershell
$env:ADMIN_PASSWORD = "change-me"
$env:ADMIN_PATH = "/test-admin-teiko"
docker compose up --build
```

## Checks

With the app running:

```powershell
npm run check
```
