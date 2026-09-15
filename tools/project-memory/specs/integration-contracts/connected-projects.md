# Connected Projects

This register lists external projects, repositories, services, libraries, docs
sites, upstream tools, cloned examples, and sibling workspaces that this project
depends on, researches, vendors, or regularly interacts with.

Agents should read this file before touching integrations, nested repositories,
cloned examples, external project folders, or cross-project service contracts.
Do not treat an entry here as permission to inspect arbitrary files; follow the
project scope, privacy rules, and explicit user request.

## Entry Template

### Hipershield — визуальный референс TEIKO

- Назначение: источник композиции и поведения анимаций для редизайна от 15.09.2026.
- URL: https://hipershield.ru/.
- Роль: исследовательский референс; приложение не зависит от его API или ассетов.
- Владелец контента: Hipershield. Логотипы, видео, тексты и код не копируются.
- Карта адаптации: `docs/hipershield-redesign.md`.
- Сайт изучен по явному запросу пользователя; доступ только к публичным страницам.

### Pexels — исходная съёмка для фона

- Роль: видеосъёмка мойки автомобиля для первого экрана.
- Источник и лицензия: `docs/hero-media.md`.
- Локальные файлы: `public/assets/cinematic/`; исключены из Git, входят в артефакт сайта.
- Приложение воспроизводит локальный MP4; runtime-зависимости от API Pexels нет.

## Шаблон новой записи

### Project Name

- Purpose:
- Business or architectural role:
- Local folder:
- Canonical Git/package/docs URLs:
- Service ID or runtime endpoints:
- Owner or source of truth:
- Data/API contract:
- Setup, sync, build, test, or update commands:
- Version, branch, or update cadence:
- Privacy, secret, license, and access boundaries:
- Status and caveats:
- Reason this dependency still exists:
