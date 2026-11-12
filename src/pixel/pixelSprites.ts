import { PAL } from './palette';

const LEGEND: Record<string, string> = {
  '.': '',
  '0': PAL.void,
  '1': PAL.stoneShadow,
  '2': PAL.stoneDark,
  '3': PAL.stoneMid,
  '4': PAL.stoneLight,
  w: PAL.woodOutline,
  d: PAL.woodShadow,
  W: PAL.woodDark,
  m: PAL.woodMid,
  u: PAL.woodWarm,
  l: PAL.woodLight,
  h: PAL.woodHighlight,
  b: PAL.brassDark,
  B: PAL.brassMid,
  G: PAL.brassBright,
  Y: PAL.amberGlow,
  C: PAL.candleCream,
  c: PAL.crtDark,
  t: PAL.crtMid,
  T: PAL.crtGlow,
  Q: PAL.crtBright,
  r: PAL.rugShadow,
  R: PAL.rugCrimson,
  p: PAL.rugRose,
  g: PAL.rugGoldTrim,
  f: PAL.leafDark,
  F: PAL.leafMid,
  L: PAL.leafBright,
  k: PAL.coatDark,
  K: PAL.coatPlum,
  v: PAL.coatLight,
  s: PAL.skinShadow,
  S: PAL.skinWarm,
  H: PAL.hairDark,
  o: PAL.catGinger,
  O: PAL.catCream,
  '*': PAL.starWhite,
};

