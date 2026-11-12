import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ClassificationCrtModal } from './components/ClassificationCrtModal';
import { ObservatoryCutawayCanvas } from './components/ObservatoryCutawayCanvas';
import { ObservatoryStage } from './components/ObservatoryStage';
import { SkyEditSatchelHud } from './components/SkyEditSatchelHud';
import { StarAtlasModal } from './components/StarAtlasModal';
import { WorkbenchModal } from './components/WorkbenchModal';
import { useSkyGardenState } from './state/useSkyGardenState';
import { serializeScenesToJson } from './storage/sceneStorage';
import type { StationId } from './types/skyGarden';

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
    placeItem,
    beginContinuousGesture,
    updateObjectLive,
    endContinuousGesture,
    patchObjectDiscrete,
    reorderObjectLayer,
    removePlacedObject,
    setSceneAppearance,
    toggleRoomProp,
    recordPracticeObservation,
    clearCurrentScene,
    resetStarterScenes,
    undo,
    redo,
    importScenesJson,
    dismissWarning,
  } = useSkyGardenState();

  const [activeStation, setActiveStation] = useState<StationId | null>(null);
  const [exhibitionMode, setExhibitionMode] = useState<boolean>(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const skyEditMode = activeStation === 'telescope' && !exhibitionMode;

  const observedSourceIds = useMemo(
    () => new Set(scenesState.practiceLog.map((entry) => entry.sourceGalaxyId)),
    [scenesState.practiceLog],
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
        if (exhibitionMode) {
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
  }, [activeStation, exhibitionMode, redo, undo]);

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
                <span className="pixel-micro-tag status-demo">DEMO</span>
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
            <button
              type="button"
              aria-pressed={exhibitionMode}
              className={`pixel-hud-btn btn-gold ${exhibitionMode ? 'is-active' : ''}`}
              onClick={() => {
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
            scene={activeScene}
            selectedObject={selectedObject}
            observedSourceIds={observedSourceIds}
            canUndo={canUndo}
            canRedo={canRedo}
            onPlaceItem={(kind, refId) => {
              placeItem(kind, refId);
            }}
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
            observedSourceIds={observedSourceIds}
            practiceCount={scenesState.practiceLog.length}
            onRecordObservation={recordPracticeObservation}
            onHangGalaxyAtScope={(collectionEntryId) => {
              placeItem('galaxy', collectionEntryId);
              setActiveStation('telescope');
            }}
            onClose={() => setActiveStation(null)}
          />
        )}

        {activeStation === 'atlas' && (
          <StarAtlasModal
            inspectedCollectionEntryId={inspectedCollectionEntryId}
            activeHemisphere={activeHemisphere}
            observedSourceIds={observedSourceIds}
            onSelectEntry={setInspectedCollectionEntryId}
            onHangInSky={(entryId) => {
              placeItem('galaxy', entryId);
              setActiveStation('telescope');
            }}
            onClose={() => setActiveStation(null)}
          />
        )}

        {activeStation === 'workbench' && (
          <WorkbenchModal
            scene={activeScene}
            activeRoomProps={scenesState.activeRoomProps}
            onToggleRoomProp={toggleRoomProp}
            onSetSceneAppearance={setSceneAppearance}
            onExportJson={handleExportJson}
            onImportJsonFile={handleImportFile}
            onResetDemo={resetStarterScenes}
            onClose={() => setActiveStation(null)}
          />
        )}
        </div>
      </div>
    </div>
  );
};

export default App;
