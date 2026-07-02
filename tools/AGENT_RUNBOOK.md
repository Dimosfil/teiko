# Agent Runbook

Every command should be copy-pasteable from the project root.

## Install

```powershell
npm install
```

## Run

```powershell
npm start
```

## Test

```powershell
npm run check
```

## Build

```powershell
docker compose build
```

## Smoke Check

```powershell
npm start
npm run check
```

Expected result:

```text
Health and storefront API checks pass; public site is available at http://localhost:3000 and admin at http://localhost:3000/test-admin-teiko.
```

## Logs

```powershell
docker compose logs -f teiko
```

## Environment Notes

- `ADMIN_PASSWORD`: admin panel password, default `admin123` for local MVP.
- `ADMIN_PATH`: admin panel path, default `/test-admin-teiko`. Do not link it
  from the public storefront.
- `DATA_DIR`: SQLite database directory, default `data`.
- Seed product images are stored in `public/uploads/`.
- `UPLOAD_DIR`: admin upload directory. Defaults to `public/uploads` locally and
  is set to `/app/data/uploads` in Docker.
