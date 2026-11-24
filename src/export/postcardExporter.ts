import {
  getCelestialDecor,
  getSourceGalaxyForCollectionEntry,
  SKY_BACKGROUNDS,
} from '../data/demoCatalog';
import type { PlacedObject, SceneComposition } from '../types/skyGarden';

const POSTCARD_W = 1280;
const STAGE_H = 720;
const PLAQUE_H = 120;
const POSTCARD_H = STAGE_H + PLAQUE_H;

const STAR_COLORS = ['#ffffff', '#dce8ff', '#fff2d6', '#ffd9b3', '#cadbff'];

export interface PostcardMetadata {
  readonly hemisphereLabel: string;
  readonly title: string;
  readonly featuredCatalogNames: readonly string[];
  readonly surveyCredits: readonly string[];
  readonly filename: string;
}

export interface PostcardExportResult {
  readonly ok: boolean;
  readonly filename?: string;
  readonly metadata?: PostcardMetadata;
  readonly error?: string;
}

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function sanitizeFilenameSlug(raw: string): string {
  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return slug || 'observatory-study';
}

export function buildPostcardMetadata(scene: SceneComposition): PostcardMetadata {
  const hemisphereLabel =
    scene.hemisphere === 'north' ? 'NORTHERN OBSERVATORY DOME' : 'SOUTHERN OBSERVATORY DOME';
  const title = scene.exhibitionTitle.trim() || 'Untitled Sky Study';
  const featuredCatalogNames: string[] = [];
  const seenCatalogs = new Set<string>();
  const surveyCredits: string[] = [];
  const seenSurveys = new Set<string>();

  const sorted = [...scene.objects].sort((a, b) => a.layer - b.layer);
  for (const obj of sorted) {
    if (obj.kind !== 'galaxy') continue;
    const galaxy = getSourceGalaxyForCollectionEntry(obj.refId);
    if (!galaxy) continue;
    if (!seenCatalogs.has(galaxy.catalogName)) {
      seenCatalogs.add(galaxy.catalogName);
      featuredCatalogNames.push(galaxy.catalogName);
    }
    const credit = `${galaxy.provenance.survey} (${galaxy.provenance.license})`;
    if (!seenSurveys.has(credit)) {
      seenSurveys.add(credit);
      surveyCredits.push(credit);
    }
  }

  if (surveyCredits.length === 0) {
    surveyCredits.push('DESI Legacy Imaging Surveys & SDSS DR18 (CC BY 4.0)');
  }

  const dateTag = new Date().toISOString().slice(0, 10);
  const filename = `sky-garden-${scene.hemisphere}-${sanitizeFilenameSlug(title)}-${dateTag}.png`;

  return {
    hemisphereLabel,
    title,
    featuredCatalogNames,
    surveyCredits,
    filename,
  };
}

function defaultLoadImage(url: string): Promise<HTMLImageElement | null> {
  if (typeof Image === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    let settled = false;
    const done = (result: HTMLImageElement | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(result);
    };
    const timer = window.setTimeout(() => done(null), 3000);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => done(img);
    img.onerror = () => done(null);
    img.src = url;
  });
}

