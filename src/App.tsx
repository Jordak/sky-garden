import React, { useEffect, useRef, useState } from 'react';
import { CollectionTray } from './components/CollectionTray';
import { ObservatoryStage } from './components/ObservatoryStage';
import { SubjectInspector } from './components/SubjectInspector';
import { useSkyGardenState } from './state/useSkyGardenState';
import { serializeScenesToJson } from './storage/sceneStorage';

export const App: React.FC = () => {
  const {
    scenesState,
    activeHemisphere,
    activeScene,
    selectedInstanceId,
    selectedObject,
    inspectedCollectionEntryId,
    inspectedGalaxy,
    canUndo,
    canRedo,
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
  } = useSkyGardenState();

  const [exhibitionMode, setExhibitionMode] = useState<boolean>(false);
  const [showScienceModal, setShowScienceModal] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
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
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Escape' && exhibitionMode) {
        setExhibitionMode(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [exhibitionMode, redo, undo]);

  const handleExportJson = () => {
    const json = serializeScenesToJson(scenesState);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sky-garden-layout-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatusNotice('Exported both North and South sky compositions as JSON.');
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const result = importScenesJson(text);
      if (!result.ok) {
        setStatusNotice(`Import declined: ${result.error}`);
      } else {
        setStatusNotice(`Imported sky layout from "${file.name}".`);
      }
    } catch {
      setStatusNotice('Could not read the selected layout file.');
    }
  };

  const northCount = scenesState.scenes.north.objects.length;
  const southCount = scenesState.scenes.south.objects.length;

  return (
    <div className={`app-shell ${exhibitionMode ? 'mode-exhibition' : ''}`}>
      {/* Top Observatory Toolbar */}
      <header className="topbar">
        <div className="brand-group">
          <div className="brand-mark" aria-hidden="true">
            ✦
          </div>
          <div>
            <div className="brand-title-line">
              <h1 className="brand-title">Sky Garden</h1>
              <span className="prototype-pill">Prototype · Demo Collection</span>
            </div>
            <p className="brand-tagline">
              Personal observatory window — offline sky-composition milestone
            </p>
          </div>
        </div>

        {/* North / South Creative Hemisphere Switcher */}
        <div
          className="hemisphere-toggle"
          role="group"
          aria-label="Creative Sky Window Hemisphere"
        >
          <button
            type="button"
            aria-pressed={activeHemisphere === 'north'}
            className={`hemi-btn ${activeHemisphere === 'north' ? 'is-active' : ''}`}
            onClick={() => selectHemisphere('north')}
          >
            <span>Northern Window</span>
            <small>{northCount}</small>
          </button>
          <button
            type="button"
            aria-pressed={activeHemisphere === 'south'}
            className={`hemi-btn ${activeHemisphere === 'south' ? 'is-active' : ''}`}
            onClick={() => selectHemisphere('south')}
          >
            <span>Southern Window</span>
            <small>{southCount}</small>
          </button>
        </div>

        {/* Editing, Persistence & Exhibition Actions */}
        <div className="topbar-actions">
          {!exhibitionMode && (
            <>
              <button
                type="button"
                className="btn-toolbar"
                disabled={!canUndo}
                onClick={undo}
                title="Undo last change (Cmd/Ctrl+Z)"
              >
                ↶ Undo
              </button>
              <button
                type="button"
                className="btn-toolbar"
                disabled={!canRedo}
                onClick={redo}
                title="Redo (Shift+Cmd/Ctrl+Z)"
              >
                ↷ Redo
              </button>

              <span className="toolbar-divider" aria-hidden="true" />

              <button
                type="button"
                className="btn-toolbar"
                onClick={handleExportJson}
                title="Download North & South layouts as a JSON file"
              >
                Export JSON
              </button>
              <button
                type="button"
                className="btn-toolbar"
                onClick={() => fileInputRef.current?.click()}
                title="Import a saved Sky Garden JSON layout"
              >
                Import
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="sr-only-file"
                onChange={handleImportFile}
                aria-label="Import layout JSON file"
              />

              <button
                type="button"
                className="btn-toolbar"
                onClick={clearCurrentScene}
                disabled={activeScene.objects.length === 0}
                title="Remove all placed items from the current hemisphere window"
              >
                Clear Pane
              </button>
              <button
                type="button"
                className="btn-toolbar"
                onClick={resetStarterScenes}
                title="Restore initial demo arrangements for both North and South"
              >
                Reset Demo
              </button>
            </>
          )}

          <button
            type="button"
            aria-pressed={exhibitionMode}
            className={`btn-toolbar btn-exhibition ${exhibitionMode ? 'is-active' : ''}`}
            onClick={() => setExhibitionMode((v) => !v)}
            title="Hide editing panels and frame your sky as a quiet exhibition"
          >
            {exhibitionMode ? 'Exit Exhibition' : '✦ Exhibition Gaze'}
          </button>

          <button
            type="button"
            className="btn-toolbar btn-science-note"
            onClick={() => setShowScienceModal(true)}
          >
            Science Guardrails
          </button>

          <span
            className={`storage-indicator ${storageHealthy ? 'is-ok' : 'is-warn'}`}
            title={
              storageHealthy
                ? 'Both North and South scenes auto-save locally in your browser'
                : 'Local storage unavailable — changes remain in memory until exported'
            }
          >
            {storageHealthy ? 'Saved locally' : 'Memory only'}
          </span>
        </div>
      </header>

      {/* Non-destructive Storage / Import Notices */}
      {(storageWarning || statusNotice) && (
        <div className="notice-banner" role="status">
          <span>{storageWarning ?? statusNotice}</span>
          <button
            type="button"
            className="notice-dismiss"
            onClick={() => {
              dismissWarning();
              setStatusNotice(null);
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Three-Column Observatory Workspace */}
      <main className="workspace-grid">
        {!exhibitionMode && (
          <CollectionTray
            scene={activeScene}
            inspectedCollectionEntryId={inspectedCollectionEntryId}
            onInspectEntry={setInspectedCollectionEntryId}
            onPlaceItem={(kind, refId) => placeItem(kind, refId)}
            onSetSceneAppearance={setSceneAppearance}
          />
        )}

        <ObservatoryStage
          scene={activeScene}
          selectedInstanceId={selectedInstanceId}
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

        {!exhibitionMode && (
          <SubjectInspector
            selectedObject={selectedObject}
            inspectedGalaxy={inspectedGalaxy}
            totalObjectsInScene={activeScene.objects.length}
            onPatchDiscrete={patchObjectDiscrete}
            onReorderLayer={reorderObjectLayer}
            onRemoveObject={removePlacedObject}
          />
        )}
      </main>

      {/* Science & Zooniverse Guardrails Modal */}
      {showScienceModal && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="science-modal-title"
          onClick={() => setShowScienceModal(false)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 id="science-modal-title">Scientific Guardrails &amp; Prototype Status</h2>
              <button
                type="button"
                className="btn-subtle"
                onClick={() => setShowScienceModal(false)}
              >
                Close
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Offline Prototype Only:</strong> Sky Garden Milestone 1 makes zero network
                requests and submits no classifications to Galaxy Zoo or Zooniverse. Every item in
                the Curator&apos;s Tray is a bundled open-licensed astronomical cutout (CC BY 4.0)
                for testing whether composing a personal sky feels rewarding.
              </p>
              <ul>
                <li>
                  <strong>Immutable Scientific Data:</strong> Creative window placement, scaling,
                  rotation, and soft edge-blending never alter source cutouts or catalog records.
                </li>
                <li>
                  <strong>Ungated Inspection Tools:</strong> Negative-plate inversion, contrast
                  stretching, core zoom, and angular scale bars are available from minute zero—never
                  locked behind game progression.
                </li>
                <li>
                  <strong>Creative vs. Real Sky Honesty:</strong> Window positions are explicitly
                  labeled creative compositions. Verified ICRS (J2000) coordinates appear separately
                  in the Subject Inspector, and missing or unverified coordinates are withheld
                  rather than guessed.
                </li>
                <li>
                  <strong>Unbiased Future Rewards:</strong> Any future live Zooniverse Custom Front
                  End collaboration must avoid bonuses for speed, rare morphology labels, or
                  agreement with automated predictions.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default App;
