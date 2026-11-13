import React, { useState } from 'react';
import { GALAXY_ZOO_TALK_URL } from '../data/aiEthicsCharter';
import { DEMO_COLLECTION_ENTRIES, getSourceGalaxy } from '../data/demoCatalog';
import type { DemoMode, SceneHemisphere } from '../types/skyGarden';

interface StarAtlasModalProps {
  readonly demoMode: DemoMode;
  readonly inspectedCollectionEntryId: string;
  readonly activeHemisphere: SceneHemisphere;
  readonly unlockedEntryIds: ReadonlySet<string>;
  readonly observedSourceIds: ReadonlySet<string>;
  readonly onSelectEntry: (entryId: string) => void;
  readonly onHangInSky: (entryId: string) => void;
  readonly onOpenCrtDesk: () => void;
  readonly onClose: () => void;
}

const AllSkyChartSvg: React.FC<{ raDeg: number; decDeg: number; label: string }> = ({
  raDeg,
  decDeg,
  label,
}) => {
  const width = 260;
  const height = 108;
  const padX = 14;
  const padY = 10;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;

  const x = padX + ((360 - raDeg) / 360) * plotW;
  const y = padY + ((90 - decDeg) / 180) * plotH;
  const eqY = padY + plotH / 2;

  return (
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
        fill="#070a17"
        stroke="#4f6d9e"
        strokeWidth="1.5"
      />
      <line
        x1={padX}
        y1={eqY}
        x2={padX + plotW}
        y2={eqY}
        stroke="#6b96db"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={padX + plotW * f}
          y1={padY}
          x2={padX + plotW * f}
          y2={padY + plotH}
          stroke="#1d2847"
          strokeWidth="0.8"
        />
      ))}
      <text x={padX + 4} y={padY + 9} fill="#90aedb" fontSize="7.5" fontFamily="monospace">
        +90° N
      </text>
      <text x={padX + 4} y={eqY - 3} fill="#b3d4ff" fontSize="7.5" fontFamily="monospace">
        δ=0° EQUATOR
      </text>
      <text x={padX + 4} y={padY + plotH - 3} fill="#90aedb" fontSize="7.5" fontFamily="monospace">
        −90° S
      </text>
      <circle cx={x} cy={y} r="7" fill="none" stroke="#f2c46d" strokeWidth="1.4" />
      <line x1={x - 10} y1={y} x2={x + 10} y2={y} stroke="#f2c46d" strokeWidth="1" />
      <line x1={x} y1={y - 10} x2={x} y2={y + 10} stroke="#f2c46d" strokeWidth="1" />
      <rect x={x - 2} y={y - 2} width="4" height="4" fill="#fff0bd" />
    </svg>
  );
};

