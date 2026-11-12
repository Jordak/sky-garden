import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../App';
import { DEMO_COLLECTION_ENTRIES, SOURCE_GALAXIES } from '../data/demoCatalog';
import {
  CORRUPT_BACKUP_KEY,
  loadScenesFromStorage,
  parseImportedScenesJson,
  saveScenesToStorage,
  serializeScenesToJson,
  STORAGE_KEY,
} from '../storage/sceneStorage';

describe('Sky Garden Side-On Pixel Observatory Prototype', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders the walkable side-on observatory and preserves North and South skies independently across reloads', () => {
    const firstRender = render(<App />);

    expect(screen.getByTestId('observatory-room-canvas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Northern Window/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    // Step up to the Telescope Sky Curator station
    fireEvent.click(screen.getByRole('button', { name: /DECORATE SKY/i }));
    expect(screen.getByTestId('sky-satchel-dock')).toBeInTheDocument();

    // Hang NGC 474 into the Northern sky dome
    fireEvent.click(screen.getByRole('button', { name: /Place NGC 474 in north sky/i }));
    expect(screen.getByRole('button', { name: /Northern Window/i })).toHaveTextContent('5');
    expect(screen.getByRole('button', { name: /Southern Window/i })).toHaveTextContent('3');

    // Rotate to Southern Window and clear its sky pane
    fireEvent.click(screen.getByRole('button', { name: /Southern Window/i }));
    fireEvent.click(screen.getByRole('button', { name: /Clear Pane/i }));
    expect(screen.getByRole('button', { name: /Southern Window/i })).toHaveTextContent('0');

    // Reload simulation
    firstRender.unmount();
    render(<App />);

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

  it('logs practice observations at the Blink Comparator CRT and hangs the subject in the sky', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /^CLASSIFY$/i }));
    expect(screen.getByText(/PRACTICE TERMINAL · NOT LIVE RESEARCH/i)).toBeInTheDocument();

    // Ungated Invert hardware switch works immediately
    const invertBtn = screen.getByRole('button', { name: /INVERT/i });
    fireEvent.click(invertBtn);
    expect(invertBtn).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: /LOG PRACTICE OBSERVATION/i }));
    expect(screen.getByText(/PRACTICE OBSERVATION LOGGED/i)).toBeInTheDocument();

    // Hang directly in sky from CRT station
    fireEvent.click(screen.getByRole('button', { name: /HANG IN SKY AT TELESCOPE/i }));
    expect(screen.getByRole('button', { name: /Northern Window/i })).toHaveTextContent('5');
    expect(loadScenesFromStorage().state.practiceLog).toHaveLength(1);
  });

  it('displays verified J2000 coordinates in the Star Atlas and withholds unavailable or unverified coordinates', () => {
    render(<App />);

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

    fireEvent.click(screen.getByRole('button', { name: /DECORATE SKY/i }));
    const needleInstance = screen.getByTestId('placed-object-seed-north-needle');
    needleInstance.focus();
    fireEvent.keyDown(needleInstance, { key: 'ArrowRight', shiftKey: true });
    fireEvent.keyDown(needleInstance, { key: '+' });
    fireEvent.keyDown(needleInstance, { key: ']', shiftKey: true });

    const saved = loadScenesFromStorage();
    const updatedNeedle = saved.state.scenes.north.objects.find(
      (o) => o.instanceId === 'seed-north-needle',
    );
    expect(updatedNeedle).toBeDefined();
    expect(updatedNeedle!.x).toBeCloseTo(0.315, 3);
    expect(updatedNeedle!.scale).toBeCloseTo(1.26, 2);
    expect(updatedNeedle!.rotationDeg).toBe(3);
  });

  it('protects corrupt saved data from silent erasure and round-trips room props & sky compositions via JSON', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not-valid-json');
    const loaded = loadScenesFromStorage();
    expect(loaded.warning).toMatch(/backup copy was preserved/i);
    expect(window.localStorage.getItem(CORRUPT_BACKUP_KEY)).toBe('{not-valid-json');

    const brokenStorage = {
      setItem() {
        throw new Error('QuotaExceededError');
      },
    };
    const saveRes = saveScenesToStorage(loaded.state, brokenStorage);
    expect(saveRes.ok).toBe(false);

    const exported = serializeScenesToJson(loaded.state);
    const reimported = parseImportedScenesJson(exported);
    expect('state' in reimported).toBe(true);
  });

  it('removes all backdrop stars when Clear Dark Sky is selected and persists across reloads', () => {
    const firstRender = render(<App />);

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
});
