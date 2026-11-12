import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getCelestialDecor,
  getSourceGalaxyForCollectionEntry,
  SKY_BACKGROUNDS,
} from '../data/demoCatalog';
import type { ObjectTransformPatch } from '../state/useSkyGardenState';
import type { PlacedObject, PlacedObjectKind, SceneComposition } from '../types/skyGarden';
import { CelestialDecorGlyph, NebulaLayerSvg, StarfieldSvg } from './CelestialGlyphs';

interface ObservatoryStageProps {
  readonly scene: SceneComposition;
  readonly selectedInstanceId: string | null;
  readonly interactive: boolean;
  readonly exhibitionMode: boolean;
  readonly onSelectObject: (instanceId: string | null) => void;
  readonly onBeginGesture: () => void;
  readonly onUpdateLive: (instanceId: string, patch: ObjectTransformPatch) => void;
  readonly onEndGesture: () => void;
  readonly onPatchDiscrete: (instanceId: string, patch: ObjectTransformPatch) => void;
  readonly onReorderLayer: (
    instanceId: string,
    direction: 'forward' | 'backward' | 'front' | 'back',
  ) => void;
  readonly onRemoveObject: (instanceId: string) => void;
  readonly onDropNewItem: (
    kind: PlacedObjectKind,
    refId: string,
    pos: { x: number; y: number },
  ) => void;
}

type ActivePointerMode =
  | {
      readonly kind: 'move';
      readonly instanceId: string;
      readonly startPointerX: number;
      readonly startPointerY: number;
      readonly startObjX: number;
      readonly startObjY: number;
    }
  | {
      readonly kind: 'scale';
      readonly instanceId: string;
      readonly centerPxX: number;
      readonly centerPxY: number;
      readonly startDist: number;
      readonly startScale: number;
    }
  | {
      readonly kind: 'rotate';
      readonly instanceId: string;
      readonly centerPxX: number;
      readonly centerPxY: number;
      readonly startAngleRad: number;
      readonly startRotationDeg: number;
    };

