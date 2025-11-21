/**
 * @vitest-environment happy-dom
 */

import { render } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it } from "vitest";
import DiffViewer from "../src/index";

describe("Testing pre-rendered HTML content feature", () => {
  it("Should use pre-rendered HTML for unchanged lines", () => {
    const oldCode = "const foo = 'bar';\nconst same = 'value';";
    const newCode = "const baz = 'qux';\nconst same = 'value';";

    // Pre-rendered HTML strings with syntax highlighting
    const oldRenderedLines =
      '<span class="keyword">const</span> foo = <span class="string">\'bar\';</span>\n<span class="keyword">const</span> same = <span class="string">\'value\';</span>';
    const newRenderedLines =
      '<span class="keyword">const</span> baz = <span class="string">\'qux\';</span>\n<span class="keyword">const</span> same = <span class="string">\'value\';</span>';

    const { container } = render(
      <DiffViewer
        oldValue={oldCode}
        newValue={newCode}
        oldRenderedLines={oldRenderedLines}
        newRenderedLines={newRenderedLines}
        splitView={true}
        showDiffOnly={false}
      />,
    );

    // Verify syntax highlighting classes are present
    const htmlContent = container.innerHTML;
    expect(htmlContent).toContain('class="keyword"');
    expect(htmlContent).toContain('class="string"');
  });

  it("Should work without pre-rendered content (backward compatibility)", () => {
    const oldCode = "const foo = 'bar';";
    const newCode = "const baz = 'qux';";

    const { container } = render(
      <DiffViewer oldValue={oldCode} newValue={newCode} splitView={true} />,
    );

    // Should render a table
    const table = container.querySelector("table");
    expect(table).toBeTruthy();

    // Should show diff content
    const content = container.textContent || "";
    expect(content).toContain("foo");
    expect(content).toContain("baz");
  });

  it("Should handle multiline pre-rendered HTML", () => {
    const oldCode = "line1\nline2\nline3";
    const newCode = "line1\nline2\nline3";

    const oldRenderedLines =
      '<span class="line">line1</span>\n<span class="line">line2</span>\n<span class="line">line3</span>';
    const newRenderedLines =
      '<span class="highlight">line1</span>\n<span class="highlight">line2</span>\n<span class="highlight">line3</span>';

    const { container } = render(
      <DiffViewer
        oldValue={oldCode}
        newValue={newCode}
        oldRenderedLines={oldRenderedLines}
        newRenderedLines={newRenderedLines}
        splitView={true}
        showDiffOnly={false}
      />,
    );

    // Check that both sets of classes are present
    const htmlContent = container.innerHTML;
    expect(htmlContent).toContain('class="line"');
    expect(htmlContent).toContain('class="highlight"');
  });

  it("Should use word diff for changed lines, not pre-rendered HTML", () => {
    const oldCode = "const foo = 'bar';";
    const newCode = "const baz = 'qux';";

    const oldRenderedLines =
      '<span class="custom-style"><span class="keyword">const</span> foo = <span class="string">\'bar\';</span></span>';
    const newRenderedLines =
      '<span class="custom-style"><span class="keyword">const</span> baz = <span class="string">\'qux\';</span></span>';

    const { container } = render(
      <DiffViewer
        oldValue={oldCode}
        newValue={newCode}
        oldRenderedLines={oldRenderedLines}
        newRenderedLines={newRenderedLines}
        splitView={true}
        showDiffOnly={false}
      />,
    );

    // Should show word-level diffs (ins/del tags)
    const insertions = container.querySelectorAll("ins");
    const deletions = container.querySelectorAll("del");

    // Changed lines should use word diff, not custom pre-rendered HTML
    expect(insertions.length).toBeGreaterThan(0);
    expect(deletions.length).toBeGreaterThan(0);
  });

  it("Should correctly split HTML by newlines", () => {
    const oldCode = "line1\nline2\nline3";
    const newCode = "line1\nline2\nline3";

    // HTML with nested tags across multiple lines
    const oldRenderedLines =
      '<span class="a">line1</span>\n<span class="b"><span class="c">line2</span></span>\n<span class="d">line3</span>';
    const newRenderedLines =
      '<span class="a">line1</span>\n<span class="b"><span class="c">line2</span></span>\n<span class="d">line3</span>';

    const { container } = render(
      <DiffViewer
        oldValue={oldCode}
        newValue={newCode}
        oldRenderedLines={oldRenderedLines}
        newRenderedLines={newRenderedLines}
        splitView={true}
        showDiffOnly={false}
      />,
    );

    // All classes should be present
    const htmlContent = container.innerHTML;
    expect(htmlContent).toContain('class="a"');
    expect(htmlContent).toContain('class="b"');
    expect(htmlContent).toContain('class="c"');
    expect(htmlContent).toContain('class="d"');
  });
});
