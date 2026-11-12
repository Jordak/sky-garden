# Sky Garden (Working Title)

Sky Garden is an offline desktop-browser prototype exploring a cozy personal observatory built around citizen-science guardrails for [Galaxy Zoo](https://www.zooniverse.org/projects/zookeeper/galaxy-zoo/). Milestone 1 tests a foundational design question before any live Zooniverse integration or reward economy is built: **is composing a framed night sky out of real astronomical galaxy cutouts intrinsically enjoyable?**

> **Prototype Status:** This build uses a clearly labeled local demo bundle of eight open-licensed astronomical cutouts (`CC BY 4.0`). It requires no account, makes no network requests during play, and submits no classifications to Galaxy Zoo or Zooniverse.

## Quick Start

All dependencies are pinned locally in `package.json` and `package-lock.json` (nothing is installed globally).

```bash
npm install
npm run dev
```

Additional verification commands:

```bash
npm test          # Run Vitest unit & integration suite
npm run build     # Type-check with TypeScript and build production bundle into dist/
npm run preview   # Serve the production build locally
```

## Renderer Choice

Milestone 1 uses a **layered DOM + inline SVG stage** (`src/components/ObservatoryStage.tsx`) rather than an imperative WebGL/Canvas engine such as PixiJS or Phaser:

- **Resolution-independent normalized coordinates:** Object centers are stored as normalized `[0..1]` fractions of the `16:10` observatory aperture, while visual diameters scale proportionally to live stage width via `ResizeObserver`. Resizing the browser window preserves overlaps, spacing, and mullion framing without coordinate drift.
- **Non-destructive optical blending:** Placed galaxy cutouts render with `mix-blend-mode: screen` and a soft radial CSS mask so dark sky backgrounds in real survey stamps melt seamlessly into starfields and nebula veils, while the underlying JPEG files and the Subject Inspector view remain untouched.
- **Native keyboard & assistive accessibility:** Every placed galaxy or celestial accent is a focusable DOM control supporting keyboard nudging (`Arrows`, `Shift+Arrows`), scaling (`+`/`-`), rotation (`[`/`]`), layer ordering (`PageUp`/`PageDown`), removal (`Delete`), and session `Undo`/`Redo` (`Cmd/Ctrl+Z`, `Shift+Cmd/Ctrl+Z`).
- **Low complexity:** For scenes of ~5–50 celestial objects, GPU-composited CSS transforms and SVG filters stay crisp at 60 fps without pulling in a heavy game-engine runtime. PixiJS remains an easy future swap if particle systems or hundreds of animated objects become desirable.

## Architecture & Scientific Guardrails

Domain models in `src/types/skyGarden.ts` keep creative state strictly separated from scientific subject records:

- **`SourceGalaxy`** — Immutable survey cutout path, provenance, angular field size, and a discriminated `SkyCoordinates` union (`verified` ICRS J2000 coordinates vs. `unavailable` or `unverified`).
- **`CollectionEntry`** — Distinct entry ID linking a `SourceGalaxy` to its acquisition provenance (`demo_bundle` today; `verified_contribution` reserved for future live workflows). Removing a placed object from a window never deletes it from the collection.
- **`PlacedObject`** — Distinct `instanceId`, hemisphere (`north` or `south`), normalized `(x, y)` creative window coordinates, `scale`, `rotationDeg`, and integer `layer`.
- **`SavedScenesState`** — Versioned (`schemaVersion: 1`) persistence in `localStorage` (`sky-garden.scenes.v1`) with JSON export/import, corrupt-payload backup protection, and explicit warnings if browser storage is blocked or full.
- **Ungated Inspection Tools** — Negative-plate luminance inversion, contrast stretch, 2× nuclear core zoom, and calibrated arcminute reticles are available immediately in the Subject Inspector for every galaxy and are never gated behind progression upgrades.

## Current Limitations & Next Steps Before Live Integration

1. **No live Zooniverse connection:** No partnership or Custom Front End authorization with Zooniverse or Galaxy Zoo has been arranged yet. Outreach to `contact@zooniverse.org` (subject: `Custom Front End`) is required before connecting OAuth, subject queues, or classification submissions.
2. **Creative hemispheres, not an ephemeris planetarium:** The Northern and Southern observatory windows are independent creative compositions, not horizon simulations for a specific latitude or sidereal time. Verified real-sky locations are shown separately in the Subject Inspector's all-sky `ICRS (J2000)` projection.
3. **Desktop-first ergonomics:** Pointer capture and responsive layout work across desktop/laptop viewports, while multi-touch pinch-zoom gestures on phones are out of scope for Milestone 1.

See [SKY_GARDEN_HANDOFF.md](./SKY_GARDEN_HANDOFF.md) for the project brief and [PROVENANCE.md](./PROVENANCE.md) for full survey attributions.
