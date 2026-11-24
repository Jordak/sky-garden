import type { PanoptesAnnotation } from '../types/skyGarden';

export const GALAXY_ZOO_HELP_GUIDE_URL =
  'https://www.zooniverse.org/projects/zookeeper/galaxy-zoo/talk/1268/570127';
export const GALAXY_ZOO_HELP_BOARD_URL =
  'https://www.zooniverse.org/projects/zookeeper/galaxy-zoo/talk/1268';
export const GALAXY_ZOO_FAQ_URL =
  'https://www.zooniverse.org/projects/zookeeper/galaxy-zoo/about/faq';
export const GALAXY_ZOO_RESEARCH_URL =
  'https://www.zooniverse.org/projects/zookeeper/galaxy-zoo/about/research';
export const GALAXY_ZOO_TALK_TAGS_BASE =
  'https://www.zooniverse.org/projects/zookeeper/galaxy-zoo/talk/tags';

export type AnswerIconId =
  | 'smooth'
  | 'features-disk'
  | 'artifact'
  | 'round'
  | 'elliptical'
  | 'cigar'
  | 'edge-on'
  | 'face-on'
  | 'bulge-round'
  | 'bulge-boxy'
  | 'bulge-none'
  | 'bar-strong'
  | 'bar-weak'
  | 'bar-none'
  | 'spiral-yes'
  | 'ring-only'
  | 'wind-tight'
  | 'wind-medium'
  | 'wind-loose'
  | 'merger'
  | 'tidal-shells'
  | 'ring-dust'
  | 'none';

export interface PanoptesReferenceLink {
  readonly label: string;
  readonly url: string;
}

export interface PanoptesProjectGuideItem {
  readonly title: string;
  readonly contentMarkdown: string;
}

export interface PanoptesFieldGuideItem {
  readonly icon: AnswerIconId;
  readonly title: string;
  readonly body: string;
}

export interface PanoptesAnswerOption {
  readonly label: string;
  readonly hint: string;
  readonly icon: AnswerIconId;
  readonly next: string;
}

export interface PanoptesSingleTask {
  readonly type: 'single';
  readonly shortTitle: string;
  readonly question: string;
  readonly helpTip: string;
  readonly helpMarkdown?: string;
  readonly referenceLinks?: readonly PanoptesReferenceLink[];
  readonly fieldGuide: readonly PanoptesFieldGuideItem[];
  readonly answers: readonly PanoptesAnswerOption[];
}

export interface PanoptesWorkflow {
  readonly id: string;
  readonly version: string;
  readonly display_name: string;
  readonly first_task: string;
  readonly sourceKind?: 'offline-demo' | 'panoptes-live' | 'panoptes-json';
  readonly sourceLabel?: string;
  readonly projectId?: string;
  readonly projectFieldGuide?: readonly PanoptesProjectGuideItem[];
  readonly tasks: Readonly<Record<string, PanoptesSingleTask>>;
}

function talkTagLink(tag: string, label?: string): PanoptesReferenceLink {
  return {
    label: label ?? `#${tag}`,
    url: `${GALAXY_ZOO_TALK_TAGS_BASE}/${tag}`,
  };
}

