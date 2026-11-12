import React, { useCallback, useEffect, useRef } from 'react';
import { PAL } from '../pixel/palette';
import { drawPixelText, measurePixelText } from '../pixel/pixelFont';
import { getSideSpriteSheet } from '../pixel/pixelSprites';
import type { RoomPropId, SceneHemisphere, StationId } from '../types/skyGarden';

export const NATIVE_W = 320;
export const NATIVE_H = 180;

export interface StationHotspot {
  readonly id: StationId;
  readonly x: number;
  readonly prompt: string;
  readonly hitLeft: number;
  readonly hitRight: number;
  readonly hitTop: number;
  readonly hitBottom: number;
}

export const STATIONS: readonly StationHotspot[] = [
  {
    id: 'crt-desk',
    x: 66,
    prompt: '[E] CLASSIFY',
    hitLeft: 44,
    hitRight: 88,
    hitTop: 118,
    hitBottom: 152,
  },
  {
    id: 'atlas',
    x: 112,
    prompt: '[E] STAR ATLAS',
    hitLeft: 98,
    hitRight: 126,
    hitTop: 120,
    hitBottom: 152,
  },
  {
    id: 'telescope',
    x: 164,
    prompt: '[E] DECORATE SKY',
    hitLeft: 144,
    hitRight: 186,
    hitTop: 110,
    hitBottom: 148,
  },
  {
    id: 'dome-wheel',
    x: 216,
    prompt: '[E] ROTATE DOME',
    hitLeft: 200,
    hitRight: 232,
    hitTop: 122,
    hitBottom: 152,
  },
  {
    id: 'workbench',
    x: 264,
    prompt: '[E] WORKBENCH',
    hitLeft: 244,
    hitRight: 296,
    hitTop: 120,
    hitBottom: 152,
  },
];

function getFloorYAt(x: number): number {
  if (x >= 140 && x <= 188) return 142;
  if ((x >= 134 && x < 140) || (x > 188 && x <= 194)) return 145;
  return 148;
}

interface DustPuff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface ObservatoryCutawayCanvasProps {
  readonly hemisphere: SceneHemisphere;
  readonly windowFrameId: string;
  readonly activeRoomProps: readonly RoomPropId[];
  readonly practiceCount: number;
  readonly activeStation: StationId | null;
  readonly skyEditMode: boolean;
  readonly exhibitionMode: boolean;
  readonly onTriggerStation: (station: StationId) => void;
}

