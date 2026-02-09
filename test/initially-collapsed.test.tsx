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

  it('should show correct change count when initiallyCollapsed is true', () => {
    // Spy on computeLineInformation to verify it's not called
    const computeSpy = vi.spyOn(computeLines, 'computeLineInformation');
    // Spy on computeChangeCount to verify it IS called
    const changeCountSpy = vi.spyOn(computeLines, 'computeChangeCount');

    const oldValue = 'Line 1\nLine 2\nLine 3';
    const newValue = 'Line 1\nModified Line 2\nLine 3\nLine 4';

    const { container } = render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        initiallyCollapsed={true}
      />
    );

    // Verify full line computation was NOT called
    expect(computeSpy).not.toHaveBeenCalled();

    // Verify lightweight change count WAS called
    expect(changeCountSpy).toHaveBeenCalled();

    // The diff has:
    // - Line 1: unchanged
    // - Line 2: modified (1 removal + 1 addition = 2 changes)
    // - Line 3: unchanged
    // - Line 4: added (1 addition)
    // Total: 3 changes (1 deletion + 2 additions)

    // The summary banner contains: [fold/expand button] [changeCount] [blocks...] [summary text] [chevron]
    // Let's get the entire HTML and check it contains the number 3
    const html = container.innerHTML;

    // The change count "3" should appear somewhere in the rendered output
    // (it's the first number after the fold button in the summary)
    expect(html).toContain('3');

    // Additionally verify that computeChangeCount was called correctly
    expect(changeCountSpy).toHaveBeenCalledWith(
      oldValue,
      newValue,
      DiffViewer.defaultProps.compareMethod,
      undefined
    );
  });

  it('should maintain correct change count after expansion', () => {
    const oldValue = 'Line 1\nLine 2\nLine 3';
    const newValue = 'Line 1\nModified Line 2\nLine 3\nLine 4';

    const { container, getAllByRole, rerender } = render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        initiallyCollapsed={true}
      />
    );

    // Get initial HTML
    const htmlBefore = container.innerHTML;

    // Click the "Load diff" button
    const buttons = getAllByRole('button');
    const loadDiffButton = buttons.find(btn => btn.getAttribute('aria-label') === 'Load diff');
    expect(loadDiffButton).toBeTruthy();
    fireEvent.click(loadDiffButton);

    // Force re-render
    rerender(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        initiallyCollapsed={true}
      />
    );

    // Get HTML after expansion
    const htmlAfter = container.innerHTML;

    // Both should contain the number 3 (the change count)
    expect(htmlBefore).toContain('3');
    expect(htmlAfter).toContain('3');

    // After expansion, we should see actual diff lines (not just the collapsed placeholder)
    expect(htmlAfter).toContain('Line 1');
  });
});
