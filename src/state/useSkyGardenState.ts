import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createInitialScenesState,
  DEMO_COLLECTION_ENTRIES,
  getSourceGalaxyForCollectionEntry,
} from '../data/demoCatalog';
import {
  clampCoord,
  clampScale,
  loadScenesFromStorage,
  normalizeLayerOrder,
  normalizeRotation,
  parseImportedScenesJson,
  saveScenesToStorage,
} from '../storage/sceneStorage';
import type {
  PlacedObject,
  PlacedObjectKind,
  SavedScenesState,
  SceneComposition,
  SceneHemisphere,
} from '../types/skyGarden';

const MAX_HISTORY = 50;

export interface ObjectTransformPatch {
  readonly x?: number;
  readonly y?: number;
  readonly scale?: number;
  readonly rotationDeg?: number;
}

function makeInstanceId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function useSkyGardenState() {
  const initialLoad = useMemo(() => loadScenesFromStorage(), []);

  const [scenesState, setScenesState] = useState<SavedScenesState>(initialLoad.state);
  const [past, setPast] = useState<SavedScenesState[]>([]);
  const [future, setFuture] = useState<SavedScenesState[]>([]);

  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(() => {
    const currentObjects = initialLoad.state.scenes[initialLoad.state.selectedScene].objects;
    const firstGalaxy = currentObjects.find((o) => o.kind === 'galaxy');
    return firstGalaxy?.instanceId ?? currentObjects[0]?.instanceId ?? null;
  });

  const [inspectedCollectionEntryId, setInspectedCollectionEntryId] = useState<string>(
    () => DEMO_COLLECTION_ENTRIES[0].entryId,
  );

  const [storageWarning, setStorageWarning] = useState<string | null>(initialLoad.warning);
  const [storageHealthy, setStorageHealthy] = useState<boolean>(initialLoad.storageAvailable);
  const scenesRef = useRef<SavedScenesState>(initialLoad.state);
  useEffect(() => {
    scenesRef.current = scenesState;
  }, [scenesState]);

  const hasUserMutatedRef = useRef<boolean>(initialLoad.hadSavedData);
  const gestureSnapshotRef = useRef<SavedScenesState | null>(null);

  const persistIfDirty = useCallback((nextState: SavedScenesState) => {
    const result = saveScenesToStorage(nextState);
    setStorageHealthy(result.ok);
    if (!result.ok && result.warning) {
      setStorageWarning(result.warning);
    }
  }, []);

  // Persist initial starter scenes only when storage is clean (never overwrite a corrupt backup before user edits)
  useEffect(() => {
    if (initialLoad.storageAvailable && !initialLoad.hadSavedData && initialLoad.warning === null) {
      const result = saveScenesToStorage(initialLoad.state);
      setStorageHealthy(result.ok);
      if (!result.ok && result.warning) {
        setStorageWarning(result.warning);
      }
    }
  }, [initialLoad]);

  const commitChange = useCallback(
    (updater: (prev: SavedScenesState) => SavedScenesState, recordHistory = true) => {
      const prev = scenesRef.current;
      const nextRaw = updater(prev);
      if (nextRaw === prev) return;
      const next: SavedScenesState = {
        ...nextRaw,
        updatedAtIso: new Date().toISOString(),
      };
      scenesRef.current = next;
      setScenesState(next);
      if (recordHistory) {
        setPast((h) => [...h.slice(-(MAX_HISTORY - 1)), prev]);
        setFuture([]);
      }
      hasUserMutatedRef.current = true;
      persistIfDirty(next);
    },
    [persistIfDirty],
  );

  const activeHemisphere = scenesState.selectedScene;
  const activeScene: SceneComposition = scenesState.scenes[activeHemisphere];

  const selectedObject = useMemo(
    () => activeScene.objects.find((o) => o.instanceId === selectedInstanceId) ?? null,
    [activeScene.objects, selectedInstanceId],
  );

  // Sync inspected galaxy whenever a placed galaxy is selected
  useEffect(() => {
    if (selectedObject && selectedObject.kind === 'galaxy') {
      setInspectedCollectionEntryId(selectedObject.refId);
    }
  }, [selectedObject]);

  const inspectedGalaxy = useMemo(
    () => getSourceGalaxyForCollectionEntry(inspectedCollectionEntryId) ?? null,
    [inspectedCollectionEntryId],
  );

  const selectHemisphere = useCallback(
    (hemisphere: SceneHemisphere) => {
      if (hemisphere === scenesState.selectedScene) return;
      const nextObjects = scenesState.scenes[hemisphere].objects;
      const nextSelected =
        nextObjects.find((o) => o.kind === 'galaxy')?.instanceId ??
        nextObjects[0]?.instanceId ??
        null;
      setSelectedInstanceId(nextSelected);
      commitChange(
        (prev) => ({
          ...prev,
          selectedScene: hemisphere,
        }),
        false,
      );
    },
    [commitChange, scenesState.scenes, scenesState.selectedScene],
  );

  const placeItem = useCallback(
    (kind: PlacedObjectKind, refId: string, preferredPos?: { x: number; y: number }) => {
      const newInstanceId = makeInstanceId(kind === 'galaxy' ? 'gal' : 'dec');
      commitChange((prev) => {
        const hemi = prev.selectedScene;
        const current = prev.scenes[hemi];
        const count = current.objects.length;
        // Gentle golden-angle spiral offset around window center when clicking "+ Place" repeatedly
        const angle = count * 2.39996;
        const radius = Math.min(0.22, 0.055 * ((count % 5) + 1));
        const defaultX = count === 0 ? 0.5 : 0.5 + Math.cos(angle) * radius;
        const defaultY = count === 0 ? 0.48 : 0.48 + Math.sin(angle) * radius * 0.85;

        const nextObj: PlacedObject = {
          instanceId: newInstanceId,
          kind,
          refId,
          scene: hemi,
          x: clampCoord(preferredPos?.x ?? defaultX),
          y: clampCoord(preferredPos?.y ?? defaultY),
          scale: 1,
          rotationDeg: 0,
          layer: current.objects.length,
        };

        return {
          ...prev,
          scenes: {
            ...prev.scenes,
            [hemi]: {
              ...current,
              objects: normalizeLayerOrder([...current.objects, nextObj]),
            },
          },
        };
      });
      setSelectedInstanceId(newInstanceId);
      if (kind === 'galaxy') {
        setInspectedCollectionEntryId(refId);
      }
    },
    [commitChange],
  );

  const beginContinuousGesture = useCallback(() => {
    gestureSnapshotRef.current = scenesRef.current;
  }, []);

  const updateObjectLive = useCallback((instanceId: string, patch: ObjectTransformPatch) => {
    const prev = scenesRef.current;
    const hemi = prev.selectedScene;
    const current = prev.scenes[hemi];
    let changed = false;
    const updated = current.objects.map((obj) => {
      if (obj.instanceId !== instanceId) return obj;
      const nextX = patch.x !== undefined ? clampCoord(patch.x) : obj.x;
      const nextY = patch.y !== undefined ? clampCoord(patch.y) : obj.y;
      const nextScale = patch.scale !== undefined ? clampScale(patch.scale) : obj.scale;
      const nextRot =
        patch.rotationDeg !== undefined ? normalizeRotation(patch.rotationDeg) : obj.rotationDeg;
      if (
        nextX === obj.x &&
        nextY === obj.y &&
        nextScale === obj.scale &&
        nextRot === obj.rotationDeg
      ) {
        return obj;
      }
      changed = true;
      return {
        ...obj,
        x: nextX,
        y: nextY,
        scale: nextScale,
        rotationDeg: nextRot,
      };
    });
    if (!changed) return;
    const next: SavedScenesState = {
      ...prev,
      scenes: {
        ...prev.scenes,
        [hemi]: {
          ...current,
          objects: updated,
        },
      },
    };
    scenesRef.current = next;
    setScenesState(next);
  }, []);

  const endContinuousGesture = useCallback(() => {
    const before = gestureSnapshotRef.current;
    gestureSnapshotRef.current = null;
    const current = scenesRef.current;
    if (!before || before === current) return;
    const stamped: SavedScenesState = {
      ...current,
      updatedAtIso: new Date().toISOString(),
    };
    scenesRef.current = stamped;
    setScenesState(stamped);
    setPast((h) => [...h.slice(-(MAX_HISTORY - 1)), before]);
    setFuture([]);
    hasUserMutatedRef.current = true;
    persistIfDirty(stamped);
  }, [persistIfDirty]);

  const patchObjectDiscrete = useCallback(
    (instanceId: string, patch: ObjectTransformPatch) => {
      commitChange((prev) => {
        const hemi = prev.selectedScene;
        const current = prev.scenes[hemi];
        let changed = false;
        const objects = current.objects.map((obj) => {
          if (obj.instanceId !== instanceId) return obj;
          const nextX = patch.x !== undefined ? clampCoord(patch.x) : obj.x;
          const nextY = patch.y !== undefined ? clampCoord(patch.y) : obj.y;
          const nextScale = patch.scale !== undefined ? clampScale(patch.scale) : obj.scale;
          const nextRot =
            patch.rotationDeg !== undefined
              ? normalizeRotation(patch.rotationDeg)
              : obj.rotationDeg;
          if (
            nextX === obj.x &&
            nextY === obj.y &&
            nextScale === obj.scale &&
            nextRot === obj.rotationDeg
          ) {
            return obj;
          }
          changed = true;
          return {
            ...obj,
            x: nextX,
            y: nextY,
            scale: nextScale,
            rotationDeg: nextRot,
          };
        });
        if (!changed) return prev;
        return {
          ...prev,
          scenes: {
            ...prev.scenes,
            [hemi]: { ...current, objects },
          },
        };
      });
    },
    [commitChange],
  );

  const reorderObjectLayer = useCallback(
    (instanceId: string, direction: 'forward' | 'backward' | 'front' | 'back') => {
      commitChange((prev) => {
        const hemi = prev.selectedScene;
        const current = prev.scenes[hemi];
        const sorted = normalizeLayerOrder(current.objects);
        const index = sorted.findIndex((o) => o.instanceId === instanceId);
        if (index === -1) return prev;

        let targetIndex = index;
        if (direction === 'forward') targetIndex = Math.min(sorted.length - 1, index + 1);
        if (direction === 'backward') targetIndex = Math.max(0, index - 1);
        if (direction === 'front') targetIndex = sorted.length - 1;
        if (direction === 'back') targetIndex = 0;
        if (targetIndex === index) return prev;

        const copy = [...sorted];
        const [moved] = copy.splice(index, 1);
        copy.splice(targetIndex, 0, moved);
        const relayered = copy.map((obj, idx) => ({ ...obj, layer: idx }));

        return {
          ...prev,
          scenes: {
            ...prev.scenes,
            [hemi]: {
              ...current,
              objects: relayered,
            },
          },
        };
      });
    },
    [commitChange],
  );

  const removePlacedObject = useCallback(
    (instanceId: string) => {
      commitChange((prev) => {
        const hemi = prev.selectedScene;
        const current = prev.scenes[hemi];
        const remaining = current.objects.filter((o) => o.instanceId !== instanceId);
        if (remaining.length === current.objects.length) return prev;
        return {
          ...prev,
          scenes: {
            ...prev.scenes,
            [hemi]: {
              ...current,
              objects: normalizeLayerOrder(remaining),
            },
          },
        };
      });
      setSelectedInstanceId((prevSelected) => (prevSelected === instanceId ? null : prevSelected));
    },
    [commitChange],
  );

  const setSceneAppearance = useCallback(
    (patch: {
      backgroundId?: string;
      nebulaLayerId?: string;
      windowFrameId?: string;
      exhibitionTitle?: string;
    }) => {
      commitChange((prev) => {
        const hemi = prev.selectedScene;
        const current = prev.scenes[hemi];
        const nextScene: SceneComposition = {
          ...current,
          backgroundId: patch.backgroundId ?? current.backgroundId,
          nebulaLayerId: patch.nebulaLayerId ?? current.nebulaLayerId,
          windowFrameId: patch.windowFrameId ?? current.windowFrameId,
          exhibitionTitle:
            patch.exhibitionTitle !== undefined ? patch.exhibitionTitle : current.exhibitionTitle,
        };
        if (
          nextScene.backgroundId === current.backgroundId &&
          nextScene.nebulaLayerId === current.nebulaLayerId &&
          nextScene.windowFrameId === current.windowFrameId &&
          nextScene.exhibitionTitle === current.exhibitionTitle
        ) {
          return prev;
        }
        return {
          ...prev,
          scenes: {
            ...prev.scenes,
            [hemi]: nextScene,
          },
        };
      });
    },
    [commitChange],
  );

  const clearCurrentScene = useCallback(() => {
    commitChange((prev) => {
      const hemi = prev.selectedScene;
      const current = prev.scenes[hemi];
      if (current.objects.length === 0) return prev;
      return {
        ...prev,
        scenes: {
          ...prev.scenes,
          [hemi]: {
            ...current,
            objects: [],
          },
        },
      };
    });
    setSelectedInstanceId(null);
  }, [commitChange]);

  const resetStarterScenes = useCallback(() => {
    const starter = createInitialScenesState();
    commitChange(() => ({
      ...starter,
      selectedScene: scenesState.selectedScene,
    }));
    const firstObj = starter.scenes[scenesState.selectedScene].objects[0] ?? null;
    setSelectedInstanceId(firstObj?.instanceId ?? null);
  }, [commitChange, scenesState.selectedScene]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    scenesRef.current = previous;
    setPast(past.slice(0, -1));
    setFuture((f) => [scenesState, ...f.slice(0, MAX_HISTORY - 1)]);
    setScenesState(previous);
    persistIfDirty(previous);
    const nextObjects = previous.scenes[previous.selectedScene].objects;
    if (selectedInstanceId && !nextObjects.some((o) => o.instanceId === selectedInstanceId)) {
      setSelectedInstanceId(nextObjects[0]?.instanceId ?? null);
    }
  }, [past, persistIfDirty, scenesState, selectedInstanceId]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const [next, ...rest] = future;
    scenesRef.current = next;
    setFuture(rest);
    setPast((p) => [...p.slice(-(MAX_HISTORY - 1)), scenesState]);
    setScenesState(next);
    persistIfDirty(next);
    const nextObjects = next.scenes[next.selectedScene].objects;
    if (selectedInstanceId && !nextObjects.some((o) => o.instanceId === selectedInstanceId)) {
      setSelectedInstanceId(nextObjects[0]?.instanceId ?? null);
    }
  }, [future, persistIfDirty, scenesState, selectedInstanceId]);

  const importScenesJson = useCallback(
    (rawJson: string): { ok: true } | { ok: false; error: string } => {
      const parsed = parseImportedScenesJson(rawJson);
      if ('error' in parsed) {
        return { ok: false, error: parsed.error };
      }
      commitChange(() => parsed.state);
      if (parsed.warning) {
        setStorageWarning(parsed.warning);
      } else {
        setStorageWarning(null);
      }
      const nextObjects = parsed.state.scenes[parsed.state.selectedScene].objects;
      setSelectedInstanceId(nextObjects[0]?.instanceId ?? null);
      return { ok: true };
    },
    [commitChange],
  );

  const dismissWarning = useCallback(() => {
    setStorageWarning(null);
  }, []);

  return {
    scenesState,
    activeHemisphere,
    activeScene,
    selectedInstanceId,
    selectedObject,
    inspectedCollectionEntryId,
    inspectedGalaxy,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    storageHealthy,
    storageWarning,
    setSelectedInstanceId,
    setInspectedCollectionEntryId,
    selectHemisphere,
    placeItem,
    beginContinuousGesture,
    updateObjectLive,
    endContinuousGesture,
    patchObjectDiscrete,
    reorderObjectLayer,
    removePlacedObject,
    setSceneAppearance,
    clearCurrentScene,
    resetStarterScenes,
    undo,
    redo,
    importScenesJson,
    dismissWarning,
  };
}
