import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { AUDIO_MUTED_STORAGE_KEY } from '../audio/observatoryAudio';
import { DEMO_COLLECTION_ENTRIES, SOURCE_GALAXIES } from '../data/demoCatalog';
import { buildPostcardMetadata } from '../export/postcardExporter';
import {
  fetchPublicPanoptesWorkflow,
  parsePanoptesWorkflowJson,
} from '../services/panoptesWorkflowAdapter';
import {
  CORRUPT_BACKUP_KEY,
  loadScenesFromStorage,
  parseImportedScenesJson,
  PROGRESSION_STORAGE_KEY,
  saveScenesToStorage,
  serializeScenesToJson,
  STORAGE_KEY,
} from '../storage/sceneStorage';

function completeQuickClassification() {
  fireEvent.click(screen.getByRole('button', { name: /Features or Disk/i }));
  fireEvent.click(screen.getByRole('button', { name: /No — Face-On \/ Inclined/i }));
  fireEvent.click(screen.getByRole('button', { name: /Strong Bar/i }));
  fireEvent.click(screen.getByRole('button', { name: /Yes — Spiral Arms/i }));
  fireEvent.click(screen.getByRole('button', { name: /Tightly Wound/i }));
  fireEvent.click(screen.getByRole('button', { name: /None — Undisturbed/i }));
  fireEvent.click(screen.getByRole('button', { name: /LOG PRACTICE OBSERVATION/i }));
}

