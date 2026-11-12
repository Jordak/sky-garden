import {
  CELESTIAL_DECOR_ITEMS,
  createInitialProgressionState,
  createInitialSandboxState,
  DEFAULT_ROOM_PROPS,
  DEMO_COLLECTION_ENTRIES,
  NEBULA_LAYERS,
  ROOM_PROPS,
  SKY_BACKGROUNDS,
  SOURCE_GALAXIES,
  STARTER_BACKGROUND_ID,
  STARTER_FRAME_ID,
  STARTER_NEBULA_ID,
  WINDOW_FRAMES,
} from '../data/demoCatalog';
import type {
  DemoMode,
  PlacedObject,
  PlacedObjectKind,
  PracticeObservation,
  RoomPropId,
  SavedScenesState,
  SceneComposition,
  SceneHemisphere,
} from '../types/skyGarden';

export const ACTIVE_DEMO_MODE_KEY = 'sky-garden.active-mode.v1';
export const PROGRESSION_STORAGE_KEY = 'sky-garden.progression.v1';
export const PROGRESSION_CORRUPT_BACKUP_KEY = 'sky-garden.progression.corrupt-backup';
export const STORAGE_KEY = 'sky-garden.scenes.v1';
export const CORRUPT_BACKUP_KEY = 'sky-garden.scenes.corrupt-backup';

export const MIN_COORD_X = 0.09;
export const MAX_COORD_X = 0.91;
export const MIN_COORD_Y = 0.1;
export const MAX_COORD_Y = 0.66;
export const MIN_SCALE = 0.35;
export const MAX_SCALE = 2.4;

const VALID_BACKGROUNDS = new Set(SKY_BACKGROUNDS.map((b) => b.id));
const VALID_NEBULAE = new Set(NEBULA_LAYERS.map((n) => n.id));
const VALID_FRAMES = new Set(WINDOW_FRAMES.map((f) => f.id));
const VALID_GALAXY_ENTRIES = new Set(DEMO_COLLECTION_ENTRIES.map((c) => c.entryId));
const VALID_DECOR_IDS = new Set(CELESTIAL_DECOR_ITEMS.map((d) => d.decorId));
const VALID_ROOM_PROPS = new Set<string>(ROOM_PROPS.map((p) => p.id));
const VALID_SOURCE_IDS = new Set(SOURCE_GALAXIES.map((g) => g.id));

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

export function clampCoordX(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(MAX_COORD_X, Math.max(MIN_COORD_X, Math.round(value * 10000) / 10000));
}

export function clampCoordY(value: number): number {
  if (!Number.isFinite(value)) return 0.36;
  return Math.min(MAX_COORD_Y, Math.max(MIN_COORD_Y, Math.round(value * 10000) / 10000));
}

export function clampScale(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(value * 1000) / 1000));
}

export function normalizeRotation(deg: number): number {
  if (!Number.isFinite(deg)) return 0;
  let wrapped = (((deg + 180) % 360) + 360) % 360 - 180;
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
      x: clampCoordX(typeof item.x === 'number' ? item.x : 0.5),
      y: clampCoordY(typeof item.y === 'number' ? item.y : 0.36),
      scale: clampScale(typeof item.scale === 'number' ? item.scale : 1),
      rotationDeg: normalizeRotation(typeof item.rotationDeg === 'number' ? item.rotationDeg : 0),
      layer:
        typeof item.layer === 'number' && Number.isFinite(item.layer)
          ? item.layer
          : sanitized.length,
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

function sanitizeRoomProps(raw: unknown): RoomPropId[] {
  if (!Array.isArray(raw)) return [...DEFAULT_ROOM_PROPS];
  const valid = raw.filter(
    (item): item is RoomPropId => typeof item === 'string' && VALID_ROOM_PROPS.has(item),
  );
  return Array.from(new Set(valid));
}

function sanitizePracticeLog(raw: unknown): PracticeObservation[] {
  if (!Array.isArray(raw)) return [];
  const list: PracticeObservation[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    if (typeof item.sourceGalaxyId !== 'string' || !VALID_SOURCE_IDS.has(item.sourceGalaxyId)) {
      continue;
    }
    list.push({
      sourceGalaxyId: item.sourceGalaxyId,
      primaryMorphology:
        typeof item.primaryMorphology === 'string' ? item.primaryMorphology : 'Observed',
      detailChoice: typeof item.detailChoice === 'string' ? item.detailChoice : '',
      oddityNote: typeof item.oddityNote === 'string' ? item.oddityNote : 'None',
      observedAtIso:
        typeof item.observedAtIso === 'string' ? item.observedAtIso : new Date().toISOString(),
    });
  }
  return list;
}

function sanitizeIdList(
  raw: unknown,
  validSet: ReadonlySet<string>,
  requiredIds: readonly string[] = [],
): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const id of requiredIds) {
    if (validSet.has(id) && !seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === 'string' && validSet.has(item) && !seen.has(item)) {
        seen.add(item);
        result.push(item);
      }
    }
  }
  return result;
}

