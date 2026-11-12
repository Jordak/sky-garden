import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createInitialProgressionState,
  createInitialSandboxState,
  DEMO_COLLECTION_ENTRIES,
  getCelestialDecor,
  getCollectionEntryBySourceId,
  getSourceGalaxyForCollectionEntry,
  NEBULA_LAYERS,
  ROOM_PROPS,
  SKY_BACKGROUNDS,
  STARDUST_PER_SUBJECT,
  WINDOW_FRAMES,
} from '../data/demoCatalog';
import {
  clampCoordX,
  clampCoordY,
  clampScale,
  loadActiveDemoMode,
  loadScenesFromStorage,
  normalizeLayerOrder,
  normalizeRotation,
  parseImportedScenesJson,
  saveActiveDemoMode,
  saveScenesToStorage,
} from '../storage/sceneStorage';
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

const MAX_HISTORY = 50;

export interface ObjectTransformPatch {
  readonly x?: number;
  readonly y?: number;
  readonly scale?: number;
  readonly rotationDeg?: number;
}

export interface ObservationRewardResult {
  readonly newlyUnlocked: boolean;
  readonly stardustEarned: number;
  readonly collectionEntryId: string | null;
}

function makeInstanceId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function useSkyGardenState() {
  const initialLoad = useMemo(() => {
    const mode = loadActiveDemoMode();
    return loadScenesFromStorage(undefined, mode);
  }, []);

  const [scenesState, setScenesState] = useState<SavedScenesState>(initialLoad.state);
  const [past, setPast] = useState<SavedScenesState[]>([]);
  const [future, setFuture] = useState<SavedScenesState[]>([]);

  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(() => {
    const currentObjects = initialLoad.state.scenes[initialLoad.state.selectedScene].objects;
    const firstGalaxy = currentObjects.find((o) => o.kind === 'galaxy');
    return firstGalaxy?.instanceId ?? currentObjects[0]?.instanceId ?? null;
  });

  const [inspectedCollectionEntryId, setInspectedCollectionEntryId] = useState<string>(
    () =>
      initialLoad.state.unlockedCollectionEntryIds[0] ?? DEMO_COLLECTION_ENTRIES[0].entryId,
  );

  const [storageWarning, setStorageWarning] = useState<string | null>(initialLoad.warning);
  const [storageHealthy, setStorageHealthy] = useState<boolean>(initialLoad.storageAvailable);

  const scenesRef = useRef<SavedScenesState>(initialLoad.state);
  useEffect(() => {
    scenesRef.current = scenesState;
  }, [scenesState]);

  const gestureSnapshotRef = useRef<SavedScenesState | null>(null);

  const persistIfDirty = useCallback((nextState: SavedScenesState) => {
    const result = saveScenesToStorage(nextState);
    setStorageHealthy(result.ok);
    if (!result.ok && result.warning) {
      setStorageWarning(result.warning);
    }
  }, []);

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
      if (hemisphere === scenesRef.current.selectedScene) return;
      const nextObjects = scenesRef.current.scenes[hemisphere].objects;
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
    [commitChange],
  );

  const toggleHemisphere = useCallback(() => {
    const nextHemi: SceneHemisphere =
      scenesRef.current.selectedScene === 'north' ? 'south' : 'north';
    selectHemisphere(nextHemi);
    return nextHemi;
  }, [selectHemisphere]);

  const placeItem = useCallback(
    (kind: PlacedObjectKind, refId: string, preferredPos?: { x: number; y: number }) => {
      const newInstanceId = makeInstanceId(kind === 'galaxy' ? 'gal' : 'dec');
      commitChange((prev) => {
        const hemi = prev.selectedScene;
        const current = prev.scenes[hemi];
        const count = current.objects.length;
        const angle = count * 2.39996;
        const radius = Math.min(0.18, 0.05 * ((count % 5) + 1));
        const defaultX = count === 0 ? 0.5 : 0.5 + Math.cos(angle) * radius * 1.4;
        const defaultY = count === 0 ? 0.36 : 0.36 + Math.sin(angle) * radius * 0.75;

        const nextObj: PlacedObject = {
          instanceId: newInstanceId,
          kind,
          refId,
          scene: hemi,
          x: clampCoordX(preferredPos?.x ?? defaultX),
          y: clampCoordY(preferredPos?.y ?? defaultY),
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
      return newInstanceId;
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
      const nextX = patch.x !== undefined ? clampCoordX(patch.x) : obj.x;
      const nextY = patch.y !== undefined ? clampCoordY(patch.y) : obj.y;
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
          const nextX = patch.x !== undefined ? clampCoordX(patch.x) : obj.x;
          const nextY = patch.y !== undefined ? clampCoordY(patch.y) : obj.y;
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

  const toggleRoomProp = useCallback(
    (propId: RoomPropId) => {
      commitChange((prev) => {
        const exists = prev.activeRoomProps.includes(propId);
        const activeRoomProps = exists
          ? prev.activeRoomProps.filter((p) => p !== propId)
          : [...prev.activeRoomProps, propId];
        return {
          ...prev,
          activeRoomProps,
        };
      });
    },
    [commitChange],
  );

  const toggleOrUnlockRoomProp = useCallback(
    (propId: RoomPropId): { ok: boolean; unlockedNow: boolean } => {
      const current = scenesRef.current;
      if (current.demoMode === 'sandbox' || current.unlockedRoomProps.includes(propId)) {
        toggleRoomProp(propId);
        return { ok: true, unlockedNow: false };
      }
      const def = ROOM_PROPS.find((p) => p.id === propId);
      if (!def || current.stardust < def.costStardust) {
        return { ok: false, unlockedNow: false };
      }
      commitChange(
        (prev) => {
          if (prev.unlockedRoomProps.includes(propId) || prev.stardust < def.costStardust) {
            return prev;
          }
          return {
            ...prev,
            stardust: prev.stardust - def.costStardust,
            unlockedRoomProps: [...prev.unlockedRoomProps, propId],
            activeRoomProps: prev.activeRoomProps.includes(propId)
              ? prev.activeRoomProps
              : [...prev.activeRoomProps, propId],
          };
        },
        false,
      );
      return { ok: true, unlockedNow: true };
    },
    [commitChange, toggleRoomProp],
  );

  const unlockCelestialDecor = useCallback(
    (decorId: string): boolean => {
      const current = scenesRef.current;
      if (current.demoMode === 'sandbox' || current.unlockedDecorIds.includes(decorId)) {
        return true;
      }
      const decor = getCelestialDecor(decorId);
      if (!decor || current.stardust < decor.costStardust) {
        return false;
      }
      commitChange(
        (prev) => {
          if (prev.unlockedDecorIds.includes(decorId) || prev.stardust < decor.costStardust) {
            return prev;
          }
          return {
            ...prev,
            stardust: prev.stardust - decor.costStardust,
            unlockedDecorIds: [...prev.unlockedDecorIds, decorId],
          };
        },
        false,
      );
      return true;
    },
    [commitChange],
  );

  const selectOrUnlockAppearance = useCallback(
    (patch: {
      backgroundId?: string;
      nebulaLayerId?: string;
      windowFrameId?: string;
      exhibitionTitle?: string;
    }): { ok: boolean; unlockedNow: boolean } => {
      if (patch.exhibitionTitle !== undefined) {
        setSceneAppearance({ exhibitionTitle: patch.exhibitionTitle });
        return { ok: true, unlockedNow: false };
      }

      const current = scenesRef.current;
      if (current.demoMode === 'sandbox') {
        setSceneAppearance(patch);
        return { ok: true, unlockedNow: false };
      }

      let requiredCost = 0;
      let unlockKind: 'bg' | 'nebula' | 'frame' | null = null;
      let unlockId = '';

      if (patch.backgroundId && !current.unlockedBackgroundIds.includes(patch.backgroundId)) {
        const bg = SKY_BACKGROUNDS.find((b) => b.id === patch.backgroundId);
        if (!bg) return { ok: false, unlockedNow: false };
        requiredCost = bg.costStardust;
        unlockKind = 'bg';
        unlockId = bg.id;
      } else if (patch.nebulaLayerId && !current.unlockedNebulaIds.includes(patch.nebulaLayerId)) {
        const neb = NEBULA_LAYERS.find((n) => n.id === patch.nebulaLayerId);
        if (!neb) return { ok: false, unlockedNow: false };
        requiredCost = neb.costStardust;
        unlockKind = 'nebula';
        unlockId = neb.id;
      } else if (patch.windowFrameId && !current.unlockedFrameIds.includes(patch.windowFrameId)) {
        const frame = WINDOW_FRAMES.find((f) => f.id === patch.windowFrameId);
        if (!frame) return { ok: false, unlockedNow: false };
        requiredCost = frame.costStardust;
        unlockKind = 'frame';
        unlockId = frame.id;
      }

      if (!unlockKind) {
        setSceneAppearance(patch);
        return { ok: true, unlockedNow: false };
      }

      if (current.stardust < requiredCost) {
        return { ok: false, unlockedNow: false };
      }

      commitChange(
        (prev) => {
          if (prev.stardust < requiredCost) return prev;
          const hemi = prev.selectedScene;
          const curScene = prev.scenes[hemi];
          return {
            ...prev,
            stardust: prev.stardust - requiredCost,
            unlockedBackgroundIds:
              unlockKind === 'bg' && !prev.unlockedBackgroundIds.includes(unlockId)
                ? [...prev.unlockedBackgroundIds, unlockId]
                : prev.unlockedBackgroundIds,
            unlockedNebulaIds:
              unlockKind === 'nebula' && !prev.unlockedNebulaIds.includes(unlockId)
                ? [...prev.unlockedNebulaIds, unlockId]
                : prev.unlockedNebulaIds,
            unlockedFrameIds:
              unlockKind === 'frame' && !prev.unlockedFrameIds.includes(unlockId)
                ? [...prev.unlockedFrameIds, unlockId]
                : prev.unlockedFrameIds,
            scenes: {
              ...prev.scenes,
              [hemi]: {
                ...curScene,
                backgroundId: patch.backgroundId ?? curScene.backgroundId,
                nebulaLayerId: patch.nebulaLayerId ?? curScene.nebulaLayerId,
                windowFrameId: patch.windowFrameId ?? curScene.windowFrameId,
              },
            },
          };
        },
        false,
      );
      return { ok: true, unlockedNow: true };
    },
    [commitChange, setSceneAppearance],
  );

  const recordPracticeObservation = useCallback(
    (obs: Omit<PracticeObservation, 'observedAtIso'>): ObservationRewardResult => {
      const entry = getCollectionEntryBySourceId(obs.sourceGalaxyId);
      const current = scenesRef.current;
      const isNewProgressionUnlock =
        current.demoMode === 'progression' &&
        Boolean(entry) &&
        !current.unlockedCollectionEntryIds.includes(entry!.entryId);
      const stardustEarned = isNewProgressionUnlock ? STARDUST_PER_SUBJECT : 0;

      commitChange(
        (prev) => {
          const canUnlock =
            prev.demoMode === 'progression' &&
            Boolean(entry) &&
            !prev.unlockedCollectionEntryIds.includes(entry!.entryId);
          return {
            ...prev,
            stardust: canUnlock ? prev.stardust + STARDUST_PER_SUBJECT : prev.stardust,
            unlockedCollectionEntryIds: canUnlock
              ? [...prev.unlockedCollectionEntryIds, entry!.entryId]
              : prev.unlockedCollectionEntryIds,
            practiceLog: [
              ...prev.practiceLog,
              {
                ...obs,
                observedAtIso: new Date().toISOString(),
              },
            ],
          };
        },
        false,
      );

      if (entry) {
        setInspectedCollectionEntryId(entry.entryId);
      }

      return {
        newlyUnlocked: isNewProgressionUnlock,
        stardustEarned,
        collectionEntryId: entry?.entryId ?? null,
      };
    },
    [commitChange],
  );

  const switchDemoMode = useCallback((nextMode: DemoMode) => {
    if (nextMode === scenesRef.current.demoMode) return;
    saveActiveDemoMode(nextMode);
    const loaded = loadScenesFromStorage(undefined, nextMode);
    if (loaded.storageAvailable && !loaded.hadSavedData && loaded.warning === null) {
      saveScenesToStorage(loaded.state);
    }
    scenesRef.current = loaded.state;
    setScenesState(loaded.state);
    setPast([]);
    setFuture([]);
    setStorageHealthy(loaded.storageAvailable);
    setStorageWarning(loaded.warning);
    const nextObjects = loaded.state.scenes[loaded.state.selectedScene].objects;
    const firstGalaxy = nextObjects.find((o) => o.kind === 'galaxy');
    setSelectedInstanceId(firstGalaxy?.instanceId ?? nextObjects[0]?.instanceId ?? null);
    setInspectedCollectionEntryId(
      loaded.state.unlockedCollectionEntryIds[0] ?? DEMO_COLLECTION_ENTRIES[0].entryId,
    );
  }, []);

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
    const mode = scenesRef.current.demoMode;
    const starter =
      mode === 'progression' ? createInitialProgressionState() : createInitialSandboxState();
    const next: SavedScenesState = {
      ...starter,
      selectedScene: starter.selectedScene,
      updatedAtIso: new Date().toISOString(),
    };
    scenesRef.current = next;
    setScenesState(next);
    setPast([]);
    setFuture([]);
    persistIfDirty(next);
    const firstObj = next.scenes[next.selectedScene].objects[0] ?? null;
    setSelectedInstanceId(firstObj?.instanceId ?? null);
    setInspectedCollectionEntryId(
      next.unlockedCollectionEntryIds[0] ?? DEMO_COLLECTION_ENTRIES[0].entryId,
    );
  }, [persistIfDirty]);

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
      saveActiveDemoMode(parsed.state.demoMode);
      scenesRef.current = parsed.state;
      setScenesState(parsed.state);
      setPast([]);
      setFuture([]);
      persistIfDirty(parsed.state);
      if (parsed.warning) {
        setStorageWarning(parsed.warning);
      } else {
        setStorageWarning(null);
      }
      const nextObjects = parsed.state.scenes[parsed.state.selectedScene].objects;
      setSelectedInstanceId(nextObjects[0]?.instanceId ?? null);
      setInspectedCollectionEntryId(
        parsed.state.unlockedCollectionEntryIds[0] ?? DEMO_COLLECTION_ENTRIES[0].entryId,
      );
      return { ok: true };
    },
    [persistIfDirty],
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
    toggleHemisphere,
    switchDemoMode,
    placeItem,
    beginContinuousGesture,
    updateObjectLive,
    endContinuousGesture,
    patchObjectDiscrete,
    reorderObjectLayer,
    removePlacedObject,
    setSceneAppearance,
    toggleRoomProp,
    toggleOrUnlockRoomProp,
    unlockCelestialDecor,
    selectOrUnlockAppearance,
    recordPracticeObservation,
    clearCurrentScene,
    resetStarterScenes,
    undo,
    redo,
    importScenesJson,
    dismissWarning,
  };
}
