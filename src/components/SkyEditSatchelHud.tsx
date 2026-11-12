import React, { useMemo, useState } from 'react';
import {
  CELESTIAL_DECOR_ITEMS,
  DEMO_COLLECTION_ENTRIES,
  getCelestialDecor,
  getSourceGalaxy,
  getSourceGalaxyForCollectionEntry,
} from '../data/demoCatalog';
import type { ObjectTransformPatch } from '../state/useSkyGardenState';
import type {
  DemoMode,
  PlacedObject,
  PlacedObjectKind,
  SceneComposition,
} from '../types/skyGarden';
import { CelestialDecorGlyph } from './CelestialGlyphs';

interface SkyEditSatchelHudProps {
  readonly demoMode: DemoMode;
  readonly stardust: number;
  readonly scene: SceneComposition;
  readonly selectedObject: PlacedObject | null;
  readonly unlockedEntryIds: ReadonlySet<string>;
  readonly unlockedDecorIds: ReadonlySet<string>;
  readonly observedSourceIds: ReadonlySet<string>;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly onPlaceItem: (kind: PlacedObjectKind, refId: string) => void;
  readonly onUnlockDecor: (decorId: string) => void;
  readonly onOpenCrtDesk: () => void;
  readonly onPatchDiscrete: (instanceId: string, patch: ObjectTransformPatch) => void;
  readonly onReorderLayer: (
    instanceId: string,
    direction: 'forward' | 'backward' | 'front' | 'back',
  ) => void;
  readonly onRemoveObject: (instanceId: string) => void;
  readonly onOpenAtlasForEntry: (entryId: string) => void;
  readonly onUndo: () => void;
  readonly onRedo: () => void;
  readonly onClearPane: () => void;
  readonly onCloseScope: () => void;
}

