/**
 * @vitest-environment happy-dom
 */
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import * as React from 'react';

import DiffViewer from '../src/index';
import * as computeLines from '../src/compute-lines';

describe('initiallyCollapsed lazy evaluation', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('should not compute diff when initiallyCollapsed is true', () => {
    // Spy on computeLineInformation to verify it's not called
    const computeSpy = vi.spyOn(computeLines, 'computeLineInformation');

    const oldValue = 'Line 1\nLine 2\nLine 3';
    const newValue = 'Line 1\nModified Line 2\nLine 3';

    render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        initiallyCollapsed={true}
      />
    );

    // Verify placeholder is shown
    const loadButton = screen.getByText('Load diff');
    expect(loadButton).toBeTruthy();

    // computeLineInformation should NOT have been called yet
    expect(computeSpy).not.toHaveBeenCalled();
  });

  it('should compute diff after clicking expand button', () => {
    const computeSpy = vi.spyOn(computeLines, 'computeLineInformation');

    const oldValue = 'Line 1\nLine 2\nLine 3';
    const newValue = 'Line 1\nModified Line 2\nLine 3';

    const { rerender, getAllByRole } = render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        initiallyCollapsed={true}
      />
    );

    // Before expansion
    expect(computeSpy).not.toHaveBeenCalled();

    // Click the "Load diff" button (there might be multiple buttons, find the right one)
    const buttons = getAllByRole('button');
    const loadDiffButton = buttons.find(btn => btn.getAttribute('aria-label') === 'Load diff');
    expect(loadDiffButton).toBeTruthy();
    fireEvent.click(loadDiffButton);

    // Force re-render to trigger diff computation
    rerender(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        initiallyCollapsed={true}
      />
    );

    // After expansion, computeLineInformation should have been called
    expect(computeSpy).toHaveBeenCalled();
  });

  it('should not compute diff when initiallyCollapsed is false (default)', () => {
    const computeSpy = vi.spyOn(computeLines, 'computeLineInformation');

    const oldValue = 'Line 1\nLine 2\nLine 3';
    const newValue = 'Line 1\nModified Line 2\nLine 3';

    render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        initiallyCollapsed={false}
      />
    );

    // When NOT initially collapsed, diff should be computed immediately
    expect(computeSpy).toHaveBeenCalled();

    computeSpy.mockRestore();
  });

  it('should compute diff immediately when initiallyCollapsed is undefined (default)', () => {
    const computeSpy = vi.spyOn(computeLines, 'computeLineInformation');

    const oldValue = 'Line 1\nLine 2\nLine 3';
    const newValue = 'Line 1\nModified Line 2\nLine 3';

    render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
      />
    );

    // Default behavior - diff should be computed immediately
    expect(computeSpy).toHaveBeenCalled();

    computeSpy.mockRestore();
  });
});
