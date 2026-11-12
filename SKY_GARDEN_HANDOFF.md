# Sky Garden — project handoff

Working title; not a final name. Prepared 12 November 2026 (UTC).

## Status and purpose

This is the starting brief for a local development session. No game has been implemented, no GitHub repository has been created, and no partnership with Galaxy Zoo or Zooniverse has been arranged. Repository creation was blocked by unavailable authenticated creation access in the preparation session. The proposed repository name is `sky-garden`; its availability has not been checked.

Build a cozy game in which contributing galaxy classifications supports a personal collection and decorative rewards. Players express themselves by furnishing an observatory and composing their own sky with galaxies they have classified, nebula backgrounds, and other celestial decorations. The intended scientific contribution is to an existing Galaxy Zoo workflow on Zooniverse.

The immediate goal is smaller: make decorating the sky enjoyable before building the scientific integration or a substantial reward economy.

## Decisions from the conversation

These are the preferences to preserve when implementing and discussing changes:

- **Self-expression is the reward.** Furniture, environments, and celestial scenery are appealing unlocks.
- **Useful classification tools are available from the beginning.** Do not gate image inspection tools, filters, or other scientific capabilities behind progression. The user specifically rejected unlocking color filtering as an upgrade.
- **Decorating the sky is a central feature.** Players choose which galaxies from their classified collection to display and drag them into a pleasing arrangement.
- **Northern and southern views are desirable.** A toggle was suggested. The precise presentation remains open.
- **Decorative positions may be fictional.** Galaxies do not need to appear at their real sky coordinates in the creative view.
- **Celestial scenery can be a reward.** A nebula backdrop was an explicit example, alongside observatory furnishings.
- **Real locations remain interesting.** When reliable coordinates are available, a separate way to locate a galaxy in the real sky would be useful.

The working title, final art style, engine, economy, and precise MVP below are recommendations, not settled user decisions.

## Proposed first playable milestone

Make a small desktop-browser prototype with no login or network dependency during play. Start directly in a pleasing night-sky scene framed by a simple observatory window. Use a small bundled sample collection, clearly labeled as a demo collection rather than completed scientific work.

1. Toggle between North and South, each with an independently saved arrangement. In this prototype these are creative scenes, not simulations of visibility from a real observing location.
2. Pick a sample galaxy from a collection tray and place it in the current scene.
3. Drag, resize, rotate, reorder, and remove placed objects. Provide a simple undo mechanism and keyboard-accessible controls for basic placement changes.
4. Choose among a few sky backgrounds or nebula layers. Include one observatory frame so the scene feels like a place.
5. Select a galaxy to see its source and original image. Show real coordinates only when present and verified; otherwise say they are unavailable.
6. Save both scenes locally and restore them after a reload. Allow export/import of the layout if inexpensive; otherwise defer it explicitly.

All sample decorations should initially be available so the first playtest measures whether decorating is satisfying. A tiny simulated reward flow can follow once that experience works, clearly labeled as practice. It must never imply that a demo click contributed to research.

**First-playtest question:** Does the player enjoy arranging these objects enough to keep refining the scene and want more decorative choices?

### Acceptance criteria

- A player can place and manipulate several galaxies without reading a manual.
- Switching scenes and refreshing the page preserve both compositions independently.
- Resizing the browser does not scramble object positions; store normalized scene coordinates.
- Removing a placed galaxy does not delete it from the collection.
- Decorations never alter source images, real coordinates, or scientific records.
- The interface clearly distinguishes the imagined arrangement from real astronomical location.
- Missing metadata and failed local storage do not silently erase progress.
- The app runs locally with documented install/start commands. A production build succeeds, and the placement/save/reload flow has been exercised in a browser.

## Suggested technical approach

Use TypeScript with React and Vite as a practical starting point, subject to checking current compatible versions. Start with the simplest rendering approach that supports smooth placement and layering. Plain DOM/SVG or canvas may be sufficient; consider PixiJS or Phaser if animation and a richer scene justify them. Unity is not a decided requirement. Revisit it if the design becomes substantially three-dimensional.

Keep these concepts separate:

| Concept | Suggested contents |
| --- | --- |
| Source galaxy | Stable ID, original image reference, provenance, optional sky coordinates and their reference frame |
| Collection entry | Reference to the source galaxy; demo status or a verified contribution reference |
| Placed object | Instance ID, source/decor reference, scene, normalized position, scale, rotation, layer |
| Saved scenes | Schema version, selected scene, backgrounds, placed objects |
| Future contribution record | Project, workflow and version, subject, annotations, submission status |

