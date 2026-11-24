import React, { useMemo, useRef, useState } from 'react';
import {
  playClick,
  playObservationLogged,
  playStepAdvance,
  playStepBack,
} from '../audio/observatoryAudio';
import {
  GALAXY_ZOO_TALK_URL,
  OFFLINE_PRACTICE_AI_DISCLOSURE,
} from '../data/aiEthicsCharter';
import { getCollectionEntryBySourceId, SOURCE_GALAXIES } from '../data/demoCatalog';
import {
  DEMO_GALAXY_ZOO_WORKFLOW,
  GALAXY_ZOO_FAQ_URL,
  GALAXY_ZOO_HELP_BOARD_URL,
  GALAXY_ZOO_HELP_GUIDE_URL,
  type PanoptesWorkflow,
  summarizeAnnotations,
} from '../data/galaxyZooWorkflow';
import {
  fetchPublicPanoptesWorkflow,
  parsePanoptesWorkflowJson,
} from '../services/panoptesWorkflowAdapter';
import type { ObservationRewardResult } from '../state/useSkyGardenState';
import type { DemoMode, PanoptesAnnotation, PracticeObservation } from '../types/skyGarden';
import { MorphologyGlyph } from './MorphologyGlyph';
import { SafeMarkdownBlock } from './SafeMarkdownBlock';

interface ClassificationCrtModalProps {
  readonly demoMode: DemoMode;
  readonly stardust: number;
  readonly unlockedEntryIds: ReadonlySet<string>;
  readonly observedSourceIds: ReadonlySet<string>;
  readonly practiceCount: number;
  readonly onRecordObservation: (obs: Omit<PracticeObservation, 'observedAtIso'>) => ObservationRewardResult;
  readonly onHangGalaxyAtScope: (collectionEntryId: string) => void;
  readonly onOpenEthics?: () => void;
  readonly onClose: () => void;
}

type ZoomLevel = 1 | 2 | 4;

interface DecisionStep {
  readonly taskId: string;
  readonly answerIndex: number;
}

interface StretchPreset {
  readonly label: string;
  readonly brightness: number;
  readonly contrast: number;
}

const STRETCH_PRESETS: readonly StretchPreset[] = [
  { label: 'STANDARD', brightness: 100, contrast: 100 },
  { label: 'FAINT SHELLS', brightness: 128, contrast: 165 },
  { label: 'BRIGHT CORE', brightness: 82, contrast: 145 },
];

const ZOOM_LEVELS: readonly ZoomLevel[] = [1, 2, 4];

function getMaxPanPct(zoom: ZoomLevel): number {
  return ((zoom - 1) / 2) * 100;
}

function clampPan(pan: { x: number; y: number }, zoom: ZoomLevel): { x: number; y: number } {
  const limit = getMaxPanPct(zoom);
  if (limit === 0) return { x: 0, y: 0 };
  return {
    x: Math.max(-limit, Math.min(limit, pan.x)),
    y: Math.max(-limit, Math.min(limit, pan.y)),
  };
}