export const DEMO_GALAXY_ZOO_WORKFLOW: PanoptesWorkflow = Object.freeze<PanoptesWorkflow>({
  id: 'gz-panoptes-demo-v2',
  version: '2.0',
  display_name: 'Galaxy Zoo Offline Morphology Tree (Panoptes-Shaped Demo)',
  first_task: 'T0',
  sourceKind: 'offline-demo',
  sourceLabel: 'Offline Calibration Onramp (bundled)',
  tasks: {
    T0: {
      type: 'single',
      shortTitle: 'Primary Morphology',
      question:
        'Is the central galaxy simply smooth and rounded, with no sign of a disk or spiral arms?',
      helpTip:
        'Focus on the target centered under the reticle. Try FAINT SHELLS or INVERT if outer structure looks very faint against the dark sky.',
      referenceLinks: [
        talkTagLink('elliptical', '#elliptical examples'),
        talkTagLink('artifact', '#artifact examples'),
      ],
      fieldGuide: [
        {
          icon: 'smooth',
          title: 'Smooth & Rounded',
          body: 'Light falls off evenly from a glowing center with no dust lane, clumpy knots, or sweeping arms.',
        },
        {
          icon: 'features-disk',
          title: 'Features or Disk',
          body: 'Shows any structure: spiral arms, a thin edge-on needle, a central stellar bar, or a detached ring.',
        },
        {
          icon: 'artifact',
          title: 'Star or Artifact',
          body: 'Point-like star with cross diffraction spikes, satellite streak, or corrupted cutout border.',
        },
      ],
      answers: [
        {
          label: 'Smooth & Rounded',
          hint: 'Even, featureless glow fading smoothly outward',
          icon: 'smooth',
          next: 'T1_SMOOTH',
        },
        {
          label: 'Features or Disk',
          hint: 'Spiral arms, edge-on disk, central bar, or ring',
          icon: 'features-disk',
          next: 'T2_EDGE',
        },
        {
          label: 'Star or Artifact',
          hint: 'Diffraction spike, satellite trail, or non-galaxy flaw',
          icon: 'artifact',
          next: '',
        },
      ],
    },
    T1_SMOOTH: {
      type: 'single',
      shortTitle: 'Elliptical Roundness',
      question: 'How rounded does the smooth galaxy appear?',
      helpTip:
        'Judge the main bright body rather than diffuse outer haloes. Compare the major and minor axes across the reticle.',
      referenceLinks: [talkTagLink('elliptical', '#elliptical examples')],
      fieldGuide: [
        {
          icon: 'round',
          title: 'Completely Round',
          body: 'Nearly circular contour all the way around (E0-like).',
        },
        {
          icon: 'elliptical',
          title: 'In-Between Elliptical',
          body: 'Clear oval footprint without looking needle-thin.',
        },
        {
          icon: 'cigar',
          title: 'Cigar-Shaped',
          body: 'Strongly elongated smooth ellipsoid; check BRIGHT CORE to ensure no edge-on disk spine is hiding inside.',
        },
      ],
      answers: [
        {
          label: 'Completely Round',
          hint: 'Circular profile from core to halo',
          icon: 'round',
          next: 'T6_MERGER',
        },
        {
          label: 'In-Between Elliptical',
          hint: 'Modestly oval smooth light distribution',
          icon: 'elliptical',
          next: 'T6_MERGER',
        },
        {
          label: 'Cigar-Shaped',
          hint: 'Strongly elongated smooth ellipsoid',
          icon: 'cigar',
          next: 'T6_MERGER',
        },
      ],
    },
    T2_EDGE: {
      type: 'single',
      shortTitle: 'Disk Orientation',
      question: 'Could this be a disk viewed edge-on?',
      helpTip:
        'An edge-on disk forms a narrow streak or needle often bisected by a dark dust lane. If you can trace a circular ring or arms, pick No.',
      referenceLinks: [
        talkTagLink('edge-on', '#edge-on examples'),
        talkTagLink('dustlane', '#dustlane examples'),
      ],
      fieldGuide: [
        {
          icon: 'edge-on',
          title: 'Yes — Edge-On Disk',
          body: 'Thin spindle seen side-on so spiral arms cannot be traced separately from the disk plane.',
        },
        {
          icon: 'face-on',
          title: 'No — Face-On / Inclined',
          body: 'Broad enough to inspect the core, bar, or arm geometry directly.',
        },
      ],
      answers: [
        {
          label: 'Yes — Edge-On Disk',
          hint: 'Thin spindle or dust-bisected needle seen side-on',
          icon: 'edge-on',
          next: 'T2B_BULGE',
        },
        {
          label: 'No — Face-On / Inclined',
          hint: 'Tilted or face-on view revealing interior structure',
          icon: 'face-on',
          next: 'T3_BAR',
        },
      ],
    },
    T2B_BULGE: {
      type: 'single',
      shortTitle: 'Edge-On Core Bulge',
      question: 'Does the edge-on disk show a central bulge at its core?',
      helpTip:
        'Switch to 2× or 4× zoom and pan along the disk midplane; BRIGHT CORE stretch helps separate an over-bright bulge from the thin disk.',
      referenceLinks: [
        talkTagLink('box-peanut-structure', '#box-peanut-structure examples'),
      ],
      fieldGuide: [
        {
          icon: 'bulge-round',
          title: 'Rounded Bulge',
          body: 'Smooth spherical swelling rising noticeably above and below the flat disk.',
        },
        {
          icon: 'bulge-boxy',
          title: 'Boxy / Peanut Bulge',
          body: 'Blocky or peanut-pinched core caused by a buckled bar seen side-on.',
        },
        {
          icon: 'bulge-none',
          title: 'No Central Bulge',
          body: 'Uniform thin needle of stars without a prominent central lump.',
        },
      ],
      answers: [
        {
          label: 'Rounded Bulge',
          hint: 'Round spheroidal glow swelling at the center',
          icon: 'bulge-round',
          next: 'T6_MERGER',
        },
        {
          label: 'Boxy / Peanut Bulge',
          hint: 'Rectangular or X/peanut-shaped thick bar side-on',
          icon: 'bulge-boxy',
          next: 'T6_MERGER',
        },
        {
          label: 'No Central Bulge',
          hint: 'Pure flat needle of uniform thickness',
          icon: 'bulge-none',
          next: 'T6_MERGER',
        },
      ],
    },
    T3_BAR: {
      type: 'single',
      shortTitle: 'Galactic Bar',
      question: 'Is there a straight stellar bar running through the center of the galaxy?',
      helpTip:
        'Bright barred cores often saturate at default exposure. Try BRIGHT CORE or lower Brightness to check if a linear bridge feeds the inner arms.',
      referenceLinks: [
        talkTagLink('bar', '#bar examples'),
        talkTagLink('strong-bar', '#strong-bar examples'),
      ],
      fieldGuide: [
        {
          icon: 'bar-strong',
          title: 'Strong Bar',
          body: 'Unmistakable bright linear bar extending halfway or more across the disk where arms attach at the ends.',
        },
        {
          icon: 'bar-weak',
          title: 'Weak Bar',
          body: 'Subtle oval or short straight structure inside the bulge that fades before the outer arms.',
        },
        {
          icon: 'bar-none',
          title: 'No Bar',
          body: 'Symmetric circular bulge with spiral arms or rings emerging evenly all around.',
        },
      ],
      answers: [
        {
          label: 'Strong Bar',
          hint: 'Prominent straight bright bar crossing the nucleus',
          icon: 'bar-strong',
          next: 'T4_SPIRAL',
        },
        {
          label: 'Weak Bar',
          hint: 'Subtle short or oval bar inside the inner disk',
          icon: 'bar-weak',
          next: 'T4_SPIRAL',
        },
        {
          label: 'No Bar',
          hint: 'Round core with no linear bar structure',
          icon: 'bar-none',
          next: 'T4_SPIRAL',
        },
      ],
    },
    T4_SPIRAL: {
      type: 'single',
      shortTitle: 'Spiral Structure',
      question: 'Is there any sign of a spiral arm pattern?',
      helpTip:
        'Look for curved luminous lanes winding outward. A closed detached loop with no spiral trace belongs under Ring or Smooth Disk.',
      referenceLinks: [
        talkTagLink('spiral', '#spiral examples'),
        talkTagLink('ring', '#ring examples'),
      ],
      fieldGuide: [
        {
          icon: 'spiral-yes',
          title: 'Yes — Spiral Arms',
          body: 'Curved lanes of starlight (two-arm grand design or patchy multi-arm) radiating outward.',
        },
        {
          icon: 'ring-only',
          title: 'No — Ring or Smooth Disk',
          body: 'Symmetrical closed ring (like Hoag’s Object) or smooth lenticular disk without winding arms.',
        },
      ],
      answers: [
        {
          label: 'Yes — Spiral Arms',
          hint: 'Winding luminous arms sweeping through the disk',
          icon: 'spiral-yes',
          next: 'T5_WINDING',
        },
        {
          label: 'No — Ring or Smooth Disk',
          hint: 'Closed detached ring or smooth disk without arms',
          icon: 'ring-only',
          next: 'T6_MERGER',
        },
      ],
    },
    T5_WINDING: {
      type: 'single',
      shortTitle: 'Arm Winding',
      question: 'How tightly wound do the spiral arms appear?',
      helpTip:
        'Trace the angle between the inner ring/bar tip and the outer arm sweep; FAINT SHELLS helps follow dimming outer arms.',
      referenceLinks: [talkTagLink('spiral', '#spiral examples')],
      fieldGuide: [
        {
          icon: 'wind-tight',
          title: 'Tightly Wound',
          body: 'Arms hug the core in nearly circular arcs with very narrow gaps.',
        },
        {
          icon: 'wind-medium',
          title: 'Medium Winding',
          body: 'Clear S-shaped or moderate opening angle with distinct dark gaps between arms.',
        },
        {
          icon: 'wind-loose',
          title: 'Loosely Wound / Open',
          body: 'Wide sweeping arms opening cleanly out into the halo, often pulled by a neighbor.',
        },
      ],
      answers: [
        {
          label: 'Tightly Wound',
          hint: 'Arms wrap closely around the core',
          icon: 'wind-tight',
          next: 'T6_MERGER',
        },
        {
          label: 'Medium Winding',
          hint: 'Moderate pitch angle between core and halo',
          icon: 'wind-medium',
          next: 'T6_MERGER',
        },
        {
          label: 'Loosely Wound / Open',
          hint: 'Wide, open arms sweeping far from the nucleus',
          icon: 'wind-loose',
          next: 'T6_MERGER',
        },
      ],
    },
    T6_MERGER: {
      type: 'single',
      shortTitle: 'Mergers & Tidal Features',
      question:
        'Is there any sign of a merger, tidal debris, or unusual outer structure?',
      helpTip:
        'Use FAINT SHELLS or INVERT plus 2×/4× pan around the edges of the frame to spot faint concentric shells, bridges, or close companions.',
      referenceLinks: [
        talkTagLink('merger', '#merger examples'),
        talkTagLink('disturbed', '#disturbed examples'),
        talkTagLink('dustlane', '#dustlane examples'),
      ],
      fieldGuide: [
        {
          icon: 'merger',
          title: 'Merging / Tidal Bridge',
          body: 'Two nearby nuclei linked by a glowing stream or visibly colliding disks.',
        },
        {
          icon: 'tidal-shells',
          title: 'Tidal Shells / Plumes',
          body: 'Faint concentric arcs or asymmetric loops left behind by past gravitational encounters.',
        },
        {
          icon: 'ring-dust',
          title: 'Prominent Ring / Dust Lane',
          body: 'Detached star-forming ring or stark dark dust lane cutting across the light.',
        },
      ],
      answers: [
        {
          label: 'Merging / Tidal Bridge',
          hint: 'Active collision or luminous bridge to a companion',
          icon: 'merger',
          next: '',
        },
        {
          label: 'Tidal Shells / Plumes',
          hint: 'Faint concentric ripples or asymmetric outer streams',
          icon: 'tidal-shells',
          next: '',
        },
        {
          label: 'Prominent Ring / Dust Lane',
          hint: 'Detached outer ring or stark dark dust lane',
          icon: 'ring-dust',
          next: '',
        },
        {
          label: 'None — Undisturbed',
          hint: 'Isolated galaxy without obvious tidal disturbance',
          icon: 'none',
          next: '',
        },
      ],
    },
  },
});

