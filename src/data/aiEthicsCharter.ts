export const ZOONIVERSE_AI_ETHICS_URL = 'https://www.zooniverse.org/about/ai-ethics';
export const GALAXY_ZOO_TALK_URL = 'https://www.zooniverse.org/projects/zookeeper/galaxy-zoo/talk';
export const REPO_FEEDBACK_URL = 'https://github.com/Jordak/sky-garden/issues';

export interface WorkflowAiDisclosure {
  readonly workflowBadge: string;
  readonly usesMachineLearning: boolean;
  readonly summary: string;
  readonly liveIntegrationPolicy: string;
}

export const OFFLINE_PRACTICE_AI_DISCLOSURE: WorkflowAiDisclosure = Object.freeze({
  workflowBadge: 'OFFLINE CALIBRATION · NO ML IN LOOP',
  usesMachineLearning: false,
  summary:
    'Eight unmodified CC BY 4.0 DESI & SDSS cutouts. No machine-learning pre-sorting, synthetic imagery, or model training runs in this prototype.',
  liveIntegrationPolicy:
    'In a live Zooniverse Custom Front End, workflows must explicitly badge whether subjects are prioritized by or used to train models such as Zoobot so volunteers can choose where to contribute.',
});

export interface EthicsPillar {
  readonly id: string;
  readonly heading: string;
  readonly principle: string;
  readonly implementation: string;
}

export const ETHICS_PILLARS: readonly EthicsPillar[] = Object.freeze([
  {
    id: 'transparency',
    heading: '1. Build Transparency',
    principle: 'Disclose AI/ML roles clearly across code, imagery, and workflows.',
    implementation:
      'Code and procedural pixel/SVG props were vibe-coded with an AI coding agent under human review. All eight galaxy cutouts are genuine, unedited DESI & SDSS survey images—never generative-AI astronomy—and future live workflows will surface explicit ML/Zoobot disclosure tags.',
  },
  {
    id: 'volunteer-experience',
    heading: '2. Design for the Volunteer Experience',
    principle: 'Respect volunteer agency, consent, and clear onboarding onramps.',
    implementation:
      'Volunteers choose workflows knowing whether AI/ML is involved. This 8-galaxy offline bundle stays available as a low-pressure Calibration Onramp even after live Zooniverse subjects connect.',
  },
  {
    id: 'accountability',
    heading: '3. Facilitate Accountability',
    principle: 'Protect scientific data quality, privacy, and verifiable ownership.',
    implementation:
      'Optical inspection switches are never gated. Stardust (+3 once per unique subject) never rewards speed, streaks, or specific labels. Source records remain immutable, and all saves stay locally in your browser (sky-garden.* keys; zero analytics or telemetry).',
  },
  {
    id: 'ongoing-dialogue',
    heading: '4. Commit to Ongoing Dialogue',
    principle: 'Keep Zooniverse Talk, provenance, and open project feedback close.',
    implementation:
      'Classified plates and Star Atlas entries link directly to survey sources and Galaxy Zoo Talk ("Done & Talk"), alongside open GitHub Issues so volunteers and researchers can challenge or refine the design.',
  },
]);
