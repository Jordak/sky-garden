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

describe('Sky Garden Milestone 1', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('preserves North and South compositions independently across remounts (reloads)', () => {
    const firstRender = render(<App />);

    // Initially on Northern Window with 4 starter objects
    expect(screen.getByRole('button', { name: /Northern Window/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    // Place NGC 474 into the Northern Window
    const placeNgc474Btn = screen.getByRole('button', {
      name: /Place NGC 474 in north sky/i,
    });
    fireEvent.click(placeNgc474Btn);

    expect(screen.getByRole('button', { name: /Northern Window/i })).toHaveTextContent('5');
    expect(screen.getByRole('button', { name: /Southern Window/i })).toHaveTextContent('3');

    // Switch to Southern Window and clear it
    fireEvent.click(screen.getByRole('button', { name: /Southern Window/i }));
    expect(screen.getByRole('button', { name: /Southern Window/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: /Clear Pane/i }));
    expect(screen.getByRole('button', { name: /Southern Window/i })).toHaveTextContent('0');

    // Simulate page reload by unmounting and mounting fresh from localStorage
    firstRender.unmount();
    render(<App />);

    // Should restore Southern Window (0 items) while Northern Window still has 5 items
    expect(screen.getByRole('button', { name: /Southern Window/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /Southern Window/i })).toHaveTextContent('0');
    expect(screen.getByRole('button', { name: /Northern Window/i })).toHaveTextContent('5');
  });

  it('removes a placed galaxy from the window without deleting it from the collection or altering source records', () => {
    const snapshotBefore = JSON.stringify(SOURCE_GALAXIES);
    render(<App />);

    // Remove the currently selected galaxy instance
    const removeBtn = screen.getByRole('button', {
      name: /Remove from Window \(Keeps in Collection\)/i,
    });
    fireEvent.click(removeBtn);

    // Northern count drops from 4 to 3, but all 8 demo collection entries remain in the tray
    expect(screen.getByRole('button', { name: /Northern Window/i })).toHaveTextContent('3');
    const collectionList = screen.getByRole('list', { name: /Demo Galaxy Collection/i });
    expect(within(collectionList).getAllByRole('listitem')).toHaveLength(
      DEMO_COLLECTION_ENTRIES.length,
    );

    // Undo restores the removed galaxy instance
    fireEvent.click(screen.getByRole('button', { name: /Undo/i }));
    expect(screen.getByRole('button', { name: /Northern Window/i })).toHaveTextContent('4');

    // Source galaxy scientific metadata remains completely untouched
    expect(JSON.stringify(SOURCE_GALAXIES)).toBe(snapshotBefore);
  });

  it('shows verified J2000 coordinates when present and explicitly reports when coordinates are unavailable or unverified', () => {
    render(<App />);

    // Click NGC 1300 in collection (verified coordinates)
    fireEvent.click(screen.getByTestId('collection-card-src-ngc-1300'));
    const coordsBox = screen.getByTestId('real-coordinates-box');
    expect(coordsBox).toHaveTextContent('Verified ICRS (J2000)');
    expect(coordsBox).toHaveTextContent('03h 19m 41.1s');
    expect(coordsBox).toHaveTextContent('Eridanus');

    // Click Demo Subject GZ-88412 (unavailable coordinates)
    fireEvent.click(screen.getByTestId('collection-card-src-subject-alpha'));
    expect(screen.getByTestId('real-coordinates-box')).toHaveTextContent(
      /Real sky coordinates unavailable: Sky coordinates are not exposed/i,
    );

    // Click Demo Subject GZ-90347 (unverified coordinates withheld)
    fireEvent.click(screen.getByTestId('collection-card-src-subject-beta'));
    expect(screen.getByTestId('real-coordinates-box')).toHaveTextContent(
      /Real sky coordinates unavailable: Preliminary pipeline coordinates have not passed catalog verification/i,
    );
  });

  it('supports keyboard nudging, scaling, and rotation using normalized coordinates', () => {
    render(<App />);

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
    expect(updatedNeedle!.x).toBeCloseTo(0.335, 3);
    expect(updatedNeedle!.scale).toBeCloseTo(1.26, 2);
    expect(updatedNeedle!.rotationDeg).toBe(3);
  });

  it('protects corrupt saved data from silent erasure and surfaces storage write failures cleanly', () => {
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
    expect(saveRes.warning).toMatch(/Export JSON so no progress is lost/i);
  });

  it('round-trips JSON export and import with schema validation', () => {
    const initial = loadScenesFromStorage().state;
    const exported = serializeScenesToJson(initial);
    const reimported = parseImportedScenesJson(exported);
    expect('state' in reimported).toBe(true);
    if ('state' in reimported) {
      expect(reimported.state.scenes.north.objects).toHaveLength(
        initial.scenes.north.objects.length,
      );
      expect(reimported.state.scenes.south.objects).toHaveLength(
        initial.scenes.south.objects.length,
      );
    }
  });
});