export const StarAtlasModal: React.FC<StarAtlasModalProps> = ({
  demoMode,
  inspectedCollectionEntryId,
  activeHemisphere,
  unlockedEntryIds,
  observedSourceIds,
  onSelectEntry,
  onHangInSky,
  onOpenCrtDesk,
  onClose,
}) => {
  const [invertPlate, setInvertPlate] = useState<boolean>(false);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [coreZoom, setCoreZoom] = useState<boolean>(false);
  const [showReticle, setShowReticle] = useState<boolean>(true);

  const unlockedEntries = DEMO_COLLECTION_ENTRIES.filter((c) => unlockedEntryIds.has(c.entryId));

  if (unlockedEntries.length === 0) {
    return (
      <div
        className="pixel-modal-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="atlas-modal-title"
        onClick={onClose}
      >
        <div className="pixel-frame atlas-folio-frame" onClick={(e) => e.stopPropagation()}>
          <div className="crt-bezel-header atlas-header">
            <div className="crt-title-cluster">
              <h2 id="atlas-modal-title" className="pixel-heading">
                ILLUMINATED STAR ATLAS
              </h2>
              <span className="pixel-tag tag-brass">
                {demoMode === 'progression' ? 'PROGRESSION FOLIO · 0 CATALOGED' : 'DEMO COLLECTION'}
              </span>
            </div>
            <button type="button" className="pixel-mini-btn" onClick={onClose}>
              [ESC] CLOSE ATLAS
            </button>
          </div>
          <div className="atlas-empty-state" data-testid="atlas-empty-state">
            <h3 className="atlas-subject-heading">NO GALAXIES CATALOGED YET</h3>
            <p className="atlas-note">
              Just like a live Zooniverse workflow, Sky Garden does not reveal galaxies in your
              atlas until you classify incoming survey subjects at the Blink Comparator CRT.
            </p>
            <button type="button" className="pixel-btn-primary" onClick={onOpenCrtDesk}>
              GO TO BLINK COMPARATOR DESK →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedEntry =
    unlockedEntries.find((c) => c.entryId === inspectedCollectionEntryId) ?? unlockedEntries[0];
  const galaxy = getSourceGalaxy(selectedEntry.sourceGalaxyId)!;

  const filterParts: string[] = [];
  if (invertPlate) filterParts.push('invert(1) hue-rotate(180deg)');
  if (highContrast) filterParts.push('contrast(1.48) brightness(1.12)');
  const inspectorFilterCss = filterParts.length > 0 ? filterParts.join(' ') : 'none';

  return (
    <div
      className="pixel-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="atlas-modal-title"
      onClick={onClose}
    >
      <div className="pixel-frame atlas-folio-frame" onClick={(e) => e.stopPropagation()}>
        <div className="crt-bezel-header atlas-header">
          <div className="crt-title-cluster">
            <h2 id="atlas-modal-title" className="pixel-heading">
              ILLUMINATED STAR ATLAS
            </h2>
            <span className="pixel-tag tag-brass">
              {unlockedEntries.length}/{DEMO_COLLECTION_ENTRIES.length} CATALOGED · UNMODIFIED
              SOURCES
            </span>
          </div>
          <button type="button" className="pixel-mini-btn" onClick={onClose}>
            [ESC] CLOSE ATLAS
          </button>
        </div>

        <div className="atlas-pages-grid">
          {/* Left Page: Folio Index */}
          <div className="atlas-left-page">
            <p className="atlas-page-caption">
              {demoMode === 'progression'
                ? 'Subjects you have logged at the Blink Comparator. Removing a galaxy from your sky never deletes its scientific record.'
                : 'Bundled CC BY 4.0 survey plates. Removing a galaxy from the sky never deletes it from this atlas.'}
            </p>
            <ul className="atlas-entry-list" aria-label="Demo Galaxy Collection">
              {unlockedEntries.map((entry) => {
                const g = getSourceGalaxy(entry.sourceGalaxyId);
                if (!g) return null;
                const isSelected = entry.entryId === selectedEntry.entryId;
                const isObserved = observedSourceIds.has(g.id);
                const coordStatus = g.skyCoordinates.status;

                return (
                  <li
                    key={entry.entryId}
                    className={`atlas-entry-row ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => onSelectEntry(entry.entryId)}
                    data-testid={`collection-card-${g.id}`}
                  >
                    <img src={g.originalImageUrl} alt={g.catalogName} className="atlas-row-thumb" />
                    <div className="atlas-row-text">
                      <div className="atlas-row-top">
                        <strong>{g.catalogName}</strong>
                        <span className={`pixel-micro-tag status-${coordStatus}`}>
                          {coordStatus === 'verified' ? 'J2000' : 'NO COORDS'}
                        </span>
                      </div>
                      <span className="atlas-row-sub">
                        {isObserved ? '★ Practice Logged · ' : ''}
                        {g.commonTitle}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right Page: Immutable Scientific Record */}
          <div className="atlas-right-page">
            <div className="atlas-plate-row">
              <div className="atlas-cutout-box">
                <img
                  src={galaxy.originalImageUrl}
                  alt={`Original unmodified survey cutout of ${galaxy.catalogName}`}
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
                      stroke="rgba(242, 196, 109, 0.6)"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <line x1="14" y1="186" x2="64" y2="186" stroke="#f2c46d" strokeWidth="1.6" />
                    <text x="14" y="178" fill="#f2c46d" fontSize="8.5" fontFamily="monospace">
                      {((galaxy.provenance.angularFieldArcmin * 0.25) / (coreZoom ? 2 : 1)).toFixed(
                        2,
                      )}
                      ′ arcmin
                    </text>
                  </svg>
                )}
              </div>

              <div className="atlas-plate-side">
                <h3 className="atlas-subject-heading">{galaxy.catalogName}</h3>
                <span className="atlas-subject-subtitle">{galaxy.commonTitle}</span>
                <p className="atlas-note">{galaxy.morphologyNote}</p>
                <p className="atlas-science-callout">{galaxy.scienceContext}</p>

                <div className="crt-hardware-switches">
                  <button
                    type="button"
                    aria-pressed={invertPlate}
                    className={`pixel-switch-btn ${invertPlate ? 'is-on' : ''}`}
                    onClick={() => setInvertPlate((v) => !v)}
                  >
                    ◐ Invert
                  </button>
                  <button
                    type="button"
                    aria-pressed={highContrast}
                    className={`pixel-switch-btn ${highContrast ? 'is-on' : ''}`}
                    onClick={() => setHighContrast((v) => !v)}
                  >
                    ◑ Contrast
                  </button>
                  <button
                    type="button"
                    aria-pressed={coreZoom}
                    className={`pixel-switch-btn ${coreZoom ? 'is-on' : ''}`}
                    onClick={() => setCoreZoom((v) => !v)}
                  >
                    ⊕ 2× Core
                  </button>
                  <button
                    type="button"
                    aria-pressed={showReticle}
                    className={`pixel-switch-btn ${showReticle ? 'is-on' : ''}`}
                    onClick={() => setShowReticle((v) => !v)}
                  >
                    ⌖ Scale
                  </button>
                </div>

                <button
                  type="button"
                  className="pixel-btn-primary"
                  onClick={() => onHangInSky(selectedEntry.entryId)}
                  aria-label={`Place ${galaxy.catalogName} in ${activeHemisphere} sky`}
                >
                  + HANG IN {activeHemisphere.toUpperCase()} SKY
                </button>
                <div className="atlas-community-links">
                  <a
                    href={galaxy.provenance.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pixel-mini-btn pixel-ext-link"
                  >
                    SURVEY SOURCE ↗
                  </a>
                  <a
                    href={GALAXY_ZOO_TALK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pixel-mini-btn btn-cyan pixel-ext-link"
                  >
                    GALAXY ZOO TALK ↗
                  </a>
                </div>
              </div>
            </div>

            {/* Verified Coordinates vs Withheld Notice */}
            <div className="real-coords-box" data-testid="real-coordinates-box">
              <div className="real-coords-header">
                <strong>REAL ASTRONOMICAL SKY LOCATION</strong>
                {galaxy.skyCoordinates.status === 'verified' ? (
                  <span className="pixel-micro-tag status-verified">
                    Verified {galaxy.skyCoordinates.frame}
                  </span>
                ) : (
                  <span className="pixel-micro-tag status-unavailable">Unavailable</span>
                )}
              </div>

              {galaxy.skyCoordinates.status === 'verified' ? (
                <div className="atlas-coords-split">
                  <dl className="coords-dl">
                    <div>
                      <dt>Right Ascension</dt>
                      <dd>
                        {galaxy.skyCoordinates.raHms} ({galaxy.skyCoordinates.raDeg.toFixed(3)}°)
                      </dd>
                    </div>
                    <div>
                      <dt>Declination</dt>
                      <dd>
                        {galaxy.skyCoordinates.decDms} ({galaxy.skyCoordinates.decDeg.toFixed(3)}°)
                      </dd>
                    </div>
                    <div>
                      <dt>Constellation</dt>
                      <dd>{galaxy.skyCoordinates.constellation}</dd>
                    </div>
                    <div>
                      <dt>Provenance</dt>
                      <dd>
                        {galaxy.provenance.survey} · {galaxy.provenance.dataRelease} (
                        {galaxy.provenance.license})
                      </dd>
                    </div>
                  </dl>
                  <AllSkyChartSvg
                    raDeg={galaxy.skyCoordinates.raDeg}
                    decDeg={galaxy.skyCoordinates.decDeg}
                    label={galaxy.catalogName}
                  />
                </div>
              ) : (
                <p className="coords-unavailable-msg">
                  Real sky coordinates unavailable: {galaxy.skyCoordinates.reason}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