describe('Sky Garden Side-On Pixel Observatory Prototype', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts in Progression Mode by default with empty sky/atlas, ungated tools, Stardust unlocks, and no duplicate farm', () => {
    render(<App />);

    expect(screen.getByTestId('observatory-room-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('mode-progression-btn')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('stardust-counter')).toHaveTextContent('0 STARDUST');
    expect(screen.getByRole('button', { name: /Northern Window/i })).toHaveTextContent('0');
    expect(screen.getByRole('button', { name: /Southern Window/i })).toHaveTextContent('0');
    // Progression starts under starless Clear Dark Sky
    expect(screen.queryByTestId('backdrop-starfield')).not.toBeInTheDocument();

    // Star Atlas starts empty until you classify incoming subjects
    fireEvent.click(screen.getByRole('button', { name: /STAR ATLAS/i }));
    expect(screen.getByTestId('atlas-empty-state')).toBeInTheDocument();

    // Jump from empty Star Atlas to Blink Comparator CRT
    fireEvent.click(screen.getByRole('button', { name: /GO TO BLINK COMPARATOR DESK/i }));
    expect(screen.getByText(/PRACTICE TERMINAL · NOT LIVE RESEARCH/i)).toBeInTheDocument();

    // Optical inspection switches remain unlocked from second zero
    const invertBtn = screen.getByRole('button', { name: /INVERT/i });
    expect(invertBtn).not.toBeDisabled();
    fireEvent.click(invertBtn);
    expect(invertBtn).toHaveAttribute('aria-pressed', 'true');

    // Classify first incoming subject -> unlocks NGC 1300 + grants +3 Stardust
    completeQuickClassification();
    expect(screen.getByText(/PRACTICE OBSERVATION LOGGED — UNLOCKED NGC 1300/i)).toBeInTheDocument();
    expect(screen.getByTestId('stardust-counter')).toHaveTextContent('3 STARDUST');

    // Re-opening CRT on the already-unlocked NGC 1300 plate does NOT award duplicate Stardust
    fireEvent.click(screen.getByRole('button', { name: /LEAVE DESK/i }));
    fireEvent.click(screen.getByRole('button', { name: /^CLASSIFY$/i }));
    fireEvent.click(screen.getByRole('button', { name: /◀ PREV/i }));
    completeQuickClassification();
    expect(screen.getByTestId('stardust-counter')).toHaveTextContent('3 STARDUST');

    // Star Atlas now contains only NGC 1300 (discovery-driven)
    fireEvent.click(screen.getByRole('button', { name: /LEAVE DESK/i }));
    fireEvent.click(screen.getByRole('button', { name: /STAR ATLAS/i }));
    const atlasList = screen.getByRole('list', { name: /Demo Galaxy Collection/i });
    expect(within(atlasList).getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByTestId('collection-card-src-ngc-1300')).toBeInTheDocument();

    // Spend Stardust at Workbench: Cat (2) + Merope Mist (1) -> 0 left; Orrery (2) disabled
    fireEvent.click(screen.getByRole('button', { name: /WORKBENCH/i }));
    fireEvent.click(screen.getByRole('button', { name: /Ginger Observatory Cat/i }));
    expect(screen.getByTestId('stardust-counter')).toHaveTextContent('1 STARDUST');

    fireEvent.click(screen.getByRole('button', { name: /Merope Reflection Mist/i }));
    expect(screen.getByTestId('stardust-counter')).toHaveTextContent('0 STARDUST');
    expect(screen.getByTestId('backdrop-starfield')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Clockwork Brass Orrery/i })).toBeDisabled();
  });

  it('switches cleanly between Progression and Sandbox profiles without overwriting either save across reloads', () => {
    const firstRender = render(<App />);

    // Earn 1 galaxy & +3 Stardust in Progression Mode
    fireEvent.click(screen.getByRole('button', { name: /^CLASSIFY$/i }));
    completeQuickClassification();
    fireEvent.click(screen.getByRole('button', { name: /HANG IN SKY AT TELESCOPE/i }));
    expect(screen.getByRole('button', { name: /Northern Window/i })).toHaveTextContent('1');
    expect(screen.getByTestId('stardust-counter')).toHaveTextContent('3 STARDUST');

    // Switch to Sandbox -> full collection and starter compositions appear
    fireEvent.click(screen.getByTestId('mode-sandbox-btn'));
    expect(screen.getByTestId('mode-sandbox-btn')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('stardust-counter')).toHaveTextContent('SANDBOX');
    expect(screen.getByRole('button', { name: /Northern Window/i })).toHaveTextContent('4');
    expect(screen.getByRole('button', { name: /Southern Window/i })).toHaveTextContent('3');

    // Switch back to Progression -> Progression progress is intact
    fireEvent.click(screen.getByTestId('mode-progression-btn'));
    expect(screen.getByTestId('stardust-counter')).toHaveTextContent('3 STARDUST');
    expect(screen.getByRole('button', { name: /Northern Window/i })).toHaveTextContent('1');

    // Reload -> stays on Progression with earned progress intact
    firstRender.unmount();
    render(<App />);
    expect(screen.getByTestId('mode-progression-btn')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('stardust-counter')).toHaveTextContent('3 STARDUST');
    expect(loadScenesFromStorage(undefined, 'progression').state.unlockedCollectionEntryIds).toHaveLength(1);
  });

  it('preserves North and South skies independently in Sandbox Mode across reloads', () => {
    const firstRender = render(<App />);
    fireEvent.click(screen.getByTestId('mode-sandbox-btn'));

    expect(screen.getByRole('button', { name: /Northern Window/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    fireEvent.click(screen.getByRole('button', { name: /DECORATE SKY/i }));
    expect(screen.getByTestId('sky-satchel-dock')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Place NGC 474 in north sky/i }));
    expect(screen.getByRole('button', { name: /Northern Window/i })).toHaveTextContent('5');
    expect(screen.getByRole('button', { name: /Southern Window/i })).toHaveTextContent('3');

    fireEvent.click(screen.getByRole('button', { name: /Southern Window/i }));
    fireEvent.click(screen.getByRole('button', { name: /Clear Pane/i }));
    expect(screen.getByRole('button', { name: /Southern Window/i })).toHaveTextContent('0');

    firstRender.unmount();
    render(<App />);

    expect(screen.getByTestId('mode-sandbox-btn')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Southern Window/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /Southern Window/i })).toHaveTextContent('0');
    expect(screen.getByRole('button', { name: /Northern Window/i })).toHaveTextContent('5');
  });

  it('removes a placed galaxy at the Telescope without deleting it from the collection or altering source records', () => {
    const snapshotBefore = JSON.stringify(SOURCE_GALAXIES);
    render(<App />);
    fireEvent.click(screen.getByTestId('mode-sandbox-btn'));

    fireEvent.click(screen.getByRole('button', { name: /DECORATE SKY/i }));
    fireEvent.click(
      screen.getByRole('button', { name: /Remove from Window \(Keeps in Collection\)/i }),
    );

    expect(screen.getByRole('button', { name: /Northern Window/i })).toHaveTextContent('3');
    const satchelList = screen.getByRole('list', { name: /Demo Galaxy Collection/i });
    expect(within(satchelList).getAllByRole('listitem')).toHaveLength(
      DEMO_COLLECTION_ENTRIES.length,
    );

    fireEvent.click(screen.getByRole('button', { name: /Undo/i }));
    expect(screen.getByRole('button', { name: /Northern Window/i })).toHaveTextContent('4');
    expect(JSON.stringify(SOURCE_GALAXIES)).toBe(snapshotBefore);
  });

  it('displays verified J2000 coordinates in the Star Atlas and withholds unavailable or unverified coordinates', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('mode-sandbox-btn'));

    fireEvent.click(screen.getByRole('button', { name: /STAR ATLAS/i }));

    fireEvent.click(screen.getByTestId('collection-card-src-ngc-1300'));
    const coordsBox = screen.getByTestId('real-coordinates-box');
    expect(coordsBox).toHaveTextContent('Verified ICRS (J2000)');
    expect(coordsBox).toHaveTextContent('03h 19m 41.1s');
    expect(coordsBox).toHaveTextContent('Eridanus');

    fireEvent.click(screen.getByTestId('collection-card-src-subject-alpha'));
    expect(screen.getByTestId('real-coordinates-box')).toHaveTextContent(
      /Real sky coordinates unavailable: Sky coordinates are not exposed/i,
    );

    fireEvent.click(screen.getByTestId('collection-card-src-subject-beta'));
    expect(screen.getByTestId('real-coordinates-box')).toHaveTextContent(
      /Real sky coordinates unavailable: Preliminary pipeline coordinates have not passed catalog verification/i,
    );
  });

  it('supports keyboard nudging, scaling, and rotation using normalized sky coordinates', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('mode-sandbox-btn'));

    fireEvent.click(screen.getByRole('button', { name: /DECORATE SKY/i }));
    const needleInstance = screen.getByTestId('placed-object-seed-north-needle');
    needleInstance.focus();
    fireEvent.keyDown(needleInstance, { key: 'ArrowRight', shiftKey: true });
    fireEvent.keyDown(needleInstance, { key: '+' });
    fireEvent.keyDown(needleInstance, { key: ']', shiftKey: true });

    const saved = loadScenesFromStorage(undefined, 'sandbox');
    const updatedNeedle = saved.state.scenes.north.objects.find(
      (o) => o.instanceId === 'seed-north-needle',
    );
    expect(updatedNeedle).toBeDefined();
    expect(updatedNeedle!.x).toBeCloseTo(0.315, 3);
    expect(updatedNeedle!.scale).toBeCloseTo(1.26, 2);
    expect(updatedNeedle!.rotationDeg).toBe(3);
  });

  it('removes all backdrop stars when Clear Dark Sky is selected in Sandbox and persists across reloads', () => {
    const firstRender = render(<App />);
    fireEvent.click(screen.getByTestId('mode-sandbox-btn'));

    expect(screen.getByTestId('backdrop-starfield')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /WORKBENCH/i }));
    const clearDarkSkyBtn = screen.getByRole('button', { name: /Clear Dark Sky/i });
    fireEvent.click(clearDarkSkyBtn);

    expect(clearDarkSkyBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByTestId('backdrop-starfield')).not.toBeInTheDocument();

    firstRender.unmount();
    render(<App />);

    expect(screen.queryByTestId('backdrop-starfield')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /WORKBENCH/i }));
    fireEvent.click(screen.getByRole('button', { name: /Cygnus Filament Veil/i }));
    expect(screen.getByTestId('backdrop-starfield')).toBeInTheDocument();
  });

  it('protects corrupt saved data from silent erasure and round-trips room props & sky compositions via JSON', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not-valid-json');
    const loadedSandbox = loadScenesFromStorage(undefined, 'sandbox');
    expect(loadedSandbox.warning).toMatch(/backup copy was preserved/i);
    expect(window.localStorage.getItem(CORRUPT_BACKUP_KEY)).toBe('{not-valid-json');

    window.localStorage.setItem(PROGRESSION_STORAGE_KEY, '{bad-progression');
    const loadedProg = loadScenesFromStorage(undefined, 'progression');
    expect(loadedProg.warning).toMatch(/backup copy was preserved/i);
    expect(loadedProg.state.demoMode).toBe('progression');

    const brokenStorage = {
      setItem() {
        throw new Error('QuotaExceededError');
      },
    };
    const saveRes = saveScenesToStorage(loadedProg.state, brokenStorage);
    expect(saveRes.ok).toBe(false);

    const exported = serializeScenesToJson(loadedProg.state);
    const reimported = parseImportedScenesJson(exported);
    expect('state' in reimported).toBe(true);
    if ('state' in reimported) {
      expect(reimported.state.demoMode).toBe('progression');
    }
  });

  it('requires confirmation before resetting Progression Mode and leaves Sandbox untouched', () => {
    const firstRender = render(<App />);

    // Earn Stardust and hang a galaxy in Northern Window, then switch to Southern Window
    fireEvent.click(screen.getByRole('button', { name: /^CLASSIFY$/i }));
    completeQuickClassification();
    fireEvent.click(screen.getByRole('button', { name: /HANG IN SKY AT TELESCOPE/i }));
    fireEvent.click(screen.getByRole('button', { name: /Southern Window/i }));

    expect(screen.getByTestId('stardust-counter')).toHaveTextContent('3 STARDUST');
    expect(screen.getByRole('button', { name: /Northern Window/i })).toHaveTextContent('1');

    // Open Reset Progression confirmation -> cancelling preserves progress
    fireEvent.click(screen.getByTestId('top-reset-progression-btn'));
    const dialog = screen.getByTestId('reset-confirm-dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByTestId('stardust-counter')).toHaveTextContent('3 STARDUST');

    fireEvent.click(within(dialog).getAllByRole('button', { name: /\[ESC\] CANCEL/i })[0]);
    expect(screen.queryByTestId('reset-confirm-dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('stardust-counter')).toHaveTextContent('3 STARDUST');
    expect(screen.getByRole('button', { name: /Northern Window/i })).toHaveTextContent('1');

    // Confirm reset -> returns everything to zero and restores North hemisphere
    fireEvent.click(screen.getByTestId('top-reset-progression-btn'));
    fireEvent.click(screen.getByTestId('confirm-reset-btn'));

    expect(screen.queryByTestId('reset-confirm-dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('stardust-counter')).toHaveTextContent('0 STARDUST');
    expect(screen.getByRole('button', { name: /Northern Window/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /Northern Window/i })).toHaveTextContent('0');

    // Star Atlas is empty again
    fireEvent.click(screen.getByRole('button', { name: /STAR ATLAS/i }));
    expect(screen.getByTestId('atlas-empty-state')).toBeInTheDocument();

    // Reload persists clean reset, while Sandbox remains untouched
    firstRender.unmount();
    render(<App />);
    expect(screen.getByTestId('stardust-counter')).toHaveTextContent('0 STARDUST');
    fireEvent.click(screen.getByTestId('mode-sandbox-btn'));
    expect(screen.getByRole('button', { name: /Northern Window/i })).toHaveTextContent('4');
    fireEvent.click(screen.getByRole('button', { name: /Southern Window/i }));
    expect(screen.getByRole('button', { name: /Northern Window/i })).toHaveTextContent('4');
    expect(screen.getByRole('button', { name: /Southern Window/i })).toHaveTextContent('3');
  });

  it('surfaces Zooniverse AI Ethics charter, workflow ML badge, and Talk/provenance links in CRT and Star Atlas', () => {
    render(<App />);

    fireEvent.click(screen.getByTestId('top-ethics-btn'));
    const charter = screen.getByTestId('ethics-charter-modal');
    expect(charter).toHaveTextContent(/1\. Build Transparency/i);
    expect(charter).toHaveTextContent(/2\. Design for the Volunteer Experience/i);
    expect(charter).toHaveTextContent(/3\. Facilitate Accountability/i);
    expect(charter).toHaveTextContent(/4\. Commit to Ongoing Dialogue/i);

    const ethicsLink = within(charter).getByRole('link', {
      name: /ZOONIVERSE AI ETHICS FRAMEWORK/i,
    });
    expect(ethicsLink).toHaveAttribute('href', 'https://www.zooniverse.org/about/ai-ethics');
    expect(
      within(charter).getByRole('link', { name: /GALAXY ZOO TALK BOARDS/i }),
    ).toHaveAttribute('href', 'https://www.zooniverse.org/projects/zookeeper/galaxy-zoo/talk');
    expect(
      within(charter).getByRole('link', { name: /PROJECT FEEDBACK & ISSUES/i }),
    ).toHaveAttribute('href', 'https://github.com/Jordak/sky-garden/issues');

    // Escape closes Ethics modal
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('ethics-charter-modal')).not.toBeInTheDocument();

    // CRT surfaces workflow ML disclosure and opens Ethics overlay without losing CRT session
    fireEvent.click(screen.getByRole('button', { name: /^CLASSIFY$/i }));
    const disclosure = screen.getByTestId('crt-workflow-disclosure');
    expect(disclosure).toHaveTextContent(/OFFLINE CALIBRATION · NO ML IN LOOP/i);

    fireEvent.click(within(disclosure).getByRole('button', { name: /\[i\] AI & DATA ETHICS/i }));
    expect(screen.getByTestId('ethics-charter-modal')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('ethics-charter-modal')).not.toBeInTheDocument();
    expect(screen.getByText(/BLINK COMPARATOR MK-II/i)).toBeInTheDocument();

    // Post-classification status box and Star Atlas expose Survey Source & Galaxy Zoo Talk links
    completeQuickClassification();
    const statusBox = screen.getByRole('status');
    expect(within(statusBox).getByRole('link', { name: /SURVEY SOURCE/i })).toHaveAttribute(
      'href',
      expect.stringContaining('legacysurvey.org'),
    );
    expect(within(statusBox).getByRole('link', { name: /GALAXY ZOO TALK/i })).toHaveAttribute(
      'href',
      'https://www.zooniverse.org/projects/zookeeper/galaxy-zoo/talk',
    );

    fireEvent.click(screen.getByRole('button', { name: /STAR ATLAS/i }));
    const atlasDialog = screen.getByRole('dialog', { name: /ILLUMINATED STAR ATLAS/i });
    expect(within(atlasDialog).getByRole('link', { name: /SURVEY SOURCE/i })).toHaveAttribute(
      'href',
      expect.stringContaining('legacysurvey.org'),
    );
    expect(within(atlasDialog).getByRole('link', { name: /GALAXY ZOO TALK/i })).toHaveAttribute(
      'href',
      'https://www.zooniverse.org/projects/zookeeper/galaxy-zoo/talk',
    );
  });

  it('wipes both Progression and Sandbox localStorage saves after confirmation in the Ethics & Data modal', () => {
    render(<App />);

    // Create persisted changes in both Sandbox and Progression saves
    fireEvent.click(screen.getByTestId('mode-sandbox-btn'));
    fireEvent.click(screen.getByRole('button', { name: /WORKBENCH/i }));
    fireEvent.click(screen.getByRole('button', { name: /Clear Dark Sky/i }));
    expect(screen.queryByTestId('backdrop-starfield')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('mode-progression-btn'));
    fireEvent.click(screen.getByRole('button', { name: /^CLASSIFY$/i }));
    completeQuickClassification();
    expect(screen.getByTestId('stardust-counter')).toHaveTextContent('3 STARDUST');
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(window.localStorage.getItem(PROGRESSION_STORAGE_KEY)).not.toBeNull();

    // Cancel wipe preserves state & storage
    fireEvent.click(screen.getByTestId('top-ethics-btn'));
    fireEvent.click(screen.getByTestId('wipe-all-data-btn'));
    fireEvent.click(screen.getByTestId('cancel-wipe-all-btn'));
    expect(screen.getByTestId('stardust-counter')).toHaveTextContent('3 STARDUST');
    expect(window.localStorage.getItem(PROGRESSION_STORAGE_KEY)).not.toBeNull();

    // Confirm wipe clears both Progression and Sandbox saves in localStorage
    fireEvent.click(screen.getByTestId('wipe-all-data-btn'));
    fireEvent.click(screen.getByTestId('confirm-wipe-all-btn'));

    expect(screen.queryByTestId('ethics-charter-modal')).not.toBeInTheDocument();
    expect(window.localStorage.getItem(PROGRESSION_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(screen.getByTestId('stardust-counter')).toHaveTextContent('0 STARDUST');

    // Sandbox falls back cleanly to its default starfield showcase
    fireEvent.click(screen.getByTestId('mode-sandbox-btn'));
    expect(screen.getByTestId('backdrop-starfield')).toBeInTheDocument();
  });

  it('walks the Panoptes-shaped branching decision tree with zero pre-selected defaults, Back navigation, and persisted annotations', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^CLASSIFY$/i }));

    // Zero pre-selected answers and submit disabled until terminal step
    const logBtn = screen.getByRole('button', { name: /LOG PRACTICE OBSERVATION/i });
    expect(logBtn).toBeDisabled();
    const initialGroup = screen.getByRole('group', {
      name: /Is the central galaxy simply smooth and rounded/i,
    });
    for (const choiceBtn of within(initialGroup).getAllByRole('button')) {
      expect(choiceBtn).toHaveAttribute('aria-pressed', 'false');
    }

    // Walk full multi-step branch and revise T5_WINDING via Back
    fireEvent.click(screen.getByRole('button', { name: /Features or Disk/i }));
    fireEvent.click(screen.getByRole('button', { name: /No — Face-On \/ Inclined/i }));
    fireEvent.click(screen.getByRole('button', { name: /Strong Bar/i }));
    fireEvent.click(screen.getByRole('button', { name: /Yes — Spiral Arms/i }));
    fireEvent.click(screen.getByRole('button', { name: /Loosely Wound \/ Open/i }));

    fireEvent.click(screen.getByRole('button', { name: /◀ BACK/i }));
    expect(screen.getByRole('button', { name: /Loosely Wound \/ Open/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: /Tightly Wound/i }));

    // Still disabled on T6_MERGER until a final answer is picked
    expect(screen.getByRole('button', { name: /LOG PRACTICE OBSERVATION/i })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Merging \/ Tidal Bridge/i }));
    expect(screen.getByRole('button', { name: /LOG PRACTICE OBSERVATION/i })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: /LOG PRACTICE OBSERVATION/i }));
    expect(screen.getByTestId('stardust-counter')).toHaveTextContent('3 STARDUST');

    const stored = loadScenesFromStorage(undefined, 'progression').state;
    expect(stored.practiceLog).toHaveLength(1);
    expect(stored.practiceLog[0].workflowId).toBe('gz-panoptes-demo-v2');
    expect(stored.practiceLog[0].annotations?.map((a) => a.task)).toEqual([
      'T0',
      'T2_EDGE',
      'T3_BAR',
      'T4_SPIRAL',
      'T5_WINDING',
      'T6_MERGER',
    ]);

    const roundTrip = parseImportedScenesJson(serializeScenesToJson(stored));
    expect('state' in roundTrip).toBe(true);
    if ('state' in roundTrip) {
      expect(roundTrip.state.practiceLog[0].annotations).toHaveLength(6);
    }

    // Advance to next incoming subject and verify 1-step terminal Star/Artifact path also grants flat +3 Stardust
    fireEvent.click(screen.getByRole('button', { name: /NEXT INCOMING SUBJECT ▶/i }));
    fireEvent.click(screen.getByRole('button', { name: /Star or Artifact/i }));
    fireEvent.click(screen.getByRole('button', { name: /LOG PRACTICE OBSERVATION/i }));
    expect(screen.getByTestId('stardust-counter')).toHaveTextContent('6 STARDUST');
  });

  it('supports ungated Field Guide, 1x/2x/4x zoom with clamped drag-panning, and real-time brightness/contrast stretch', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^CLASSIFY$/i }));

    // Toggle contextual Field Guide on T0, then verify it updates on T1_SMOOTH
    fireEvent.click(screen.getByTestId('crt-field-guide-toggle'));
    expect(screen.getByTestId('crt-field-guide-drawer')).toHaveTextContent(
      /Light falls off evenly from a glowing center/i,
    );
    fireEvent.click(screen.getByRole('button', { name: /Smooth & Rounded/i }));
    expect(screen.getByTestId('crt-field-guide-drawer')).toHaveTextContent(/Completely Round/i);

    // Zoom 1x -> 4x, verify dynamic arcmin scale & clamped drag-panning
    const viewport = screen.getByTestId('crt-optical-viewport');
    const plateImg = within(viewport).getByRole('img');
    const oneXScaleText = viewport.textContent ?? '';
    const oneXArcmin = parseFloat(oneXScaleText.match(/([\d.]+)′ arcmin/)?.[1] ?? '0');
    expect(oneXArcmin).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /Zoom 4x/i }));
    const fourXArcmin = parseFloat((viewport.textContent ?? '').match(/([\d.]+)′ arcmin/)?.[1] ?? '0');
    expect(fourXArcmin).toBeCloseTo(oneXArcmin / 4, 2);

    const dispatchPointer = (
      target: Element,
      type: 'pointerdown' | 'pointermove' | 'pointerup',
      clientX: number,
      clientY: number,
    ) => {
      const evt = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        button: 0,
        clientX,
        clientY,
      });
      Object.defineProperty(evt, 'pointerId', { value: 1 });
      fireEvent(target, evt);
    };

    dispatchPointer(viewport, 'pointerdown', 100, 100);
    dispatchPointer(viewport, 'pointermove', 700, -600);
    dispatchPointer(viewport, 'pointerup', 700, -600);
    expect(plateImg.style.transform).toBe('translate(150.0%, -150.0%) scale(4)');

    fireEvent.click(screen.getByRole('button', { name: /RESET VIEW/i }));
    expect(plateImg.style.transform).toBe('translate(0.0%, 0.0%) scale(1)');

    // Stretch preset + sliders + invert + flat reset
    fireEvent.click(screen.getByRole('button', { name: /FAINT SHELLS/i }));
    fireEvent.click(screen.getByRole('button', { name: /INVERT/i }));
    fireEvent.change(screen.getByTestId('crt-brightness-slider'), { target: { value: '140' } });
    fireEvent.change(screen.getByTestId('crt-contrast-slider'), { target: { value: '185' } });
    expect(plateImg.style.filter).toBe(
      'invert(1) hue-rotate(180deg) brightness(1.40) contrast(1.85)',
    );

    fireEvent.click(screen.getByRole('button', { name: /FLAT/i }));
    expect(plateImg.style.filter).toBe('none');
  });

  it('surfaces contextual Zooniverse Talk #tag links and Help Guide / FAQ links in the Field Guide drawer', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^CLASSIFY$/i }));
    fireEvent.click(screen.getByTestId('crt-field-guide-toggle'));

    const linksBox = screen.getByTestId('crt-field-guide-links');
    expect(within(linksBox).getByRole('link', { name: /#artifact examples/i })).toHaveAttribute(
      'href',
      'https://www.zooniverse.org/projects/zookeeper/galaxy-zoo/talk/tags/artifact',
    );
    expect(
      within(linksBox).getByRole('link', { name: /NEW TO GALAXY ZOO\? HELP GUIDE/i }),
    ).toHaveAttribute('href', 'https://www.zooniverse.org/projects/zookeeper/galaxy-zoo/talk/1268/570127');
    expect(within(linksBox).getByRole('link', { name: /HELP BOARD/i })).toHaveAttribute(
      'href',
      'https://www.zooniverse.org/projects/zookeeper/galaxy-zoo/talk/1268',
    );
    expect(within(linksBox).getByRole('link', { name: /GALAXY ZOO FAQ/i })).toHaveAttribute(
      'href',
      'https://www.zooniverse.org/projects/zookeeper/galaxy-zoo/about/faq',
    );

    // Advance T0 -> T2_EDGE -> T3_BAR and confirm contextual #tag pills update to bar tags
    fireEvent.click(screen.getByRole('button', { name: /Features or Disk/i }));
    expect(within(linksBox).getByRole('link', { name: /#edge-on examples/i })).toHaveAttribute(
      'href',
      'https://www.zooniverse.org/projects/zookeeper/galaxy-zoo/talk/tags/edge-on',
    );
    fireEvent.click(screen.getByRole('button', { name: /No — Face-On \/ Inclined/i }));
    expect(within(linksBox).getByRole('link', { name: /#strong-bar examples/i })).toHaveAttribute(
      'href',
      'https://www.zooniverse.org/projects/zookeeper/galaxy-zoo/talk/tags/strong-bar',
    );
  });

  it('builds accurate Observatory Postcard metadata and downloads a PNG from Quiet Gaze & Workbench', async () => {
    const sandboxState = loadScenesFromStorage(undefined, 'sandbox').state;
    const meta = buildPostcardMetadata(sandboxState.scenes.north);
    expect(meta.title).toBe('Quiet Study of Rings & Bridges');
    expect(meta.featuredCatalogNames).toEqual([
      'NGC 4565',
      'Arp 87 (NGC 3808A/B)',
      'PGC 54559',
    ]);
    expect(meta.surveyCredits).toContain('DESI Legacy Imaging Surveys (CC BY 4.0)');
    expect(meta.surveyCredits).toContain('Sloan Digital Sky Survey (CC BY 4.0)');

    const fakeGrad = { addColorStop: vi.fn() };
    const fakeCtx = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textAlign: 'left',
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      imageSmoothingEnabled: true,
      createLinearGradient: vi.fn(() => fakeGrad),
      createRadialGradient: vi.fn(() => fakeGrad),
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    const origImage = window.Image;
    class ImmediateFailImage {
      crossOrigin = '';
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_val: string) {
        Promise.resolve().then(() => this.onerror?.());
      }
    }
    window.Image = ImmediateFailImage as unknown as typeof Image;

    const getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(fakeCtx);
    const toDataUrlSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
      .mockReturnValue('data:image/png;base64,iVBORw0KGgo=');
    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    try {
      render(<App />);
      fireEvent.click(screen.getByTestId('mode-sandbox-btn'));

      fireEvent.click(screen.getByRole('button', { name: /QUIET GAZE/i }));
      fireEvent.click(screen.getByTestId('gaze-export-postcard-btn'));

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/Downloaded observatory postcard/i);
      });
      expect(toDataUrlSpy).toHaveBeenCalledWith('image/png');
      expect(anchorClickSpy).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: /EXIT GAZE/i }));
      fireEvent.click(screen.getByRole('button', { name: /^WORKBENCH$/i }));
      fireEvent.click(screen.getByTestId('workbench-export-postcard-btn'));

      await waitFor(() => {
        expect(anchorClickSpy).toHaveBeenCalledTimes(2);
      });
    } finally {
      window.Image = origImage;
      getContextSpy.mockRestore();
      toDataUrlSpy.mockRestore();
      anchorClickSpy.mockRestore();
    }
  });

  it('adapts read-only Panoptes workflow JSON & public API responses safely inside the CRT classifier', async () => {
    const samplePanoptesEnvelope = {
      workflows: [
        {
          id: '20751',
          version: '3.12',
          display_name: 'Galaxy Zoo Cosmic Dawn Preview',
          first_task: 'T0',
          strings: {
            'T0.question': 'Does the galaxy have a clean **bulge** or a *bar*?',
            'T0.help': 'See [Galaxy Zoo FAQ](https://www.zooniverse.org/projects/zookeeper/galaxy-zoo/about/faq) before deciding.',
            'T0.answers.0.label': 'Strong Bar',
            'T0.answers.1.label': 'Star or Artifact',
          },
          tasks: {
            T0: {
              type: 'single',
              question: 'T0.question',
              help: 'T0.help',
              answers: [
                { label: 'T0.answers.0.label', next: 'T_DRAW' },
                { label: 'T0.answers.1.label', next: null },
              ],
            },
            T_DRAW: {
              type: 'drawing',
              question: 'Draw spiral arms',
              answers: [],
            },
          },
        },
      ],
      field_guides: [
        {
          id: '99',
          items: [
            {
              title: 'Sample Bar Note',
              content: 'Look for a bright linear stellar **bar**.',
            },
          ],
        },
      ],
    };

    const parsed = parsePanoptesWorkflowJson(JSON.stringify(samplePanoptesEnvelope));
    expect('workflow' in parsed).toBe(true);
    if ('workflow' in parsed) {
      expect(parsed.workflow.id).toBe('20751');
      expect(parsed.workflow.tasks.T0.answers[0].next).toBe('');
      expect(parsed.skippedTaskIds).toEqual(['T_DRAW']);
      expect(parsed.warnings).toHaveLength(2);
    }

    // Verify public Panoptes fetch uses strictly GET with JSON:API v1 Accept header
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => samplePanoptesEnvelope,
    });
    const fetched = await fetchPublicPanoptesWorkflow('20751', fetchMock as unknown as typeof fetch);
    expect(fetchMock).toHaveBeenCalledWith('https://www.zooniverse.org/api/workflows/20751', {
      method: 'GET',
      headers: { Accept: 'application/vnd.api+json; version=1' },
    });
    expect('workflow' in fetched).toBe(true);

    // Load offline Panoptes JSON inside the live CRT modal and verify walkthrough + reset
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^CLASSIFY$/i }));
    fireEvent.click(screen.getByTestId('crt-workflow-source-toggle'));
    fireEvent.change(screen.getByTestId('panoptes-json-input'), {
      target: { value: JSON.stringify(samplePanoptesEnvelope) },
    });
    fireEvent.click(screen.getByTestId('panoptes-json-load-btn'));

    expect(screen.getByTestId('crt-workflow-disclosure')).toHaveTextContent(/PANOPTES READ-ONLY · #20751/i);
    expect(screen.getByTestId('panoptes-adapter-warnings')).toHaveTextContent(/Skipped non-single task "T_DRAW"/i);

    fireEvent.click(screen.getByTestId('crt-field-guide-toggle'));
    expect(screen.getByTestId('crt-field-guide-drawer')).toHaveTextContent(/Sample Bar Note/i);

    fireEvent.click(screen.getByRole('button', { name: /Strong Bar/i }));
    fireEvent.click(screen.getByRole('button', { name: /LOG PRACTICE OBSERVATION/i }));

    const stored = loadScenesFromStorage(undefined, 'progression').state;
    expect(stored.practiceLog[0].workflowId).toBe('20751');
    expect(stored.practiceLog[0].annotations?.[0]).toMatchObject({
      task: 'T0',
      value: 0,
      answerLabel: 'Strong Bar',
    });

    fireEvent.click(screen.getByTestId('panoptes-reset-demo-btn'));
    expect(screen.getByTestId('crt-workflow-disclosure')).toHaveTextContent(
      /OFFLINE CALIBRATION · NO ML IN LOOP/i,
    );
  });

  it('persists Web Audio mute preference and bundles M87 smooth elliptical plus HD 108642 foreground star calibration plates', () => {
    render(<App />);

    const audioBtn = screen.getByTestId('top-audio-toggle-btn');
    expect(audioBtn).toHaveAttribute('aria-pressed', 'true');
    expect(audioBtn).toHaveTextContent('♪ SFX ON');

    fireEvent.click(audioBtn);
    expect(audioBtn).toHaveAttribute('aria-pressed', 'false');
    expect(audioBtn).toHaveTextContent('♪ SFX OFF');
    expect(window.localStorage.getItem(AUDIO_MUTED_STORAGE_KEY)).toBe('true');

    // Sandbox Star Atlas includes all 10 bundled subjects including M87 & HD 108642
    fireEvent.click(screen.getByTestId('mode-sandbox-btn'));
    fireEvent.click(screen.getByRole('button', { name: /STAR ATLAS/i }));
    const atlasList = screen.getByRole('list', { name: /Demo Galaxy Collection/i });
    expect(within(atlasList).getAllByRole('listitem')).toHaveLength(10);
    expect(screen.getByTestId('collection-card-src-m87')).toBeInTheDocument();
    expect(screen.getByTestId('collection-card-src-hd-108642')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('collection-card-src-m87'));
    expect(screen.getByTestId('real-coordinates-box')).toHaveTextContent('Virgo');

    fireEvent.click(screen.getByTestId('collection-card-src-hd-108642'));
    expect(screen.getByTestId('real-coordinates-box')).toHaveTextContent('Coma Berenices');

    // Clear All Local Data resets audio mute state too
    fireEvent.click(screen.getByRole('button', { name: /CLOSE ATLAS/i }));
    fireEvent.click(screen.getByTestId('top-ethics-btn'));
    fireEvent.click(screen.getByTestId('wipe-all-data-btn'));
    fireEvent.click(screen.getByTestId('confirm-wipe-all-btn'));
    expect(window.localStorage.getItem(AUDIO_MUTED_STORAGE_KEY)).toBeNull();
    expect(screen.getByTestId('top-audio-toggle-btn')).toHaveTextContent('♪ SFX ON');
  });
});
