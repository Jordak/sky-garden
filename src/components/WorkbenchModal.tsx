import React, { useRef } from 'react';
import {
  CELESTIAL_DECOR_ITEMS,
  NEBULA_LAYERS,
  ROOM_PROPS,
  SKY_BACKGROUNDS,
  WINDOW_FRAMES,
} from '../data/demoCatalog';
import type { DemoMode, RoomPropId, SceneComposition } from '../types/skyGarden';

interface WorkbenchModalProps {
  readonly demoMode: DemoMode;
  readonly stardust: number;
  readonly scene: SceneComposition;
  readonly activeRoomProps: readonly RoomPropId[];
  readonly unlockedRoomProps: ReadonlySet<RoomPropId>;
  readonly unlockedDecorIds: ReadonlySet<string>;
  readonly unlockedBackgroundIds: ReadonlySet<string>;
  readonly unlockedNebulaIds: ReadonlySet<string>;
  readonly unlockedFrameIds: ReadonlySet<string>;
  readonly onToggleOrUnlockRoomProp: (propId: RoomPropId) => void;
  readonly onUnlockDecor: (decorId: string) => void;
  readonly onSelectOrUnlockAppearance: (patch: {
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
  demoMode,
  stardust,
  scene,
  activeRoomProps,
  unlockedRoomProps,
  unlockedDecorIds,
  unlockedBackgroundIds,
  unlockedNebulaIds,
  unlockedFrameIds,
  onToggleOrUnlockRoomProp,
  onUnlockDecor,
  onSelectOrUnlockAppearance,
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
          <div className="crt-header-right">
            <span className="pixel-tag tag-amber">
              {demoMode === 'progression' ? `✦ ${stardust} STARDUST` : 'SANDBOX · ALL UNLOCKED'}
            </span>
            <button type="button" className="pixel-mini-btn" onClick={onClose}>
              [ESC] CLOSE BENCH
            </button>
          </div>
        </div>

        <div className="workbench-columns">
          {/* Column 1: Cozy Observatory Room Props + Celestial Scenery + Save Ledger */}
          <div className="workbench-col">
            <h3 className="workbench-section-title">OBSERVATORY FURNISHINGS</h3>
            <div className="workbench-prop-list">
              {ROOM_PROPS.map((prop) => {
                const isUnlocked = demoMode === 'sandbox' || unlockedRoomProps.has(prop.id);
                const isActive = isUnlocked && propSet.has(prop.id);
                const canAfford = stardust >= prop.costStardust;

                return (
                  <button
                    key={prop.id}
                    type="button"
                    aria-pressed={isUnlocked ? isActive : undefined}
                    disabled={!isUnlocked && !canAfford}
                    className={`workbench-prop-btn ${isActive ? 'is-active' : ''} ${
                      !isUnlocked ? 'is-locked' : ''
                    }`}
                    onClick={() => onToggleOrUnlockRoomProp(prop.id)}
                  >
                    <div>
                      <strong>{prop.name}</strong>
                      <small>{prop.description}</small>
                    </div>
                    <span className="prop-state-chip">
                      {isUnlocked
                        ? isActive
                          ? 'PLACED'
                          : 'STORED'
                        : `UNLOCK ${prop.costStardust} ✦`}
                    </span>
                  </button>
                );
              })}
            </div>

            <h3 className="workbench-section-title" style={{ marginTop: '4px' }}>
              CELESTIAL SCENERY ACCENTS
            </h3>
            <div className="workbench-compact-grid">
              {CELESTIAL_DECOR_ITEMS.map((decor) => {
                const isUnlocked = demoMode === 'sandbox' || unlockedDecorIds.has(decor.decorId);
                const canAfford = stardust >= decor.costStardust;

                return (
                  <button
                    key={decor.decorId}
                    type="button"
                    disabled={isUnlocked || !canAfford}
                    title={decor.subtitle}
                    className={`crt-choice-btn ${isUnlocked ? 'is-picked' : 'is-locked'}`}
                    onClick={() => onUnlockDecor(decor.decorId)}
                  >
                    {isUnlocked
                      ? `${decor.title} · UNLOCKED ✓`
                      : `${decor.title} · UNLOCK ${decor.costStardust} ✦`}
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
                onChange={(e) => onSelectOrUnlockAppearance({ exhibitionTitle: e.target.value })}
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
                  {demoMode === 'progression' ? 'RESET PROGRESSION' : 'RESET SANDBOX'}
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
              {SKY_BACKGROUNDS.map((bg) => {
                const isUnlocked = demoMode === 'sandbox' || unlockedBackgroundIds.has(bg.id);
                const isSelected = isUnlocked && scene.backgroundId === bg.id;
                const canAfford = stardust >= bg.costStardust;

                return (
                  <button
                    key={bg.id}
                    type="button"
                    aria-pressed={isSelected}
                    disabled={!isUnlocked && !canAfford}
                    className={`workbench-prop-btn ${isSelected ? 'is-active' : ''} ${
                      !isUnlocked ? 'is-locked' : ''
                    }`}
                    onClick={() => onSelectOrUnlockAppearance({ backgroundId: bg.id })}
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
                    {!isUnlocked && (
                      <span className="prop-state-chip">UNLOCK {bg.costStardust} ✦</span>
                    )}
                  </button>
                );
              })}
            </div>

            <h3 className="workbench-section-title">AMBIENT SKY &amp; DOME RIBS</h3>
            <div className="workbench-compact-grid">
              {NEBULA_LAYERS.map((neb) => {
                const isUnlocked = demoMode === 'sandbox' || unlockedNebulaIds.has(neb.id);
                const isSelected = isUnlocked && scene.nebulaLayerId === neb.id;
                const canAfford = stardust >= neb.costStardust;

                return (
                  <button
                    key={neb.id}
                    type="button"
                    aria-pressed={isSelected}
                    disabled={!isUnlocked && !canAfford}
                    title={neb.description}
                    className={`crt-choice-btn ${isSelected ? 'is-picked' : ''} ${
                      !isUnlocked ? 'is-locked' : ''
                    }`}
                    onClick={() => onSelectOrUnlockAppearance({ nebulaLayerId: neb.id })}
                  >
                    {isUnlocked ? neb.name : `${neb.name} · ${neb.costStardust} ✦`}
                  </button>
                );
              })}
            </div>
            <div className="workbench-compact-grid" style={{ marginTop: '6px' }}>
              {WINDOW_FRAMES.map((frame) => {
                const isUnlocked = demoMode === 'sandbox' || unlockedFrameIds.has(frame.id);
                const isSelected = isUnlocked && scene.windowFrameId === frame.id;
                const canAfford = stardust >= frame.costStardust;

                return (
                  <button
                    key={frame.id}
                    type="button"
                    aria-pressed={isSelected}
                    disabled={!isUnlocked && !canAfford}
                    title={frame.description}
                    className={`crt-choice-btn ${isSelected ? 'is-picked' : ''} ${
                      !isUnlocked ? 'is-locked' : ''
                    }`}
                    onClick={() => onSelectOrUnlockAppearance({ windowFrameId: frame.id })}
                  >
                    {isUnlocked ? frame.name : `${frame.name} · ${frame.costStardust} ✦`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