function paintSkyBackground(ctx: CanvasRenderingContext2D, backgroundId: string): void {
  const grad = ctx.createLinearGradient(0, 0, 0, STAGE_H);
  if (backgroundId === 'bg-subarctic-aurora') {
    grad.addColorStop(0, '#113340');
    grad.addColorStop(0.55, '#0a1629');
    grad.addColorStop(1, '#050812');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, POSTCARD_W, STAGE_H);
    const glow = ctx.createRadialGradient(420, 140, 20, 420, 140, 620);
    glow.addColorStop(0, 'rgba(68, 204, 166, 0.22)');
    glow.addColorStop(1, 'rgba(8, 12, 24, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, POSTCARD_W, STAGE_H);
    return;
  }

  if (backgroundId === 'bg-austral-velvet') {
    grad.addColorStop(0, '#28183e');
    grad.addColorStop(0.54, '#100d26');
    grad.addColorStop(1, '#06060f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, POSTCARD_W, STAGE_H);
    const glow = ctx.createLinearGradient(0, STAGE_H * 0.45, 0, STAGE_H);
    glow.addColorStop(0, 'rgba(40, 22, 58, 0)');
    glow.addColorStop(1, 'rgba(168, 108, 82, 0.24)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, POSTCARD_W, STAGE_H);
    return;
  }

  if (backgroundId === 'bg-astronomical-twilight') {
    grad.addColorStop(0, '#080e22');
    grad.addColorStop(0.52, '#142447');
    grad.addColorStop(0.76, '#322c4a');
    grad.addColorStop(1, '#523840');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, POSTCARD_W, STAGE_H);
    return;
  }

  // Default Atacama Zenith
  const sky = ctx.createRadialGradient(POSTCARD_W / 2, 60, 20, POSTCARD_W / 2, 180, 920);
  sky.addColorStop(0, '#152145');
  sky.addColorStop(0.55, '#090e21');
  sky.addColorStop(1, '#04060e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, POSTCARD_W, STAGE_H);
}

function paintStarfieldAndNebula(ctx: CanvasRenderingContext2D, scene: SceneComposition): void {
  if (scene.nebulaLayerId === 'nebula-none') return;

  const rand = seededRandom(scene.hemisphere === 'north' ? 42197 : 91823);
  for (let i = 0; i < 165; i += 1) {
    const roll = rand();
    const r = (roll > 0.96 ? 1.55 + rand() * 0.8 : 0.45 + rand() * 0.85) * 1.15;
    const x = rand() * POSTCARD_W;
    const y = rand() * STAGE_H;
    const opacity = 0.24 + rand() * 0.72;
    const color = STAR_COLORS[Math.floor(rand() * STAR_COLORS.length)];
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  if (scene.nebulaLayerId === 'nebula-cygnus-veil') {
    const neb = ctx.createLinearGradient(120, 120, 1140, 540);
    neb.addColorStop(0, 'rgba(78, 205, 196, 0.16)');
    neb.addColorStop(0.55, 'rgba(79, 124, 255, 0.11)');
    neb.addColorStop(1, 'rgba(232, 111, 154, 0.14)');
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, POSTCARD_W, STAGE_H);
  } else if (scene.nebulaLayerId === 'nebula-carina-amber') {
    const neb = ctx.createRadialGradient(480, 320, 20, 480, 320, 540);
    neb.addColorStop(0, 'rgba(232, 154, 84, 0.22)');
    neb.addColorStop(0.55, 'rgba(176, 82, 92, 0.12)');
    neb.addColorStop(1, 'rgba(27, 18, 43, 0)');
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, POSTCARD_W, STAGE_H);
  } else {
    const neb = ctx.createRadialGradient(660, 300, 20, 660, 300, 560);
    neb.addColorStop(0, 'rgba(126, 182, 255, 0.2)');
    neb.addColorStop(0.6, 'rgba(72, 104, 184, 0.08)');
    neb.addColorStop(1, 'rgba(11, 19, 43, 0)');
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, POSTCARD_W, STAGE_H);
  }
  ctx.restore();
}

function paintDecorAccent(
  ctx: CanvasRenderingContext2D,
  glyphKind: string,
  sizePx: number,
): void {
  const half = sizePx / 2;
  if (glyphKind === 'comet-wisp') {
    const grad = ctx.createLinearGradient(-half * 0.65, half * 0.35, half * 0.8, -half * 0.5);
    grad.addColorStop(0, 'rgba(255, 243, 214, 0.9)');
    grad.addColorStop(0.45, 'rgba(124, 232, 255, 0.38)');
    grad.addColorStop(1, 'rgba(70, 118, 217, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-half * 0.65, half * 0.35);
    ctx.lineTo(half * 0.82, -half * 0.45);
    ctx.lineTo(half * 0.72, -half * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fffdf5';
    ctx.beginPath();
    ctx.arc(-half * 0.62, half * 0.33, sizePx * 0.04, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  const haloColor = glyphKind === 'globular-haze' ? '#f5c97b' : '#9ec8ff';
  const halo = ctx.createRadialGradient(0, 0, 2, 0, 0, half * 0.85);
  halo.addColorStop(0, 'rgba(255, 247, 227, 0.88)');
  halo.addColorStop(0.35, glyphKind === 'globular-haze' ? 'rgba(245, 201, 123, 0.4)' : 'rgba(158, 200, 255, 0.3)');
  halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, half * 0.85, 0, Math.PI * 2);
  ctx.fill();

  if (glyphKind === 'diffraction-star' || glyphKind === 'open-cluster') {
    ctx.strokeStyle = haloColor;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-half * 0.72, 0);
    ctx.lineTo(half * 0.72, 0);
    ctx.moveTo(0, -half * 0.72);
    ctx.lineTo(0, half * 0.72);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, sizePx * 0.045, 0, Math.PI * 2);
    ctx.fill();
  }
}

function paintVignettedGalaxy(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  sizePx: number,
): void {
  const scratch = document.createElement('canvas');
  const px = Math.max(64, Math.round(sizePx));
  scratch.width = px;
  scratch.height = px;
  const sCtx = scratch.getContext('2d');
  if (!sCtx) {
    ctx.drawImage(img, -sizePx / 2, -sizePx / 2, sizePx, sizePx);
    return;
  }

  sCtx.drawImage(img, 0, 0, px, px);
  sCtx.globalCompositeOperation = 'destination-in';
  const mask = sCtx.createRadialGradient(px / 2, px / 2, px * 0.22, px / 2, px / 2, px * 0.49);
  mask.addColorStop(0, 'rgba(255, 255, 255, 1)');
  mask.addColorStop(0.75, 'rgba(255, 255, 255, 0.9)');
  mask.addColorStop(1, 'rgba(255, 255, 255, 0)');
  sCtx.fillStyle = mask;
  sCtx.fillRect(0, 0, px, px);

  ctx.drawImage(scratch, -sizePx / 2, -sizePx / 2, sizePx, sizePx);
}

function drawMuseumPlaque(ctx: CanvasRenderingContext2D, meta: PostcardMetadata): void {
  const y0 = STAGE_H;
  ctx.fillStyle = '#08101a';
  ctx.fillRect(0, y0, POSTCARD_W, PLAQUE_H);

  ctx.strokeStyle = '#c99c52';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, y0 + 1.5);
  ctx.lineTo(POSTCARD_W, y0 + 1.5);
  ctx.stroke();

  ctx.fillStyle = '#9cf5eb';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`SKY GARDEN OBSERVATORY POSTCARD · ${meta.hemisphereLabel}`, 34, y0 + 34);

  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(meta.title, 34, y0 + 68);

  const featuredText =
    meta.featuredCatalogNames.length > 0
      ? `Featured Subjects: ${meta.featuredCatalogNames.join(', ')}`
      : 'Open Night Sky Study';
  ctx.fillStyle = '#b3d4ff';
  ctx.font = '14px monospace';
  ctx.fillText(featuredText.slice(0, 96), 34, y0 + 96);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#f2c46d';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('OFFLINE PROTOTYPE · UNMODIFIED CC BY 4.0 SURVEY CUTOUTS', POSTCARD_W - 34, y0 + 44);
  ctx.fillStyle = '#9cb9c9';
  ctx.font = '12px monospace';
  ctx.fillText(meta.surveyCredits.join(' · ').slice(0, 74), POSTCARD_W - 34, y0 + 70);
  ctx.fillText('https://jordak.github.io/sky-garden/', POSTCARD_W - 34, y0 + 96);
  ctx.textAlign = 'left';
}