export function summarizeAnnotations(
  workflow: PanoptesWorkflow,
  annotations: readonly PanoptesAnnotation[],
): {
  primaryMorphology: string;
  detailChoice: string;
  oddityNote: string;
} {
  const resolveLabel = (entry: PanoptesAnnotation): string => {
    if (entry.answerLabel) return entry.answerLabel;
    const task = workflow.tasks[entry.task];
    return task?.answers[entry.value]?.label ?? `Option ${entry.value}`;
  };

  const first = annotations[0];
  const last = annotations[annotations.length - 1];
  const primaryMorphology = first ? resolveLabel(first) : 'Observed';

  const hasMergerTask = Boolean(workflow.tasks.T6_MERGER);
  const middleLabels = annotations
    .filter((a) =>
      hasMergerTask
        ? a.task !== workflow.first_task && a.task !== 'T6_MERGER'
        : a.task !== workflow.first_task && a !== last,
    )
    .map(resolveLabel);

  const detailChoice =
    middleLabels.length > 0
      ? middleLabels.join(' → ')
      : annotations.length === 1
        ? 'Single-step check'
        : primaryMorphology;

  const oddityEntry = hasMergerTask
    ? annotations.find((a) => a.task === 'T6_MERGER')
    : last && last.task !== workflow.first_task
      ? last
      : undefined;
  const oddityNote = oddityEntry
    ? resolveLabel(oddityEntry)
    : last && last.task !== workflow.first_task
      ? resolveLabel(last)
      : 'N/A';

  return {
    primaryMorphology,
    detailChoice,
    oddityNote,
  };
}
