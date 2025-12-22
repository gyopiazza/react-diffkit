/**
 * @vitest-environment happy-dom
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DiffViewer from "../src/index";

const oldCode = `const a = 123\nconst b = 456`;
const newCode = `const a = 123\nconst b = 789\nconst c = 999`;

describe("Collapsed State Feature", (): void => {
  it("should render full diff when initiallyCollapsed is undefined", (): void => {
    const { container } = render(
      <DiffViewer oldValue={oldCode} newValue={newCode} />,
    );

    // Should show the diff table rows (more than just the placeholder)
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBeGreaterThan(1);
  });

  it("should render full diff when initiallyCollapsed is false", (): void => {
    const { container } = render(
      <DiffViewer oldValue={oldCode} newValue={newCode} initiallyCollapsed={false} />,
    );

    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBeGreaterThan(1);
  });

  it("should render collapsed placeholder when initiallyCollapsed is true", (): void => {
    const { container } = render(
      <DiffViewer oldValue={oldCode} newValue={newCode} initiallyCollapsed={true} />,
    );

    // Should show only the placeholder row
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(1);

    // Should show expand button
    const expandButton = screen.getByRole("button", { name: /load diff/i });
    expect(expandButton).toBeTruthy();
  });

  it("should expand diff internally when expand button is clicked", (): void => {
    const { container } = render(
      <DiffViewer
        oldValue={oldCode}
        newValue={newCode}
        initiallyCollapsed={true}
      />,
    );

    // Should initially show only placeholder
    let rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(1);

    const expandButton = container.querySelector('button[aria-label="Load diff"]');
    fireEvent.click(expandButton!);

    // Should now show full diff with multiple rows
    rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBeGreaterThan(1);
  });

  it("should always show summary banner regardless of collapsed state", (): void => {
    const { rerender, container } = render(
      <DiffViewer oldValue={oldCode} newValue={newCode} initiallyCollapsed={false} />,
    );

    let banner = container.querySelector('[role="banner"]');
    expect(banner).toBeTruthy();

    rerender(
      <DiffViewer oldValue={oldCode} newValue={newCode} initiallyCollapsed={true} />,
    );

    banner = container.querySelector('[role="banner"]');
    expect(banner).toBeTruthy();
  });

  it("should use custom collapsedMessageRenderer when provided", (): void => {
    const customRenderer = (totalChanges: number) => (
      <span>Custom message: {totalChanges} changes</span>
    );

    render(
      <DiffViewer
        oldValue={oldCode}
        newValue={newCode}
        initiallyCollapsed={true}
        collapsedMessageRenderer={customRenderer}
      />,
    );

    expect(screen.getByText(/Custom message:/i)).toBeTruthy();
  });

  it("should disable fold/expand all button when collapsed", (): void => {
    const { container } = render(
      <DiffViewer
        oldValue={oldCode}
        newValue={newCode}
        initiallyCollapsed={true}
        showDiffOnly={true}
      />,
    );

    // The fold/expand all button should be disabled
    const banner = container.querySelector('[role="banner"]');
    const foldButton = banner?.querySelector("button");
    expect(foldButton?.disabled).toBe(true);
  });

  it("should work in both split and inline view", (): void => {
    const { rerender, container } = render(
      <DiffViewer
        oldValue={oldCode}
        newValue={newCode}
        initiallyCollapsed={true}
        splitView={true}
      />,
    );

    let expandButton = container.querySelector('button[aria-label="Load diff"]');
    expect(expandButton).toBeTruthy();

    rerender(
      <DiffViewer
        oldValue={oldCode}
        newValue={newCode}
        initiallyCollapsed={true}
        splitView={false}
      />,
    );

    expandButton = container.querySelector('button[aria-label="Load diff"]');
    expect(expandButton).toBeTruthy();
  });

  it("should handle keyboard navigation", (): void => {
    const { container } = render(
      <DiffViewer
        oldValue={oldCode}
        newValue={newCode}
        initiallyCollapsed={true}
      />,
    );

    const expandButton = container.querySelector('button[aria-label="Load diff"]') as HTMLButtonElement;

    // Focus the button
    expandButton.focus();
    expect(document.activeElement).toBe(expandButton);

    // Button should have tabIndex set
    expect(expandButton.tabIndex).toBe(0);
  });

  it("should work with renderGutter option", (): void => {
    const customGutter = () => <div>Gutter</div>;

    const { container } = render(
      <DiffViewer
        oldValue={oldCode}
        newValue={newCode}
        initiallyCollapsed={true}
        renderGutter={customGutter}
      />,
    );

    // Should still render the collapsed placeholder
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(1);

    const expandButton = container.querySelector('button[aria-label="Load diff"]');
    expect(expandButton).toBeTruthy();
  });

  it("should work with hideLineNumbers option", (): void => {
    const { container } = render(
      <DiffViewer
        oldValue={oldCode}
        newValue={newCode}
        initiallyCollapsed={true}
        hideLineNumbers={true}
      />,
    );

    // Should still render the collapsed placeholder
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(1);

    const expandButton = container.querySelector('button[aria-label="Load diff"]');
    expect(expandButton).toBeTruthy();
  });

  it("should display collapsedMessage when provided", (): void => {
    render(
      <DiffViewer
        oldValue={oldCode}
        newValue={newCode}
        initiallyCollapsed={true}
        collapsedMessage="This file was deleted"
      />,
    );

    expect(screen.getByText("This file was deleted")).toBeTruthy();
  });

  it("should support ReactElement as collapsedMessage", (): void => {
    render(
      <DiffViewer
        oldValue={oldCode}
        newValue={newCode}
        initiallyCollapsed={true}
        collapsedMessage={<span data-testid="custom-message">Large file</span>}
      />,
    );

    const messageElement = screen.getByTestId("custom-message");
    expect(messageElement).toBeTruthy();
    expect(messageElement.textContent).toBe("Large file");
  });

  it("should not display message when collapsedMessage is not provided", (): void => {
    const { container } = render(
      <DiffViewer
        oldValue={oldCode}
        newValue={newCode}
        initiallyCollapsed={true}
      />,
    );

    // Should only have the expand button, no additional message
    const td = container.querySelector("td");
    const children = td?.children;
    expect(children?.length).toBe(1); // Only the button
  });
});
