/**
 * @vitest-environment happy-dom
 */

import { render } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it } from "vitest";

import DiffViewer from "../src/index";

describe("alignLineNumbers prop", (): void => {
  const oldValue = "line 1\nline 2\nline 3";
  const newValue = "line 1\nline 3";

  it("should render only one line number column per row in inline view with alignLineNumbers=true", (): void => {
    const { container } = render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        splitView={false}
        alignLineNumbers={true}
      />,
    );

    // Get all table cells
    const allCells = container.querySelectorAll('tbody tr td');

    // Each content row in inline view with alignLineNumbers should have:
    // 1 gutter (line number) + 1 marker + 1 content = 3 cells
    // Without alignLineNumbers it would have: 2 gutters + 1 marker + 1 content = 4 cells

    // Look for rows with content (not header/fold rows)
    const contentRows = Array.from(container.querySelectorAll('tbody tr')).filter(row => {
      const cells = row.querySelectorAll('td');
      // Content rows have multiple cells and a marker column
      return cells.length >= 3 && row.querySelector('pre');
    });

    expect(contentRows.length).toBeGreaterThan(0);

    // Check first content row
    const firstRow = contentRows[0];
    const cells = firstRow.querySelectorAll('td');

    // With alignLineNumbers, should have 3 cells (1 gutter + 1 marker + 1 content)
    expect(cells.length).toBe(3);
  });

  it("should render two line number columns per row in inline view without alignLineNumbers", (): void => {
    const { container } = render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        splitView={false}
        alignLineNumbers={false}
      />,
    );

    // Look for rows with content
    const contentRows = Array.from(container.querySelectorAll('tbody tr')).filter(row => {
      const cells = row.querySelectorAll('td');
      return cells.length >= 3 && row.querySelector('pre');
    });

    expect(contentRows.length).toBeGreaterThan(0);

    // Check first content row
    const firstRow = contentRows[0];
    const cells = firstRow.querySelectorAll('td');

    // Without alignLineNumbers, should have 4 cells (2 gutters + 1 marker + 1 content)
    expect(cells.length).toBe(4);
  });

  it("should display left line number for removed lines with alignLineNumbers", (): void => {
    const { container } = render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        splitView={false}
        alignLineNumbers={true}
      />,
    );

    // Find row with minus marker (removed line)
    const rows = Array.from(container.querySelectorAll('tbody tr'));
    const removedRow = rows.find(row => {
      const cells = row.querySelectorAll('td');
      // Look for marker cell (second cell in inline view) with '-'
      if (cells.length >= 3) {
        const markerCell = cells[1]; // marker is the second cell
        return markerCell?.textContent?.includes('-');
      }
      return false;
    });

    expect(removedRow).toBeTruthy();

    if (removedRow) {
      // First cell should be the line number gutter
      const firstCell = removedRow.querySelector('td');
      const lineNumber = firstCell?.querySelector('pre');

      // Should show line 2 (the removed line)
      expect(lineNumber?.textContent).toBe('2');
    }
  });

  it("should not affect split view (should still have 2 gutters per row)", (): void => {
    const { container } = render(
      <DiffViewer
        oldValue={oldValue}
        newValue={newValue}
        splitView={true}
        alignLineNumbers={true}
      />,
    );

    // Look for content rows
    const contentRows = Array.from(container.querySelectorAll('tbody tr')).filter(row => {
      const cells = row.querySelectorAll('td');
      return cells.length >= 3 && row.querySelector('pre');
    });

    expect(contentRows.length).toBeGreaterThan(0);

    // In split view, each row should have 6 cells:
    // Left: 1 gutter + 1 marker + 1 content
    // Right: 1 gutter + 1 marker + 1 content
    const firstRow = contentRows[0];
    const cells = firstRow.querySelectorAll('td');

    expect(cells.length).toBe(6);
  });
});