export const ObservatoryStage: React.FC<ObservatoryStageProps> = ({
  scene,
  selectedInstanceId,
  interactive,
  exhibitionMode,
  onSelectObject,
  onBeginGesture,
  onUpdateLive,
  onEndGesture,
  onPatchDiscrete,
  onReorderLayer,
  onRemoveObject,
  onDropNewItem,
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageWidth, setStageWidth] = useState<number>(960);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const activeGestureRef = useRef<ActivePointerMode | null>(null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) {
        setStageWidth(rect.width);
      }
    };
    updateSize();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateSize);
      observer.observe(el);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const backgroundPreset = useMemo(
    () => SKY_BACKGROUNDS.find((b) => b.id === scene.backgroundId) ?? SKY_BACKGROUNDS[0],
    [scene.backgroundId],
  );

  const orderedObjects = useMemo(
    () => [...scene.objects].sort((a, b) => a.layer - b.layer),
    [scene.objects],
  );

  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    if (e.target === e.currentTarget) {
      onSelectObject(null);
    }
  };

  const startMoveGesture = (e: React.PointerEvent, obj: PlacedObject) => {
    if (!interactive || exhibitionMode) return;
    e.stopPropagation();
    onSelectObject(obj.instanceId);
    onBeginGesture();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    activeGestureRef.current = {
      kind: 'move',
      instanceId: obj.instanceId,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startObjX: obj.x,
      startObjY: obj.y,
    };
  };

  const startScaleGesture = (e: React.PointerEvent, obj: PlacedObject) => {
    if (!interactive || exhibitionMode) return;
    e.stopPropagation();
    e.preventDefault();
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    onSelectObject(obj.instanceId);
    onBeginGesture();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const centerPxX = rect.left + obj.x * rect.width;
    const centerPxY = rect.top + obj.y * rect.height;
    const startDist = Math.max(16, Math.hypot(e.clientX - centerPxX, e.clientY - centerPxY));
    activeGestureRef.current = {
      kind: 'scale',
      instanceId: obj.instanceId,
      centerPxX,
      centerPxY,
      startDist,
      startScale: obj.scale,
    };
  };

  const startRotateGesture = (e: React.PointerEvent, obj: PlacedObject) => {
    if (!interactive || exhibitionMode) return;
    e.stopPropagation();
    e.preventDefault();
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    onSelectObject(obj.instanceId);
    onBeginGesture();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const centerPxX = rect.left + obj.x * rect.width;
    const centerPxY = rect.top + obj.y * rect.height;
    const startAngleRad = Math.atan2(e.clientY - centerPxY, e.clientX - centerPxX);
    activeGestureRef.current = {
      kind: 'rotate',
      instanceId: obj.instanceId,
      centerPxX,
      centerPxY,
      startAngleRad,
      startRotationDeg: obj.rotationDeg,
    };
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const gesture = activeGestureRef.current;
      if (!gesture) return;
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) return;

      if (gesture.kind === 'move') {
        const dx = (e.clientX - gesture.startPointerX) / rect.width;
        const dy = (e.clientY - gesture.startPointerY) / rect.height;
        onUpdateLive(gesture.instanceId, {
          x: gesture.startObjX + dx,
          y: gesture.startObjY + dy,
        });
      } else if (gesture.kind === 'scale') {
        const dist = Math.max(
          10,
          Math.hypot(e.clientX - gesture.centerPxX, e.clientY - gesture.centerPxY),
        );
        const ratio = dist / gesture.startDist;
        onUpdateLive(gesture.instanceId, {
          scale: gesture.startScale * ratio,
        });
      } else if (gesture.kind === 'rotate') {
        const currentAngle = Math.atan2(
          e.clientY - gesture.centerPxY,
          e.clientX - gesture.centerPxX,
        );
        const deltaDeg = ((currentAngle - gesture.startAngleRad) * 180) / Math.PI;
        onUpdateLive(gesture.instanceId, {
          rotationDeg: gesture.startRotationDeg + deltaDeg,
        });
      }
    },
    [onUpdateLive],
  );

  const finishPointerGesture = useCallback(() => {
    if (!activeGestureRef.current) return;
    activeGestureRef.current = null;
    onEndGesture();
  }, [onEndGesture]);

  const handleObjectKeyDown = (e: React.KeyboardEvent, obj: PlacedObject) => {
    if (exhibitionMode) return;
    const step = e.shiftKey ? 0.045 : 0.015;
    const rotStep = e.shiftKey ? 15 : 5;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        onPatchDiscrete(obj.instanceId, { x: obj.x - step });
        break;
      case 'ArrowRight':
        e.preventDefault();
        onPatchDiscrete(obj.instanceId, { x: obj.x + step });
        break;
      case 'ArrowUp':
        e.preventDefault();
        onPatchDiscrete(obj.instanceId, { y: obj.y - step });
        break;
      case 'ArrowDown':
        e.preventDefault();
        onPatchDiscrete(obj.instanceId, { y: obj.y + step });
        break;
      case '+':
      case '=':
        e.preventDefault();
        onPatchDiscrete(obj.instanceId, { scale: obj.scale + 0.08 });
        break;
      case '-':
      case '_':
        e.preventDefault();
        onPatchDiscrete(obj.instanceId, { scale: obj.scale - 0.08 });
        break;
      case '[':
        e.preventDefault();
        onPatchDiscrete(obj.instanceId, { rotationDeg: obj.rotationDeg - rotStep });
        break;
      case ']':
        e.preventDefault();
        onPatchDiscrete(obj.instanceId, { rotationDeg: obj.rotationDeg + rotStep });
        break;
      case 'PageUp':
        e.preventDefault();
        onReorderLayer(obj.instanceId, 'forward');
        break;
      case 'PageDown':
        e.preventDefault();
        onReorderLayer(obj.instanceId, 'backward');
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        onRemoveObject(obj.instanceId);
        break;
      case 'Escape':
        e.preventDefault();
        onSelectObject(null);
        break;
      default:
        break;
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!interactive || exhibitionMode) return;
    if (e.dataTransfer.types.includes('application/x-sky-garden-item')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      if (!isDragOver) setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragOver(false);
    if (!interactive || exhibitionMode) return;
    const payload = e.dataTransfer.getData('application/x-sky-garden-item');
    if (!payload) return;
    e.preventDefault();
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;

    try {
      const parsed = JSON.parse(payload) as { kind: PlacedObjectKind; refId: string };
      if (
        (parsed.kind === 'galaxy' || parsed.kind === 'celestial_decor') &&
        typeof parsed.refId === 'string'
      ) {
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        onDropNewItem(parsed.kind, parsed.refId, { x, y });
      }
    } catch {
      // Ignore invalid payload
    }
  };

  // Visual size scales proportionally to viewport width so resizing never scrambles overlaps!
  const baseUnitPx = stageWidth * 0.135;

  return (
    <div
      ref={stageRef}
      className={`sky-backdrop-stage ${interactive ? 'is-interactive' : ''} ${
        isDragOver ? 'is-drag-over' : ''
      }`}
      style={
        {
          backgroundImage: `${backgroundPreset.horizonGlowCss}, ${backgroundPreset.gradientCss}`,
          '--stage-width': `${stageWidth}px`,
        } as React.CSSProperties
      }
      onPointerDown={handleStagePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointerGesture}
      onPointerCancel={finishPointerGesture}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid="observatory-stage"
    >
      {scene.nebulaLayerId !== 'nebula-none' && <StarfieldSvg hemisphere={scene.hemisphere} />}
      <NebulaLayerSvg nebulaLayerId={scene.nebulaLayerId} />

      <div className="placed-objects-layer">
        {orderedObjects.map((obj) => {
          const isSelected = interactive && !exhibitionMode && obj.instanceId === selectedInstanceId;
          const galaxy =
            obj.kind === 'galaxy' ? getSourceGalaxyForCollectionEntry(obj.refId) : undefined;
          const decor =
            obj.kind === 'celestial_decor' ? getCelestialDecor(obj.refId) : undefined;

          if (!galaxy && !decor) return null;

          const label = galaxy
            ? `${galaxy.catalogName} (${galaxy.commonTitle})`
            : decor?.title ?? 'Celestial object';
          const sizePx = baseUnitPx * obj.scale * (obj.kind === 'celestial_decor' ? 0.78 : 1);

          return (
            <div
              key={obj.instanceId}
              role="button"
              tabIndex={exhibitionMode ? -1 : 0}
              aria-label={`${label}, creative sky position ${Math.round(obj.x * 100)}% horizontal, ${Math.round(obj.y * 100)}% vertical, scale ${obj.scale.toFixed(2)}, rotation ${Math.round(obj.rotationDeg)} degrees`}
              aria-pressed={isSelected}
              data-testid={`placed-object-${obj.instanceId}`}
              data-object-kind={obj.kind}
              className={`placed-object ${isSelected ? 'is-selected' : ''} ${
                interactive ? 'is-editable' : 'is-ambient'
              } ${obj.kind === 'galaxy' ? 'is-galaxy' : 'is-decor'}`}
              style={{
                left: `${obj.x * 100}%`,
                top: `${obj.y * 100}%`,
                width: `${sizePx}px`,
                height: `${sizePx}px`,
                zIndex: 10 + obj.layer,
              }}
              onPointerDown={(e) => startMoveGesture(e, obj)}
              onKeyDown={(e) => handleObjectKeyDown(e, obj)}
              onClick={(e) => {
                if (!interactive || exhibitionMode) return;
                e.stopPropagation();
                onSelectObject(obj.instanceId);
              }}
            >
              <div
                className="placed-object-visual"
                style={{
                  transform: `rotate(${obj.rotationDeg}deg)`,
                }}
              >
                {galaxy ? (
                  <img
                    src={galaxy.originalImageUrl}
                    alt=""
                    draggable={false}
                    className="placed-galaxy-cutout"
                  />
                ) : decor ? (
                  <CelestialDecorGlyph glyphKind={decor.glyphKind} />
                ) : null}
              </div>

              {isSelected && (
                <div className="selection-reticle" aria-hidden="true">
                  <div className="reticle-stem" />
                  <div
                    className="reticle-handle reticle-rotate-handle"
                    title="Drag to rotate"
                    onPointerDown={(e) => startRotateGesture(e, obj)}
                  />
                  <div
                    className="reticle-handle reticle-scale-handle"
                    title="Drag to resize"
                    onPointerDown={(e) => startScaleGesture(e, obj)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {exhibitionMode && (
        <div className="exhibition-plaque">
          <span className="exhibition-plaque-hemi">
            {scene.hemisphere === 'north' ? 'NORTHERN OBSERVATORY DOME' : 'SOUTHERN OBSERVATORY DOME'}
          </span>
          <strong className="exhibition-plaque-title">
            {scene.exhibitionTitle.trim() || 'Untitled Sky Study'}
          </strong>
          <span className="exhibition-plaque-sub">
            CREATIVE SKY ARRANGEMENT · DEMO SURVEY CUTOUTS
          </span>
        </div>
      )}
    </div>
  );
};