function getStorageKeysForMode(mode: DemoMode): { storageKey: string; backupKey: string } {
  if (mode === 'progression') {
    return {
      storageKey: PROGRESSION_STORAGE_KEY,
      backupKey: PROGRESSION_CORRUPT_BACKUP_KEY,
    };
  }
  return {
    storageKey: STORAGE_KEY,
    backupKey: CORRUPT_BACKUP_KEY,
  };
}

export function loadActiveDemoMode(storage?: Pick<Storage, 'getItem'>): DemoMode {
  const targetStorage =
    storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!targetStorage) return 'progression';
  try {
    return targetStorage.getItem(ACTIVE_DEMO_MODE_KEY) === 'sandbox' ? 'sandbox' : 'progression';
  } catch {
    return 'progression';
  }
}

export function saveActiveDemoMode(
  mode: DemoMode,
  storage?: Pick<Storage, 'setItem'>,
): void {
  const targetStorage =
    storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!targetStorage) return;
  try {
    targetStorage.setItem(ACTIVE_DEMO_MODE_KEY, mode);
  } catch {
    // Ignore storage mode persistence failures
  }
}

export function validateAndSanitizeScenesState(
  parsed: unknown,
  fallbackMode: DemoMode = 'sandbox',
):
  | { readonly state: SavedScenesState; readonly warnings: readonly string[] }
  | { readonly error: string } {
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

  const demoMode: DemoMode =
    parsed.demoMode === 'progression'
      ? 'progression'
      : parsed.demoMode === 'sandbox'
        ? 'sandbox'
        : fallbackMode;

  const fallback =
    demoMode === 'progression' ? createInitialProgressionState() : createInitialSandboxState();
  const warnings: string[] = [];

  const selectedScene: SceneHemisphere =
    parsed.selectedScene === 'south' || parsed.selectedScene === 'north'
      ? parsed.selectedScene
      : 'north';

  const stardust =
    demoMode === 'progression' &&
    typeof parsed.stardust === 'number' &&
    Number.isFinite(parsed.stardust)
      ? Math.max(0, Math.min(9999, Math.floor(parsed.stardust)))
      : 0;

  const unlockedCollectionEntryIds =
    demoMode === 'sandbox'
      ? [...fallback.unlockedCollectionEntryIds]
      : sanitizeIdList(parsed.unlockedCollectionEntryIds, VALID_GALAXY_ENTRIES);
  const unlockedDecorIds =
    demoMode === 'sandbox'
      ? [...fallback.unlockedDecorIds]
      : sanitizeIdList(parsed.unlockedDecorIds, VALID_DECOR_IDS);
  const unlockedRoomProps =
    demoMode === 'sandbox'
      ? ([...fallback.unlockedRoomProps] as RoomPropId[])
      : (sanitizeIdList(parsed.unlockedRoomProps, VALID_ROOM_PROPS) as RoomPropId[]);
  const unlockedBackgroundIds =
    demoMode === 'sandbox'
      ? [...fallback.unlockedBackgroundIds]
      : sanitizeIdList(parsed.unlockedBackgroundIds, VALID_BACKGROUNDS, [STARTER_BACKGROUND_ID]);
  const unlockedNebulaIds =
    demoMode === 'sandbox'
      ? [...fallback.unlockedNebulaIds]
      : sanitizeIdList(parsed.unlockedNebulaIds, VALID_NEBULAE, [STARTER_NEBULA_ID]);
  const unlockedFrameIds =
    demoMode === 'sandbox'
      ? [...fallback.unlockedFrameIds]
      : sanitizeIdList(parsed.unlockedFrameIds, VALID_FRAMES, [STARTER_FRAME_ID]);

  const unlockedRoomPropSet = new Set<RoomPropId>(unlockedRoomProps);
  const rawRoomProps = sanitizeRoomProps(parsed.activeRoomProps);
  const activeRoomProps =
    demoMode === 'sandbox'
      ? rawRoomProps
      : rawRoomProps.filter((propId) => unlockedRoomPropSet.has(propId));

  let north = sanitizeScene(parsed.scenes.north, 'north', fallback.scenes.north, warnings);
  let south = sanitizeScene(parsed.scenes.south, 'south', fallback.scenes.south, warnings);

  if (demoMode === 'progression') {
    const unlockedEntrySet = new Set(unlockedCollectionEntryIds);
    const unlockedDecorSet = new Set(unlockedDecorIds);
    const unlockedBgSet = new Set(unlockedBackgroundIds);
    const unlockedNebSet = new Set(unlockedNebulaIds);
    const unlockedFrameSet = new Set(unlockedFrameIds);

    const clampSceneToUnlocked = (sc: SceneComposition): SceneComposition => ({
      ...sc,
      backgroundId: unlockedBgSet.has(sc.backgroundId) ? sc.backgroundId : STARTER_BACKGROUND_ID,
      nebulaLayerId: unlockedNebSet.has(sc.nebulaLayerId) ? sc.nebulaLayerId : STARTER_NEBULA_ID,
      windowFrameId: unlockedFrameSet.has(sc.windowFrameId) ? sc.windowFrameId : STARTER_FRAME_ID,
      objects: normalizeLayerOrder(
        sc.objects.filter((obj) =>
          obj.kind === 'galaxy' ? unlockedEntrySet.has(obj.refId) : unlockedDecorSet.has(obj.refId),
        ),
      ),
    });

    north = clampSceneToUnlocked(north);
    south = clampSceneToUnlocked(south);
  }

  return {
    state: {
      schemaVersion: 1,
      demoMode,
      stardust,
      unlockedCollectionEntryIds,
      unlockedDecorIds,
      unlockedRoomProps,
      unlockedBackgroundIds,
      unlockedNebulaIds,
      unlockedFrameIds,
      selectedScene,
      updatedAtIso:
        typeof parsed.updatedAtIso === 'string' ? parsed.updatedAtIso : new Date().toISOString(),
      activeRoomProps,
      practiceLog: sanitizePracticeLog(parsed.practiceLog),
      scenes: { north, south },
    },
    warnings,
  };
}

