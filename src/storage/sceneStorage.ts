import {
  CELESTIAL_DECOR_ITEMS,
  createInitialScenesState,
  DEMO_COLLECTION_ENTRIES,
  NEBULA_LAYERS,
  SKY_BACKGROUNDS,
  WINDOW_FRAMES,
} from '../data/demoCatalog';
import type {
  PlacedObject,
  PlacedObjectKind,
  SavedScenesState,
  SceneComposition,
  SceneHemisphere,
} from '../types/skyGarden';

export const STORAGE_KEY = 'sky-garden.scenes.v1';
export const CORRUPT_BACKUP_KEY = 'sky-garden.scenes.corrupt-backup';

export const MIN_COORD = 0.06;
export const MAX_COORD = 0.94;
export const MIN_SCALE = 0.35;
export const MAX_SCALE = 2.4;

const VALID_BACKGROUNDS = new Set(SKY_BACKGROUNDS.map((b) => b.id));
const VALID_NEBULAE = new Set(NEBULA_LAYERS.map((n) => n.id));
const VALID_FRAMES = new Set(WINDOW_FRAMES.map((f) => f.id));
const VALID_GALAXY_ENTRIES = new Set(DEMO_COLLECTION_ENTRIES.map((c) => c.entryId));
const VALID_DECOR_IDS = new Set(CELESTIAL_DECOR_ITEMS.map((d) => d.decorId));

export interface LoadScenesResult {
  readonly state: SavedScenesState;
  readonly storageAvailable: boolean;
  readonly warning: string | null;
  readonly hadSavedData: boolean;
}

export interface SaveScenesResult {
  readonly ok: boolean;
  readonly warning: string | null;
}

export function clampCoord(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(MAX_COORD, Math.max(MIN_COORD, Math.round(value * 10000) / 10000));
}

export function clampScale(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(value * 1000) / 1000));
}

export function normalizeRotation(deg: number): number {
  if (!Number.isFinite(deg)) return 0;
  let wrapped = ((deg + 180) % 360 + 360) % 360 - 180;
  if (Object.is(wrapped, -0)) wrapped = 0;
  return Math.round(wrapped * 10) / 10;
}

