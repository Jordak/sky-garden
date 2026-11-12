import React from 'react';
import type { AnswerIconId } from '../data/galaxyZooWorkflow';

interface MorphologyGlyphProps {
  readonly icon: AnswerIconId;
}

export const MorphologyGlyph: React.FC<MorphologyGlyphProps> = ({ icon }) => {
  return (
    <svg
      viewBox="0 0 28 28"
      width={26}
      height={26}
      className="morphology-glyph"
      aria-hidden="true"
    >
      {icon === 'smooth' && (
        <>
          <circle cx="14" cy="14" r="9" fill="rgba(67,181,191,0.18)" stroke="#43b5bf" strokeWidth="1.2" />
          <circle cx="14" cy="14" r="5" fill="rgba(156,245,235,0.28)" />
          <circle cx="14" cy="14" r="2.2" fill="#ffd27d" />
        </>
      )}
      {icon === 'features-disk' && (
        <>
          <ellipse cx="14" cy="14" rx="10.5" ry="5.5" transform="rotate(-24 14 14)" fill="none" stroke="#43b5bf" strokeWidth="1.3" />
          <path d="M7 17 C10 10, 18 18, 21 11" fill="none" stroke="#9cf5eb" strokeWidth="1.6" />
          <circle cx="14" cy="14" r="2" fill="#ffd27d" />
        </>
      )}
      {icon === 'artifact' && (
        <>
          <line x1="14" y1="3" x2="14" y2="25" stroke="#9cf5eb" strokeWidth="1.4" />
          <line x1="3" y1="14" x2="25" y2="14" stroke="#9cf5eb" strokeWidth="1.4" />
          <line x1="8" y1="8" x2="20" y2="20" stroke="#43b5bf" strokeWidth="1" />
          <line x1="20" y1="8" x2="8" y2="20" stroke="#43b5bf" strokeWidth="1" />
          <circle cx="14" cy="14" r="2.5" fill="#ffd27d" />
        </>
      )}
      {icon === 'round' && (
        <>
          <circle cx="14" cy="14" r="8.5" fill="rgba(67,181,191,0.2)" stroke="#9cf5eb" strokeWidth="1.4" />
          <circle cx="14" cy="14" r="2.6" fill="#ffd27d" />
        </>
      )}
      {icon === 'elliptical' && (
        <>
          <ellipse cx="14" cy="14" rx="10" ry="6.2" transform="rotate(-20 14 14)" fill="rgba(67,181,191,0.2)" stroke="#9cf5eb" strokeWidth="1.4" />
          <circle cx="14" cy="14" r="2.2" fill="#ffd27d" />
        </>
      )}
      {icon === 'cigar' && (
        <>
          <ellipse cx="14" cy="14" rx="11" ry="3.4" transform="rotate(-25 14 14)" fill="rgba(67,181,191,0.22)" stroke="#9cf5eb" strokeWidth="1.4" />
          <circle cx="14" cy="14" r="1.8" fill="#ffd27d" />
        </>
      )}
      {icon === 'edge-on' && (
        <>
          <line x1="4" y1="19" x2="24" y2="9" stroke="#9cf5eb" strokeWidth="3.2" strokeLinecap="round" />
          <line x1="4" y1="19" x2="24" y2="9" stroke="#08131a" strokeWidth="1.1" />
          <circle cx="14" cy="14" r="2.3" fill="#ffd27d" />
        </>
      )}
      {icon === 'face-on' && (
        <>
          <circle cx="14" cy="14" r="9.5" fill="none" stroke="#43b5bf" strokeWidth="1.2" strokeDasharray="2 2" />
          <path d="M14 14 C16 9, 22 10, 21 15" fill="none" stroke="#9cf5eb" strokeWidth="1.5" />
          <path d="M14 14 C12 19, 6 18, 7 13" fill="none" stroke="#9cf5eb" strokeWidth="1.5" />
          <circle cx="14" cy="14" r="2.2" fill="#ffd27d" />
        </>
      )}
      {icon === 'bulge-round' && (
        <>
          <line x1="4" y1="14" x2="24" y2="14" stroke="#9cf5eb" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="14" cy="14" r="4.6" fill="rgba(255,210,125,0.35)" stroke="#ffd27d" strokeWidth="1.4" />
        </>
      )}
      {icon === 'bulge-boxy' && (
        <>
          <line x1="4" y1="14" x2="24" y2="14" stroke="#9cf5eb" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M9 10 Q14 12 19 10 L19 18 Q14 16 9 18 Z" fill="rgba(255,210,125,0.3)" stroke="#ffd27d" strokeWidth="1.3" />
        </>
      )}
      {icon === 'bulge-none' && (
        <>
          <line x1="4" y1="14" x2="24" y2="14" stroke="#9cf5eb" strokeWidth="2.6" strokeLinecap="round" />
          <line x1="6" y1="14" x2="22" y2="14" stroke="#ffd27d" strokeWidth="1" />
        </>
      )}
      {icon === 'bar-strong' && (
        <>
          <ellipse cx="14" cy="14" rx="10" ry="7" transform="rotate(-18 14 14)" fill="none" stroke="#43b5bf" strokeWidth="1.2" />
          <line x1="7" y1="16" x2="21" y2="12" stroke="#ffd27d" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M21 12 Q24 16 18 20" fill="none" stroke="#9cf5eb" strokeWidth="1.4" />
          <path d="M7 16 Q4 12 10 8" fill="none" stroke="#9cf5eb" strokeWidth="1.4" />
        </>
      )}
      {icon === 'bar-weak' && (
        <>
          <circle cx="14" cy="14" r="9.5" fill="none" stroke="#43b5bf" strokeWidth="1.1" strokeDasharray="2 2" />
          <line x1="10" y1="15" x2="18" y2="13" stroke="#ffd27d" strokeWidth="2" strokeLinecap="round" />
          <path d="M18 13 Q22 16 17 20" fill="none" stroke="#9cf5eb" strokeWidth="1.4" />
          <path d="M10 15 Q6 12 11 8" fill="none" stroke="#9cf5eb" strokeWidth="1.4" />
        </>
      )}
      {icon === 'bar-none' && (
        <>
          <path d="M14 14 Q20 9 22 15" fill="none" stroke="#9cf5eb" strokeWidth="1.4" />
          <path d="M14 14 Q8 19 6 13" fill="none" stroke="#9cf5eb" strokeWidth="1.4" />
          <circle cx="14" cy="14" r="3" fill="#ffd27d" />
        </>
      )}
      {icon === 'spiral-yes' && (
        <>
          <path d="M14 14 C16 8, 23 10, 21 18" fill="none" stroke="#9cf5eb" strokeWidth="1.6" />
          <path d="M14 14 C12 20, 5 18, 7 10" fill="none" stroke="#9cf5eb" strokeWidth="1.6" />
          <circle cx="14" cy="14" r="2.3" fill="#ffd27d" />
        </>
      )}
      {icon === 'ring-only' && (
        <>
          <circle cx="14" cy="14" r="9" fill="none" stroke="#9cf5eb" strokeWidth="1.8" />
          <circle cx="14" cy="14" r="2.6" fill="#ffd27d" />
        </>
      )}
      {icon === 'wind-tight' && (
        <>
          <circle cx="14" cy="14" r="9" fill="none" stroke="#43b5bf" strokeWidth="1.2" />
          <circle cx="14" cy="14" r="6" fill="none" stroke="#9cf5eb" strokeWidth="1.3" strokeDasharray="7 2" />
          <circle cx="14" cy="14" r="2.2" fill="#ffd27d" />
        </>
      )}
      {icon === 'wind-medium' && (
        <>
          <path d="M14 14 C17 9, 22 12, 20 19" fill="none" stroke="#9cf5eb" strokeWidth="1.5" />
          <path d="M14 14 C11 19, 6 16, 8 9" fill="none" stroke="#9cf5eb" strokeWidth="1.5" />
          <circle cx="14" cy="14" r="2.2" fill="#ffd27d" />
        </>
      )}
      {icon === 'wind-loose' && (
        <>
          <path d="M14 14 Q21 7 24 17" fill="none" stroke="#9cf5eb" strokeWidth="1.6" />
          <path d="M14 14 Q7 21 4 11" fill="none" stroke="#9cf5eb" strokeWidth="1.6" />
          <circle cx="14" cy="14" r="2.1" fill="#ffd27d" />
        </>
      )}
      {icon === 'merger' && (
        <>
          <path d="M9 17 Q14 14 19 10" fill="none" stroke="#9cf5eb" strokeWidth="2.2" />
          <path d="M6 12 Q12 22 22 16" fill="none" stroke="#43b5bf" strokeWidth="1.2" />
          <circle cx="9" cy="17" r="2.4" fill="#ffd27d" />
          <circle cx="19" cy="10" r="2" fill="#ffd27d" />
        </>
      )}
      {icon === 'tidal-shells' && (
        <>
          <path d="M5 10 Q14 4 23 10" fill="none" stroke="#9cf5eb" strokeWidth="1.3" />
          <path d="M4 18 Q14 24 24 18" fill="none" stroke="#43b5bf" strokeWidth="1.3" />
          <circle cx="14" cy="14" r="3" fill="#ffd27d" />
        </>
      )}
      {icon === 'ring-dust' && (
        <>
          <ellipse cx="14" cy="14" rx="9.5" ry="6" transform="rotate(-22 14 14)" fill="none" stroke="#9cf5eb" strokeWidth="1.6" />
          <line x1="6" y1="17" x2="22" y2="11" stroke="#08131a" strokeWidth="1.5" />
          <circle cx="14" cy="14" r="2.1" fill="#ffd27d" />
        </>
      )}
      {icon === 'none' && (
        <>
          <circle cx="14" cy="14" r="7.5" fill="none" stroke="#43b5bf" strokeWidth="1.2" />
          <line x1="9" y1="14" x2="19" y2="14" stroke="#9cf5eb" strokeWidth="1.3" />
        </>
      )}
    </svg>
  );
};
