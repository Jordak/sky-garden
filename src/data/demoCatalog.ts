import type {
  CelestialDecorItem,
  CollectionEntry,
  NebulaLayerPreset,
  SavedScenesState,
  SkyBackgroundPreset,
  SourceGalaxy,
  WindowFramePreset,
} from '../types/skyGarden';

export const SOURCE_GALAXIES: readonly SourceGalaxy[] = Object.freeze([
  {
    id: 'src-ngc-1300',
    catalogName: 'NGC 1300',
    commonTitle: 'Grand-Design Barred Spiral',
    morphologyNote: 'Strong central stellar bar feeding two sweeping blue star-forming spiral arms and inner dust lanes.',
    scienceContext:
      'Barred spirals test how stellar bars funnel gas inward without necessarily triggering an active galactic nucleus.',
    originalImageUrl: '/assets/galaxies/ngc-1300.jpg',
    provenance: {
      survey: 'DESI Legacy Imaging Surveys',
      dataRelease: 'DR10 (g, r, i, z composite)',
      license: 'CC BY 4.0',
      attribution: 'Legacy Surveys / D. Lang (Perimeter Institute)',
      sourceUrl:
        'https://www.legacysurvey.org/viewer?ra=49.9212&dec=-19.4114&layer=ls-dr10&zoom=13',
      angularFieldArcmin: 7.25,
    },
    skyCoordinates: {
      status: 'verified',
      frame: 'ICRS (J2000)',
      raDeg: 49.9212,
      decDeg: -19.4114,
      raHms: '03h 19m 41.1s',
      decDms: '−19° 24′ 41″',
      constellation: 'Eridanus',
    },
  },
  {
    id: 'src-ngc-1365',
    catalogName: 'NGC 1365',
    commonTitle: 'Great Fornax Barred Spiral',
    morphologyNote: 'Open two-armed spiral with bright blue OB associations, prominent dust lanes, and a warm nuclear bar.',
    scienceContext:
      'In Galaxy Zoo workflows, distinguishing bar-driven arms from tidal tails helps calibrate secular vs. merger-driven evolution.',
    originalImageUrl: '/assets/galaxies/ngc-1365.jpg',
    provenance: {
      survey: 'DESI Legacy Imaging Surveys',
      dataRelease: 'DR10 (DECam multi-band)',
      license: 'CC BY 4.0',
      attribution: 'Legacy Surveys / D. Lang (Perimeter Institute)',
      sourceUrl:
        'https://www.legacysurvey.org/viewer?ra=53.4015&dec=-36.1406&layer=ls-dr10&zoom=12',
      angularFieldArcmin: 12.8,
    },
    skyCoordinates: {
      status: 'verified',
      frame: 'ICRS (J2000)',
      raDeg: 53.4015,
      decDeg: -36.1406,
      raHms: '03h 33m 36.4s',
      decDms: '−36° 08′ 26″',
      constellation: 'Fornax',
    },
  },
  {
    id: 'src-ngc-4565',
    catalogName: 'NGC 4565',
    commonTitle: 'Needle Edge-On Disk',
    morphologyNote: 'Razor-thin edge-on disk bisected by a crisp equatorial dust lane and a boxy, peanut-shaped central bulge.',
    scienceContext:
      'Edge-on disks let volunteers classify bulge geometry (boxy vs. rounded) and vertical disk warping that face-on views hide.',
    originalImageUrl: '/assets/galaxies/ngc-4565.jpg',
    provenance: {
      survey: 'DESI Legacy Imaging Surveys',
      dataRelease: 'DR10',
      license: 'CC BY 4.0',
      attribution: 'Legacy Surveys / D. Lang (Perimeter Institute)',
      sourceUrl:
        'https://www.legacysurvey.org/viewer?ra=189.0866&dec=25.9877&layer=ls-dr10&zoom=12',
      angularFieldArcmin: 13.65,
    },
    skyCoordinates: {
      status: 'verified',
      frame: 'ICRS (J2000)',
      raDeg: 189.0866,
      decDeg: 25.9877,
      raHms: '12h 36m 20.8s',
      decDms: '+25° 59′ 16″',
      constellation: 'Coma Berenices',
    },
  },
  {
    id: 'src-arp-87',
    catalogName: 'Arp 87 (NGC 3808A/B)',
    commonTitle: 'Tidal Bridge Pair',
    morphologyNote: 'Interacting face-on and edge-on spirals linked by a luminous stream of stars and dust stripped during close passage.',
    scienceContext:
      'Faint tidal bridges frequently confuse automated classifiers when foreground stars overlap; human active-learning labels sharpen Zoobot.',
    originalImageUrl: '/assets/galaxies/arp-87.jpg',
    provenance: {
      survey: 'DESI Legacy Imaging Surveys',
      dataRelease: 'DR10',
      license: 'CC BY 4.0',
      attribution: 'Legacy Surveys / D. Lang (Perimeter Institute)',
      sourceUrl:
        'https://www.legacysurvey.org/viewer?ra=175.1828&dec=22.4330&layer=ls-dr10&zoom=15',
      angularFieldArcmin: 2.22,
    },
    skyCoordinates: {
      status: 'verified',
      frame: 'ICRS (J2000)',
      raDeg: 175.1828,
      decDeg: 22.433,
      raHms: '11h 40m 43.9s',
      decDms: '+22° 25′ 59″',
      constellation: 'Leo',
    },
  },
  {
    id: 'src-ngc-474',
    catalogName: 'NGC 474',
    commonTitle: 'Concentric Shell Elliptical',
    morphologyNote: 'Smooth golden spheroid wrapped in delicate concentric tidal shells left behind by ancient minor mergers.',
    scienceContext:
      'Try toggling Negative Plate (Invert) in the Subject Inspector—low-surface-brightness shells leap out immediately.',
    originalImageUrl: '/assets/galaxies/ngc-474.jpg',
    provenance: {
      survey: 'DESI Legacy Imaging Surveys',
      dataRelease: 'DR10',
      license: 'CC BY 4.0',
      attribution: 'Legacy Surveys / D. Lang (Perimeter Institute)',
      sourceUrl:
        'https://www.legacysurvey.org/viewer?ra=20.0279&dec=3.4153&layer=ls-dr10&zoom=13',
      angularFieldArcmin: 5.55,
    },
    skyCoordinates: {
      status: 'verified',
      frame: 'ICRS (J2000)',
      raDeg: 20.0279,
      decDeg: 3.4153,
      raHms: '01h 20m 06.7s',
      decDms: '+03° 24′ 55″',
      constellation: 'Pisces',
    },
  },
  {
    id: 'src-hoags-object',
    catalogName: 'PGC 54559',
    commonTitle: "Hoag's Detached Ring",
    morphologyNote: 'Nearly circular ring of hot blue stars orbiting a detached yellow-red core with an almost empty gap between them.',
    scienceContext:
      'Rare ring morphologies represent <0.1% of local galaxies and remain prime targets for human anomaly discovery in wide surveys.',
    originalImageUrl: '/assets/galaxies/hoags-object.jpg',
    provenance: {
      survey: 'Sloan Digital Sky Survey',
      dataRelease: 'SDSS DR18 (gri composite)',
      license: 'CC BY 4.0',
      attribution: 'SDSS Collaboration (www.sdss.org)',
      sourceUrl:
        'https://skyserver.sdss.org/dr18/VisualTools/navi?ra=229.3095&dec=21.5858&scale=0.18',
      angularFieldArcmin: 1.54,
    },
    skyCoordinates: {
      status: 'verified',
      frame: 'ICRS (J2000)',
      raDeg: 229.3095,
      decDeg: 21.5858,
      raHms: '15h 17m 14.3s',
      decDms: '+21° 35′ 09″',
      constellation: 'Serpens',
    },
  },
  {
    id: 'src-subject-alpha',
    catalogName: 'Demo Subject GZ-88412',
    commonTitle: 'Orthogonal Spiral Pair (Metadata Omitted)',
    morphologyNote: 'Edge-on dusty disk aligned perpendicularly above a face-on spiral companion in the same survey frame.',
    scienceContext:
      'Models a live Zooniverse subject whose public workflow metadata omits sky coordinates prior to catalog publication.',
    originalImageUrl: '/assets/galaxies/field-subject-alpha.jpg',
    provenance: {
      survey: 'Sloan Digital Sky Survey',
      dataRelease: 'SDSS DR18 Cutout Archive',
      license: 'CC BY 4.0',
      attribution: 'SDSS Collaboration (bundled as unindexed workflow demo subject)',
      sourceUrl: 'https://www.sdss.org/collaboration/citing-sdss/',
      angularFieldArcmin: 1.88,
    },
    skyCoordinates: {
      status: 'unavailable',
      reason: 'Sky coordinates are not exposed in this workflow subject packet.',
    },
  },
  {
    id: 'src-subject-beta',
    catalogName: 'Demo Subject GZ-90347',
    commonTitle: 'Collisional Ring Candidate (Unverified Coords)',
    morphologyNote: 'Compact elongated companion piercing an expanding blue collisional ring.',
    scienceContext:
      'Models a pipeline candidate whose preliminary astrometry has not been cross-matched; Sky Garden withholds unverified coordinates.',
    originalImageUrl: '/assets/galaxies/field-subject-beta.jpg',
    provenance: {
      survey: 'DESI Legacy Imaging Surveys',
      dataRelease: 'DR9 Cutout Archive',
      license: 'CC BY 4.0',
      attribution: 'Legacy Surveys / D. Lang (Perimeter Institute)',
      sourceUrl: 'https://www.legacysurvey.org/acknowledgment/',
      angularFieldArcmin: 1.54,
    },
    skyCoordinates: {
      status: 'unverified',
      reason: 'Preliminary pipeline coordinates have not passed catalog verification and are withheld.',
    },
  },
]);