export function normalizeLayerOrder(objects: readonly PlacedObject[]): PlacedObject[] {
  return [...objects]
    .sort((a, b) => a.layer - b.layer || a.instanceId.localeCompare(b.instanceId))
    .map((obj, idx) => ({ ...obj, layer: idx }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizePlacedObjects(
  rawObjects: unknown,
  hemisphere: SceneHemisphere,
  warnings: string[],
): PlacedObject[] {
  if (!Array.isArray(rawObjects)) {
    warnings.push(`Scene "${hemisphere}" object list was missing or invalid; reset to empty.`);
    return [];
  }

  const seenIds = new Set<string>();
  const sanitized: PlacedObject[] = [];

  for (const item of rawObjects) {
    if (!isRecord(item)) {
      warnings.push(`Skipped malformed placed object in ${hemisphere} scene.`);
      continue;
    }

    const kind = item.kind as PlacedObjectKind;
    const refId = typeof item.refId === 'string' ? item.refId : '';
    if (kind === 'galaxy' && !VALID_GALAXY_ENTRIES.has(refId)) {
      warnings.push(`Skipped unknown galaxy reference "${refId}" in ${hemisphere} scene.`);
      continue;
    }
    if (kind === 'celestial_decor' && !VALID_DECOR_IDS.has(refId)) {
      warnings.push(`Skipped unknown celestial decoration "${refId}" in ${hemisphere} scene.`);
      continue;
    }
    if (kind !== 'galaxy' && kind !== 'celestial_decor') {
      warnings.push(`Skipped unrecognized object kind in ${hemisphere} scene.`);
      continue;
    }

    let instanceId =
      typeof item.instanceId === 'string' && item.instanceId.trim().length > 0
        ? item.instanceId.trim()
        : `restored-${hemisphere}-${sanitized.length + 1}`;
    if (seenIds.has(instanceId)) {
      instanceId = `${instanceId}-${sanitized.length + 1}`;
    }
    seenIds.add(instanceId);

    sanitized.push({
      instanceId,
      kind,
      refId,
      scene: hemisphere,
      x: clampCoord(typeof item.x === 'number' ? item.x : 0.5),
      y: clampCoord(typeof item.y === 'number' ? item.y : 0.5),
      scale: clampScale(typeof item.scale === 'number' ? item.scale : 1),
      rotationDeg: normalizeRotation(typeof item.rotationDeg === 'number' ? item.rotationDeg : 0),
      layer: typeof item.layer === 'number' && Number.isFinite(item.layer) ? item.layer : sanitized.length,
    });
  }

  return normalizeLayerOrder(sanitized);
}

function sanitizeScene(
  rawScene: unknown,
  hemisphere: SceneHemisphere,
  fallback: SceneComposition,
  warnings: string[],
): SceneComposition {
  if (!isRecord(rawScene)) {
    warnings.push(`Missing "${hemisphere}" scene record; restored default ${hemisphere} composition.`);
    return fallback;
  }

  const backgroundId =
    typeof rawScene.backgroundId === 'string' && VALID_BACKGROUNDS.has(rawScene.backgroundId)
      ? rawScene.backgroundId
      : fallback.backgroundId;
  if (rawScene.backgroundId !== undefined && rawScene.backgroundId !== backgroundId) {
    warnings.push(`Unknown sky backdrop in ${hemisphere} scene; fell back to default backdrop.`);
  }

  const nebulaLayerId =
    typeof rawScene.nebulaLayerId === 'string' && VALID_NEBULAE.has(rawScene.nebulaLayerId)
      ? rawScene.nebulaLayerId
      : fallback.nebulaLayerId;

  const windowFrameId =
    typeof rawScene.windowFrameId === 'string' && VALID_FRAMES.has(rawScene.windowFrameId)
      ? rawScene.windowFrameId
      : fallback.windowFrameId;

  const exhibitionTitle =
    typeof rawScene.exhibitionTitle === 'string'
      ? rawScene.exhibitionTitle.slice(0, 80)
      : fallback.exhibitionTitle;

  return {
    hemisphere,
    exhibitionTitle,
    backgroundId,
    nebulaLayerId,
    windowFrameId,
    objects: sanitizePlacedObjects(rawScene.objects, hemisphere, warnings),
  };
}

export function validateAndSanitizeScenesState(
  parsed: unknown,
): { readonly state: SavedScenesState; readonly warnings: readonly string[] } | { readonly error: string } {
  if (!isRecord(parsed)) {
    return { error: 'Saved layout root is not a JSON object.' };
  }
  if (parsed.schemaVersion !== 1) {
    return {
      error: `Unsupported layout schemaVersion "${String(parsed.schemaVersion)}" (expected 1).`,
    };
  }
  if (!isRecord(parsed.scenes)) {
    return { error: 'Saved layout is missing its "scenes" container.' };
  }

  const fallback = createInitialScenesState();
  const warnings: string[] = [];

  const selectedScene: SceneHemisphere =
    parsed.selectedScene === 'south' || parsed.selectedScene === 'north'
      ? parsed.selectedScene
      : 'north';

  const north = sanitizeScene(parsed.scenes.north, 'north', fallback.scenes.north, warnings);
  const south = sanitizeScene(parsed.scenes.south, 'south', fallback.scenes.south, warnings);

  return {
    state: {
      schemaVersion: 1,
      selectedScene,
      updatedAtIso:
        typeof parsed.updatedAtIso === 'string' ? parsed.updatedAtIso : new Date().toISOString(),
      scenes: { north, south },
    },
    warnings,
  };
}

export function loadScenesFromStorage(storage?: Pick<Storage, 'getItem' | 'setItem'>): LoadScenesResult {
  const targetStorage =
    storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);

  if (!targetStorage) {
    return {
      state: createInitialScenesState(),
      storageAvailable: false,
      warning: 'Browser localStorage is unavailable; changes will live in memory until exported.',
      hadSavedData: false,
    };
  }

  let raw: string | null = null;
  try {
    raw = targetStorage.getItem(STORAGE_KEY);
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'access denied';
    return {
      state: createInitialScenesState(),
      storageAvailable: false,
      warning: `Could not read localStorage (${detail}). Working in memory—use Export JSON to save your sky.`,
      hadSavedData: false,
    };
  }

  if (raw === null) {
    return {
      state: createInitialScenesState(),
      storageAvailable: true,
      warning: null,
      hadSavedData: false,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    try {
      targetStorage.setItem(CORRUPT_BACKUP_KEY, raw);
    } catch {
      // Ignore secondary backup failure; we still warn the user before touching primary key.
    }
    return {
      state: createInitialScenesState(),
      storageAvailable: true,
      warning:
        'Previously saved local data could not be parsed. A backup copy was preserved and starter scenes were loaded in memory.',
      hadSavedData: false,
    };
  }

  const result = validateAndSanitizeScenesState(parsed);
  if ('error' in result) {
    try {
      targetStorage.setItem(CORRUPT_BACKUP_KEY, raw);
    } catch {
      // Ignore backup write error.
    }
    return {
      state: createInitialScenesState(),
      storageAvailable: true,
      warning: `${result.error} Previous data was backed up rather than silently erased.`,
      hadSavedData: false,
    };
  }

  return {
    state: result.state,
    storageAvailable: true,
    warning: result.warnings.length > 0 ? result.warnings.join(' ') : null,
    hadSavedData: true,
  };
}

export function saveScenesToStorage(
  state: SavedScenesState,
  storage?: Pick<Storage, 'setItem'>,
): SaveScenesResult {
  const targetStorage =
    storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);

  if (!targetStorage) {
    return {
      ok: false,
      warning: 'Local storage is unavailable; export JSON to keep your arrangement.',
    };
  }

  try {
    targetStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return { ok: true, warning: null };
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'write failed';
    return {
      ok: false,
      warning: `Local save failed (${detail}). Your current sky is intact in memory—use Export JSON so no progress is lost.`,
    };
  }
}

export function serializeScenesToJson(state: SavedScenesState): string {
  return JSON.stringify(state, null, 2);
}

export function parseImportedScenesJson(
  rawJson: string,
): { readonly state: SavedScenesState; readonly warning: string | null } | { readonly error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return { error: 'Selected file is not valid JSON.' };
  }

  const validated = validateAndSanitizeScenesState(parsed);
  if ('error' in validated) {
    return { error: validated.error };
  }

  return {
    state: {
      ...validated.state,
      updatedAtIso: new Date().toISOString(),
    },
    warning: validated.warnings.length > 0 ? validated.warnings.join(' ') : null,
  };
}
