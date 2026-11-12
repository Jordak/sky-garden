import React, { useMemo } from 'react';
import type { CelestialDecorItem, SceneHemisphere } from '../types/skyGarden';

interface StarPoint {
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly opacity: number;
  readonly color: string;
  readonly twinkle: boolean;
}

const STAR_COLORS = ['#ffffff', '#dce8ff', '#fff2d6', '#ffd9b3', '#cadbff'];

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const StarfieldSvg: React.FC<{ hemisphere: SceneHemisphere }> = React.memo(
  ({ hemisphere }) => {
    const stars = useMemo<StarPoint[]>(() => {
      const rand = seededRandom(hemisphere === 'north' ? 42197 : 91823);
      const list: StarPoint[] = [];
      for (let i = 0; i < 165; i += 1) {
        const roll = rand();
        const r = roll > 0.96 ? 1.55 + rand() * 0.8 : 0.45 + rand() * 0.85;
        list.push({
          x: rand() * 1000,
          y: rand() * 625,
          r,
          opacity: 0.24 + rand() * 0.72,
          color: STAR_COLORS[Math.floor(rand() * STAR_COLORS.length)],
          twinkle: i % 11 === 0,
        });
      }
      return list;
    }, [hemisphere]);

    return (
      <svg
        className="stage-layer-svg starfield-svg"
        data-testid="backdrop-starfield"
        viewBox="0 0 1000 625"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {stars.map((star, idx) => (
          <circle
            key={idx}
            cx={star.x}
            cy={star.y}
            r={star.r}
            fill={star.color}
            opacity={star.opacity}
            className={star.twinkle ? 'star-twinkle' : undefined}
          />
        ))}
      </svg>
    );
  },
);

export const NebulaLayerSvg: React.FC<{ nebulaLayerId: string }> = React.memo(
  ({ nebulaLayerId }) => {
    if (nebulaLayerId === 'nebula-none') return null;

    if (nebulaLayerId === 'nebula-cygnus-veil') {
      return (
        <svg
          className="stage-layer-svg nebula-svg"
          viewBox="0 0 1000 625"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <filter id="blur-veil" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="34" />
            </filter>
            <linearGradient id="veil-cyan" x1="0%" y1="0%" x2="100%" y2="80%">
              <stop offset="0%" stopColor="#4ecdc4" stopOpacity="0.28" />
              <stop offset="55%" stopColor="#4f7cff" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#e86f9a" stopOpacity="0.24" />
            </linearGradient>
          </defs>
          <g filter="url(#blur-veil)">
            <path
              d="M 110 140 Q 380 40 620 190 T 900 160"
              fill="none"
              stroke="url(#veil-cyan)"
              strokeWidth="85"
              strokeLinecap="round"
            />
            <path
              d="M 190 420 Q 470 290 790 440"
              fill="none"
              stroke="#c95b8b"
              strokeOpacity="0.16"
              strokeWidth="70"
              strokeLinecap="round"
            />
          </g>
        </svg>
      );
    }

    if (nebulaLayerId === 'nebula-carina-amber') {
      return (
        <svg
          className="stage-layer-svg nebula-svg"
          viewBox="0 0 1000 625"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <filter id="blur-carina" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="44" />
            </filter>
            <radialGradient id="carina-gold" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor="#e89a54" stopOpacity="0.32" />
              <stop offset="55%" stopColor="#b0525c" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#1b122b" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g filter="url(#blur-carina)">
            <ellipse
              cx="340"
              cy="280"
              rx="320"
              ry="170"
              transform="rotate(-18 340 280)"
              fill="url(#carina-gold)"
            />
            <ellipse
              cx="700"
              cy="390"
              rx="280"
              ry="145"
              transform="rotate(-14 700 390)"
              fill="url(#carina-gold)"
            />
          </g>
        </svg>
      );
    }

    // Default / nebula-pleiades-mist
    return (
      <svg
        className="stage-layer-svg nebula-svg"
        viewBox="0 0 1000 625"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <filter id="blur-pleiades" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="40" />
          </filter>
          <radialGradient id="pleiades-blue" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7eb6ff" stopOpacity="0.28" />
            <stop offset="60%" stopColor="#4868b8" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#0b132b" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g filter="url(#blur-pleiades)">
          <ellipse
            cx="520"
            cy="270"
            rx="340"
            ry="175"
            transform="rotate(-12 520 270)"
            fill="url(#pleiades-blue)"
          />
          <ellipse cx="290" cy="410" rx="210" ry="120" fill="url(#pleiades-blue)" />
        </g>
      </svg>
    );
  },
);