export const DEMO_COLLECTION_ENTRIES: readonly CollectionEntry[] = Object.freeze(
  SOURCE_GALAXIES.map(
    (galaxy, index): CollectionEntry => ({
      entryId: `col-demo-${index + 1}-${galaxy.id.replace('src-', '')}`,
      sourceGalaxyId: galaxy.id,
      acquisition: {
        kind: 'demo_bundle',
        badgeLabel: 'Demo Sample — Offline Prototype',
      },
      addedAtIso: '2026-11-12T00:00:00.000Z',
    }),
  ),
);

export const CELESTIAL_DECOR_ITEMS: readonly CelestialDecorItem[] = Object.freeze([
  {
    decorId: 'decor-open-cluster',
    title: 'Seven-Sister Sparkle Cluster',
    subtitle: 'Decorative open star cluster accent (fictional scenery)',
    glyphKind: 'open-cluster',
  },
  {
    decorId: 'decor-comet-wisp',
    title: 'Quiet Ion-Tail Comet',
    subtitle: 'Decorative dust & ion tail accent (fictional scenery)',
    glyphKind: 'comet-wisp',
  },
  {
    decorId: 'decor-globular-haze',
    title: 'Golden Globular Swarm',
    subtitle: 'Decorative resolved star-swarm accent (fictional scenery)',
    glyphKind: 'globular-haze',
  },
  {
    decorId: 'decor-diffraction-star',
    title: 'Survey Beacon Star',
    subtitle: 'Decorative four-vane telescope diffraction star (fictional scenery)',
    glyphKind: 'diffraction-star',
  },
]);