export async function renderObservatoryPostcardDataUrl(options: {
  readonly scene: SceneComposition;
  readonly roomCanvas: HTMLCanvasElement | null;
  readonly loadImage?: (url: string) => Promise<HTMLImageElement | null>;
}): Promise<{ readonly dataUrl: string; readonly metadata: PostcardMetadata }> {
  const { scene, roomCanvas, loadImage = defaultLoadImage } = options;
  const metadata = buildPostcardMetadata(scene);

  const canvas = document.createElement('canvas');
  canvas.width = POSTCARD_W;
  canvas.height = POSTCARD_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2D canvas rendering context is unavailable.');
  }

  // Validate background preset exists; fallback cleanly if unknown
  const preset =
    SKY_BACKGROUNDS.find((b) => b.id === scene.backgroundId) ?? SKY_BACKGROUNDS[0];
  paintSkyBackground(ctx, preset.id);
  paintStarfieldAndNebula(ctx, scene);

  const orderedObjects: readonly PlacedObject[] = [...scene.objects].sort(
    (a, b) => a.layer - b.layer,
  );
  const uniqueUrls = Array.from(
    new Set(
      orderedObjects
        .filter((obj) => obj.kind === 'galaxy')
        .map((obj) => getSourceGalaxyForCollectionEntry(obj.refId)?.originalImageUrl)
        .filter((url): url is string => Boolean(url)),
    ),
  );
  const loadedEntries = await Promise.all(
    uniqueUrls.map(async (url) => [url, await loadImage(url)] as const),
  );
  const imageByUrl = new Map<string, HTMLImageElement | null>(loadedEntries);

  const baseUnitPx = POSTCARD_W * 0.135;

  for (const obj of orderedObjects) {
    const sizePx = baseUnitPx * obj.scale * (obj.kind === 'celestial_decor' ? 0.78 : 1);
    const cx = obj.x * POSTCARD_W;
    const cy = obj.y * STAGE_H;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((obj.rotationDeg * Math.PI) / 180);
    ctx.globalCompositeOperation = 'screen';

    if (obj.kind === 'galaxy') {
      const galaxy = getSourceGalaxyForCollectionEntry(obj.refId);
      if (galaxy) {
        const img = imageByUrl.get(galaxy.originalImageUrl) ?? null;
        if (img) {
          paintVignettedGalaxy(ctx, img, sizePx);
        } else {
          paintDecorAccent(ctx, 'globular-haze', sizePx * 0.85);
        }
      }
    } else {
      const decor = getCelestialDecor(obj.refId);
      if (decor) {
        paintDecorAccent(ctx, decor.glyphKind, sizePx);
      }
    }
    ctx.restore();
  }

  // Layer 2 foreground cutaway observatory canvas scaled with nearest-neighbor crispness
  if (roomCanvas) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(roomCanvas, 0, 0, POSTCARD_W, STAGE_H);
    ctx.restore();
  }

  drawMuseumPlaque(ctx, metadata);

  const dataUrl = canvas.toDataURL('image/png');
  return { dataUrl, metadata };
}

export async function downloadObservatoryPostcardPng(options: {
  readonly scene: SceneComposition;
  readonly roomCanvas: HTMLCanvasElement | null;
}): Promise<PostcardExportResult> {
  try {
    const { dataUrl, metadata } = await renderObservatoryPostcardDataUrl(options);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = metadata.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return {
      ok: true,
      filename: metadata.filename,
      metadata,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to export PNG postcard.';
    return {
      ok: false,
      error: message,
    };
  }
}