Use distinct IDs for a galaxy and its decorative instances. Keep rendering transforms separate from scientific data. Start with versioned local storage; avoid a backend, accounts, multiplayer, and a complex economy in the first milestone. Record asset sources and usage terms. Generated galaxy-like art may serve as labeled decorative placeholders, never as actual research subjects.

## Scientific integration: knowns and unknowns

Zooniverse describes Custom Front Ends that use its infrastructure for authentication, subject management, and classification recording. This is a promising route to discuss with the team, not evidence that this game is authorized to submit to any existing Galaxy Zoo workflow. Its announcement invites proposals at `contact@zooniverse.org` with “Custom Front End” in the subject. No outreach has been sent. [1]

Zooniverse's frontend repository includes modular classifier components. Investigate reuse before implementing a scientific decision tree, but do not assume those components are a drop-in integration. [2]

Published Galaxy Zoo catalogs include sky coordinates for some datasets. That does not establish that the particular live workflow selected for this game exposes them. Right ascension and declination describe sky direction, not distance; actual visibility also depends on observing location and time. [3]

Before live integration, resolve:

- Which active Galaxy Zoo project and workflow would benefit, and whether its team wants this experiment.
- The supported authentication and submission path, workflow versions, subject availability, retry handling, and duplicate prevention.
- Whether a user's past classifications and their corresponding subjects can be retrieved for a collection. This has not been verified.
- Availability and permitted reuse of subject images, coordinates, and metadata, including attribution.
- How to evaluate whether rewards improve participation without reducing classification quality.

Scientific tools should follow the actual workflow and be equally available to every player. Cosmetic transformations belong in decoration mode. Do not add bonuses for particular scientific answers, rare labels, agreement with a prediction, or speed. For example, a “find five mergers” quest could bias answers. The exact reward schedule remains open.

A later submission flow should visibly distinguish pending, failed, and successfully recorded contributions. Research records and reward grants need independent duplicate handling so a network retry cannot produce extra submissions or rewards.

## Later possibilities, not first-milestone commitments

- An observatory interior with furniture, plants, books, window styles, and decorative telescopes.
- A real-sky atlas or “Locate in real sky” view using verified coordinates.
- Celestial decoration sets: nebulae, star clusters, comets, planets, or seasonal scenery.
- Screenshot export and eventually visits to other players' observatories.
- A journal where players add personal notes and arrange favorite objects into themed collections.

One promising design idea is an **exhibition**: a player curates a small composition, gives it a title, and displays it through a chosen observatory window. It creates a satisfying stopping point without ranking players by classification speed. This is an idea to test, not an agreed feature.

## Open decisions

Choose an art direction after seeing a small prototype. Decide later whether the observatory or the sky takes most of the screen; how collecting and earning decorations work; how much session structure is useful; and whether sharing matters. No monetization plan, competitive leaderboard, daily streak requirement, or final title has been selected.

## Starting the next local session

Put this file in a new project folder and open that folder in the local coding session. The following request carries the intended scope without requiring the chat history:

> Read SKY_GARDEN_HANDOFF.md. Build the proposed first playable sky-decorating milestone. Start with TypeScript and a simple browser implementation, local persistence, and clearly labeled demo assets. Preserve separate North and South compositions and original galaxy metadata. Choose an appropriate lightweight renderer and explain the choice briefly. Do not add live Zooniverse submissions yet. Make it runnable locally, verify the core editing and save/reload flow, and document the commands and remaining limitations. If authenticated GitHub creation is available, create a private repository named sky-garden, checking name availability first, and commit the brief and implementation.

## Primary sources

Checked during handoff preparation. These establish integration possibilities and data context, not a commitment by either project to this game.

1. Zooniverse, [A New Space for Experimentation with Zooniverse](https://blog.zooniverse.org/2026/10/01/a-new-space-for-experimentation-with-zooniverse/), 1 October 2026 — Custom Front Ends and contact route.
2. Zooniverse, [front-end-monorepo](https://github.com/zooniverse/front-end-monorepo) — modular classifier implementation; inspect package documentation before choosing reuse.
3. Galaxy Zoo, [published data releases](https://static.zooniverse.org/data.galaxyzoo.org/) — catalogs, image resources, and coordinate examples; not a guarantee about live subject metadata.