export const SkyEditSatchelHud: React.FC<SkyEditSatchelHudProps> = ({
  demoMode,
  stardust,
  scene,
  selectedObject,
  unlockedEntryIds,
  unlockedDecorIds,
  observedSourceIds,
  canUndo,
  canRedo,
  onPlaceItem,
  onUnlockDecor,
  onOpenCrtDesk,
  onPatchDiscrete,
  onReorderLayer,
  onRemoveObject,
  onOpenAtlasForEntry,
  onUndo,
  onRedo,
  onClearPane,
  onCloseScope,
}) => {
  const [trayFilter, setTrayFilter] = useState<'galaxies' | 'accents'>('galaxies');

  const unlockedEntries = useMemo(
    () => DEMO_COLLECTION_ENTRIES.filter((entry) => unlockedEntryIds.has(entry.entryId)),
    [unlockedEntryIds],
  );

  const placementCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const obj of scene.objects) {
      counts.set(obj.refId, (counts.get(obj.refId) ?? 0) + 1);
    }
    return counts;
  }, [scene.objects]);

  const selectedLabel = selectedObject
    ? selectedObject.kind === 'galaxy'
      ? getSourceGalaxyForCollectionEntry(selectedObject.refId)?.catalogName ?? 'Galaxy'
      : getCelestialDecor(selectedObject.refId)?.title ?? 'Accent'
    : null;

  const handleDragStart = (e: React.DragEvent, kind: PlacedObjectKind, refId: string) => {
    e.dataTransfer.setData('application/x-sky-garden-item', JSON.stringify({ kind, refId }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <section
      className="sky-satchel-dock"
      aria-label="Telescope Sky-Curator Satchel"
      data-testid="sky-satchel-dock"
    >
      <div className="satchel-top-strip">
        <div className="satchel-mode-group">
          <span className="pixel-tag tag-brass">
            TELESCOPE SKY CURATOR · {scene.hemisphere === 'north' ? 'NORTH DOME' : 'SOUTH DOME'}
          </span>
          <button
            type="button"
            className={`pixel-tab-btn ${trayFilter === 'galaxies' ? 'is-active' : ''}`}
            onClick={() => setTrayFilter('galaxies')}
          >
            GALAXIES ({unlockedEntries.length})
          </button>
          <button
            type="button"
            className={`pixel-tab-btn ${trayFilter === 'accents' ? 'is-active' : ''}`}
            onClick={() => setTrayFilter('accents')}
          >
            STARS &amp; COMETS ({unlockedDecorIds.size}/{CELESTIAL_DECOR_ITEMS.length})
          </button>
          {demoMode === 'progression' && (
            <span className="pixel-tag tag-amber">✦ {stardust} STARDUST</span>
          )}
        </div>

        {/* Selected Sky Instance Quick Pixel Controls */}
        {selectedObject && (
          <div className="satchel-selected-bar" role="group" aria-label="Selected sky object controls">
            <strong className="satchel-sel-name">{selectedLabel}</strong>
            <button
              type="button"
              className="pixel-mini-btn"
              onClick={() =>
                onPatchDiscrete(selectedObject.instanceId, { scale: selectedObject.scale - 0.12 })
              }
              title="Shrink (-)"
            >
              SIZE −
            </button>
            <button
              type="button"
              className="pixel-mini-btn"
              onClick={() =>
                onPatchDiscrete(selectedObject.instanceId, { scale: selectedObject.scale + 0.12 })
              }
              title="Enlarge (+)"
            >
              SIZE +
            </button>
            <button
              type="button"
              className="pixel-mini-btn"
              onClick={() =>
                onPatchDiscrete(selectedObject.instanceId, {
                  rotationDeg: selectedObject.rotationDeg - 15,
                })
              }
              title="Rotate counter-clockwise ([)"
            >
              ↺ 15°
            </button>
            <button
              type="button"
              className="pixel-mini-btn"
              onClick={() =>
                onPatchDiscrete(selectedObject.instanceId, {
                  rotationDeg: selectedObject.rotationDeg + 15,
                })
              }
              title="Rotate clockwise (])"
            >
              ↻ 15°
            </button>
            <button
              type="button"
              className="pixel-mini-btn"
              disabled={selectedObject.layer <= 0}
              onClick={() => onReorderLayer(selectedObject.instanceId, 'backward')}
              title="Send backward"
            >
              ↓ LAYER
            </button>
            <button
              type="button"
              className="pixel-mini-btn"
              disabled={selectedObject.layer >= scene.objects.length - 1}
              onClick={() => onReorderLayer(selectedObject.instanceId, 'forward')}
              title="Bring forward"
            >
              ↑ LAYER
            </button>
            {selectedObject.kind === 'galaxy' && (
              <button
                type="button"
                className="pixel-mini-btn btn-cyan"
                onClick={() => onOpenAtlasForEntry(selectedObject.refId)}
              >
                ATLAS RECORD
              </button>
            )}
            <button
              type="button"
              className="pixel-mini-btn btn-danger"
              onClick={() => onRemoveObject(selectedObject.instanceId)}
            >
              Remove from Window (Keeps in Collection)
            </button>
          </div>
        )}

        <div className="satchel-right-actions">
          <button
            type="button"
            className="pixel-mini-btn"
            disabled={!canUndo}
            onClick={onUndo}
            title="Undo (Cmd/Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button
            type="button"
            className="pixel-mini-btn"
            disabled={!canRedo}
            onClick={onRedo}
            title="Redo (Shift+Cmd/Ctrl+Z)"
          >
            ↷ Redo
          </button>
          <button
            type="button"
            className="pixel-mini-btn"
            disabled={scene.objects.length === 0}
            onClick={onClearPane}
          >
            Clear Pane
          </button>
          <button type="button" className="pixel-btn-primary" onClick={onCloseScope}>
            [ESC] STEP FROM SCOPE
          </button>
        </div>
      </div>

      {trayFilter === 'galaxies' ? (
        unlockedEntries.length === 0 ? (
          <div className="satchel-empty-box" data-testid="satchel-empty-box">
            <span>
              No galaxies cataloged yet — classify a survey subject at the CRT desk to unlock it
              and earn +3 ✦ Stardust.
            </span>
            <button type="button" className="pixel-btn-primary" onClick={onOpenCrtDesk}>
              CLASSIFY AT CRT →
            </button>
          </div>
        ) : (
          <ul className="satchel-slots-row" aria-label="Demo Galaxy Collection">
            {unlockedEntries.map((entry) => {
              const galaxy = getSourceGalaxy(entry.sourceGalaxyId);
              if (!galaxy) return null;
              const count = placementCounts.get(entry.entryId) ?? 0;
              const isObserved = observedSourceIds.has(galaxy.id);

              return (
                <li
                  key={entry.entryId}
                  className="satchel-slot-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'galaxy', entry.entryId)}
                >
                  <div
                    className="satchel-slot-thumb"
                    onClick={() => onOpenAtlasForEntry(entry.entryId)}
                    title={`Inspect ${galaxy.catalogName} in Star Atlas`}
                  >
                    <img src={galaxy.originalImageUrl} alt={galaxy.catalogName} />
                    {count > 0 && <span className="slot-count-badge">{count}×</span>}
                    {isObserved && (
                      <span className="slot-observed-star" title="Logged at Practice Desk">
                        ★
                      </span>
                    )}
                  </div>
                  <div className="satchel-slot-meta">
                    <span className="slot-title">{galaxy.catalogName}</span>
                    <button
                      type="button"
                      className="slot-place-btn"
                      onClick={() => onPlaceItem('galaxy', entry.entryId)}
                      aria-label={`Place ${galaxy.catalogName} in ${scene.hemisphere} sky`}
                    >
                      + HANG
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )
      ) : (
        <ul className="satchel-slots-row" aria-label="Celestial Scenery Accents">
          {CELESTIAL_DECOR_ITEMS.map((decor) => {
            const count = placementCounts.get(decor.decorId) ?? 0;
            const isUnlocked = demoMode === 'sandbox' || unlockedDecorIds.has(decor.decorId);
            const canAfford = stardust >= decor.costStardust;

            return (
              <li
                key={decor.decorId}
                className={`satchel-slot-card ${!isUnlocked ? 'is-locked' : ''}`}
                draggable={isUnlocked}
                onDragStart={
                  isUnlocked
                    ? (e) => handleDragStart(e, 'celestial_decor', decor.decorId)
                    : undefined
                }
              >
                <div className="satchel-slot-thumb decor-slot-bg">
                  <CelestialDecorGlyph glyphKind={decor.glyphKind} />
                  {count > 0 && <span className="slot-count-badge">{count}×</span>}
                </div>
                <div className="satchel-slot-meta">
                  <span className="slot-title">{decor.title}</span>
                  {isUnlocked ? (
                    <button
                      type="button"
                      className="slot-place-btn"
                      onClick={() => onPlaceItem('celestial_decor', decor.decorId)}
                    >
                      + HANG
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="slot-place-btn btn-unlock"
                      disabled={!canAfford}
                      onClick={() => onUnlockDecor(decor.decorId)}
                      title={
                        canAfford
                          ? `Spend ${decor.costStardust} Stardust to unlock ${decor.title}`
                          : `Requires ${decor.costStardust} Stardust`
                      }
                    >
                      UNLOCK · {decor.costStardust} ✦
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