export function loadScenesFromStorage(
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
  mode: DemoMode = 'sandbox',
): LoadScenesResult {
  const targetStorage =
    storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  const fallbackState =
    mode === 'progression' ? createInitialProgressionState() : createInitialSandboxState();

  if (!targetStorage) {
    return {
      state: fallbackState,
      storageAvailable: false,
      warning: 'Browser localStorage is unavailable; changes will live in memory until exported.',
      hadSavedData: false,
    };
  }

  const { storageKey, backupKey } = getStorageKeysForMode(mode);

  let raw: string | null = null;
  try {
    raw = targetStorage.getItem(storageKey);
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'access denied';
    return {
      state: fallbackState,
      storageAvailable: false,
      warning: `Could not read localStorage (${detail}). Working in memory—use Export JSON to save your sky.`,
      hadSavedData: false,
    };
  }

  if (raw === null) {
    return {
      state: fallbackState,
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
      targetStorage.setItem(backupKey, raw);
    } catch {
      // Ignore secondary backup failure.
    }
    return {
      state: fallbackState,
      storageAvailable: true,
      warning:
        'Previously saved local data could not be parsed. A backup copy was preserved and starter scenes were loaded in memory.',
      hadSavedData: false,
    };
  }

  const result = validateAndSanitizeScenesState(parsed, mode);
  if ('error' in result) {
    try {
      targetStorage.setItem(backupKey, raw);
    } catch {
      // Ignore backup write error.
    }
    return {
      state: fallbackState,
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

  const { storageKey } = getStorageKeysForMode(state.demoMode);

  try {
    targetStorage.setItem(storageKey, JSON.stringify(state));
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
):
  | { readonly state: SavedScenesState; readonly warning: string | null }
  | { readonly error: string } {
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
