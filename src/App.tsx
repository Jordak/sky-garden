import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ClassificationCrtModal } from './components/ClassificationCrtModal';
import { EthicsCharterModal } from './components/EthicsCharterModal';
import { ObservatoryCutawayCanvas } from './components/ObservatoryCutawayCanvas';
import { ObservatoryStage } from './components/ObservatoryStage';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { SkyEditSatchelHud } from './components/SkyEditSatchelHud';
import { StarAtlasModal } from './components/StarAtlasModal';
import { WorkbenchModal } from './components/WorkbenchModal';
import { CELESTIAL_DECOR_ITEMS, NEBULA_LAYERS, ROOM_PROPS, SKY_BACKGROUNDS, WINDOW_FRAMES } from './data/demoCatalog';
import { useSkyGardenState } from './state/useSkyGardenState';
import { serializeScenesToJson } from './storage/sceneStorage';
import type { RoomPropId, StationId } from './types/skyGarden';

export const App: React.FC = () => {
  const {
    scenesState,
    activeHemisphere,
    activeScene,
    selectedInstanceId,
    selectedObject,
    inspectedCollectionEntryId,
    canUndo,
    canRedo,
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
    toggleOrUnlockRoomProp,
    unlockCelestialDecor,
    selectOrUnlockAppearance,
    recordPracticeObservation,
    clearCurrentScene,
    resetStarterScenes,
    wipeAllLocalData,
    undo,
    redo,
    importScenesJson,
    dismissWarning,
  } = useSkyGardenState();

  const [activeStation, setActiveStation] = useState<StationId | null>(null);
  const [exhibitionMode, setExhibitionMode] = useState<boolean>(false);
  const [confirmingReset, setConfirmingReset] = useState<boolean>(false);
  const [ethicsModalOpen, setEthicsModalOpen] = useState<boolean>(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const skyEditMode = activeStation === 'telescope' && !exhibitionMode;

  const unlockedEntryIds = useMemo(
    () => new Set(scenesState.unlockedCollectionEntryIds),
    [scenesState.unlockedCollectionEntryIds],
  );
  const unlockedDecorIds = useMemo(
    () => new Set(scenesState.unlockedDecorIds),
    [scenesState.unlockedDecorIds],
  );
  const unlockedRoomProps = useMemo(
    () => new Set(scenesState.unlockedRoomProps),
    [scenesState.unlockedRoomProps],
  );
  const unlockedBackgroundIds = useMemo(
    () => new Set(scenesState.unlockedBackgroundIds),
    [scenesState.unlockedBackgroundIds],
  );
  const unlockedNebulaIds = useMemo(
    () => new Set(scenesState.unlockedNebulaIds),
    [scenesState.unlockedNebulaIds],
  );
  const unlockedFrameIds = useMemo(
    () => new Set(scenesState.unlockedFrameIds),
    [scenesState.unlockedFrameIds],
  );

  const observedSourceIds = useMemo(
    () => new Set(scenesState.practiceLog.map((entry) => entry.sourceGalaxyId)),
    [scenesState.practiceLog],
  );

  const handleToggleOrUnlockRoomProp = useCallback(
    (propId: RoomPropId) => {
      const res = toggleOrUnlockRoomProp(propId);
      if (res.unlockedNow) {
        const def = ROOM_PROPS.find((p) => p.id === propId);
        if (def) setStatusToast(`Unlocked & placed ${def.name}!`);
      }
    },
    [toggleOrUnlockRoomProp],
  );

  const handleUnlockDecor = useCallback(
    (decorId: string) => {
      const ok = unlockCelestialDecor(decorId);
      if (ok) {
        const def = CELESTIAL_DECOR_ITEMS.find((d) => d.decorId === decorId);
        if (def) setStatusToast(`Unlocked ${def.title} for your sky dome!`);
      }
    },
    [unlockCelestialDecor],
  );

  const handleSelectOrUnlockAppearance = useCallback(
    (patch: {
      backgroundId?: string;
      nebulaLayerId?: string;
      windowFrameId?: string;
      exhibitionTitle?: string;
    }) => {
      const res = selectOrUnlockAppearance(patch);
      if (res.unlockedNow) {
        const label =
          (patch.backgroundId && SKY_BACKGROUNDS.find((b) => b.id === patch.backgroundId)?.name) ||
          (patch.nebulaLayerId && NEBULA_LAYERS.find((n) => n.id === patch.nebulaLayerId)?.name) ||
          (patch.windowFrameId && WINDOW_FRAMES.find((f) => f.id === patch.windowFrameId)?.name);
        if (label) setStatusToast(`Unlocked & applied ${label}!`);
      }
    },
    [selectOrUnlockAppearance],
  );

  const handleTriggerStation = useCallback(
    (station: StationId) => {
      if (station === 'dome-wheel') {
        const next = toggleHemisphere();
        setStatusToast(
          next === 'north'
            ? 'Rotated observatory dome to Northern Sky.'
            : 'Rotated observatory dome to Southern Sky.',
        );
        return;
      }
      setActiveStation(station);
    },
    [toggleHemisphere],
  );

  useEffect(() => {
    if (!statusToast) return;
    const id = window.setTimeout(() => setStatusToast(null), 3400);
    return () => window.clearTimeout(id);
  }, [statusToast]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      if (e.key === 'Escape') {
        if (ethicsModalOpen) {
          e.preventDefault();
          setEthicsModalOpen(false);
        } else if (confirmingReset) {
          e.preventDefault();
          setConfirmingReset(false);
        } else if (exhibitionMode) {
          e.preventDefault();
          setExhibitionMode(false);
        } else if (activeStation !== null) {
          e.preventDefault();
          setActiveStation(null);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeStation, confirmingReset, ethicsModalOpen, exhibitionMode, redo, undo]);

  const handleExportJson = () => {
    const json = serializeScenesToJson(scenesState);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sky-garden-observatory-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatusToast('Saved observatory & sky layout to JSON.');
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const result = importScenesJson(text);
      if (!result.ok) {
        setStatusToast(`Import declined: ${result.error}`);
      } else {
        setStatusToast(`Loaded observatory layout from "${file.name}".`);
      }
    } catch {
      setStatusToast('Could not read the selected JSON file.');
    }
  };

  const northCount = scenesState.scenes.north.objects.length;
  const southCount = scenesState.scenes.south.objects.length;

  return (
    <div className="game-screen-root">
      <div className="game-cabinet-column">
        {/* Slim Pixel Top Bar outside the glasshouse dome so the arched roof & lights stay 100% unobstructed */}
        <header className="pixel-hud-strip">
          {!exhibitionMode ? (
            <div className="pixel-hud-bar">
              <div className="pixel-brand-plaque">
                <span className="pixel-star-glyph" aria-hidden="true">
                  ✦
                </span>
                <strong>SKY GARDEN</strong>
                <div className="pixel-mode-switch" role="group" aria-label="Demo Mode">
                  <button
                    type="button"
                    data-testid="mode-progression-btn"
                    aria-pressed={scenesState.demoMode === 'progression'}
                    className={`pixel-hud-btn ${scenesState.demoMode === 'progression' ? 'is-active' : ''}`}
                    onClick={() => {
                      setConfirmingReset(false);
                      setActiveStation(null);
                      switchDemoMode('progression');
                    }}
                    title="Start bare & unlock galaxies, Star Atlas records, and furnishings via classifications"
                  >
                    PROGRESSION
                  </button>
                  <button
                    type="button"
                    data-testid="mode-sandbox-btn"
                    aria-pressed={scenesState.demoMode === 'sandbox'}
                    className={`pixel-hud-btn ${scenesState.demoMode === 'sandbox' ? 'is-active' : ''}`}
                    onClick={() => {
                      setConfirmingReset(false);
                      setActiveStation(null);
                      switchDemoMode('sandbox');
                    }}
                    title="All galaxies, Star Atlas entries, and sky items unlocked immediately"
                  >
                    SANDBOX
                  </button>
                </div>
              </div>

              <nav className="pixel-station-shortcuts" aria-label="Observatory Stations">
                <button
                  type="button"
                  aria-pressed={activeStation === 'crt-desk'}
                  className={`pixel-hud-btn ${activeStation === 'crt-desk' ? 'is-active' : ''}`}
                  onClick={() =>
                    setActiveStation((s) => (s === 'crt-desk' ? null : 'crt-desk'))
                  }
                >
                  CLASSIFY
                </button>
                <button
                  type="button"
                  aria-pressed={activeStation === 'atlas'}
                  className={`pixel-hud-btn ${activeStation === 'atlas' ? 'is-active' : ''}`}
                  onClick={() => setActiveStation((s) => (s === 'atlas' ? null : 'atlas'))}
                >
                  STAR ATLAS
                </button>
                <button
                  type="button"
                  aria-pressed={skyEditMode}
                  className={`pixel-hud-btn ${skyEditMode ? 'is-active' : ''}`}
                  onClick={() =>
                    setActiveStation((s) => (s === 'telescope' ? null : 'telescope'))
                  }
                >
                  DECORATE SKY
                </button>
                <button
                  type="button"
                  aria-pressed={activeStation === 'workbench'}
                  className={`pixel-hud-btn ${activeStation === 'workbench' ? 'is-active' : ''}`}
                  onClick={() =>
                    setActiveStation((s) => (s === 'workbench' ? null : 'workbench'))
                  }
                >
                  WORKBENCH
                </button>
              </nav>

              <div
                className="pixel-hemi-switch"
                role="group"
                aria-label="Observatory Dome Hemisphere"
              >
                <button
                  type="button"
                  aria-pressed={activeHemisphere === 'north'}
                  className={`pixel-hud-btn ${activeHemisphere === 'north' ? 'is-active' : ''}`}
                  onClick={() => selectHemisphere('north')}
                >
                  Northern Window <span>{northCount}</span>
                </button>
                <button
                  type="button"
                  aria-pressed={activeHemisphere === 'south'}
                  className={`pixel-hud-btn ${activeHemisphere === 'south' ? 'is-active' : ''}`}
                  onClick={() => selectHemisphere('south')}
                >
                  Southern Window <span>{southCount}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="pixel-brand-plaque">
              <span className="pixel-star-glyph" aria-hidden="true">
                ✦
              </span>
              <strong>EXHIBITION GAZE</strong>
            </div>
          )}

          <div className="pixel-hud-right">
            {!exhibitionMode && (
              <span
                className="pixel-stardust-badge"
                data-testid="stardust-counter"
                title={
                  scenesState.demoMode === 'progression'
                    ? 'Earn +3 Stardust for each unique galaxy you classify at the Blink Comparator'
                    : 'Sandbox Mode: All catalog items unlocked'
                }
              >
                {scenesState.demoMode === 'progression'
                  ? `✦ ${scenesState.stardust} STARDUST`
                  : '✦ SANDBOX'}
              </span>
            )}
            {!exhibitionMode && scenesState.demoMode === 'progression' && (
              <button
                type="button"
                data-testid="top-reset-progression-btn"
                className="pixel-hud-btn btn-reset"
                onClick={() => setConfirmingReset(true)}
                title="Reset Progression Mode back to zero (asks for confirmation)"
              >
                ↺ RESET PROGRESSION
              </button>
            )}
            <button
              type="button"
              data-testid="top-ethics-btn"
              aria-pressed={ethicsModalOpen}
              className={`pixel-hud-btn ${ethicsModalOpen ? 'is-active' : ''}`}
              onClick={() => {
                setConfirmingReset(false);
                setEthicsModalOpen((v) => !v);
              }}
              title="AI & Data Ethics Charter, local storage controls, and Zooniverse Talk links"
            >
              [i] ETHICS &amp; DATA
            </button>
            <button
              type="button"
              aria-pressed={exhibitionMode}
              className={`pixel-hud-btn btn-gold ${exhibitionMode ? 'is-active' : ''}`}
              onClick={() => {
                setConfirmingReset(false);
                setEthicsModalOpen(false);
                setActiveStation(null);
                setExhibitionMode((v) => !v);
              }}
            >
              {exhibitionMode ? '[ESC] EXIT GAZE' : '✦ QUIET GAZE'}
            </button>
            {!exhibitionMode && (
              <span
                className={`pixel-save-lamp ${storageHealthy ? 'is-ok' : 'is-warn'}`}
                title={
                  storageHealthy
                    ? 'Auto-saved in browser localStorage'
                    : 'Local storage unavailable — export JSON at Workbench'
                }
              >
                {storageHealthy ? 'SAVED' : 'MEM ONLY'}
              </span>
            )}
          </div>
        </header>

        <div className="observatory-world-viewport">
          {/* Layer 1: Always-visible panoramic night sky & placed galaxies */}
          <ObservatoryStage
            scene={activeScene}
            selectedInstanceId={selectedInstanceId}
            interactive={skyEditMode}
            exhibitionMode={exhibitionMode}
            onSelectObject={setSelectedInstanceId}
            onBeginGesture={beginContinuousGesture}
            onUpdateLive={updateObjectLive}
            onEndGesture={endContinuousGesture}
            onPatchDiscrete={patchObjectDiscrete}
            onReorderLayer={reorderObjectLayer}
            onRemoveObject={removePlacedObject}
            onDropNewItem={placeItem}
          />

          {/* Layer 2: Side-on 320x180 Celeste-style cutaway pixel-art observatory */}
          <ObservatoryCutawayCanvas
            demoMode={scenesState.demoMode}
            stardust={scenesState.stardust}
            unlockedGalaxyCount={unlockedEntryIds.size}
            hemisphere={activeHemisphere}
            windowFrameId={activeScene.windowFrameId}
            activeRoomProps={scenesState.activeRoomProps}
            practiceCount={scenesState.practiceLog.length}
            activeStation={activeStation}
            skyEditMode={skyEditMode}
            exhibitionMode={exhibitionMode}
            onTriggerStation={handleTriggerStation}
          />

        {/* Non-destructive Pixel Toast / Storage Warning */}
        {(storageWarning || statusToast) && !exhibitionMode && (
          <div className="pixel-toast-banner" role="status">
            <span>{storageWarning ?? statusToast}</span>
            <button
              type="button"
              className="pixel-mini-btn"
              onClick={() => {
                dismissWarning();
                setStatusToast(null);
              }}
            >
              OK
            </button>
          </div>
        )}

        {/* Layer 3A: Bottom Pixel Satchel Dock when peering through the Telescope */}
        {skyEditMode && (
          <SkyEditSatchelHud
            demoMode={scenesState.demoMode}
            stardust={scenesState.stardust}
            scene={activeScene}
            selectedObject={selectedObject}
            unlockedEntryIds={unlockedEntryIds}
            unlockedDecorIds={unlockedDecorIds}
            observedSourceIds={observedSourceIds}
            canUndo={canUndo}
            canRedo={canRedo}
            onPlaceItem={(kind, refId) => {
              placeItem(kind, refId);
            }}
            onUnlockDecor={handleUnlockDecor}
            onOpenCrtDesk={() => setActiveStation('crt-desk')}
            onPatchDiscrete={patchObjectDiscrete}
            onReorderLayer={reorderObjectLayer}
            onRemoveObject={removePlacedObject}
            onOpenAtlasForEntry={(entryId) => {
              setInspectedCollectionEntryId(entryId);
              setActiveStation('atlas');
            }}
            onUndo={undo}
            onRedo={redo}
            onClearPane={clearCurrentScene}
            onCloseScope={() => setActiveStation(null)}
          />
        )}

        {/* Layer 3B: Diegetic Station Modals */}
        {activeStation === 'crt-desk' && (
          <ClassificationCrtModal
            demoMode={scenesState.demoMode}
            stardust={scenesState.stardust}
            unlockedEntryIds={unlockedEntryIds}
            observedSourceIds={observedSourceIds}
            practiceCount={scenesState.practiceLog.length}
            onRecordObservation={recordPracticeObservation}
            onHangGalaxyAtScope={(collectionEntryId) => {
              placeItem('galaxy', collectionEntryId);
              setActiveStation('telescope');
            }}
            onOpenEthics={() => setEthicsModalOpen(true)}
            onClose={() => setActiveStation(null)}
          />
        )}

        {activeStation === 'atlas' && (
          <StarAtlasModal
            demoMode={scenesState.demoMode}
            inspectedCollectionEntryId={inspectedCollectionEntryId}
            activeHemisphere={activeHemisphere}
            unlockedEntryIds={unlockedEntryIds}
            observedSourceIds={observedSourceIds}
            onSelectEntry={setInspectedCollectionEntryId}
            onHangInSky={(entryId) => {
              placeItem('galaxy', entryId);
              setActiveStation('telescope');
            }}
            onOpenCrtDesk={() => setActiveStation('crt-desk')}
            onClose={() => setActiveStation(null)}
          />
        )}

        {activeStation === 'workbench' && (
          <WorkbenchModal
            demoMode={scenesState.demoMode}
            stardust={scenesState.stardust}
            scene={activeScene}
            activeRoomProps={scenesState.activeRoomProps}
            unlockedRoomProps={unlockedRoomProps}
            unlockedDecorIds={unlockedDecorIds}
            unlockedBackgroundIds={unlockedBackgroundIds}
            unlockedNebulaIds={unlockedNebulaIds}
            unlockedFrameIds={unlockedFrameIds}
            onToggleOrUnlockRoomProp={handleToggleOrUnlockRoomProp}
            onUnlockDecor={handleUnlockDecor}
            onSelectOrUnlockAppearance={handleSelectOrUnlockAppearance}
            onExportJson={handleExportJson}
            onImportJsonFile={handleImportFile}
            onResetDemo={() => setConfirmingReset(true)}
            onClose={() => setActiveStation(null)}
          />
        )}

        {confirmingReset && (
          <ResetConfirmModal
            demoMode={scenesState.demoMode}
            onCancel={() => setConfirmingReset(false)}
            onConfirm={() => {
              const modeBeforeReset = scenesState.demoMode;
              resetStarterScenes();
              setConfirmingReset(false);
              setActiveStation(null);
              setStatusToast(
                modeBeforeReset === 'progression'
                  ? 'Progression Mode reset to a fresh start.'
                  : 'Sandbox Mode restored to starter showcase.',
              );
            }}
          />
        )}

        {ethicsModalOpen && (
          <EthicsCharterModal
            onExportJson={handleExportJson}
            onWipeAllLocalData={() => {
              wipeAllLocalData();
              setEthicsModalOpen(false);
              setActiveStation(null);
              setStatusToast('Cleared all local Sky Garden saves (Progression & Sandbox).');
            }}
            onClose={() => setEthicsModalOpen(false)}
          />
        )}
        </div>
      </div>
    </div>
  );
};

export default App;
