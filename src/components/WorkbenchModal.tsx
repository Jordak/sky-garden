import React, { useRef } from 'react';
import {
  NEBULA_LAYERS,
  ROOM_PROPS,
  SKY_BACKGROUNDS,
  WINDOW_FRAMES,
} from '../data/demoCatalog';
import type { RoomPropId, SceneComposition } from '../types/skyGarden';

interface WorkbenchModalProps {
  readonly scene: SceneComposition;
  readonly activeRoomProps: readonly RoomPropId[];
  readonly onToggleRoomProp: (propId: RoomPropId) => void;
  readonly onSetSceneAppearance: (patch: {
    backgroundId?: string;
    nebulaLayerId?: string;
    windowFrameId?: string;
    exhibitionTitle?: string;
  }) => void;
  readonly onExportJson: () => void;
  readonly onImportJsonFile: (file: File) => void;
  readonly onResetDemo: () => void;
  readonly onClose: () => void;
}

export const WorkbenchModal: React.FC<WorkbenchModalProps> = ({
  scene,
  activeRoomProps,
  onToggleRoomProp,
  onSetSceneAppearance,
  onExportJson,
  onImportJsonFile,
  onResetDemo,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const propSet = new Set(activeRoomProps);

  return (
    <div
      className="pixel-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workbench-modal-title"
      onClick={onClose}
    >
      <div className="pixel-frame workbench-frame" onClick={(e) => e.stopPropagation()}>
        <div className="crt-bezel-header">
          <div className="crt-title-cluster">
            <h2 id="workbench-modal-title" className="pixel-heading">
              CURATOR&apos;S WORKBENCH
            </h2>
            <span className="pixel-tag tag-brass">
              ROOM FURNISHINGS &amp; {scene.hemisphere.toUpperCase()} SKY ATMOSPHERE
            </span>
          </div>
          <button type="button" className="pixel-mini-btn" onClick={onClose}>
            [ESC] CLOSE BENCH
          </button>
        </div>

        <div className="workbench-columns">
          {/* Column 1: Cozy Observatory Room Props */}
          <div className="workbench-col">
            <h3 className="workbench-section-title">OBSERVATORY FURNISHINGS</h3>
            <div className="workbench-prop-list">
              {ROOM_PROPS.map((prop) => {
                const isActive = propSet.has(prop.id);
                return (
                  <button
                    key={prop.id}
                    type="button"
                    aria-pressed={isActive}
                    className={`workbench-prop-btn ${isActive ? 'is-active' : ''}`}
                    onClick={() => onToggleRoomProp(prop.id)}
                  >
                    <div>
                      <strong>{prop.name}</strong>
                      <small>{prop.description}</small>
                    </div>
                    <span className="prop-state-chip">{isActive ? 'PLACED' : 'STORED'}</span>
                  </button>
                );
              })}
            </div>

            <div className="workbench-ledger-box">
              <h3 className="workbench-section-title">OBSERVATORY SAVE LEDGER</h3>
              <label htmlFor="exhibition-title-input" className="workbench-field-label">
                {scene.hemisphere === 'north' ? 'Northern' : 'Southern'} Exhibition Plaque Title
              </label>
              <input
                id="exhibition-title-input"
                type="text"
                className="pixel-input"
                maxLength={70}
                value={scene.exhibitionTitle}
                onChange={(e) => onSetSceneAppearance({ exhibitionTitle: e.target.value })}
              />
              <div className="workbench-ledger-actions">
                <button type="button" className="pixel-mini-btn" onClick={onExportJson}>
                  EXPORT JSON
                </button>
                <button
                  type="button"
                  className="pixel-mini-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  IMPORT JSON
                </button>
                <button type="button" className="pixel-mini-btn btn-danger" onClick={onResetDemo}>
                  RESET DEMO
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="sr-only-file"
                  aria-label="Import layout JSON file"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (f) onImportJsonFile(f);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Column 2: Sky Backdrop, Nebula & Dome Rafters */}
          <div className="workbench-col">
            <h3 className="workbench-section-title">
              {scene.hemisphere.toUpperCase()} SKY BACKDROP
            </h3>
            <div className="workbench-preset-list">
              {SKY_BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  className={`workbench-prop-btn ${scene.backgroundId === bg.id ? 'is-active' : ''}`}
                  onClick={() => onSetSceneAppearance({ backgroundId: bg.id })}
                >
                  <div className="preset-inline-row">
                    <span
                      className="preset-swatch-pixel"
                      style={{ backgroundImage: bg.gradientCss }}
                    />
                    <div>
                      <strong>{bg.name}</strong>
                      <small>{bg.description}</small>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <h3 className="workbench-section-title">NEBULA VEIL &amp; DOME RIBS</h3>
            <div className="workbench-compact-grid">
              {NEBULA_LAYERS.map((neb) => (
                <button
                  key={neb.id}
                  type="button"
                  className={`crt-choice-btn ${scene.nebulaLayerId === neb.id ? 'is-picked' : ''}`}
                  onClick={() => onSetSceneAppearance({ nebulaLayerId: neb.id })}
                >
                  {neb.name}
                </button>
              ))}
            </div>
            <div className="workbench-compact-grid" style={{ marginTop: '6px' }}>
              {WINDOW_FRAMES.map((frame) => (
                <button
                  key={frame.id}
                  type="button"
                  className={`crt-choice-btn ${scene.windowFrameId === frame.id ? 'is-picked' : ''}`}
                  onClick={() => onSetSceneAppearance({ windowFrameId: frame.id })}
                >
                  {frame.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