export const SKY_BACKGROUNDS: readonly SkyBackgroundPreset[] = Object.freeze([
  {
    id: 'bg-atacama-zenith',
    name: 'Atacama Zenith',
    description: 'Deep dry-desert midnight indigo with subtle airglow near the sill',
    gradientCss:
      'radial-gradient(120% 95% at 50% 12%, #131c38 0%, #090e20 52%, #050711 100%)',
    horizonGlowCss:
      'linear-gradient(180deg, rgba(16, 28, 58, 0) 58%, rgba(56, 78, 122, 0.22) 100%)',
  },
  {
    id: 'bg-subarctic-aurora',
    name: 'Boreal Curtain',
    description: 'Cool slate-emerald sky kissed by faint high-latitude oxygen glow',
    gradientCss:
      'radial-gradient(110% 90% at 35% 18%, #102b36 0%, #0a1526 55%, #050812 100%)',
    horizonGlowCss:
      'linear-gradient(165deg, rgba(62, 189, 156, 0.16) 0%, rgba(28, 82, 118, 0.08) 52%, rgba(8, 12, 24, 0) 100%)',
  },
  {
    id: 'bg-austral-velvet',
    name: 'Austral Velvet',
    description: 'Warm southern-winter plum and obsidian with subtle zodiacal warmth',
    gradientCss:
      'radial-gradient(120% 95% at 62% 20%, #231636 0%, #0f0d24 54%, #06060f 100%)',
    horizonGlowCss:
      'linear-gradient(180deg, rgba(40, 22, 58, 0) 55%, rgba(154, 102, 78, 0.2) 100%)',
  },
  {
    id: 'bg-astronomical-twilight',
    name: 'Astronomical Twilight',
    description: '18° below horizon—deep cobalt zenith meeting warm amber dusk',
    gradientCss:
      'linear-gradient(180deg, #090f24 0%, #132142 64%, #2d2942 88%, #47323b 100%)',
    horizonGlowCss:
      'linear-gradient(180deg, rgba(12, 18, 38, 0) 62%, rgba(226, 158, 98, 0.22) 100%)',
  },
]);

export const NEBULA_LAYERS: readonly NebulaLayerPreset[] = Object.freeze([
  {
    id: 'nebula-none',
    name: 'Clear Dark Sky',
    description: 'Unadorned starfield with maximum contrast for delicate galaxy halos',
  },
  {
    id: 'nebula-cygnus-veil',
    name: 'Cygnus Filament Veil',
    description: 'Delicate sapphire and rose supernova-remnant wisps across the upper pane',
  },
  {
    id: 'nebula-carina-amber',
    name: 'Carina Warm Dust',
    description: 'Soft golden-copper molecular cloud glow drifting diagonally',
  },
  {
    id: 'nebula-pleiades-mist',
    name: 'Merope Reflection Mist',
    description: 'Silky silver-blue reflection nebulosity brushed behind foreground stars',
  },
]);

