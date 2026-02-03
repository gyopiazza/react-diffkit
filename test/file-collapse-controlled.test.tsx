/**
 * @vitest-environment happy-dom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import DiffViewer from '../src/index';

const oldValue = `line 1
line 2
line 3
line 4
line 5`;

const newValue = `line 1
line 2 modified
line 3
line 4
line 5`;

describe('File Collapse - Controlled Mode', () => {
  it('should use fileCollapsed prop to control initial state', () => {
    const { container } = render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        fileCollapsed={true}
      />
    );

    // File should be collapsed (no diff table visible)
    const table = container.querySelector('table');
    expect(table).toBeNull();
  });

  it('should show expanded state when fileCollapsed is false', () => {
    const { container } = render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        fileCollapsed={false}
      />
    );

    // File should be expanded (diff table visible)
    const table = container.querySelector('table');
    expect(table).not.toBeNull();
  });

  it('should fire onFileCollapseChange when collapse button is clicked in controlled mode', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        fileCollapsed={false}
        onFileCollapseChange={handleChange}
      />
    );

    // Click the summary banner to toggle collapse
    const banner = container.querySelector('[role="button"]');
    fireEvent.click(banner!);

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('should NOT update internal state when clicked in controlled mode', () => {
    const handleChange = vi.fn();
    const { container, rerender } = render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        fileCollapsed={false}
        onFileCollapseChange={handleChange}
      />
    );

    // Click the summary banner
    const banner = container.querySelector('[role="button"]');
    fireEvent.click(banner!);

    // Callback should have been called
    expect(handleChange).toHaveBeenCalledWith(true);

    // But state should NOT change until parent updates prop
    let table = container.querySelector('table');
    expect(table).not.toBeNull(); // Still showing table

    // Parent updates the prop
    rerender(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        fileCollapsed={true}
        onFileCollapseChange={handleChange}
      />
    );

    // Now table should be hidden
    table = container.querySelector('table');
    expect(table).toBeNull();
  });

  it('should sync state when fileCollapsed prop changes', () => {
    const { container, rerender } = render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        fileCollapsed={false}
      />
    );

    // Initially expanded
    let table = container.querySelector('table');
    expect(table).not.toBeNull();

    // Parent changes prop to collapsed
    rerender(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        fileCollapsed={true}
      />
    );

    // Should now be collapsed
    table = container.querySelector('table');
    expect(table).toBeNull();

    // Parent changes prop back to expanded
    rerender(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        fileCollapsed={false}
      />
    );

    // Should be expanded again
    table = container.querySelector('table');
    expect(table).not.toBeNull();
  });

  it('should handle fileCollapsed=false as controlled mode (not undefined)', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        fileCollapsed={false}
        onFileCollapseChange={handleChange}
      />
    );

    const banner = container.querySelector('[role="button"]');
    fireEvent.click(banner!);

    // Should fire callback (controlled mode)
    expect(handleChange).toHaveBeenCalledWith(true);

    // Should NOT update internal state
    const table = container.querySelector('table');
    expect(table).not.toBeNull(); // Still showing
  });

  it('should show correct aria-label based on fileCollapsed prop', () => {
    const { container, rerender } = render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        fileCollapsed={true}
      />
    );

    // Check the banner aria-label
    const banner = container.querySelector('[role="button"]');
    expect(banner?.getAttribute('aria-label')).toBe('Expand file diff');

    rerender(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        fileCollapsed={false}
      />
    );

    const banner2 = container.querySelector('[role="button"]');
    expect(banner2?.getAttribute('aria-label')).toBe('Collapse file diff');
  });

  it('should disable expand/collapse all button when fileCollapsed is true', () => {
    const { container } = render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        fileCollapsed={true}
      />
    );

    // Find the expand/collapse all button (only button in the summary banner)
    const banner = container.querySelector('[role="button"]');
    const buttons = banner?.querySelectorAll('button');
    const allExpandButton = buttons?.[0]; // The expand/collapse all button
    expect(allExpandButton?.hasAttribute('disabled')).toBe(true);
  });

  it('should support keyboard interaction on banner', () => {
    const { container } = render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        initiallyFileCollapsed={false}
      />
    );

    const banner = container.querySelector('[role="button"]');

    // Verify banner is keyboard accessible
    expect(banner?.getAttribute('tabIndex')).toBe('0');
    expect(banner?.getAttribute('role')).toBe('button');

    // Test Enter key
    fireEvent.keyDown(banner!, { key: 'Enter' });
    let table = container.querySelector('table');
    expect(table).toBeNull(); // File should collapse

    // Test Space key
    fireEvent.keyDown(banner!, { key: ' ' });
    table = container.querySelector('table');
    expect(table).not.toBeNull(); // File should expand
  });
});

describe('File Collapse - Uncontrolled Mode (Backward Compatibility)', () => {
  it('should work in uncontrolled mode with initiallyFileCollapsed', () => {
    const { container } = render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        initiallyFileCollapsed={true}
      />
    );

    // Should start collapsed
    let table = container.querySelector('table');
    expect(table).toBeNull();

    // Click to expand
    const banner = container.querySelector('[role="button"]');
    fireEvent.click(banner!);

    // Should now be expanded
    table = container.querySelector('table');
    expect(table).not.toBeNull();
  });

  it('should update internal state in uncontrolled mode', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        initiallyFileCollapsed={false}
        onFileCollapseChange={handleChange}
      />
    );

    const banner = container.querySelector('[role="button"]');
    fireEvent.click(banner!);

    // Callback should fire
    expect(handleChange).toHaveBeenCalledWith(true);

    // State should update immediately
    const table = container.querySelector('table');
    expect(table).toBeNull();
  });

  it('should toggle multiple times in uncontrolled mode', () => {
    const { container } = render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        initiallyFileCollapsed={false}
      />
    );

    const banner = container.querySelector('[role="button"]');

    // Start expanded
    let table = container.querySelector('table');
    expect(table).not.toBeNull();

    // Click to collapse
    fireEvent.click(banner!);
    table = container.querySelector('table');
    expect(table).toBeNull();

    // Click to expand
    fireEvent.click(banner!);
    table = container.querySelector('table');
    expect(table).not.toBeNull();

    // Click to collapse again
    fireEvent.click(banner!);
    table = container.querySelector('table');
    expect(table).toBeNull();
  });
});

describe('File Collapse - Mode Detection', () => {
  it('should prefer fileCollapsed over initiallyFileCollapsed', () => {
    const { container } = render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        fileCollapsed={true}
        initiallyFileCollapsed={false}
      />
    );

    // Should use fileCollapsed (true), not initiallyFileCollapsed (false)
    const table = container.querySelector('table');
    expect(table).toBeNull();
  });

  it('should warn when both fileCollapsed and initiallyFileCollapsed are provided', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        fileCollapsed={true}
        initiallyFileCollapsed={false}
      />
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Both `fileCollapsed` and `initiallyFileCollapsed` provided')
    );

    consoleSpy.mockRestore();
  });

  it('should warn when fileCollapsed is provided without onFileCollapseChange', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        fileCollapsed={true}
      />
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('`fileCollapsed` provided without `onFileCollapseChange` handler')
    );

    consoleSpy.mockRestore();
  });

  it('should NOT warn in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        fileCollapsed={true}
        initiallyFileCollapsed={false}
      />
    );

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });
});

describe('File Collapse - Edge Cases', () => {
  it('should handle switching from uncontrolled to controlled mode', () => {
    const { container, rerender } = render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        initiallyFileCollapsed={true}
      />
    );

    // Start in uncontrolled mode, collapsed
    let table = container.querySelector('table');
    expect(table).toBeNull();

    // Switch to controlled mode, expanded
    rerender(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        fileCollapsed={false}
      />
    );

    // Should sync to new controlled state
    table = container.querySelector('table');
    expect(table).not.toBeNull();
  });

  it('should handle rapid prop changes in controlled mode', () => {
    const { container, rerender } = render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        fileCollapsed={false}
      />
    );

    // Rapidly toggle
    rerender(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        fileCollapsed={true}
      />
    );

    rerender(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        fileCollapsed={false}
      />
    );

    rerender(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        fileCollapsed={true}
      />
    );

    // Should end up collapsed
    const table = container.querySelector('table');
    expect(table).toBeNull();
  });

  it('should work in controlled mode without onFileCollapseChange (read-only)', () => {
    const { container } = render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        fileCollapsed={true}
      />
    );

    // Should start collapsed
    let table = container.querySelector('table');
    expect(table).toBeNull();

    // Click banner
    const banner = container.querySelector('[role="button"]');
    fireEvent.click(banner!);

    // Should stay collapsed (no callback, no state update)
    table = container.querySelector('table');
    expect(table).toBeNull();
  });
});
