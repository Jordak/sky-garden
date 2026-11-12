export type SceneHemisphere = 'north' | 'south';

export type SkyCoordinates =
  | {
      readonly status: 'verified';
      readonly frame: 'ICRS (J2000)';
      readonly raDeg: number;
      readonly decDeg: number;
      readonly raHms: string;
      readonly decDms: string;
      readonly constellation: string;
    }
  | {
      readonly status: 'unavailable';
      readonly reason: string;
    }
  | {
      readonly status: 'unverified';
      readonly reason: string;
    };

export interface SourceProvenance {
  readonly survey: string;
  readonly dataRelease: string;
  readonly license: string;
  readonly attribution: string;
  readonly sourceUrl: string;
  readonly angularFieldArcmin: number;
}

/**
 * Immutable scientific subject metadata.
 * Decorative placement, scaling, rotation, and blending must never mutate this record.
 */
export interface SourceGalaxy {
  readonly id: string;
  readonly catalogName: string;
  readonly commonTitle: string;
  readonly morphologyNote: string;
  readonly scienceContext: string;
  readonly originalImageUrl: string;
  readonly provenance: SourceProvenance;
  readonly skyCoordinates: SkyCoordinates;
}

export type CollectionAcquisition =
  | {
      readonly kind: 'demo_bundle';
      readonly badgeLabel: 'Demo Sample — Offline Prototype';
    }
  | {
      readonly kind: 'verified_contribution';
      readonly contributionId: string;
    };

/**
 * Player collection entry referencing a SourceGalaxy by ID.
 * Distinct from both SourceGalaxy.id and PlacedObject.instanceId.
 */
export interface CollectionEntry {
  readonly entryId: string;
  readonly sourceGalaxyId: string;
  readonly acquisition: CollectionAcquisition;
  readonly addedAtIso: string;
}

export interface CelestialDecorItem {
  readonly decorId: string;
  readonly title: string;
  readonly subtitle: string;
  readonly glyphKind: 'open-cluster' | 'comet-wisp' | 'globular-haze' | 'diffraction-star';
}

export type PlacedObjectKind = 'galaxy' | 'celestial_decor';

/**
 * A single decorative instance placed in a creative North or South scene.
 * Coordinates x and y are normalized [0..1] relative to the observatory window stage.
 */
export interface PlacedObject {
  readonly instanceId: string;
  readonly kind: PlacedObjectKind;
  /** References CollectionEntry.entryId when kind === 'galaxy', or CelestialDecorItem.decorId when kind === 'celestial_decor'. */
  readonly refId: string;
  readonly scene: SceneHemisphere;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly rotationDeg: number;
  readonly layer: number;
}

export interface SkyBackgroundPreset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly gradientCss: string;
  readonly horizonGlowCss: string;
}

export interface NebulaLayerPreset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export interface WindowFramePreset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export interface SceneComposition {
  readonly hemisphere: SceneHemisphere;
  readonly exhibitionTitle: string;
  readonly backgroundId: string;
  readonly nebulaLayerId: string;
  readonly windowFrameId: string;
  readonly objects: readonly PlacedObject[];
}

export interface SavedScenesState {
  readonly schemaVersion: 1;
  readonly selectedScene: SceneHemisphere;
  readonly updatedAtIso: string;
  readonly scenes: {
    readonly north: SceneComposition;
    readonly south: SceneComposition;
  };
}

/**
 * Reserved contract for future Zooniverse Custom Front End integration.
 * Kept separate from scene decorations and reward unlocks so network retries
 * cannot duplicate submissions or bias scientific answers.
 */
export interface FutureContributionRecord {
  readonly contributionId: string;
  readonly idempotencyKey: string;
  readonly projectSlug: string;
  readonly workflowId: string;
  readonly workflowVersion: string;
  readonly subjectId: string;
  readonly annotations: ReadonlyArray<{ readonly task: string; readonly value: unknown }>;
  readonly submissionStatus: 'pending' | 'recorded' | 'failed';
  readonly createdAtIso: string;
}
