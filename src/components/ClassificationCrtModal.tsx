import React, { useMemo, useState } from 'react';
import { getCollectionEntryBySourceId, SOURCE_GALAXIES } from '../data/demoCatalog';
import type { PracticeObservation } from '../types/skyGarden';

interface ClassificationCrtModalProps {
  readonly observedSourceIds: ReadonlySet<string>;
  readonly practiceCount: number;
  readonly onRecordObservation: (obs: Omit<PracticeObservation, 'observedAtIso'>) => void;
  readonly onHangGalaxyAtScope: (collectionEntryId: string) => void;
  readonly onClose: () => void;
}

type PrimaryShape = 'Smooth & Rounded' | 'Disk, Spiral, or Ring' | 'Merging / Tidal Pair';

const DETAIL_OPTIONS: Record<PrimaryShape, readonly string[]> = {
  'Smooth & Rounded': ['Round Spheroid', 'Elongated Elliptical', 'Faint Concentric Shells'],
  'Disk, Spiral, or Ring': [
    'Edge-On Dust Disk',
    'Barred Spiral Arms',
    'Unbarred Spiral Arms',
    'Detached Outer Ring',
  ],
  'Merging / Tidal Pair': [
    'Luminous Tidal Bridge',
    'Collisional Ring + Companion',
    'Overlapping / Close Pair',
  ],
};

const ODDITY_OPTIONS: readonly string[] = [
  'Prominent Dust Lane',
  'Tidal Stream / Shells',
  'Ring Structure',
  'None Stand Out',
];

