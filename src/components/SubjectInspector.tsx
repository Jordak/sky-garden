import React, { useState } from 'react';
import { getCelestialDecor, getSourceGalaxyForCollectionEntry } from '../data/demoCatalog';
import { MAX_SCALE, MIN_SCALE } from '../storage/sceneStorage';
import type { ObjectTransformPatch } from '../state/useSkyGardenState';
import type { PlacedObject, SourceGalaxy } from '../types/skyGarden';

interface SubjectInspectorProps {
  readonly selectedObject: PlacedObject | null;
  readonly inspectedGalaxy: SourceGalaxy | null;
  readonly totalObjectsInScene: number;
  readonly onPatchDiscrete: (instanceId: string, patch: ObjectTransformPatch) => void;
  readonly onReorderLayer: (
    instanceId: string,
    direction: 'forward' | 'backward' | 'front' | 'back',
  ) => void;
  readonly onRemoveObject: (instanceId: string) => void;
}

const AllSkyChartSvg: React.FC<{ raDeg: number; decDeg: number; label: string }> = ({
  raDeg,
  decDeg,
  label,
}) => {
  // Astronomical convention: RA increases leftward (24h/360° on left, 0h/0° on right), Dec +90° top, -90° bottom
  const width = 260;
  const height = 116;
  const padX = 16;
  const padY = 12;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;

  const x = padX + ((360 - raDeg) / 360) * plotW;
  const y = padY + ((90 - decDeg) / 180) * plotH;
  const eqY = padY + plotH / 2;

  return (
    <div className="real-sky-chart-wrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="real-sky-chart-svg"
        role="img"
        aria-label={`Real celestial sphere location of ${label} at Right Ascension ${raDeg.toFixed(1)} degrees, Declination ${decDeg.toFixed(1)} degrees`}
      >
        <rect
          x={padX}
          y={padY}
          width={plotW}
          height={plotH}
          rx="8"
          fill="#070c1a"
          stroke="#2c3d63"
          strokeWidth="1"
        />
        {/* Declination +30 / -30 grid */}
        <line
          x1={padX}
          y1={padY + plotH / 6}
          x2={padX + plotW}
          y2={padY + plotH / 6}
          stroke="#1b2847"
          strokeWidth="0.7"
          strokeDasharray="2 3"
        />
        <line
          x1={padX}
          y1={padY + (plotH * 5) / 6}
          x2={padX + plotW}
          y2={padY + (plotH * 5) / 6}
          stroke="#1b2847"
          strokeWidth="0.7"
          strokeDasharray="2 3"
        />
        {/* Celestial Equator (Dec = 0°) */}
        <line
          x1={padX}
          y1={eqY}
          x2={padX + plotW}
          y2={eqY}
          stroke="#4f6d9e"
          strokeWidth="1"
          strokeDasharray="4 3"
        />
        {/* RA 6h, 12h, 18h meridians */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={padX + plotW * f}
            y1={padY}
            x2={padX + plotW * f}
            y2={padY + plotH}
            stroke="#1b2847"
            strokeWidth="0.7"
          />
        ))}
        {/* Labels */}
        <text x={padX + 4} y={padY + 10} fill="#7e94ba" fontSize="7.5">
          +90° N
        </text>
        <text x={padX + 4} y={eqY - 3} fill="#8fb0e3" fontSize="7.5">
          δ = 0° Equator
        </text>
        <text x={padX + 4} y={padY + plotH - 4} fill="#7e94ba" fontSize="7.5">
          −90° S
        </text>
        <text x={padX + plotW - 22} y={padY + plotH - 4} fill="#7e94ba" fontSize="7.5">
          0h RA
        </text>

        {/* Target marker */}
        <circle cx={x} cy={y} r="7.5" fill="none" stroke="#f0c373" strokeWidth="1.2" opacity="0.8" />
        <line x1={x - 10} y1={y} x2={x + 10} y2={y} stroke="#f0c373" strokeWidth="0.9" />
        <line x1={x} y1={y - 10} x2={x} y2={y + 10} stroke="#f0c373" strokeWidth="0.9" />
        <circle cx={x} cy={y} r="3" fill="#ffe7b8" />
      </svg>
    </div>
  );
};

