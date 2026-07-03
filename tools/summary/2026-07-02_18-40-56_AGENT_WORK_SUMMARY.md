# TEIKO Hero And Storefront Handoff Summary

Scope: this summary covers the TEIKO storefront work that started with the user request: "вот эти полоски от карусели вынеси за слайды что бы не перекрывали". It intentionally excludes MultiSnap installer work and other non-TEIKO changes.

## User Intent

- The user is tuning the public TEIKO storefront hero area by screenshots and wants fast visual iteration directly on the page.
- The carousel indicators must not cover slide images.
- Poster-style hero slides should span the viewport horizontally and avoid pale side panels around product images.
- The fixed green molecular background should resemble the TEIKO reference composition: large TEIKO mark, molecular network underneath/behind it, green and monochrome variants.
- Latest request split the hero background into two independently adjustable layers: text/logo and molecule grid, with on-page debug sliders for color and transform.

## Implemented Storefront Changes

### Carousel controls and slide area

- `public/index.html` now wraps the carousel slides in `.hero-viewport` and places `.hero-dots` plus `.hero-progress` in `.hero-carousel-footer`.
- `public/styles.css` makes `.hero-viewport` handle slide clipping, while footer controls sit below the slide instead of overlaying the image.
- The carousel was expanded to full viewport width using `width: 100vw` and `margin-left: calc(50% - 50vw)`.
- Poster slides use transparent styling via `.hero-card.is-poster`, removing the previous pale card background, border, shadow, and blur around uploaded poster images.

### Fixed hero background composition

- The hero background moved from a section background to fixed decorative layers so it stays with the viewport during page scroll.
- `public/index.html` includes:
  - `.hero-background-plane` for the base background.
  - `.hero-background-logo` for the TEIKO mark.
  - `.molecule-field` SVG for the molecular grid.
- `public/styles.css` positions the logo and molecule network independently with CSS variables and keeps the carousel above them.
- The active theme class is currently `hero-theme-green`; `hero-theme-mono` exists for the monochrome variant.

### Debug controls for visual tuning

- A fixed `.hero-debug-panel` was added inside the hero section.
- It exposes direct controls for the text/logo layer:
  - Color.
  - Outline color.
  - Opacity.
  - Scale.
  - X and Y position.
- It exposes direct controls for the molecule layer:
  - Rings color.
  - Links color.
  - Opacity.
  - Scale.
  - X and Y position.
- `public/app.js` adds `debugPresets`, `setDebugControl`, `applyDebugPreset`, and `bindHeroDebug`.
- Presets currently available in the panel: `Green` and `Mono`.

## Assets

- Created `public/assets/logo-teiko-mask.png`, a cropped transparent TEIKO logo mask derived from the existing `public/assets/logo.jpg`.
- Earlier temporary generated logo variants were removed; the current CSS recolors the single mask via `background` and CSS variables.

## Verification Evidence

- `npm run check` passed after the hero/debug changes.
- `node --check .\public\app.js` passed.
- `git diff --check -- .\public\index.html .\public\styles.css .\public\app.js` passed.
- A local TEIKO server was already responding at `http://localhost:3000`.

## Repository State Notes

- TEIKO has uncommitted changes in:
  - `public/app.js`
  - `public/index.html`
  - `public/styles.css`
  - `public/assets/logo-teiko-mask.png`
- `resources/logo-back.jpg` also appears modified in `git status`; this summary does not attribute that change to the latest hero/debug edits.
- MultiSnap was checked only to confirm TEIKO work did not get moved there. No TEIKO cleanup was performed in MultiSnap.

## Next Useful Context

- The user likely wants to adjust the live hero composition by moving sliders, then hard-code the chosen values into CSS defaults.
- If the debug panel should not ship publicly, later remove or gate `.hero-debug-panel` and keep only the final CSS variable values.
- If the monochrome variant should become active, switch the hero section class from `hero-theme-green` to `hero-theme-mono` and align the initial debug input values with that preset.
