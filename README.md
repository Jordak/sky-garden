# Sky Garden (Working Title)

Sky Garden is an offline desktop-browser prototype for a cozy **side-on pixel-art rooftop observatory** built around citizen-science guardrails for [Galaxy Zoo](https://www.zooniverse.org/projects/zookeeper/galaxy-zoo/). Players walk across a cutaway glasshouse observatory beneath their live night sky, sit at a Blink Comparator CRT terminal to practice classifying real astronomical cutouts, flip through an Illuminated Star Atlas, and step up to a brass telescope to compose Northern and Southern skies.

> **Prototype Status:** This build uses a local demo bundle of eight open-licensed astronomical cutouts (`CC BY 4.0`). It requires no account, makes no network requests during play, and submits no live classifications to Galaxy Zoo or Zooniverse.

## Live Browser Demo

Play the hosted demo directly in any desktop browser with no download required: **[https://jordak.github.io/sky-garden/](https://jordak.github.io/sky-garden/)** (automatically built and deployed from `main` via GitHub Actions).

## Scientific Integrity Guardrails

- **Ungated Optical Inspection:** Hardware switches (`Invert`, `Contrast`, `2× Core`, `Arcmin Scale`) are unlocked from second zero and never sold or gated behind rewards.
- **Zero Accuracy or Speed Pressure:** Each unique subject awards a flat, answer-agnostic `+3 ✦ Stardust` once upon completion with zero streak multipliers, countdowns, or speed bonuses.
- **Immutable Scientific Source & Verified Coordinates:** Cutout pixels and verified `ICRS (J2000)` metadata live strictly on immutable `SourceGalaxy` records (`withheld`/`unverified` coordinates stay omitted rather than fabricated), completely separate from decorative sky placements (`PlacedGalaxy`).
- **Clear Offline Practice Boundary:** Every classification action is explicitly labeled offline practice so volunteers never mistake sandbox interactions for live Galaxy Zoo consensus votes.
- **Zooniverse AI Ethics Alignment:** Includes an in-app `[i] ETHICS & DATA` charter aligned with the [Zooniverse AI Ethics Framework](https://www.zooniverse.org/about/ai-ethics), surfacing explicit workflow ML/*Zoobot* disclosure tags (`OFFLINE CALIBRATION · NO ML IN LOOP`), local data export/wipe controls, and direct links to survey provenance and Galaxy Zoo Talk.

## Two Switchable Demo Profiles

Toggle between profiles anytime in the top-left bar (`PROGRESSION` vs. `SANDBOX`); each saves independently in browser `localStorage` and also has a canonical JSON preset under `public/demos/`:

- **Progression Mode (Default — [progression-fresh.json](./public/demos/progression-fresh.json)):** Starts in an empty observatory under a starless **Clear Dark Sky** (`0` Stardust, `0` cataloged galaxies in the Star Atlas). Classifying incoming subjects at the Blink Comparator CRT unlocks each galaxy into your Star Atlas & Telescope satchel and awards a flat `+3 ✦ Stardust` once per unique subject—answer-agnostic and with zero speed bonuses, while keeping all four optical inspection tools unlocked from second zero. Spend Stardust at the Workbench and Telescope satchel to unlock cozy furnishings, nebulae, sky gradients, dome ribs, and celestial accents.
- **Sandbox Mode ([sandbox-all-unlocked.json](./public/demos/sandbox-all-unlocked.json)):** Starts with all eight galaxies, all room props, and all sky atmospheres unlocked and pre-arranged so reviewers can test sky decorating immediately.

## Quick Start

All dependencies are pinned locally in `package.json` and `package-lock.json` (nothing is installed globally).

```bash
npm install
npm run dev
```

Verification commands:

```bash
npm test          # Run Vitest unit & integration suite
npm run build     # Type-check with TypeScript and build production bundle into dist/
npm run preview   # Serve the production build locally
```

## Controls & Stations

- **Move & Hop:** `A` / `D` or `←` / `→` to walk across the observatory deck, `Space` to hop, and `E` / `Enter` / `W` (or clicking any station) to interact.
- **Blink Comparator CRT Desk (Left):** Run clearly labeled offline practice classifications on real survey cutouts with ungated hardware switches (`Invert`, `Contrast`, `2× Core`, `Arcmin Scale`), then hang the studied galaxy in your sky.
- **Illuminated Star Atlas (Center-Left):** Inspect all eight bundled `512×512` cutouts, provenance, and verified `ICRS (J2000)` coordinates on an all-sky celestial chart (or honest unavailability notices when coordinates are omitted/unverified).
- **Brass Telescope on Dais (Center):** Enter Sky-Curator mode to drag, scale, rotate, reorder, or keyboard-nudge (`Arrows`, `+/-`, `[/]`, `PageUp/PageDown`, `Del`) galaxies directly in the live sky dome overhead.
- **Dome Compass Wheel (Center-Right):** Rotate the observatory dome between independent **Northern** and **Southern** sky compositions.
- **Curator's Workbench (Right):** Toggle pixel-art room furnishings (crimson rug, sleeping ginger cat, bookshelf fern, spinning brass orrery, amber rafter lights), choose sky atmospheres and nebula veils, and export/import layout JSON.

## Hybrid Pixel-Art + Survey Cutout Renderer

Sky Garden layers two purpose-built renderers inside a `16:9` viewport:

1. **Foreground Cutaway Observatory (`src/components/ObservatoryCutawayCanvas.tsx`):** A palette-locked `320×180` HTML5 `<canvas>` (`imageSmoothingEnabled = false`, `image-rendering: pixelated`) with transparent glasshouse dome panes, integer-grid ASCII-compiled pixel sprites (`src/pixel/pixelSprites.ts`), and a crisp proportional `4×5`/`5×5` pixel bitmap font (`src/pixel/pixelFont.ts`).
2. **Panoramic Sky Backdrop (`src/components/ObservatoryStage.tsx`):** Normalized `[0..1]` DOM/SVG sky stage behind the pixel rafters so real, unpixelated survey cutouts float naturally via non-destructive CSS `screen` blending while preserving unmodified scientific pixels in the CRT and Star Atlas viewers.

## How This Prototype Was Built (Vibe-Coded)

This prototype was vibe-coded in collaboration with an AI coding agent to rapidly explore a design question before writing any live backend integration: *does curating a personal night sky above a cozy pixel-art observatory feel rewarding enough to support real Galaxy Zoo classifications without compromising data quality?* Every mechanic, visual iteration, and citizen-science guardrail above—ungated optical inspection switches, flat answer-agnostic rewards, and strict separation between immutable survey data and decorative sky placement—was directed and reviewed by a human, backed by automated tests in `src/test/skyGarden.test.tsx`.

## Licensing & Asset Provenance

Application source code and original pixel-art / inline SVG scenery are licensed under the [MIT License](./LICENSE). All eight astronomical survey cutouts in `public/assets/galaxies/` are open-licensed (`CC BY 4.0`) scientific images from the DESI Legacy Imaging Surveys and Sloan Digital Sky Survey; see [PROVENANCE.md](./PROVENANCE.md) for per-object credits and survey acknowledgments.
