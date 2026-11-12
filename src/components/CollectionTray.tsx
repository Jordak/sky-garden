import React, { useMemo, useState } from 'react';
import {
  CELESTIAL_DECOR_ITEMS,
  DEMO_COLLECTION_ENTRIES,
  getSourceGalaxy,
  NEBULA_LAYERS,
  SKY_BACKGROUNDS,
  WINDOW_FRAMES,
} from '../data/demoCatalog';
import type { PlacedObjectKind, SceneComposition } from '../types/skyGarden';
import { CelestialDecorGlyph } from './CelestialGlyphs';

type TrayTab = 'galaxies' | 'scenery' | 'atmosphere';

interface CollectionTrayProps {
  readonly scene: SceneComposition;
  readonly inspectedCollectionEntryId: string;
  readonly onInspectEntry: (entryId: string) => void;
  readonly onPlaceItem: (kind: PlacedObjectKind, refId: string) => void;
  readonly onSetSceneAppearance: (patch: {
    backgroundId?: string;
    nebulaLayerId?: string;
    windowFrameId?: string;
    exhibitionTitle?: string;
  }) => void;
}

export const CollectionTray: React.FC<CollectionTrayProps> = ({
  scene,
  inspectedCollectionEntryId,
  onInspectEntry,
  onPlaceItem,
  onSetSceneAppearance,
}) => {
  const [activeTab, setActiveTab] = useState<TrayTab>('galaxies');

  const placementCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const obj of scene.objects) {
      counts.set(obj.refId, (counts.get(obj.refId) ?? 0) + 1);
    }
    return counts;
  }, [scene.objects]);

  const handleDragStart = (
    e: React.DragEvent,
    kind: PlacedObjectKind,
    refId: string,
  ) => {
    e.dataTransfer.setData(
      'application/x-sky-garden-item',
      JSON.stringify({ kind, refId }),
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside className="panel collection-tray" aria-label="Collection and Scenery Tray">
      <div className="panel-header">
        <div className="panel-title-row">
          <h2 className="panel-title">Curator&apos;s Tray</h2>
          <span
            className="demo-badge"
            title="Bundled open-licensed survey cutouts for sky-composition playtesting. No live classifications have been submitted."
          >
            Demo Bundle
          </span>
        </div>
        <p className="panel-subtitle">
          Sample galaxies &amp; observatory scenery — not completed research work.
        </p>
      </div>

      <div className="tray-tabs" role="tablist" aria-label="Curator categories">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'galaxies'}
          className={`tray-tab ${activeTab === 'galaxies' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('galaxies')}
        >
          Galaxies ({DEMO_COLLECTION_ENTRIES.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'scenery'}
          className={`tray-tab ${activeTab === 'scenery' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('scenery')}
        >
          Accents ({CELESTIAL_DECOR_ITEMS.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'atmosphere'}
          className={`tray-tab ${activeTab === 'atmosphere' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('atmosphere')}
        >
          Sky &amp; Frame
        </button>
      </div>

      <div className="tray-scroll-area">
        {activeTab === 'galaxies' && (
          <ul className="collection-list" aria-label="Demo Galaxy Collection">
            {DEMO_COLLECTION_ENTRIES.map((entry) => {
              const galaxy = getSourceGalaxy(entry.sourceGalaxyId);
              if (!galaxy) return null;
              const isInspected = entry.entryId === inspectedCollectionEntryId;
              const placedCount = placementCounts.get(entry.entryId) ?? 0;
              const coordStatus = galaxy.skyCoordinates.status;

              return (
                <li
                  key={entry.entryId}
                  className={`collection-card ${isInspected ? 'is-inspected' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'galaxy', entry.entryId)}
                  onClick={() => onInspectEntry(entry.entryId)}
                  data-testid={`collection-card-${galaxy.id}`}
                >
                  <div className="collection-thumb-wrap">
                    <img
                      src={galaxy.originalImageUrl}
                      alt={galaxy.catalogName}
                      className="collection-thumb"
                      loading="lazy"
                    />
                    {placedCount > 0 && (
                      <span
                        className="placed-count-pill"
                        title={`Placed ${placedCount} time(s) in current pane`}
                      >
                        {placedCount}×
                      </span>
                    )}
                  </div>

                  <div className="collection-card-body">
                    <div className="collection-card-top">
                      <span className="collection-catalog-name">{galaxy.catalogName}</span>
                      <span
                        className={`coord-mini-tag status-${coordStatus}`}
                        title={
                          coordStatus === 'verified'
                            ? `Verified ${galaxy.skyCoordinates.frame} (${galaxy.skyCoordinates.constellation})`
                            : galaxy.skyCoordinates.reason
                        }
                      >
                        {coordStatus === 'verified'
                          ? galaxy.skyCoordinates.decDeg >= 0
                            ? 'J2000 · δ+'
                            : 'J2000 · δ−'
                          : coordStatus === 'unverified'
                            ? 'Unverified'
                            : 'No Coords'}
                      </span>
                    </div>
                    <span className="collection-common-title">{galaxy.commonTitle}</span>
                    <div className="collection-card-actions">
                      <button
                        type="button"
                        className="btn-place"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlaceItem('galaxy', entry.entryId);
                        }}
                        aria-label={`Place ${galaxy.catalogName} in ${scene.hemisphere} sky`}
                      >
                        + Place in Sky
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {activeTab === 'scenery' && (
          <div className="scenery-tab-content">
            <p className="scenery-note">
              Fictional celestial accents to complement your classified galaxies. Drag into the
              window or click <strong>+ Place</strong>.
            </p>
            <ul className="collection-list" aria-label="Celestial Scenery Accents">
              {CELESTIAL_DECOR_ITEMS.map((decor) => {
                const placedCount = placementCounts.get(decor.decorId) ?? 0;
                return (
                  <li
                    key={decor.decorId}
                    className="collection-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'celestial_decor', decor.decorId)}
                  >
                    <div className="collection-thumb-wrap decor-thumb-bg">
                      <CelestialDecorGlyph glyphKind={decor.glyphKind} />
                      {placedCount > 0 && <span className="placed-count-pill">{placedCount}×</span>}
                    </div>
                    <div className="collection-card-body">
                      <span className="collection-catalog-name">{decor.title}</span>
                      <span className="collection-common-title">{decor.subtitle}</span>
                      <div className="collection-card-actions">
                        <button
                          type="button"
                          className="btn-place"
                          onClick={() => onPlaceItem('celestial_decor', decor.decorId)}
                        >
                          + Place Accent
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {activeTab === 'atmosphere' && (
          <div className="atmosphere-controls">
            <div className="control-group">
              <label htmlFor="exhibition-title-input" className="control-group-label">
                Window Exhibition Title ({scene.hemisphere === 'north' ? 'North' : 'South'})
              </label>
              <input
                id="exhibition-title-input"
                type="text"
                className="text-input"
                maxLength={70}
                value={scene.exhibitionTitle}
                onChange={(e) => onSetSceneAppearance({ exhibitionTitle: e.target.value })}
                placeholder="Name this sky composition…"
              />
            </div>

            <div className="control-group">
              <span className="control-group-label">Sky Backdrop</span>
              <div className="preset-grid">
                {SKY_BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    className={`preset-option ${scene.backgroundId === bg.id ? 'is-selected' : ''}`}
                    onClick={() => onSetSceneAppearance({ backgroundId: bg.id })}
                  >
                    <span
                      className="preset-swatch"
                      style={{ backgroundImage: bg.gradientCss }}
                      aria-hidden="true"
                    />
                    <span className="preset-text">
                      <strong>{bg.name}</strong>
                      <small>{bg.description}</small>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="control-group">
              <span className="control-group-label">Nebula Veil Layer</span>
              <div className="preset-grid">
                {NEBULA_LAYERS.map((neb) => (
                  <button
                    key={neb.id}
                    type="button"
                    className={`preset-option ${scene.nebulaLayerId === neb.id ? 'is-selected' : ''}`}
                    onClick={() => onSetSceneAppearance({ nebulaLayerId: neb.id })}
                  >
                    <span className="preset-text">
                      <strong>{neb.name}</strong>
                      <small>{neb.description}</small>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="control-group">
              <span className="control-group-label">Observatory Window Frame</span>
              <div className="preset-grid">
                {WINDOW_FRAMES.map((frame) => (
                  <button
                    key={frame.id}
                    type="button"
                    className={`preset-option ${scene.windowFrameId === frame.id ? 'is-selected' : ''}`}
                    onClick={() => onSetSceneAppearance({ windowFrameId: frame.id })}
                  >
                    <span className="preset-text">
                      <strong>{frame.name}</strong>
                      <small>{frame.description}</small>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
