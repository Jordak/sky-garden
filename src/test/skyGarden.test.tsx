import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../App';
import { DEMO_COLLECTION_ENTRIES, SOURCE_GALAXIES } from '../data/demoCatalog';
import {
  CORRUPT_BACKUP_KEY,
  loadScenesFromStorage,
  parseImportedScenesJson,
  PROGRESSION_STORAGE_KEY,
  saveScenesToStorage,
  serializeScenesToJson,
  STORAGE_KEY,
} from '../storage/sceneStorage';

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
    fireEvent.click(screen.getByRole('button', { name: /LOG PRACTICE OBSERVATION/i }));
    expect(screen.getByText(/PRACTICE OBSERVATION LOGGED — UNLOCKED NGC 1300/i)).toBeInTheDocument();
    expect(screen.getByTestId('stardust-counter')).toHaveTextContent('3 STARDUST');

    // Re-opening CRT on the already-unlocked NGC 1300 plate does NOT award duplicate Stardust
    fireEvent.click(screen.getByRole('button', { name: /LEAVE DESK/i }));
    fireEvent.click(screen.getByRole('button', { name: /^CLASSIFY$/i }));
    fireEvent.click(screen.getByRole('button', { name: /◀ PREV/i }));
    fireEvent.click(screen.getByRole('button', { name: /LOG PRACTICE OBSERVATION/i }));
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
    fireEvent.click(screen.getByRole('button', { name: /LOG PRACTICE OBSERVATION/i }));
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
    fireEvent.click(screen.getByRole('button', { name: /LOG PRACTICE OBSERVATION/i }));
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
    fireEvent.click(screen.getByRole('button', { name: /LOG PRACTICE OBSERVATION/i }));
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
    fireEvent.click(screen.getByRole('button', { name: /LOG PRACTICE OBSERVATION/i }));
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
});
