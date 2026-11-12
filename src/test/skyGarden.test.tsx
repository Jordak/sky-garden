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
});