export const ClassificationCrtModal: React.FC<ClassificationCrtModalProps> = ({
  observedSourceIds,
  practiceCount,
  onRecordObservation,
  onHangGalaxyAtScope,
  onClose,
}) => {
  const initialIndex = useMemo(() => {
    const firstUnobserved = SOURCE_GALAXIES.findIndex((g) => !observedSourceIds.has(g.id));
    return firstUnobserved >= 0 ? firstUnobserved : 0;
  }, [observedSourceIds]);

  const [subjectIndex, setSubjectIndex] = useState<number>(initialIndex);
  const [invertPlate, setInvertPlate] = useState<boolean>(false);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [coreZoom, setCoreZoom] = useState<boolean>(false);
  const [showScale, setShowScale] = useState<boolean>(true);

  const [primaryShape, setPrimaryShape] = useState<PrimaryShape>('Disk, Spiral, or Ring');
  const [detailChoice, setDetailChoice] = useState<string>('Barred Spiral Arms');
  const [oddityNote, setOddityNote] = useState<string>('None Stand Out');
  const [justLoggedId, setJustLoggedId] = useState<string | null>(null);

  const subject = SOURCE_GALAXIES[subjectIndex];
  const linkedEntry = getCollectionEntryBySourceId(subject.id);

  const filterParts: string[] = [];
  if (invertPlate) filterParts.push('invert(1) hue-rotate(180deg)');
  if (highContrast) filterParts.push('contrast(1.48) brightness(1.12)');
  const plateFilterCss = filterParts.length > 0 ? filterParts.join(' ') : 'none';

  const selectPrimary = (next: PrimaryShape) => {
    setPrimaryShape(next);
    setDetailChoice(DETAIL_OPTIONS[next][0]);
  };

  const stepSubject = (delta: number) => {
    const nextIdx = (subjectIndex + delta + SOURCE_GALAXIES.length) % SOURCE_GALAXIES.length;
    setSubjectIndex(nextIdx);
    setJustLoggedId(null);
  };

  const handleLogObservation = () => {
    onRecordObservation({
      sourceGalaxyId: subject.id,
      primaryMorphology: primaryShape,
      detailChoice,
      oddityNote,
    });
    setJustLoggedId(subject.id);
  };

  return (
    <div
      className="pixel-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crt-modal-title"
      onClick={onClose}
    >
      <div className="pixel-frame crt-monitor-bezel" onClick={(e) => e.stopPropagation()}>
        {/* Monitor Top Hardware Bezel */}
        <div className="crt-bezel-header">
          <div className="crt-title-cluster">
            <span className="crt-led" aria-hidden="true" />
            <h2 id="crt-modal-title" className="pixel-heading">
              BLINK COMPARATOR MK-II
            </h2>
            <span className="pixel-tag tag-amber">PRACTICE TERMINAL · NOT LIVE RESEARCH</span>
          </div>
          <div className="crt-header-right">
            <span className="crt-tally">LOGGED: {practiceCount}</span>
            <button type="button" className="pixel-mini-btn" onClick={onClose}>
              [ESC] LEAVE DESK
            </button>
          </div>
        </div>

        <div className="crt-practice-disclaimer">
          Offline practice workflow on bundled open-licensed survey stamps. Inspection tools are
          never gated, and stamps are never awarded for speed or picking a specific label.
        </div>

        <div className="crt-split-grid">
          {/* Left Optical Plate Viewport */}
          <div className="crt-plate-column">
            <div className="crt-subject-switcher">
              <button type="button" className="pixel-mini-btn" onClick={() => stepSubject(-1)}>
                ◀ PREV
              </button>
              <span className="crt-subject-counter">
                PLATE {subjectIndex + 1}/{SOURCE_GALAXIES.length} · {subject.catalogName}
              </span>
              <button type="button" className="pixel-mini-btn" onClick={() => stepSubject(1)}>
                NEXT ▶
              </button>
            </div>

            <div className="crt-optical-viewport">
              <img
                src={subject.originalImageUrl}
                alt={`Survey cutout of ${subject.catalogName}`}
                className="raw-cutout-img"
                style={{
                  filter: plateFilterCss,
                  transform: coreZoom ? 'scale(2)' : 'scale(1)',
                }}
              />
              {showScale && (
                <svg viewBox="0 0 200 200" className="inspector-reticle-overlay" aria-hidden="true">
                  <circle
                    cx="100"
                    cy="100"
                    r="28"
                    fill="none"
                    stroke="rgba(156, 245, 235, 0.55)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <line x1="14" y1="186" x2="64" y2="186" stroke="#9cf5eb" strokeWidth="1.6" />
                  <line x1="14" y1="182" x2="14" y2="190" stroke="#9cf5eb" strokeWidth="1.4" />
                  <line x1="64" y1="182" x2="64" y2="190" stroke="#9cf5eb" strokeWidth="1.4" />
                  <text x="14" y="178" fill="#9cf5eb" fontSize="8.5" fontFamily="monospace">
                    {((subject.provenance.angularFieldArcmin * 0.25) / (coreZoom ? 2 : 1)).toFixed(
                      2,
                    )}
                    ′ arcmin
                  </text>
                </svg>
              )}
            </div>

            {/* Ungated Hardware Switches */}
            <div
              className="crt-hardware-switches"
              role="group"
              aria-label="Optical inspection switches (always unlocked)"
            >
              <button
                type="button"
                aria-pressed={invertPlate}
                className={`pixel-switch-btn ${invertPlate ? 'is-on' : ''}`}
                onClick={() => setInvertPlate((v) => !v)}
              >
                ◐ INVERT
              </button>
              <button
                type="button"
                aria-pressed={highContrast}
                className={`pixel-switch-btn ${highContrast ? 'is-on' : ''}`}
                onClick={() => setHighContrast((v) => !v)}
              >
                ◑ CONTRAST
              </button>
              <button
                type="button"
                aria-pressed={coreZoom}
                className={`pixel-switch-btn ${coreZoom ? 'is-on' : ''}`}
                onClick={() => setCoreZoom((v) => !v)}
              >
                ⊕ 2× CORE
              </button>
              <button
                type="button"
                aria-pressed={showScale}
                className={`pixel-switch-btn ${showScale ? 'is-on' : ''}`}
                onClick={() => setShowScale((v) => !v)}
              >
                ⌖ SCALE
              </button>
            </div>
          </div>

          {/* Right Morphology Decision Tree */}
          <div className="crt-questions-column">
            <div className="crt-question-block">
              <span className="crt-q-label">1. OVERALL MORPHOLOGY</span>
              <div className="crt-choice-grid">
                {(Object.keys(DETAIL_OPTIONS) as PrimaryShape[]).map((shape) => (
                  <button
                    key={shape}
                    type="button"
                    aria-pressed={primaryShape === shape}
                    className={`crt-choice-btn ${primaryShape === shape ? 'is-picked' : ''}`}
                    onClick={() => selectPrimary(shape)}
                  >
                    {shape}
                  </button>
                ))}
              </div>
            </div>

            <div className="crt-question-block">
              <span className="crt-q-label">2. RESOLVED STRUCTURE</span>
              <div className="crt-choice-grid two-col">
                {DETAIL_OPTIONS[primaryShape].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    aria-pressed={detailChoice === opt}
                    className={`crt-choice-btn ${detailChoice === opt ? 'is-picked' : ''}`}
                    onClick={() => setDetailChoice(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="crt-question-block">
              <span className="crt-q-label">3. NOTABLE TIDAL OR DUST FEATURE</span>
              <div className="crt-choice-grid two-col">
                {ODDITY_OPTIONS.map((odd) => (
                  <button
                    key={odd}
                    type="button"
                    aria-pressed={oddityNote === odd}
                    className={`crt-choice-btn ${oddityNote === odd ? 'is-picked' : ''}`}
                    onClick={() => setOddityNote(odd)}
                  >
                    {odd}
                  </button>
                ))}
              </div>
            </div>

            {justLoggedId === subject.id ? (
              <div className="crt-logged-feedback" role="status">
                <strong>★ PRACTICE OBSERVATION LOGGED ({subject.catalogName})</strong>
                <p>{subject.morphologyNote}</p>
                <div className="crt-logged-actions">
                  <button type="button" className="pixel-mini-btn" onClick={() => stepSubject(1)}>
                    NEXT PLATE ▶
                  </button>
                  {linkedEntry && (
                    <button
                      type="button"
                      className="pixel-btn-primary"
                      onClick={() => onHangGalaxyAtScope(linkedEntry.entryId)}
                    >
                      HANG IN SKY AT TELESCOPE →
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="pixel-btn-primary crt-submit-btn"
                onClick={handleLogObservation}
              >
                LOG PRACTICE OBSERVATION
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