export const ClassificationCrtModal: React.FC<ClassificationCrtModalProps> = ({
  demoMode,
  stardust,
  unlockedEntryIds,
  observedSourceIds,
  practiceCount,
  onRecordObservation,
  onHangGalaxyAtScope,
  onOpenEthics,
  onClose,
}) => {
  const [workflow, setWorkflow] = useState<PanoptesWorkflow>(DEMO_GALAXY_ZOO_WORKFLOW);
  const [workflowWarnings, setWorkflowWarnings] = useState<readonly string[]>([]);
  const [sourcePanelOpen, setSourcePanelOpen] = useState<boolean>(false);
  const [panoptesIdInput, setPanoptesIdInput] = useState<string>('20751');
  const [panoptesJsonInput, setPanoptesJsonInput] = useState<string>('');
  const [workflowLoading, setWorkflowLoading] = useState<boolean>(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  const availableGalaxies = useMemo(() => {
    if (demoMode === 'sandbox') return SOURCE_GALAXIES;
    const unlockedList = SOURCE_GALAXIES.filter((g) => {
      const entry = getCollectionEntryBySourceId(g.id);
      return entry ? unlockedEntryIds.has(entry.entryId) : false;
    });
    const nextIncoming = SOURCE_GALAXIES.find((g) => {
      const entry = getCollectionEntryBySourceId(g.id);
      return entry ? !unlockedEntryIds.has(entry.entryId) : false;
    });
    return nextIncoming ? [...unlockedList, nextIncoming] : unlockedList;
  }, [demoMode, unlockedEntryIds]);

  const initialIndex = useMemo(() => {
    if (demoMode === 'progression') {
      const incomingIdx = availableGalaxies.findIndex((g) => {
        const entry = getCollectionEntryBySourceId(g.id);
        return entry ? !unlockedEntryIds.has(entry.entryId) : false;
      });
      return incomingIdx >= 0 ? incomingIdx : 0;
    }
    const firstUnobserved = availableGalaxies.findIndex((g) => !observedSourceIds.has(g.id));
    return firstUnobserved >= 0 ? firstUnobserved : 0;
  }, [availableGalaxies, demoMode, observedSourceIds, unlockedEntryIds]);

  const [subjectIndex, setSubjectIndex] = useState<number>(initialIndex);

  // Optical inspection state (ungated from second zero)
  const [invertPlate, setInvertPlate] = useState<boolean>(false);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [showScale, setShowScale] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(1);
  const [panPct, setPanPct] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const panDragRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    originPanX: number;
    originPanY: number;
  } | null>(null);

  // Panoptes-shaped branching wizard state (nothing pre-selected)
  const [stepHistory, setStepHistory] = useState<readonly DecisionStep[]>([]);
  const [currentTaskId, setCurrentTaskId] = useState<string>(workflow.first_task);
  const [pickedAnswerIndex, setPickedAnswerIndex] = useState<number | null>(null);
  const [fieldGuideOpen, setFieldGuideOpen] = useState<boolean>(false);
  const [lastLoggedTrail, setLastLoggedTrail] = useState<readonly PanoptesAnnotation[]>([]);
  const [lastReward, setLastReward] = useState<{
    subjectId: string;
    newlyUnlocked: boolean;
    stardustEarned: number;
  } | null>(null);

  const safeIndex = Math.min(subjectIndex, Math.max(0, availableGalaxies.length - 1));
  const subject = availableGalaxies[safeIndex] ?? SOURCE_GALAXIES[0];
  const linkedEntry = getCollectionEntryBySourceId(subject.id);
  const isSubjectUnlocked =
    demoMode === 'sandbox' || (linkedEntry ? unlockedEntryIds.has(linkedEntry.entryId) : false);
  const hasMoreIncoming =
    demoMode === 'progression' && unlockedEntryIds.size < SOURCE_GALAXIES.length;

  const activeTask = workflow.tasks[currentTaskId] ?? workflow.tasks[workflow.first_task];
  const selectedAnswer =
    pickedAnswerIndex !== null ? activeTask.answers[pickedAnswerIndex] : undefined;
  const canSubmit = Boolean(selectedAnswer && selectedAnswer.next === '');

  const filterParts: string[] = [];
  if (invertPlate) filterParts.push('invert(1) hue-rotate(180deg)');
  if (brightness !== 100) filterParts.push(`brightness(${(brightness / 100).toFixed(2)})`);
  if (contrast !== 100) filterParts.push(`contrast(${(contrast / 100).toFixed(2)})`);
  const plateFilterCss = filterParts.length > 0 ? filterParts.join(' ') : 'none';

  const applyZoom = (nextZoom: ZoomLevel) => {
    setZoomLevel(nextZoom);
    setPanPct((prev) => clampPan(prev, nextZoom));
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanPct({ x: 0, y: 0 });
    setIsPanning(false);
    panDragRef.current = null;
  };

  const resetOptics = () => {
    setInvertPlate(false);
    setBrightness(100);
    setContrast(100);
  };

  const resetTreeSession = (targetWorkflow: PanoptesWorkflow = workflow) => {
    setStepHistory([]);
    setCurrentTaskId(targetWorkflow.first_task);
    setPickedAnswerIndex(null);
    setLastLoggedTrail([]);
    setLastReward(null);
  };

  const applyLoadedWorkflow = (
    nextWorkflow: PanoptesWorkflow,
    warnings: readonly string[],
  ) => {
    setWorkflow(nextWorkflow);
    setWorkflowWarnings(warnings);
    setWorkflowError(null);
    resetTreeSession(nextWorkflow);
  };

  const handleFetchPanoptesId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (workflowLoading) return;
    playClick();
    setWorkflowLoading(true);
    setWorkflowError(null);
    const result = await fetchPublicPanoptesWorkflow(panoptesIdInput);
    setWorkflowLoading(false);
    if ('error' in result) {
      setWorkflowError(result.error);
      return;
    }
    applyLoadedWorkflow(result.workflow, result.warnings);
  };

  const handleLoadPanoptesJson = () => {
    playClick();
    const result = parsePanoptesWorkflowJson(panoptesJsonInput);
    if ('error' in result) {
      setWorkflowError(result.error);
      return;
    }
    applyLoadedWorkflow(result.workflow, result.warnings);
  };

  const handleResetToDemoWorkflow = () => {
    playClick();
    applyLoadedWorkflow(DEMO_GALAXY_ZOO_WORKFLOW, []);
  };

  const stepSubject = (delta: number) => {
    if (availableGalaxies.length === 0) return;
    const nextIdx = (safeIndex + delta + availableGalaxies.length) % availableGalaxies.length;
    setSubjectIndex(nextIdx);
    resetTreeSession();
    resetView();
  };

  const goToNextIncoming = () => {
    const incomingIdx = availableGalaxies.findIndex((g) => {
      const entry = getCollectionEntryBySourceId(g.id);
      return entry ? !unlockedEntryIds.has(entry.entryId) : false;
    });
    if (incomingIdx >= 0) {
      setSubjectIndex(incomingIdx);
      resetTreeSession();
      resetView();
    } else {
      stepSubject(1);
    }
  };

  const handleViewportPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      zoomLevel <= 1 ||
      (e.button ?? 0) !== 0 ||
      !Number.isFinite(e.clientX) ||
      !Number.isFinite(e.clientY)
    ) {
      return;
    }
    e.currentTarget.setPointerCapture?.(e.pointerId);
    panDragRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      originPanX: panPct.x,
      originPanY: panPct.y,
    };
    setIsPanning(true);
  };

  const handleViewportPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = panDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (!Number.isFinite(e.clientX) || !Number.isFinite(e.clientY)) return;
    const rect = viewportRef.current?.getBoundingClientRect();
    const width = rect && rect.width > 0 ? rect.width : 280;
    const height = rect && rect.height > 0 ? rect.height : width;
    const dxPct = ((e.clientX - drag.startClientX) / width) * 100;
    const dyPct = ((e.clientY - drag.startClientY) / height) * 100;
    setPanPct(
      clampPan(
        {
          x: drag.originPanX + dxPct,
          y: drag.originPanY + dyPct,
        },
        zoomLevel,
      ),
    );
  };

  const handleViewportPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = panDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    panDragRef.current = null;
    setIsPanning(false);
  };

  const handleViewportWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const currentIdx = ZOOM_LEVELS.indexOf(zoomLevel);
    if (e.deltaY < 0 && currentIdx < ZOOM_LEVELS.length - 1) {
      applyZoom(ZOOM_LEVELS[currentIdx + 1]);
    } else if (e.deltaY > 0 && currentIdx > 0) {
      applyZoom(ZOOM_LEVELS[currentIdx - 1]);
    }
  };

  const handleSelectAnswer = (idx: number) => {
    const option = activeTask.answers[idx];
    if (!option) return;
    if (option.next !== '' && workflow.tasks[option.next]) {
      playStepAdvance();
      setStepHistory((prev) => [...prev, { taskId: currentTaskId, answerIndex: idx }]);
      setCurrentTaskId(option.next);
      setPickedAnswerIndex(null);
      return;
    }
    playClick();
    setPickedAnswerIndex(idx);
  };

  const handleStepBack = () => {
    if (stepHistory.length === 0) return;
    playStepBack();
    const previous = stepHistory[stepHistory.length - 1];
    setStepHistory((prev) => prev.slice(0, -1));
    setCurrentTaskId(previous.taskId);
    setPickedAnswerIndex(previous.answerIndex);
  };

  const handleJumpToStep = (historyIndex: number) => {
    const target = stepHistory[historyIndex];
    if (!target) return;
    playStepBack();
    setStepHistory((prev) => prev.slice(0, historyIndex));
    setCurrentTaskId(target.taskId);
    setPickedAnswerIndex(target.answerIndex);
  };

  const handleLogObservation = () => {
    if (pickedAnswerIndex === null || !selectedAnswer || selectedAnswer.next !== '') {
      return;
    }
    const trail: DecisionStep[] = [
      ...stepHistory,
      { taskId: currentTaskId, answerIndex: pickedAnswerIndex },
    ];
    const annotations: PanoptesAnnotation[] = trail.map((step) => {
      const task = workflow.tasks[step.taskId];
      const answer = task?.answers[step.answerIndex];
      return {
        task: step.taskId,
        value: step.answerIndex,
        taskLabel: task?.shortTitle,
        answerLabel: answer?.label,
      };
    });
    const summary = summarizeAnnotations(workflow, annotations);
    const reward = onRecordObservation({
      sourceGalaxyId: subject.id,
      primaryMorphology: summary.primaryMorphology,
      detailChoice: summary.detailChoice,
      oddityNote: summary.oddityNote,
      workflowId: workflow.id,
      workflowVersion: workflow.version,
      annotations,
    });
    playObservationLogged();
    setLastLoggedTrail(annotations);
    setLastReward({
      subjectId: subject.id,
      newlyUnlocked: reward.newlyUnlocked,
      stardustEarned: reward.stardustEarned,
    });
  };

  const isViewDefault = zoomLevel === 1 && panPct.x === 0 && panPct.y === 0;
  const isOpticsFlat = !invertPlate && brightness === 100 && contrast === 100;

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
            {demoMode === 'progression' && (
              <span className="pixel-tag tag-brass">✦ {stardust} STARDUST</span>
            )}
            <span className="crt-tally">LOGGED: {practiceCount}</span>
            <button type="button" className="pixel-mini-btn" onClick={onClose}>
              [ESC] LEAVE DESK
            </button>
          </div>
        </div>

        <div className="crt-workflow-disclosure" data-testid="crt-workflow-disclosure">
          <div className="crt-workflow-disclosure-copy">
            <span className="pixel-tag tag-cyan">
              {workflow.sourceKind && workflow.sourceKind !== 'offline-demo'
                ? `PANOPTES READ-ONLY · #${workflow.id}`
                : OFFLINE_PRACTICE_AI_DISCLOSURE.workflowBadge}
            </span>
            <span>
              {workflow.sourceKind && workflow.sourceKind !== 'offline-demo'
                ? `Previewing "${workflow.display_name}" (v${workflow.version}) against bundled CC BY 4.0 stamps — zero live submissions.`
                : 'Offline Panoptes-shaped Calibration Onramp on unmodified CC BY 4.0 survey stamps — zero ML pre-sorting or model training in loop. Zoom, pan, and stretch controls are never gated, and Stardust is flat (+3 once per unique subject).'}
            </span>
          </div>
          <div className="crt-workflow-disclosure-actions">
            <button
              type="button"
              data-testid="crt-workflow-source-toggle"
              aria-expanded={sourcePanelOpen}
              className={`pixel-mini-btn ${sourcePanelOpen ? 'is-on' : ''}`}
              onClick={() => {
                playClick();
                setSourcePanelOpen((v) => !v);
              }}
            >
              ⚙ WORKFLOW SOURCE
            </button>
            {onOpenEthics && (
              <button type="button" className="pixel-mini-btn btn-cyan" onClick={onOpenEthics}>
                [i] AI &amp; DATA ETHICS
              </button>
            )}
          </div>
        </div>

        {sourcePanelOpen && (
          <div className="crt-workflow-source-panel" data-testid="crt-workflow-source-panel">
            <div className="crt-workflow-source-header">
              <span>
                <strong>ACTIVE TREE:</strong> {workflow.display_name} (
                {Object.keys(workflow.tasks).length} tasks · v{workflow.version})
              </span>
              <div className="crt-workflow-source-badges">
                <span className="pixel-tag tag-amber">READ-ONLY · ZERO LIVE SUBMISSIONS</span>
                {workflow.sourceKind && workflow.sourceKind !== 'offline-demo' && (
                  <button
                    type="button"
                    data-testid="panoptes-reset-demo-btn"
                    className="pixel-mini-btn"
                    onClick={handleResetToDemoWorkflow}
                  >
                    RESET TO OFFLINE DEMO
                  </button>
                )}
              </div>
            </div>

            <div className="crt-workflow-source-grid">
              <form className="crt-workflow-source-row" onSubmit={handleFetchPanoptesId}>
                <label htmlFor="panoptes-wf-id" className="crt-source-label">
                  PUBLIC ZOONIVERSE WORKFLOW ID
                </label>
                <div className="crt-source-inline">
                  <input
                    id="panoptes-wf-id"
                    data-testid="panoptes-workflow-id-input"
                    type="text"
                    className="pixel-input"
                    value={panoptesIdInput}
                    onChange={(e) => setPanoptesIdInput(e.target.value)}
                    placeholder="e.g. 20751 or 5733"
                  />
                  <button
                    type="submit"
                    data-testid="panoptes-load-id-btn"
                    className="pixel-mini-btn btn-cyan"
                    disabled={workflowLoading}
                  >
                    {workflowLoading ? 'FETCHING...' : 'LOAD PUBLIC ID'}
                  </button>
                </div>
              </form>

              <div className="crt-workflow-source-row">
                <label htmlFor="panoptes-wf-json" className="crt-source-label">
                  OR PASTE PANOPTES WORKFLOW JSON (OFFLINE)
                </label>
                <div className="crt-source-inline">
                  <textarea
                    id="panoptes-wf-json"
                    data-testid="panoptes-json-input"
                    className="pixel-input crt-workflow-json-area"
                    rows={1}
                    value={panoptesJsonInput}
                    onChange={(e) => setPanoptesJsonInput(e.target.value)}
                    placeholder='{"workflows":[{"id":"20751","first_task":"T0","tasks":{...}}]}'
                  />
                  <button
                    type="button"
                    data-testid="panoptes-json-load-btn"
                    className="pixel-mini-btn"
                    disabled={panoptesJsonInput.trim().length === 0}
                    onClick={handleLoadPanoptesJson}
                  >
                    LOAD JSON
                  </button>
                </div>
              </div>
            </div>

            {workflowError && (
              <p className="crt-workflow-error" role="alert">
                {workflowError}
              </p>
            )}
            {workflowWarnings.length > 0 && (
              <div className="crt-workflow-warnings" data-testid="panoptes-adapter-warnings">
                {workflowWarnings.map((w, idx) => (
                  <span key={idx}>• {w}</span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="crt-split-grid">
          {/* Left Optical Plate Viewport + Ungated Optical Controls */}
          <div className="crt-plate-column">
            <div className="crt-subject-switcher">
              <button
                type="button"
                className="pixel-mini-btn"
                disabled={availableGalaxies.length <= 1}
                onClick={() => stepSubject(-1)}
              >
                ◀ PREV
              </button>
              <span className="crt-subject-counter">
                {!isSubjectUnlocked
                  ? `INCOMING SURVEY SUBJECT · ${safeIndex + 1}/${SOURCE_GALAXIES.length}`
                  : `PLATE ${safeIndex + 1}/${availableGalaxies.length} · ${subject.catalogName}`}
              </span>
              <button
                type="button"
                className="pixel-mini-btn"
                disabled={availableGalaxies.length <= 1}
                onClick={() => stepSubject(1)}
              >
                NEXT ▶
              </button>
            </div>

            <div
              ref={viewportRef}
              data-testid="crt-optical-viewport"
              className={`crt-optical-viewport ${zoomLevel > 1 ? 'is-zoomed' : ''} ${isPanning ? 'is-panning' : ''}`}
              onPointerDown={handleViewportPointerDown}
              onPointerMove={handleViewportPointerMove}
              onPointerUp={handleViewportPointerEnd}
              onPointerCancel={handleViewportPointerEnd}
              onWheel={handleViewportWheel}
              title={
                zoomLevel > 1
                  ? 'Drag inside the viewport to pan across faint outer features'
                  : 'Use 2× / 4× zoom or scroll wheel to inspect outer shells & companions'
              }
            >
              <img
                src={subject.originalImageUrl}
                alt={
                  isSubjectUnlocked
                    ? `Survey cutout of ${subject.catalogName}`
                    : 'Incoming unclassified galaxy survey cutout'
                }
                draggable={false}
                className="raw-cutout-img"
                style={{
                  filter: plateFilterCss,
                  transform: `translate(${panPct.x.toFixed(1)}%, ${panPct.y.toFixed(1)}%) scale(${zoomLevel})`,
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
                    {((subject.provenance.angularFieldArcmin * 0.25) / zoomLevel).toFixed(2)}′ arcmin
                  </text>
                </svg>
              )}
              {zoomLevel > 1 && (
                <span className="crt-pan-hint">{zoomLevel}× DRAG TO PAN</span>
              )}
            </div>

            {/* Ungated Hardware Magnification & Overlay Switches */}
            <div
              className="crt-hardware-switches three-col"
              role="group"
              aria-label="Zoom and plate inspection switches (always unlocked)"
            >
              {ZOOM_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  aria-label={`Zoom ${level}x`}
                  aria-pressed={zoomLevel === level}
                  className={`pixel-switch-btn ${zoomLevel === level ? 'is-on' : ''}`}
                  onClick={() => {
                    playClick();
                    applyZoom(level);
                  }}
                >
                  {level}×
                </button>
              ))}
              <button
                type="button"
                aria-pressed={invertPlate}
                className={`pixel-switch-btn ${invertPlate ? 'is-on' : ''}`}
                onClick={() => {
                  playClick();
                  setInvertPlate((v) => !v);
                }}
              >
                ◐ INVERT
              </button>
              <button
                type="button"
                aria-pressed={showScale}
                className={`pixel-switch-btn ${showScale ? 'is-on' : ''}`}
                onClick={() => {
                  playClick();
                  setShowScale((v) => !v);
                }}
              >
                ⌖ SCALE
              </button>
              <button
                type="button"
                className="pixel-switch-btn"
                disabled={isViewDefault}
                onClick={() => {
                  playClick();
                  resetView();
                }}
              >
                ↺ RESET VIEW
              </button>
            </div>

            {/* Real-Time Optical Brightness & Contrast Stretch Panel */}
            <div className="crt-stretch-panel" aria-label="Optical stretch controls">
              <div className="crt-stretch-header">
                <span className="crt-q-label">OPTICAL STRETCH</span>
                <button
                  type="button"
                  className="pixel-mini-btn"
                  disabled={isOpticsFlat}
                  onClick={resetOptics}
                >
                  ↺ FLAT
                </button>
              </div>
              <div className="crt-preset-row">
                {STRETCH_PRESETS.map((preset) => {
                  const isActive =
                    brightness === preset.brightness && contrast === preset.contrast;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      aria-pressed={isActive}
                      className={`pixel-switch-btn ${isActive ? 'is-on' : ''}`}
                      onClick={() => {
                        setBrightness(preset.brightness);
                        setContrast(preset.contrast);
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              <label className="crt-slider-row">
                <span>BRIGHTNESS {brightness}%</span>
                <input
                  type="range"
                  data-testid="crt-brightness-slider"
                  aria-label="Plate brightness"
                  min={55}
                  max={165}
                  step={5}
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                />
              </label>
              <label className="crt-slider-row">
                <span>CONTRAST {contrast}%</span>
                <input
                  type="range"
                  data-testid="crt-contrast-slider"
                  aria-label="Plate contrast"
                  min={70}
                  max={220}
                  step={5}
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                />
              </label>
            </div>
          </div>

          {/* Right Panoptes Step-by-Step Morphology Decision Tree */}
          <div className="crt-questions-column">
            {lastReward?.subjectId === subject.id ? (
              <div className="crt-logged-feedback" role="status">
                <strong>
                  {lastReward.newlyUnlocked
                    ? `★ PRACTICE OBSERVATION LOGGED — UNLOCKED ${subject.catalogName} (+${lastReward.stardustEarned} ✦ STARDUST)`
                    : `★ PRACTICE OBSERVATION LOGGED (${subject.catalogName})`}
                </strong>
                {lastLoggedTrail.length > 0 && (
                  <div className="crt-breadcrumbs" aria-label="Recorded annotation trail">
                    {lastLoggedTrail.map((step, i) => (
                      <span key={`${step.task}-${i}`} className="crt-trail-chip is-done">
                        {step.task}: {step.answerLabel}
                      </span>
                    ))}
                  </div>
                )}
                <p>{subject.morphologyNote}</p>
                {demoMode === 'progression' && !lastReward.newlyUnlocked && (
                  <small>
                    Already cataloged in your Star Atlas — Stardust is granted once per unique
                    subject.
                  </small>
                )}
                <div className="crt-logged-actions">
                  {hasMoreIncoming ? (
                    <button type="button" className="pixel-mini-btn" onClick={goToNextIncoming}>
                      NEXT INCOMING SUBJECT ▶
                    </button>
                  ) : (
                    <button type="button" className="pixel-mini-btn" onClick={() => stepSubject(1)}>
                      NEXT PLATE ▶
                    </button>
                  )}
                  <button
                    type="button"
                    className="pixel-mini-btn"
                    onClick={() => resetTreeSession()}
                  >
                    RE-CLASSIFY THIS PLATE
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
                  <a
                    href={subject.provenance.sourceUrl}
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
                    title="Discuss galaxy classifications with volunteers & researchers on Zooniverse Talk"
                  >
                    GALAXY ZOO TALK ↗
                  </a>
                </div>
              </div>
            ) : (
              <>
                {stepHistory.length > 0 && (
                  <div className="crt-breadcrumbs" aria-label="Decision path">
                    {stepHistory.map((step, idx) => {
                      const prevTask = workflow.tasks[step.taskId];
                      const prevAnswer = prevTask?.answers[step.answerIndex];
                      return (
                        <button
                          key={`${step.taskId}-${idx}`}
                          type="button"
                          className="crt-trail-chip"
                          title={`Jump back to ${prevTask?.shortTitle ?? step.taskId}`}
                          onClick={() => handleJumpToStep(idx)}
                        >
                          {idx + 1}. {prevAnswer?.label ?? step.taskId}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="crt-step-header">
                  <span className="crt-q-label">
                    STEP {stepHistory.length + 1} · {activeTask.shortTitle.toUpperCase()} ({currentTaskId})
                  </span>
                  <div className="crt-step-actions">
                    <button
                      type="button"
                      className="pixel-mini-btn"
                      disabled={stepHistory.length === 0}
                      onClick={handleStepBack}
                    >
                      ◀ BACK
                    </button>
                    <button
                      type="button"
                      data-testid="crt-field-guide-toggle"
                      aria-expanded={fieldGuideOpen}
                      className={`pixel-switch-btn ${fieldGuideOpen ? 'is-on' : ''}`}
                      onClick={() => {
                        playClick();
                        setFieldGuideOpen((v) => !v);
                      }}
                    >
                      [?] FIELD GUIDE
                    </button>
                  </div>
                </div>

                <h3 className="crt-task-question">{activeTask.question}</h3>

                {fieldGuideOpen && (
                  <div
                    className="crt-field-guide-drawer"
                    data-testid="crt-field-guide-drawer"
                  >
                    {activeTask.helpTip && <p className="crt-guide-tip">{activeTask.helpTip}</p>}
                    {activeTask.helpMarkdown && (
                      <SafeMarkdownBlock
                        markdown={activeTask.helpMarkdown}
                        className="crt-guide-tip safe-md-block"
                      />
                    )}
                    {activeTask.fieldGuide.length > 0 && (
                      <div className="crt-guide-cards">
                        {activeTask.fieldGuide.map((item) => (
                          <div key={item.title} className="crt-guide-card">
                            <MorphologyGlyph icon={item.icon} />
                            <div>
                              <strong>{item.title}</strong>
                              <p>{item.body}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {workflow.projectFieldGuide && workflow.projectFieldGuide.length > 0 && (
                      <div className="crt-project-guide-list">
                        <span className="crt-guide-links-label">
                          PROJECT FIELD GUIDE ({workflow.projectFieldGuide.length})
                        </span>
                        {workflow.projectFieldGuide.map((item) => (
                          <details key={item.title} className="crt-project-guide-item">
                            <summary>{item.title}</summary>
                            {item.contentMarkdown && (
                              <SafeMarkdownBlock markdown={item.contentMarkdown} />
                            )}
                          </details>
                        ))}
                      </div>
                    )}
                    <div className="crt-guide-links-bar" data-testid="crt-field-guide-links">
                      {activeTask.referenceLinks && activeTask.referenceLinks.length > 0 && (
                        <div className="crt-guide-links-row">
                          <span className="crt-guide-links-label">
                            REAL EXAMPLES ON ZOONIVERSE:
                          </span>
                          {activeTask.referenceLinks.map((refLink) => (
                            <a
                              key={refLink.url}
                              href={refLink.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="pixel-mini-btn btn-cyan pixel-ext-link"
                            >
                              {refLink.label} ↗
                            </a>
                          ))}
                        </div>
                      )}
                      <div className="crt-guide-links-row">
                        <span className="crt-guide-links-label">ZOONIVERSE GUIDES:</span>
                        <a
                          href={GALAXY_ZOO_HELP_GUIDE_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pixel-mini-btn pixel-ext-link"
                        >
                          NEW TO GALAXY ZOO? HELP GUIDE ↗
                        </a>
                        <a
                          href={GALAXY_ZOO_HELP_BOARD_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pixel-mini-btn pixel-ext-link"
                        >
                          HELP BOARD ↗
                        </a>
                        <a
                          href={GALAXY_ZOO_FAQ_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pixel-mini-btn pixel-ext-link"
                        >
                          GALAXY ZOO FAQ ↗
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                <div className="crt-answer-stack" role="group" aria-label={activeTask.question}>
                  {activeTask.answers.map((opt, idx) => {
                    const isPicked = pickedAnswerIndex === idx;
                    const isTerminal = opt.next === '';
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        aria-pressed={isPicked}
                        className={`crt-choice-btn crt-answer-card ${isPicked ? 'is-picked' : ''}`}
                        onClick={() => handleSelectAnswer(idx)}
                      >
                        <MorphologyGlyph icon={opt.icon} />
                        <div className="crt-answer-copy">
                          <span className="crt-answer-title">{opt.label}</span>
                          <span className="crt-answer-hint">{opt.hint}</span>
                        </div>
                        <span className="crt-answer-route">
                          {isTerminal ? 'FINAL STEP' : 'NEXT →'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="crt-submit-footer">
                  <button
                    type="button"
                    className="pixel-btn-primary crt-submit-btn"
                    disabled={!canSubmit}
                    onClick={handleLogObservation}
                  >
                    LOG PRACTICE OBSERVATION
                  </button>
                  {!canSubmit && (
                    <span className="crt-submit-hint">
                      {activeTask.answers.some((a) => a.next === '')
                        ? 'Choose a final option above to log this practice classification.'
                        : 'Select an answer to advance to the next Galaxy Zoo task.'}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