export function compilePixelArt(rows: readonly string[]): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  for (let y = 0; y < height; y += 1) {
    const row = rows[y];
    for (let x = 0; x < row.length; x += 1) {
      const color = LEGEND[row[x]];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  return canvas;
}

function flipCanvasHorizontal(src: HTMLCanvasElement | null): HTMLCanvasElement | null {
  if (!src || typeof document === 'undefined') return null;
  const out = document.createElement('canvas');
  out.width = src.width;
  out.height = src.height;
  const ctx = out.getContext('2d');
  if (!ctx) return null;
  ctx.translate(src.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(src, 0, 0);
  return out;
}

// Side-profile pixel astronomer (16x20)
const PLAYER_RIGHT_IDLE: readonly string[] = [
  '.....HHHHHH.....',
  '....HHHHHHHH....',
  '...HHHHSSSSHH...',
  '...HHHSSSS0SH...',
  '...HHHSSSSSSH...',
  '....HHsSSSSs....',
  '...GGGGGGGGGG...',
  '..GYGKKKKKKvKk..',
  '..GGkKKKKKKvKKk.',
  '....kKKKKKKKKKk.',
  '....kKKkKKKKKKk.',
  '....kKKkKKKKsSS.',
  '....kKKKKKKKKss.',
  '....kKKKKKKKKk..',
  '.....kKKKKKKk...',
  '.....kKK..KKk...',
  '.....kKK..KKk...',
  '.....dWW..WWd...',
  '.....dWW..WWd...',
  '.....www..www...',
];

const PLAYER_RIGHT_RUN1: readonly string[] = [
  '......HHHHHH....',
  '.....HHHHHHHH...',
  '....HHHHSSSSHH..',
  '....HHHSSSS0SH..',
  '....HHHSSSSSSH..',
  '.....HHsSSSSs...',
  '..GGGGGGGGGGG...',
  '.GYYGKKKKKKvKk..',
  '....kKKKKKKvKKk.',
  '....kKKKKKKKKSS.',
  '....sSSKKKKKKss.',
  '.....ssKKKKKKk..',
  '.....kKKKKKKk...',
  '....kKKk..KKKk..',
  '...kKKk....kKKk.',
  '..dWWd......dWWd',
  '..www........www',
  '................',
  '................',
  '................',
];

const PLAYER_RIGHT_RUN2: readonly string[] = [
  '.....HHHHHH.....',
  '....HHHHHHHH....',
  '...HHHHSSSSHH...',
  '...HHHSSSS0SH...',
  '...HHHSSSSSSH...',
  '....HHsSSSSs....',
  '..GGGGGGGGGG....',
  '.GYG.kKKKKKvKk..',
  '.....kKKKKKvKKk.',
  '.....kKKKKsSSKk.',
  '.....kKKKKkssKk.',
  '.....kKKKKKKKKk.',
  '......kKKKKKKk..',
  '......kKKKKKKk..',
  '......kKK.KKk...',
  '.....dWW..dWWd..',
  '.....www...www..',
  '................',
  '................',
  '................',
];

const PLAYER_RIGHT_JUMP: readonly string[] = [
  '.....HHHHHH.....',
  '....HHHHHHHH....',
  '...HHHHSSSSHH...',
  '...HHHSSSS0SH...',
  '...HHHSSSSSSH...',
  '....HHsSSSSs....',
  '.GGGGGGGGGGG....',
  'GYYG.kKKKKKvKk..',
  'G....kKKKKKvKKsS',
  '.....kKKKKKKKKss',
  '.....kKKKKKKKKk.',
  '.....kKKKKKKKk..',
  '....kKKk..kKKk..',
  '...dWWd....dWWd.',
  '...www......www.',
  '................',
  '................',
  '................',
  '................',
  '................',
];

// Side-view Brass Refractor Telescope on Tripod (28x24)
const TELESCOPE_SPRITE: readonly string[] = [
  '......................GG....',
  '....................GGBBG...',
  '..................GGBBBBBG..',
  '................GGBBBYYBBBG.',
  '..............GGBBBYYYYBBBB.',
  '............GGBBBYYYYBBBBb..',
  '..........GGBBBYYYYBBBBb....',
  '........GGBBBYYYYBBBBb......',
  '.......bBBBBYYYBBBBb........',
  '......bBBBBBBBBBBb..........',
  '.....wBBBBBBBBb.............',
  '....wWw..bGGb...............',
  '.........bGGb...............',
  '........bBBBBb..............',
  '........wmmmmw..............',
  '........wu..uw..............',
  '.......wmu..umw.............',
  '.......wm.ww.mw.............',
  '......wmu.wm.umw............',
  '......wm..wm..mw............',
  '.....wmu..wm..umw...........',
  '.....wm...wm...mw...........',
  '....wmu...wm...umw..........',
  '....bb....bb....bb..........',
];

// Side-view Blink Comparator CRT Desk + Lamp + Mug (40x23)
const CRT_DESK_SPRITE: readonly string[] = [
  '.......bbbbbbbbbb.......................',
  '......bGGGGGGGGGGb............GGG.......',
  '.....bGGccccccccGGb..........GYYYG......',
  '.....bGctTTTTTTtcGb..........CYYYC......',
  '.....bGcTTQ**QTTcGb...........bGb.......',
  '.....bGcTT*QQ*TTcGb............B........',
  '.....bGctTTTTTTtcGb............B....C...',
  '.....bGcctttttttcGb............B...lhl..',
  '.....bGGGGGGGGGGGYb...........bBb..lRl..',
  '.......bbbbBBBBbb............bBBBb.lll..',
  '.........bBBBBb......wwwwww.............',
  '..wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww..',
  '.whhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhw.',
  '.wllllllllllllllllllllllllllllllllllllw.',
  '.wuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuw.',
  '..wmmmmwmmmmmmmmmmmmmmmmmmmmmmmmwmmmmw..',
  '..wmmmmw........................wmmmmw..',
  '..wmmmmw......wwwwwwwwww........wmmmmw..',
  '..wWWWWw.....wllllllllllw.......wWWWWw..',
  '..wWWWWw......wmmmmmmmmw........wWWWWw..',
  '..wWWWWw........wmmmmw..........wWWWWw..',
  '..wWWWWw........wWWWWw..........wWWWWw..',
  '..wwwwww.......wWWWWWWw.........wwwwww..',
];

// Side-view Illuminated Star Atlas Lectern (20x20)
const LECTERN_SPRITE: readonly string[] = [
  '.....CC......CC.....',
  '...CCYYCCCCCCYYCC...',
  '..CYYYYCwwwwCYYYYC..',
  '.bbbbbbbbbbbbbbbbbb.',
  '..bGGGGGGGGGGGGGGb..',
  '...wwwwwwwwwwwwww...',
  '.....whhhhhhhhw.....',
  '......wllllllw......',
  '.......wuuuuw.......',
  '.......wuuuuw.......',
  '.......wmmmmw.......',
  '.......wmmmmw.......',
  '.......wmmmmw.......',
  '.......wmmmmw.......',
  '.......wWWWWw.......',
  '......wuuuuuuw......',
  '.....wllllllllw.....',
  '....wmmmmmmmmmmw....',
  '....wWWWWWWWWWWw....',
  '....wwwwwwwwwwww....',
];

// Side-view Hemisphere Dome Gear Wheel (20x18)
const DOME_WHEEL_SPRITE: readonly string[] = [
  '........GGGG........',
  '.....GGBBBBBBG......',
  '....GBb..GG..bBG....',
  '...GBb...GG...bBG...',
  '..GBb.GGGGGGGG.bBG..',
  '..GB..GGGGGGGG..BG..',
  '...GBb...GG...bBG...',
  '....GBb..GG..bBG....',
  '.....GGBBBBBBG......',
  '........bGGb........',
  '.......wmmmmw.......',
  '.......wuuuuw.......',
  '......wllllllw......',
  '......wmmmmmmw......',
  '......wmmmmmmw......',
  '.....wWWWWWWWWw.....',
  '....wmmmmmmmmmmw....',
  '....wwwwwwwwwwww....',
];

// Side-view Bookshelf (24x23)
const BOOKSHELF_SPRITE: readonly string[] = [
  '.wwwwwwwwwwwwwwwwwwwwww.',
  'whhhhhhhhhhhhhhhhhhhhhhw',
  'wllllllllllllllllllllllw',
  'wmmRRmmzzmmGGmmFFmmKKmmw',
  'wmmRRmmzzmmGGmmFFmmKKmmw',
  'wmmRRppzzGGYYmmFFLLKKvvw',
  'wmmRRppzzGGYYmmFFLLKKvvw',
  'wuuuuuuuuuuuuuuuuuuuuuuw',
  'wwwwwwwwwwwwwwwwwwwwwwww',
  'wmmKKmmGGmmRRmmzzmmFFmmw',
  'wmmKKvvGGmmRRppzzmmFFmmw',
  'wmmKKvvGGmmRRppzzmmFFLLw',
  'wmmKKvvGGmmRRppzzmmFFLLw',
  'wuuuuuuuuuuuuuuuuuuuuuuw',
  'wwwwwwwwwwwwwwwwwwwwwwww',
  'wmmFFmmRRmmbbbbmmKKmmzzw',
  'wmmFFLLRRmmBBBBmmKKvvzzw',
  'wmmFFLLRRmmBBBBmmKKvvzzw',
  'wmmFFLLRRmmbbbbmmKKvvzzw',
  'wuuuuuuuuuuuuuuuuuuuuuuw',
  'wmmmmmmmmmmmmmmmmmmmmmmw',
  'wWWWWWWWWWWWWWWWWWWWWWWw',
  'wwwwwwwwwwwwwwwwwwwwwwww',
];

// Side-view Curator's Workbench & Window Bench (42x12)
const WORKBENCH_SPRITE: readonly string[] = [
  '.........................wwwwwwwwwwwwwwww.',
  '........................wRRRRRRRRRRRRRRRRw',
  '.......................wpRRRRpRRRRpRRRRpRw',
  '.wwwwwwwwwwwwwwwwwwwwwwwgggggggggggggggggw',
  'whhhhhhhhhhhhhhhhhhhhhhhlllllllllllllllllw',
  'wuuuuuuuuuuuuuuuuuuuuuuummmmmmmmmmmmmmmmmw',
  '.wmmw..............wmmw.wmmw..........wmmw',
  '.wmmw..bbbbbbbbbb..wmmw.wmmw..........wmmw',
  '.wmmw.bGGGGGGGGGGb.wmmw.wWWWWWWWWWWWWWWWWw',
  '.wWWw.bBBBBBBBBBBb.wWWw.wWWWWWWWWWWWWWWWWw',
  '.wWWw.wwwwwwwwwwww.wWWw.wwwwwwwwwwwwwwwwww',
  '.wwww..............wwww...................',
];

const CAT_SLEEP_1: readonly string[] = [
  '.....oo..oo.....',
  '....oooooooo....',
  '...ooOooooOoo...',
  '..oooooooooooo..',
  '.ooooooOOOooooo.',
  '.oooooOOOOOoooo.',
  '..oooooooooooo..',
];

const CAT_SLEEP_2: readonly string[] = [
  '.....oo..oo.....',
  '....oooooooo....',
  '...ooOooooOoo.o.',
  '..ooooooooooo.o.',
  '.ooooooOOOoooo..',
  '.oooooOOOOOooo..',
  '..oooooooooooo..',
];

const POTTED_FERN: readonly string[] = [
  '.....LL..LL.....',
  '...LLFFLLFFLL...',
  '.LLFFFFFFFFFFL..',
  'LFFFFfLLLLfFFFL.',
  '.FFffFFLLFFffF..',
  '..LLFFffffFFL...',
  '...wwwwwwwwww...',
  '..wllllllllllw..',
  '...wuuuuuuuuw...',
  '...wWWWWWWWWw...',
  '....wwwwwwww....',
];

export interface SideSpriteSheet {
  readonly playerRight: {
    readonly idle: HTMLCanvasElement | null;
    readonly run: readonly (HTMLCanvasElement | null)[];
    readonly jump: HTMLCanvasElement | null;
  };
  readonly playerLeft: {
    readonly idle: HTMLCanvasElement | null;
    readonly run: readonly (HTMLCanvasElement | null)[];
    readonly jump: HTMLCanvasElement | null;
  };
  readonly crtDesk: HTMLCanvasElement | null;
  readonly lectern: HTMLCanvasElement | null;
  readonly telescope: HTMLCanvasElement | null;
  readonly domeWheel: HTMLCanvasElement | null;
  readonly bookshelf: HTMLCanvasElement | null;
  readonly workbench: HTMLCanvasElement | null;
  readonly catFrames: readonly (HTMLCanvasElement | null)[];
  readonly fern: HTMLCanvasElement | null;
}

let cachedSideSheet: SideSpriteSheet | null = null;

export function getSideSpriteSheet(): SideSpriteSheet {
  if (cachedSideSheet) return cachedSideSheet;

  const rIdle = compilePixelArt(PLAYER_RIGHT_IDLE);
  const rRun1 = compilePixelArt(PLAYER_RIGHT_RUN1);
  const rRun2 = compilePixelArt(PLAYER_RIGHT_RUN2);
  const rJump = compilePixelArt(PLAYER_RIGHT_JUMP);

  cachedSideSheet = {
    playerRight: {
      idle: rIdle,
      run: [rRun1, rIdle, rRun2, rIdle],
      jump: rJump,
    },
    playerLeft: {
      idle: flipCanvasHorizontal(rIdle),
      run: [
        flipCanvasHorizontal(rRun1),
        flipCanvasHorizontal(rIdle),
        flipCanvasHorizontal(rRun2),
        flipCanvasHorizontal(rIdle),
      ],
      jump: flipCanvasHorizontal(rJump),
    },
    crtDesk: compilePixelArt(CRT_DESK_SPRITE),
    lectern: compilePixelArt(LECTERN_SPRITE),
    telescope: compilePixelArt(TELESCOPE_SPRITE),
    domeWheel: compilePixelArt(DOME_WHEEL_SPRITE),
    bookshelf: compilePixelArt(BOOKSHELF_SPRITE),
    workbench: compilePixelArt(WORKBENCH_SPRITE),
    catFrames: [compilePixelArt(CAT_SLEEP_1), compilePixelArt(CAT_SLEEP_2)],
    fern: compilePixelArt(POTTED_FERN),
  };

  return cachedSideSheet;
}
