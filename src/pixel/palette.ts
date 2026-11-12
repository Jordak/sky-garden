/**
 * Curated 32-color Warm Observatory Twilight & Amber Pixel Palette.
 * All room tiles, furniture sprites, lighting dithers, and character frames
 * use strict palette colors on integer pixel coordinates.
 */
export const PAL = {
  // Void & night sky blues
  void: '#060710',
  nightDeep: '#0b0e1f',
  nightMid: '#141b36',
  nightSlate: '#1f2b52',
  nightBlue: '#31467a',
  starBlue: '#6b96db',
  starIce: '#b3d4ff',
  starWhite: '#f5f9ff',

  // Phosphor CRT cyan / emerald
  crtDark: '#0d262e',
  crtMid: '#1d5663',
  crtGlow: '#43b5bf',
  crtBright: '#9cf5eb',

  // Stone & slate observatory walls
  stoneShadow: '#121321',
  stoneDark: '#1c1f33',
  stoneMid: '#2a2f4a',
  stoneLight: '#3d4569',

  // Aged walnut & cedar timber
  woodOutline: '#160d10',
  woodShadow: '#261619',
  woodDark: '#3b2223',
  woodMid: '#57332e',
  woodWarm: '#78483a',
  woodLight: '#9c634b',
  woodHighlight: '#bf8563',

  // Brass, candlelight & gold
  brassDark: '#5e3d1e',
  brassMid: '#96652c',
  brassBright: '#cf9646',
  amberGlow: '#f2c46d',
  candleCream: '#fff0bd',

  // Cozy fabric, foliage & cat accents
  rugShadow: '#3d1725',
  rugCrimson: '#6e273b',
  rugRose: '#a34357',
  rugGoldTrim: '#d49a53',

  leafDark: '#1b362b',
  leafMid: '#2f5c43',
  leafBright: '#568f5c',

  coatDark: '#261d42',
  coatPlum: '#413269',
  coatLight: '#614d94',
  skinShadow: '#b87d63',
  skinWarm: '#e3ab8d',
  hairDark: '#291a1e',
  catGinger: '#d9783b',
  catCream: '#f7cfa6',
} as const;

export type FacingDir = 'down' | 'up' | 'left' | 'right';