export const SubjectInspector: React.FC<SubjectInspectorProps> = ({
  selectedObject,
  inspectedGalaxy,
  totalObjectsInScene,
  onPatchDiscrete,
  onReorderLayer,
  onRemoveObject,
}) => {
  // Scientific inspection tools — always available, never gated behind upgrades!
  const [invertPlate, setInvertPlate] = useState<boolean>(false);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [coreZoom, setCoreZoom] = useState<boolean>(false);
  const [showReticle, setShowReticle] = useState<boolean>(true);

  const selectedLabel = selectedObject
    ? selectedObject.kind === 'galaxy'
      ? getSourceGalaxyForCollectionEntry(selectedObject.refId)?.catalogName ?? 'Galaxy'
      : getCelestialDecor(selectedObject.refId)?.title ?? 'Celestial Accent'
    : null;

  const filterParts: string[] = [];
  if (invertPlate) filterParts.push('invert(1) hue-rotate(180deg)');
  if (highContrast) filterParts.push('contrast(1.48) brightness(1.12)');
  const inspectorFilterCss = filterParts.length > 0 ? filterParts.join(' ') : 'none';

  return (
    <aside className="panel subject-inspector" aria-label="Object Controls and Subject Inspector">
      {/* Creative Instance Controls */}
      <div className="inspector-section creative-controls-section">
        <div className="section-heading-row">
          <h2 className="panel-title">Window Placement</h2>
          <span className="fictional-tag">Creative View</span>
        </div>

        {selectedObject ? (
          <div className="selected-instance-controls">
            <div className="selected-instance-header">
              <strong className="selected-instance-name">{selectedLabel}</strong>
              <span className="selected-instance-coords">
                Pane X {(selectedObject.x * 100).toFixed(0)}% · Y{' '}
                {(selectedObject.y * 100).toFixed(0)}%
              </span>
            </div>

            <div className="slider-row">
              <label htmlFor="scale-slider">
                <span>Scale</span>
                <output>{selectedObject.scale.toFixed(2)}×</output>
              </label>
              <input
                id="scale-slider"
                type="range"
                min={MIN_SCALE}
                max={MAX_SCALE}
                step={0.03}
                value={selectedObject.scale}
                onChange={(e) =>
                  onPatchDiscrete(selectedObject.instanceId, {
                    scale: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="slider-row">
              <label htmlFor="rotation-slider">
                <span>Orientation</span>
                <output>{Math.round(selectedObject.rotationDeg)}°</output>
              </label>
              <input
                id="rotation-slider"
                type="range"
                min={-180}
                max={180}
                step={1}
                value={selectedObject.rotationDeg}
                onChange={(e) =>
                  onPatchDiscrete(selectedObject.instanceId, {
                    rotationDeg: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="layer-actions-row" role="group" aria-label="Layer ordering">
              <button
                type="button"
                className="btn-subtle"
                disabled={selectedObject.layer <= 0}
                onClick={() => onReorderLayer(selectedObject.instanceId, 'back')}
                title="Send to back layer"
              >
                ⤓ Back
              </button>
              <button
                type="button"
                className="btn-subtle"
                disabled={selectedObject.layer <= 0}
                onClick={() => onReorderLayer(selectedObject.instanceId, 'backward')}
                title="Send backward one layer (PageDown)"
              >
                ↓ Down
              </button>
              <button
                type="button"
                className="btn-subtle"
                disabled={selectedObject.layer >= totalObjectsInScene - 1}
                onClick={() => onReorderLayer(selectedObject.instanceId, 'forward')}
                title="Bring forward one layer (PageUp)"
              >
                ↑ Up
              </button>
              <button
                type="button"
                className="btn-subtle"
                disabled={selectedObject.layer >= totalObjectsInScene - 1}
                onClick={() => onReorderLayer(selectedObject.instanceId, 'front')}
                title="Bring to front layer"
              >
                ⤒ Front
              </button>
            </div>

            <button
              type="button"
              className="btn-remove-instance"
              onClick={() => onRemoveObject(selectedObject.instanceId)}
            >
              Remove from Window (Keeps in Collection)
            </button>
          </div>
        ) : (
          <p className="inspector-empty-hint">
            Click any placed galaxy or star accent in the window to adjust its creative position,
            size, angle, or layer.
          </p>
        )}
      </div>

      {/* Immutable Scientific Subject Record */}
      {inspectedGalaxy && (
        <div className="inspector-section scientific-record-section">
          <div className="section-heading-row">
            <h2 className="panel-title">Scientific Subject Record</h2>
            <span className="immutable-tag" title="Source image and catalog data are never altered by decorative edits">
              Unmodified Source
            </span>
          </div>

          <div className="raw-cutout-frame">
            <div className="raw-cutout-viewport">
              <img
                src={inspectedGalaxy.originalImageUrl}
                alt={`Original unmodified survey cutout of ${inspectedGalaxy.catalogName}`}
                className="raw-cutout-img"
                style={{
                  filter: inspectorFilterCss,
                  transform: coreZoom ? 'scale(2)' : 'scale(1)',
                }}
              />
              {showReticle && (
                <svg
                  viewBox="0 0 200 200"
                  className="inspector-reticle-overlay"
                  aria-hidden="true"
                >
                  <circle
                    cx="100"
                    cy="100"
                    r="28"
                    fill="none"
                    stroke="rgba(240, 195, 115, 0.55)"
                    strokeWidth="0.9"
                    strokeDasharray="3 3"
                  />
                  <line
                    x1="100"
                    y1="62"
                    x2="100"
                    y2="82"
                    stroke="rgba(240, 195, 115, 0.7)"
                    strokeWidth="1"
                  />
                  <line
                    x1="100"
                    y1="118"
                    x2="100"
                    y2="138"
                    stroke="rgba(240, 195, 115, 0.7)"
                    strokeWidth="1"
                  />
                  <line
                    x1="62"
                    y1="100"
                    x2="82"
                    y2="100"
                    stroke="rgba(240, 195, 115, 0.7)"
                    strokeWidth="1"
                  />
                  <line
                    x1="118"
                    y1="100"
                    x2="138"
                    y2="100"
                    stroke="rgba(240, 195, 115, 0.7)"
                    strokeWidth="1"
                  />
                  {/* Angular field scale bar (25% of frame width) */}
                  <line
                    x1="14"
                    y1="186"
                    x2="64"
                    y2="186"
                    stroke="#dce8ff"
                    strokeWidth="1.5"
                  />
                  <line x1="14" y1="182" x2="14" y2="190" stroke="#dce8ff" strokeWidth="1.2" />
                  <line x1="64" y1="182" x2="64" y2="190" stroke="#dce8ff" strokeWidth="1.2" />
                  <text x="14" y="178" fill="#dce8ff" fontSize="8.5" fontFamily="monospace">
                    {((inspectedGalaxy.provenance.angularFieldArcmin * 0.25) / (coreZoom ? 2 : 1)).toFixed(2)}′ arcmin
                  </text>
                </svg>
              )}
            </div>

            {/* Ungated scientific inspection toolbar */}
            <div
              className="inspection-toolbar"
              role="group"
              aria-label="Scientific image inspection aids (always unlocked)"
            >
              <button
                type="button"
                aria-pressed={invertPlate}
                className={`tool-chip ${invertPlate ? 'is-active' : ''}`}
                onClick={() => setInvertPlate((v) => !v)}
                title="Invert luminance (negative plate) to reveal faint tidal shells and bridges"
              >
                ◐ Invert
              </button>
              <button
                type="button"
                aria-pressed={highContrast}
                className={`tool-chip ${highContrast ? 'is-active' : ''}`}
                onClick={() => setHighContrast((v) => !v)}
                title="Stretch contrast for dust lanes and inner spiral structure"
              >
                ◑ Contrast
              </button>
              <button
                type="button"
                aria-pressed={coreZoom}
                className={`tool-chip ${coreZoom ? 'is-active' : ''}`}
                onClick={() => setCoreZoom((v) => !v)}
                title="Zoom 2x into galactic nucleus"
              >
                ⊕ 2× Core
              </button>
              <button
                type="button"
                aria-pressed={showReticle}
                className={`tool-chip ${showReticle ? 'is-active' : ''}`}
                onClick={() => setShowReticle((v) => !v)}
                title="Toggle angular scale bar and center reticle"
              >
                ⌖ Scale
              </button>
            </div>
            <p className="ungated-tools-caption">
              Inspection tools are permanently unlocked for every subject and only affect this
              viewer.
            </p>
          </div>

          <div className="subject-meta-card">
            <div className="subject-meta-title-block">
              <h3>{inspectedGalaxy.catalogName}</h3>
              <span>{inspectedGalaxy.commonTitle}</span>
            </div>
            <p className="subject-morphology-note">{inspectedGalaxy.morphologyNote}</p>
            <p className="subject-science-context">{inspectedGalaxy.scienceContext}</p>

            {/* Real Astronomical Coordinates vs Unavailable Notice */}
            <div className="real-coords-box" data-testid="real-coordinates-box">
              <div className="real-coords-header">
                <strong>Real Astronomical Sky Location</strong>
                {inspectedGalaxy.skyCoordinates.status === 'verified' ? (
                  <span className="coord-verified-pill">
                    Verified {inspectedGalaxy.skyCoordinates.frame}
                  </span>
                ) : (
                  <span className="coord-missing-pill">Unavailable</span>
                )}
              </div>

              {inspectedGalaxy.skyCoordinates.status === 'verified' ? (
                <>
                  <dl className="coords-dl">
                    <div>
                      <dt>Right Ascension</dt>
                      <dd>
                        {inspectedGalaxy.skyCoordinates.raHms}{' '}
                        <small>({inspectedGalaxy.skyCoordinates.raDeg.toFixed(4)}°)</small>
                      </dd>
                    </div>
                    <div>
                      <dt>Declination</dt>
                      <dd>
                        {inspectedGalaxy.skyCoordinates.decDms}{' '}
                        <small>({inspectedGalaxy.skyCoordinates.decDeg.toFixed(4)}°)</small>
                      </dd>
                    </div>
                    <div>
                      <dt>Constellation</dt>
                      <dd>
                        {inspectedGalaxy.skyCoordinates.constellation} (
                        {inspectedGalaxy.skyCoordinates.decDeg >= 0
                          ? 'Northern Celestial Hemisphere'
                          : 'Southern Celestial Hemisphere'}
                        )
                      </dd>
                    </div>
                  </dl>
                  <AllSkyChartSvg
                    raDeg={inspectedGalaxy.skyCoordinates.raDeg}
                    decDeg={inspectedGalaxy.skyCoordinates.decDeg}
                    label={inspectedGalaxy.catalogName}
                  />
                </>
              ) : (
                <p className="coords-unavailable-msg">
                  Real sky coordinates unavailable: {inspectedGalaxy.skyCoordinates.reason}
                </p>
              )}
            </div>

            {/* Survey Provenance */}
            <dl className="provenance-dl">
              <div>
                <dt>Survey</dt>
                <dd>
                  {inspectedGalaxy.provenance.survey} · {inspectedGalaxy.provenance.dataRelease}
                </dd>
              </div>
              <div>
                <dt>Field of View</dt>
                <dd>{inspectedGalaxy.provenance.angularFieldArcmin.toFixed(2)}′ × {inspectedGalaxy.provenance.angularFieldArcmin.toFixed(2)}′ square cutout</dd>
              </div>
              <div>
                <dt>Attribution</dt>
                <dd>
                  {inspectedGalaxy.provenance.attribution} ({inspectedGalaxy.provenance.license}) ·{' '}
                  <a
                    href={inspectedGalaxy.provenance.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="archive-link"
                  >
                    Survey archive ↗
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </aside>
  );
};