export const CelestialDecorGlyph: React.FC<{ glyphKind: CelestialDecorItem['glyphKind'] }> = ({
  glyphKind,
}) => {
  if (glyphKind === 'open-cluster') {
    return (
      <svg viewBox="0 0 160 160" className="celestial-decor-svg" aria-hidden="true">
        <defs>
          <radialGradient id="cluster-mist" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#9ec8ff" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#5d89d6" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="80" cy="80" r="68" fill="url(#cluster-mist)" />
        {[
          [58, 56, 3.6],
          [92, 52, 3.1],
          [76, 76, 4.3],
          [108, 82, 2.8],
          [52, 92, 2.9],
          [84, 104, 3.2],
          [68, 42, 2.1],
          [112, 62, 1.9],
          [44, 72, 1.8],
        ].map(([cx, cy, r], idx) => (
          <g key={idx}>
            <circle cx={cx} cy={cy} r={r * 2.6} fill="#a8d0ff" opacity="0.22" />
            <path
              d={`M ${cx - r * 3.4} ${cy} L ${cx + r * 3.4} ${cy} M ${cx} ${cy - r * 3.4} L ${cx} ${cy + r * 3.4}`}
              stroke="#e6f2ff"
              strokeWidth="0.9"
              opacity="0.75"
            />
            <circle cx={cx} cy={cy} r={r} fill="#ffffff" />
          </g>
        ))}
      </svg>
    );
  }

  if (glyphKind === 'comet-wisp') {
    return (
      <svg viewBox="0 0 180 120" className="celestial-decor-svg" aria-hidden="true">
        <defs>
          <linearGradient id="comet-dust" x1="15%" y1="70%" x2="95%" y2="25%">
            <stop offset="0%" stopColor="#fff3d6" stopOpacity="0.85" />
            <stop offset="45%" stopColor="#a9d6ff" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#5f8ee6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="comet-ion" x1="15%" y1="70%" x2="98%" y2="12%">
            <stop offset="0%" stopColor="#7ce8ff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#4676d9" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M 32 84 Q 88 58 168 38 L 158 64 Q 86 76 32 84 Z" fill="url(#comet-dust)" />
        <path
          d="M 32 84 L 166 18"
          stroke="url(#comet-ion)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="32" cy="84" r="11" fill="#9be4ff" opacity="0.3" />
        <circle cx="32" cy="84" r="4.2" fill="#fffdf5" />
      </svg>
    );
  }

  if (glyphKind === 'globular-haze') {
    return (
      <svg viewBox="0 0 160 160" className="celestial-decor-svg" aria-hidden="true">
        <defs>
          <radialGradient id="globular-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff3d1" stopOpacity="0.92" />
            <stop offset="28%" stopColor="#f5c97b" stopOpacity="0.52" />
            <stop offset="68%" stopColor="#8f7ab8" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="80" cy="80" r="64" fill="url(#globular-core)" />
        {[
          [66, 68],
          [94, 70],
          [74, 95],
          [90, 88],
          [58, 84],
          [82, 58],
          [104, 80],
          [62, 60],
          [98, 58],
          [70, 106],
          [50, 75],
          [86, 104],
        ].map(([x, y], idx) => (
          <circle key={idx} cx={x} cy={y} r={idx % 3 === 0 ? 1.6 : 1.1} fill="#fff7e3" opacity="0.85" />
        ))}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 160 160" className="celestial-decor-svg" aria-hidden="true">
      <defs>
        <radialGradient id="beacon-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffe9c4" stopOpacity="0.85" />
          <stop offset="35%" stopColor="#9ec5ff" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="80" cy="80" r="46" fill="url(#beacon-halo)" />
      <path
        d="M 80 14 L 80 146 M 14 80 L 146 80"
        stroke="#ffefd2"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M 48 48 L 112 112 M 112 48 L 48 112"
        stroke="#a8cbff"
        strokeWidth="0.9"
        opacity="0.5"
      />
      <circle cx="80" cy="80" r="5" fill="#ffffff" />
    </svg>
  );
};

export const ObservatoryFrameOverlay: React.FC<{
  windowFrameId: string;
  exhibitionMode: boolean;
  exhibitionTitle: string;
  hemisphere: SceneHemisphere;
}> = React.memo(({ windowFrameId, exhibitionMode, exhibitionTitle, hemisphere }) => {
  return (
    <div className="observatory-frame-overlay" aria-hidden="true">
      <svg
        viewBox="0 0 1000 625"
        preserveAspectRatio="none"
        className="observatory-frame-svg"
      >
        <defs>
          <linearGradient id="wood-sill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2a1d17" />
            <stop offset="35%" stopColor="#1b120f" />
            <stop offset="100%" stopColor="#0d0908" />
          </linearGradient>
          <linearGradient id="brass-trim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#cfa35d" stopOpacity="0.58" />
            <stop offset="50%" stopColor="#8c6836" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#e2be7e" stopOpacity="0.52" />
          </linearGradient>
          <radialGradient id="lantern-warmth" cx="12%" cy="98%" r="32%">
            <stop offset="0%" stopColor="#ffae52" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#ffae52" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Subtle warm study lantern glow along lower-left sill */}
        <rect x="0" y="0" width="1000" height="625" fill="url(#lantern-warmth)" />

        {windowFrameId === 'frame-arched-brass' && (
          <g>
            {/* Corner spandrels of arched observatory bay */}
            <path
              d="M 0 0 L 1000 0 L 1000 135 Q 895 28 500 22 Q 105 28 0 135 Z"
              fill="#0c0e18"
              opacity="0.92"
            />
            <path
              d="M 0 135 Q 105 28 500 22 Q 895 28 1000 135"
              fill="none"
              stroke="url(#brass-trim)"
              strokeWidth="3"
            />
            {/* Delicate side brass mullions that leave central sky wide open */}
            <line
              x1="135"
              y1="56"
              x2="135"
              y2="594"
              stroke="url(#brass-trim)"
              strokeWidth="1.4"
              strokeDasharray="1 0"
              opacity="0.45"
            />
            <line
              x1="865"
              y1="56"
              x2="865"
              y2="594"
              stroke="url(#brass-trim)"
              strokeWidth="1.4"
              opacity="0.45"
            />
            {/* Cozy brass finder-scope silhouette perched at bottom right */}
            <g transform="translate(888, 540) rotate(-26)">
              <rect x="-42" y="-7" width="76" height="14" rx="3" fill="#181519" stroke="#9e7a44" strokeWidth="1.2" />
              <rect x="30" y="-9" width="10" height="18" rx="2" fill="#261e18" stroke="#ba9254" strokeWidth="1.1" />
              <line x1="-8" y1="7" x2="-18" y2="54" stroke="#6c5230" strokeWidth="3.5" />
              <line x1="6" y1="7" x2="22" y2="54" stroke="#6c5230" strokeWidth="3.5" />
            </g>
          </g>
        )}

        {windowFrameId === 'frame-timber-skylight' && (
          <g>
            <polygon points="0,0 185,0 0,115" fill="#120e12" opacity="0.92" />
            <polygon points="1000,0 815,0 1000,115" fill="#120e12" opacity="0.92" />
            <line x1="185" y1="0" x2="0" y2="115" stroke="#7d5c3b" strokeWidth="3" opacity="0.65" />
            <line
              x1="815"
              y1="0"
              x2="1000"
              y2="115"
              stroke="#7d5c3b"
              strokeWidth="3"
              opacity="0.65"
            />
            <rect
              x="8"
              y="8"
              width="984"
              height="592"
              fill="none"
              stroke="#7d5c3b"
              strokeWidth="2"
              opacity="0.4"
            />
          </g>
        )}

        {windowFrameId === 'frame-wide-cupola' && (
          <g>
            {/* Curved observatory dome shutter edges */}
            <path d="M 0 0 L 92 0 Q 28 310 74 600 L 0 600 Z" fill="#0b0d16" opacity="0.94" />
            <path
              d="M 1000 0 L 908 0 Q 972 310 926 600 L 1000 600 Z"
              fill="#0b0d16"
              opacity="0.94"
            />
            <path
              d="M 92 0 Q 28 310 74 600 M 908 0 Q 972 310 926 600"
              fill="none"
              stroke="url(#brass-trim)"
              strokeWidth="2.4"
            />
          </g>
        )}

        {/* Warm wooden windowsill grounding the bottom edge */}
        <rect x="0" y="594" width="1000" height="31" fill="url(#wood-sill)" />
        <line x1="0" y1="594" x2="1000" y2="594" stroke="url(#brass-trim)" strokeWidth="2" />

        {/* Small warm notebook & teacup silhouette on left sill */}
        <g transform="translate(56, 578)" opacity="0.88">
          <path d="M 0 16 L 54 16 L 48 6 L 6 6 Z" fill="#231918" stroke="#8a6a43" strokeWidth="1" />
          <path
            d="M 70 16 L 88 16 L 86 4 L 72 4 Z"
            fill="#281d1b"
            stroke="#b58d57"
            strokeWidth="1"
          />
          <path d="M 87 7 C 93 7 93 13 87 13" fill="none" stroke="#b58d57" strokeWidth="1.1" />
        </g>

        {/* Outer bevel border */}
        <rect
          x="1.5"
          y="1.5"
          width="997"
          height="622"
          rx="12"
          fill="none"
          stroke="url(#brass-trim)"
          strokeWidth="3"
        />
      </svg>

      {exhibitionMode && (
        <div className="exhibition-plaque">
          <span className="exhibition-plaque-hemi">
            {hemisphere === 'north' ? 'Northern Observatory Window' : 'Southern Observatory Window'}
          </span>
          <strong className="exhibition-plaque-title">
            {exhibitionTitle.trim() || 'Untitled Sky Study'}
          </strong>
          <span className="exhibition-plaque-sub">
            Creative sky arrangement · Demo astronomical cutouts
          </span>
        </div>
      )}
    </div>
  );
});