export const ObservatoryCutawayCanvas: React.FC<ObservatoryCutawayCanvasProps> = ({
  hemisphere,
  windowFrameId,
  activeRoomProps,
  practiceCount,
  activeStation,
  skyEditMode,
  exhibitionMode,
  onTriggerStation,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const propsRef = useRef({
    hemisphere,
    windowFrameId,
    activeRoomProps,
    practiceCount,
    activeStation,
    skyEditMode,
    exhibitionMode,
    onTriggerStation,
  });
  useEffect(() => {
    propsRef.current = {
      hemisphere,
      windowFrameId,
      activeRoomProps,
      practiceCount,
      activeStation,
      skyEditMode,
      exhibitionMode,
      onTriggerStation,
    };
  }, [
    activeRoomProps,
    activeStation,
    exhibitionMode,
    hemisphere,
    onTriggerStation,
    practiceCount,
    skyEditMode,
    windowFrameId,
  ]);

  const playerRef = useRef({
    x: 146,
    y: getFloorYAt(146),
    vx: 0,
    vy: 0,
    grounded: true,
    facing: 'right' as 'left' | 'right',
    runTimer: 0,
    autoWalkTargetX: null as number | null,
    pendingStation: null as StationId | null,
  });

  const keysRef = useRef({ left: false, right: false });
  const puffsRef = useRef<DustPuff[]>([]);
  const domeShutterFlashRef = useRef<number>(0);
  const prevHemisphereRef = useRef<SceneHemisphere>(hemisphere);

  useEffect(() => {
    if (prevHemisphereRef.current !== hemisphere) {
      prevHemisphereRef.current = hemisphere;
      domeShutterFlashRef.current = 0.35;
    }
  }, [hemisphere]);

  const spawnDust = useCallback((x: number, y: number, count: number) => {
    for (let i = 0; i < count; i += 1) {
      puffsRef.current.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y - 1,
        vx: (Math.random() - 0.5) * 24,
        vy: -8 - Math.random() * 16,
        life: 0.28 + Math.random() * 0.15,
      });
    }
  }, []);

  const findNearestStation = useCallback((px: number): StationHotspot | null => {
    let best: StationHotspot | null = null;
    let bestDist = 22;
    for (const st of STATIONS) {
      const dist = Math.abs(px - st.x);
      if (dist <= bestDist) {
        bestDist = dist;
        best = st;
      }
    }
    return best;
  }, []);

  // Keyboard movement & station interaction when roaming the observatory
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const { activeStation: openStation, exhibitionMode: isExhib } = propsRef.current;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }

      if (openStation !== null || isExhib) {
        keysRef.current.left = false;
        keysRef.current.right = false;
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'a' || e.key === 'ArrowLeft') {
        keysRef.current.left = true;
        playerRef.current.autoWalkTargetX = null;
        playerRef.current.pendingStation = null;
      } else if (key === 'd' || e.key === 'ArrowRight') {
        keysRef.current.right = true;
        playerRef.current.autoWalkTargetX = null;
        playerRef.current.pendingStation = null;
      } else if (e.key === ' ') {
        e.preventDefault();
        const p = playerRef.current;
        if (p.grounded) {
          p.vy = -132;
          p.grounded = false;
          spawnDust(p.x, p.y, 4);
        }
      } else if (key === 'e' || e.key === 'Enter' || key === 'w' || e.key === 'ArrowUp') {
        const nearest = findNearestStation(playerRef.current.x);
        if (nearest) {
          e.preventDefault();
          keysRef.current.left = false;
          keysRef.current.right = false;
          propsRef.current.onTriggerStation(nearest.id);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'a' || e.key === 'ArrowLeft') keysRef.current.left = false;
      if (key === 'd' || e.key === 'ArrowRight') keysRef.current.right = false;
    };

    const onBlur = () => {
      keysRef.current.left = false;
      keysRef.current.right = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [findNearestStation, spawnDust]);

  // Main 60fps Pixel Simulation & Cutaway Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sprites = getSideSpriteSheet();

    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const {
        hemisphere: hemi,
        windowFrameId: frameId,
        activeRoomProps: roomProps,
        practiceCount: pCount,
        activeStation: openStation,
        skyEditMode: isSkyEdit,
        exhibitionMode: isExhib,
        onTriggerStation: triggerStation,
      } = propsRef.current;

      const propSet = new Set(roomProps);
      const p = playerRef.current;

      // Update player movement when roaming
      if (openStation === null && !isExhib) {
        let moveDir = 0;
        if (keysRef.current.left) moveDir -= 1;
        if (keysRef.current.right) moveDir += 1;

        if (moveDir === 0 && p.autoWalkTargetX !== null) {
          const diff = p.autoWalkTargetX - p.x;
          if (Math.abs(diff) <= 2.2) {
            p.x = p.autoWalkTargetX;
            p.vx = 0;
            p.autoWalkTargetX = null;
            if (p.pendingStation) {
              const st = p.pendingStation;
              p.pendingStation = null;
              triggerStation(st);
            }
          } else {
            moveDir = diff > 0 ? 1 : -1;
          }
        }

        const maxSpeed = 90;
        const accel = 580;
        const friction = 680;

        if (moveDir !== 0) {
          p.facing = moveDir > 0 ? 'right' : 'left';
          p.vx += moveDir * accel * dt;
          if (Math.abs(p.vx) > maxSpeed) p.vx = moveDir * maxSpeed;
          p.runTimer += dt * 9.5;
        } else {
          if (Math.abs(p.vx) <= friction * dt) {
            p.vx = 0;
          } else {
            p.vx -= Math.sign(p.vx) * friction * dt;
          }
          p.runTimer = 0;
        }

        const nextX = Math.max(26, Math.min(292, p.x + p.vx * dt));
        const prevFloor = getFloorYAt(p.x);
        const nextFloor = getFloorYAt(nextX);
        p.x = nextX;

        if (p.grounded && nextFloor < prevFloor) {
          // Smooth step-up onto the 2-step wooden telescope dais
          p.y = nextFloor;
        } else if (p.grounded && nextFloor > prevFloor) {
          // Step down smoothly
          p.y = nextFloor;
        }

        if (!p.grounded) {
          p.vy += 450 * dt;
          p.y += p.vy * dt;
          const floorHere = getFloorYAt(p.x);
          if (p.y >= floorHere) {
            p.y = floorHere;
            p.vy = 0;
            p.grounded = true;
            spawnDust(p.x, p.y, 3);
          }
        }
      } else {
        p.vx = 0;
      }

      if (domeShutterFlashRef.current > 0) {
        domeShutterFlashRef.current = Math.max(0, domeShutterFlashRef.current - dt);
      }

      // Clear entire canvas so Layer 1 sky + galaxies shine through the glasshouse panes!
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, NATIVE_W, NATIVE_H);

      // 1. Glasshouse Dome Ribs & Roof Arch (behind room props, framing the open sky)
      const archY = (x: number): number => {
        if (frameId === 'frame-timber-skylight') {
          const distFromCenter = Math.abs(x - 160) / 144;
          return Math.round(6 + distFromCenter * 18);
        }
        if (frameId === 'frame-wide-cupola') {
          const t = (x - 160) / 148;
          return Math.round(4 + t * t * 12);
        }
        const t = (x - 160) / 144;
        return Math.round(6 + t * t * 22);
      };

      // Roof spandrel above the arch
      for (let x = 18; x < 302; x += 1) {
        const ay = archY(x);
        ctx.fillStyle = PAL.void;
        ctx.fillRect(x, 0, 1, ay);
        ctx.fillStyle = frameId === 'frame-timber-skylight' ? PAL.woodWarm : PAL.brassMid;
        ctx.fillRect(x, ay, 1, 2);
        ctx.fillStyle = PAL.woodOutline;
        ctx.fillRect(x, ay + 2, 1, 1);
      }

      // Slender vertical dome ribs (subtle mullions that give glasshouse depth)
      const ribXs =
        frameId === 'frame-wide-cupola' ? [48, 272] : [88, 160, 232];
      for (const rx of ribXs) {
        const topY = archY(rx) + 2;
        ctx.fillStyle = PAL.stoneShadow;
        ctx.fillRect(rx - 1, topY, 2, 132 - topY);
        ctx.fillStyle = frameId === 'frame-timber-skylight' ? PAL.woodMid : PAL.brassDark;
        ctx.fillRect(rx, topY, 1, 132 - topY);
      }

      // Optional warm amber string lights draped along the upper glasshouse arch
      if (propSet.has('lights-amber')) {
        const anchors = [20, 88, 160, 232, 300];
        for (let seg = 0; seg < anchors.length - 1; seg += 1) {
          const x0 = anchors[seg];
          const x1 = anchors[seg + 1];
          const y0 = archY(x0) + 4;
          const y1 = archY(x1) + 4;
          for (let x = x0; x <= x1; x += 1) {
            const u = (x - x0) / (x1 - x0);
            const sag = Math.sin(u * Math.PI) * 6;
            const ly = Math.round(y0 + (y1 - y0) * u + sag);
            ctx.fillStyle = PAL.woodOutline;
            ctx.fillRect(x, ly, 1, 1);
            if ((x - x0) % 14 === 7) {
              const pulse = Math.sin(now * 0.003 + x * 0.2) > -0.2;
              ctx.fillStyle = pulse ? PAL.amberGlow : PAL.brassBright;
              ctx.fillRect(x - 1, ly + 1, 2, 2);
              if (pulse) {
                ctx.fillStyle = PAL.candleCream;
                ctx.fillRect(x, ly + 1, 1, 1);
              }
            }
          }
        }
      }

      // Brief dome shutter sweep when rotating between North & South skies
      if (domeShutterFlashRef.current > 0) {
        const alpha = domeShutterFlashRef.current / 0.35;
        ctx.fillStyle = `rgba(179, 212, 255, ${(alpha * 0.18).toFixed(3)})`;
        ctx.fillRect(18, 10, 284, 122);
      }

      // In Quiet Exhibition Mode, keep only the outer arch + sleek sill silhouette so the sky takes center stage!
      if (isExhib) {
        // Side pillars silhouette
        ctx.fillStyle = PAL.void;
        ctx.fillRect(0, 0, 18, NATIVE_H);
        ctx.fillRect(302, 0, 18, NATIVE_H);
        // Sleek dark sill along very bottom
        ctx.fillStyle = PAL.woodOutline;
        ctx.fillRect(0, 156, NATIVE_W, 24);
        ctx.fillStyle = PAL.brassMid;
        ctx.fillRect(18, 156, 284, 1);
        if (sprites.telescope) {
          ctx.drawImage(sprites.telescope, 254, 133);
        }
        if (propSet.has('cat-ginger')) {
          const catFrame = sprites.catFrames[Math.floor(now / 1600) % 2];
          if (catFrame) ctx.drawImage(catFrame, 42, 149);
        }
        rafId = requestAnimationFrame(tick);
        return;
      }

      // 2. Left & Right Stone Observatory Pillars (x = 0..18 and x = 302..320)
      const drawStonePillar = (startX: number) => {
        ctx.fillStyle = PAL.stoneShadow;
        ctx.fillRect(startX, 0, 18, 154);
        for (let row = 0; row < 154; row += 8) {
          const offset = (row / 8) % 2 === 0 ? 1 : 5;
          ctx.fillStyle = PAL.stoneDark;
          ctx.fillRect(startX + 1, row + 1, 16, 6);
          ctx.fillStyle = PAL.stoneMid;
          ctx.fillRect(startX + offset, row + 1, 8, 2);
        }
        ctx.fillStyle = PAL.brassDark;
        ctx.fillRect(startX === 0 ? 17 : 302, 0, 1, 154);
      };
      drawStonePillar(0);
      drawStonePillar(302);

      // 3. Wainscot Wooden Knee-Wall beneath the glass panes (y = 132..148)
      ctx.fillStyle = PAL.brassMid;
      ctx.fillRect(18, 132, 284, 1);
      ctx.fillStyle = PAL.woodHighlight;
      ctx.fillRect(18, 133, 284, 1);
      ctx.fillStyle = PAL.woodDark;
      ctx.fillRect(18, 134, 284, 14);
      for (let px = 22; px < 300; px += 8) {
        ctx.fillStyle = PAL.woodMid;
        ctx.fillRect(px, 135, 6, 12);
        ctx.fillStyle = PAL.woodShadow;
        ctx.fillRect(px + 6, 135, 1, 12);
      }

      // 4. Main Wooden Floor Deck & Raised Central Telescope Dais
      // Main floor planks (y = 148..154)
      ctx.fillStyle = PAL.woodOutline;
      ctx.fillRect(0, 148, NATIVE_W, 7);
      ctx.fillStyle = PAL.woodLight;
      ctx.fillRect(18, 148, 284, 1);
      ctx.fillStyle = PAL.woodWarm;
      ctx.fillRect(18, 149, 284, 3);
      ctx.fillStyle = PAL.woodMid;
      ctx.fillRect(18, 152, 284, 2);
      for (let gx = 26; gx < 298; gx += 18) {
        ctx.fillStyle = PAL.woodShadow;
        ctx.fillRect(gx, 148, 1, 6);
      }

      // Optional Crimson Woven Rug along floor
      if (propSet.has('rug-crimson')) {
        const drawRugSegment = (rx: number, rw: number) => {
          ctx.fillStyle = PAL.rugGoldTrim;
          ctx.fillRect(rx, 148, rw, 1);
          ctx.fillStyle = PAL.rugCrimson;
          ctx.fillRect(rx + 1, 148, rw - 2, 2);
          for (let px = rx + 3; px < rx + rw - 3; px += 4) {
            ctx.fillStyle = PAL.rugRose;
            ctx.fillRect(px, 148, 2, 1);
          }
        };
        drawRugSegment(90, 44);
        drawRugSegment(194, 46);
      }

      // Raised Central Wooden Dais for Telescope (steps at 134..140 & 188..194, top 140..188)
      // Step 1
      ctx.fillStyle = PAL.woodOutline;
      ctx.fillRect(133, 145, 62, 4);
      ctx.fillStyle = PAL.woodLight;
      ctx.fillRect(134, 145, 60, 1);
      ctx.fillStyle = PAL.woodWarm;
      ctx.fillRect(134, 146, 60, 2);
      // Step 2 (Dais Top y = 142)
      ctx.fillStyle = PAL.woodOutline;
      ctx.fillRect(139, 142, 50, 4);
      ctx.fillStyle = PAL.woodHighlight;
      ctx.fillRect(140, 142, 48, 1);
      ctx.fillStyle = PAL.woodWarm;
      ctx.fillRect(140, 143, 48, 2);
      ctx.fillStyle = PAL.brassMid;
      ctx.fillRect(140, 142, 2, 1);
      ctx.fillRect(186, 142, 2, 1);

      // 5. Cutaway Stone Masonry Foundation (y = 154..180)
      ctx.fillStyle = PAL.void;
      ctx.fillRect(0, 154, NATIVE_W, 26);
      for (let sy = 155; sy < 179; sy += 6) {
        const shift = ((sy - 155) / 6) % 2 === 0 ? 0 : 7;
        for (let sx = shift; sx < NATIVE_W; sx += 14) {
          ctx.fillStyle = PAL.stoneShadow;
          ctx.fillRect(sx, sy, 13, 5);
          ctx.fillStyle = PAL.stoneDark;
          ctx.fillRect(sx + 1, sy, 11, 1);
        }
      }

      // 6. Observatory Stations & Cozy Props
      // Left Bookshelf + Optional Fern
      if (sprites.bookshelf) {
        ctx.drawImage(sprites.bookshelf, 20, 125);
      }
      if (propSet.has('plant-fern') && sprites.fern) {
        ctx.drawImage(sprites.fern, 24, 114);
      }

      // Station 1: Blink Comparator CRT Desk
      if (sprites.crtDesk) {
        ctx.drawImage(sprites.crtDesk, 46, 125);
        // Animated scanline shimmer on CRT monitor screen
        const scanY = 128 + (Math.floor(now / 220) % 5);
        ctx.fillStyle = PAL.crtBright;
        ctx.fillRect(53, scanY, 7, 1);
        // Checkerboard pixel-dithered circular warm lamp halo (no hard square box)
        for (let dy = -7; dy <= 7; dy += 1) {
          for (let dx = -7; dx <= 7; dx += 1) {
            if (dx * dx + dy * dy <= 49 && ((dx + dy) & 1) === 0) {
              ctx.fillStyle = 'rgba(242, 196, 109, 0.14)';
              ctx.fillRect(76 + dx, 128 + dy, 1, 1);
            }
          }
        }
      }

      // Station 2: Star Atlas Lectern
      if (sprites.lectern) {
        ctx.drawImage(sprites.lectern, 102, 128);
      }

      // Station 3: Brass Telescope on Dais
      if (sprites.telescope) {
        ctx.drawImage(sprites.telescope, 152, 118);
      }

      // Station 4: Hemisphere Dome Compass Wheel (N <-> S)
      if (sprites.domeWheel) {
        ctx.drawImage(sprites.domeWheel, 206, 130);
        const hemiTag = hemi === 'north' ? 'NORTH' : 'SOUTH';
        const tagW = measurePixelText(hemiTag);
        ctx.fillStyle = PAL.void;
        ctx.fillRect(216 - Math.floor(tagW / 2) - 2, 121, tagW + 4, 7);
        ctx.fillStyle = PAL.brassMid;
        ctx.fillRect(216 - Math.floor(tagW / 2) - 2, 120, tagW + 4, 1);
        drawPixelText(
          ctx,
          hemiTag,
          216 - Math.floor(tagW / 2),
          122,
          hemi === 'north' ? PAL.starIce : PAL.amberGlow,
        );
      }

      // Station 5: Curator's Workbench & Window Bench
      if (sprites.workbench) {
        ctx.drawImage(sprites.workbench, 248, 136);
      }

      // Optional Clockwork Brass Orrery on Workbench (spinning pixel planets!)
      if (propSet.has('orrery-brass')) {
        const ox = 258;
        const oy = 132;
        ctx.fillStyle = PAL.brassMid;
        ctx.fillRect(ox - 3, oy + 6, 7, 2);
        ctx.fillRect(ox, oy + 1, 1, 5);
        // Sun core
        ctx.fillStyle = PAL.amberGlow;
        ctx.fillRect(ox - 1, oy, 3, 2);
        ctx.fillStyle = PAL.candleCream;
        ctx.fillRect(ox, oy, 1, 1);
        // Orbiting inner & outer pixel planets
        const p1x = Math.round(ox + Math.cos(now * 0.0024) * 6);
        const p2x = Math.round(ox + Math.cos(now * 0.0013 + 2.1) * 9);
        ctx.fillStyle = PAL.brassDark;
        ctx.fillRect(Math.min(ox, p1x), oy + 2, Math.abs(p1x - ox) + 1, 1);
        ctx.fillRect(Math.min(ox, p2x), oy + 4, Math.abs(p2x - ox) + 1, 1);
        ctx.fillStyle = PAL.crtBright;
        ctx.fillRect(p1x, oy + 1, 2, 2);
        ctx.fillStyle = PAL.rugRose;
        ctx.fillRect(p2x, oy + 3, 2, 2);
      }

      // Optional Sleeping Ginger Cat on Window Bench
      if (propSet.has('cat-ginger')) {
        const catFrame = sprites.catFrames[Math.floor(now / 1500) % 2];
        if (catFrame) {
          ctx.drawImage(catFrame, 274, 129);
          // Tiny floating pixel Zzz
          const zPhase = Math.floor(now / 900) % 3;
          drawPixelText(ctx, 'Z', 287 + zPhase, 124 - zPhase * 2, PAL.starIce);
        }
      }

      // 7. Dust Puffs (Celeste hop & land feedback)
      for (let i = puffsRef.current.length - 1; i >= 0; i -= 1) {
        const puff = puffsRef.current[i];
        puff.life -= dt;
        if (puff.life <= 0) {
          puffsRef.current.splice(i, 1);
          continue;
        }
        puff.x += puff.vx * dt;
        puff.y += puff.vy * dt;
        ctx.fillStyle = puff.life > 0.14 ? PAL.candleCream : PAL.stoneLight;
        ctx.fillRect(Math.round(puff.x), Math.round(puff.y), 2, 2);
      }

      // 8. Side-View Pixel Astronomer Character
      const dirSet = p.facing === 'right' ? sprites.playerRight : sprites.playerLeft;
      let playerSprite = dirSet.idle;
      if (!p.grounded) {
        playerSprite = dirSet.jump;
      } else if (Math.abs(p.vx) > 6) {
        const frameIdx = Math.floor(p.runTimer) % dirSet.run.length;
        playerSprite = dirSet.run[frameIdx];
      }
      if (playerSprite) {
        const drawX = Math.round(p.x - 8);
        const drawY = Math.round(p.y - 20);
        // Subtle 1px shadow on floor directly beneath feet
        const floorBelow = getFloorYAt(p.x);
        ctx.fillStyle = 'rgba(6, 7, 16, 0.55)';
        ctx.fillRect(Math.round(p.x - 5), floorBelow, 10, 1);
        ctx.drawImage(playerSprite, drawX, drawY);
      }

      // 9. Floating [E] Pixel Prompt above Nearest Station (when roaming)
      if (openStation === null && !isSkyEdit) {
        const nearest = findNearestStation(p.x);
        if (nearest) {
          const bob = Math.round(Math.sin(now * 0.005) * 1.4);
          const label =
            nearest.id === 'dome-wheel'
              ? hemi === 'north'
                ? '[E] SOUTH SKY'
                : '[E] NORTH SKY'
              : nearest.prompt;
          const tw = measurePixelText(label);
          const bx = Math.max(22, Math.min(298 - (tw + 8), Math.round(nearest.x - (tw + 8) / 2)));
          const by = (nearest.id === 'telescope' ? 98 : 106) + bob;

          ctx.fillStyle = PAL.void;
          ctx.fillRect(bx - 1, by - 1, tw + 10, 11);
          ctx.fillStyle = PAL.nightMid;
          ctx.fillRect(bx, by, tw + 8, 9);
          ctx.fillStyle = PAL.amberGlow;
          ctx.fillRect(bx, by, tw + 8, 1);
          ctx.fillRect(bx, by + 8, tw + 8, 1);
          ctx.fillRect(bx, by, 1, 9);
          ctx.fillRect(bx + tw + 7, by, 1, 9);
          drawPixelText(ctx, label, bx + 4, by + 2, PAL.candleCream, PAL.void);
        }

        // Crisp pixel HUD strip tucked into the lower stone foundation
        drawPixelText(
          ctx,
          'A/D WALK   SPACE HOP   E OR CLICK STATION',
          20,
          164,
          PAL.starIce,
          PAL.void,
        );
        const rightHud = `PRACTICE:${pCount}  SKY:${hemi.toUpperCase()}`;
        const rhw = measurePixelText(rightHud);
        drawPixelText(ctx, rightHud, 300 - rhw, 164, PAL.amberGlow, PAL.void);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [findNearestStation, spawnDust]);

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (skyEditMode || exhibitionMode || activeStation !== null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const nx = ((e.clientX - rect.left) / rect.width) * NATIVE_W;
    const ny = ((e.clientY - rect.top) / rect.height) * NATIVE_H;

    // Did the player click directly on one of the 5 observatory stations?
    const clickedStation = STATIONS.find(
      (st) => nx >= st.hitLeft && nx <= st.hitRight && ny >= st.hitTop && ny <= st.hitBottom,
    );

    if (clickedStation) {
      const dist = Math.abs(playerRef.current.x - clickedStation.x);
      if (dist <= 18) {
        onTriggerStation(clickedStation.id);
      } else {
        playerRef.current.autoWalkTargetX = clickedStation.x;
        playerRef.current.pendingStation = clickedStation.id;
      }
      return;
    }

    // Clicking up in the open sky dome walks the astronomer to the Telescope to edit the sky!
    if (nx > 20 && nx < 300 && ny > 16 && ny < 126) {
      const scope = STATIONS.find((s) => s.id === 'telescope')!;
      if (Math.abs(playerRef.current.x - scope.x) <= 18) {
        onTriggerStation('telescope');
      } else {
        playerRef.current.autoWalkTargetX = scope.x;
        playerRef.current.pendingStation = 'telescope';
      }
      return;
    }

    // Otherwise walk smoothly to the clicked X floor coordinate
    const targetX = Math.max(26, Math.min(292, nx));
    playerRef.current.autoWalkTargetX = targetX;
    playerRef.current.pendingStation = null;
  };

  return (
    <canvas
      ref={canvasRef}
      width={NATIVE_W}
      height={NATIVE_H}
      className={`observatory-cutaway-canvas ${skyEditMode ? 'is-passthrough' : ''}`}
      onPointerDown={handleCanvasPointerDown}
      data-testid="observatory-room-canvas"
      aria-label="Walkable side-on pixel-art rooftop observatory. Use A and D or Left and Right arrows to walk, Space to hop, and E or click a station to classify galaxies, inspect the Star Atlas, decorate the sky at the Telescope, rotate the North/South dome, or customize your room."
    />
  );
};