export const WINDOW_FRAMES: readonly WindowFramePreset[] = Object.freeze([
  {
    id: 'frame-arched-brass',
    name: 'Arched Brass Observatory',
    description: 'Classic curved brass mullions, warm walnut sill, and corner finder scope',
  },
  {
    id: 'frame-timber-skylight',
    name: 'Timber Roof Skylight',
    description: 'Clean study rafters framing a wide uninterrupted overhead aperture',
  },
  {
    id: 'frame-wide-cupola',
    name: 'Meridian Slit Cupola',
    description: 'Domed observatory shutter silhouette with maximal sky room',
  },
]);

export function createInitialScenesState(): SavedScenesState {
  return {
    schemaVersion: 1,
    selectedScene: 'north',
    updatedAtIso: '2026-11-12T00:00:00.000Z',
    scenes: {
      north: {
        hemisphere: 'north',
        exhibitionTitle: 'Quiet Study of Rings & Bridges',
        backgroundId: 'bg-atacama-zenith',
        nebulaLayerId: 'nebula-pleiades-mist',
        windowFrameId: 'frame-arched-brass',
        objects: [
          {
            instanceId: 'seed-north-needle',
            kind: 'galaxy',
            refId: 'col-demo-3-ngc-4565',
            scene: 'north',
            x: 0.29,
            y: 0.42,
            scale: 1.18,
            rotationDeg: -12,
            layer: 1,
          },
          {
            instanceId: 'seed-north-arp87',
            kind: 'galaxy',
            refId: 'col-demo-4-arp-87',
            scene: 'north',
            x: 0.66,
            y: 0.36,
            scale: 1.02,
            rotationDeg: 14,
            layer: 2,
          },
          {
            instanceId: 'seed-north-hoag',
            kind: 'galaxy',
            refId: 'col-demo-6-hoags-object',
            scene: 'north',
            x: 0.51,
            y: 0.64,
            scale: 0.86,
            rotationDeg: 0,
            layer: 3,
          },
          {
            instanceId: 'seed-north-cluster',
            kind: 'celestial_decor',
            refId: 'decor-open-cluster',
            scene: 'north',
            x: 0.78,
            y: 0.66,
            scale: 0.9,
            rotationDeg: 8,
            layer: 0,
          },
        ],
      },
      south: {
        hemisphere: 'south',
        exhibitionTitle: 'Fornax & Eridanus Drift',
        backgroundId: 'bg-austral-velvet',
        nebulaLayerId: 'nebula-carina-amber',
        windowFrameId: 'frame-arched-brass',
        objects: [
          {
            instanceId: 'seed-south-ngc1365',
            kind: 'galaxy',
            refId: 'col-demo-2-ngc-1365',
            scene: 'south',
            x: 0.36,
            y: 0.46,
            scale: 1.22,
            rotationDeg: -18,
            layer: 1,
          },
          {
            instanceId: 'seed-south-ngc1300',
            kind: 'galaxy',
            refId: 'col-demo-1-ngc-1300',
            scene: 'south',
            x: 0.68,
            y: 0.44,
            scale: 1.08,
            rotationDeg: 10,
            layer: 2,
          },
          {
            instanceId: 'seed-south-comet',
            kind: 'celestial_decor',
            refId: 'decor-comet-wisp',
            scene: 'south',
            x: 0.24,
            y: 0.27,
            scale: 0.95,
            rotationDeg: -8,
            layer: 0,
          },
        ],
      },
    },
  };
}

const SOURCE_BY_ID = new Map(SOURCE_GALAXIES.map((g) => [g.id, g]));
const COLLECTION_BY_ID = new Map(DEMO_COLLECTION_ENTRIES.map((c) => [c.entryId, c]));
const DECOR_BY_ID = new Map(CELESTIAL_DECOR_ITEMS.map((d) => [d.decorId, d]));

export function getCollectionEntry(entryId: string): CollectionEntry | undefined {
  return COLLECTION_BY_ID.get(entryId);
}

export function getSourceGalaxy(sourceId: string): SourceGalaxy | undefined {
  return SOURCE_BY_ID.get(sourceId);
}

export function getSourceGalaxyForCollectionEntry(entryId: string): SourceGalaxy | undefined {
  const entry = COLLECTION_BY_ID.get(entryId);
  if (!entry) return undefined;
  return SOURCE_BY_ID.get(entry.sourceGalaxyId);
}

export function getCelestialDecor(decorId: string): CelestialDecorItem | undefined {
  return DECOR_BY_ID.get(decorId);
}
