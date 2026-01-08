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

  it("Should handle continuous HTML format (highlight.js style)", () => {
    const oldCode = "const foo = 'bar';\nconst baz = 'qux';";
    const newCode = "const foo = 'bar';\nconst baz = 'qux';";

    // Continuous HTML like highlight.js outputs (wrapped in <code> tag)
    const oldRenderedLines =
      '<code class="hljs"><span class="hljs-keyword">const</span> foo = <span class="hljs-string">\'bar\'</span>;\n<span class="hljs-keyword">const</span> baz = <span class="hljs-string">\'qux\'</span>;</code>';
    const newRenderedLines =
      '<code class="hljs"><span class="hljs-keyword">const</span> foo = <span class="hljs-string">\'bar\'</span>;\n<span class="hljs-keyword">const</span> baz = <span class="hljs-string">\'qux\'</span>;</code>';

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
    expect(htmlContent).toContain("hljs-keyword");
    expect(htmlContent).toContain("hljs-string");

    // Verify wrapper tag is stripped (should not contain <code> tag)
    expect(htmlContent).not.toContain('<code class="hljs"');
  });

  it("Should handle spans crossing multiple lines in continuous HTML", () => {
    const oldCode = "// Comment line 1\n// Comment line 2";
    const newCode = "// Comment line 1\n// Comment line 2";

    // Simulate a multi-line comment span (like highlight.js might produce)
    const oldRenderedLines =
      '<code><span class="hljs-comment">// Comment line 1\n// Comment line 2</span></code>';
    const newRenderedLines =
      '<code><span class="hljs-comment">// Comment line 1\n// Comment line 2</span></code>';

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

    // Both lines should have the comment class
    const htmlContent = container.innerHTML;
    const commentMatches = htmlContent.match(/hljs-comment/g);
    expect(commentMatches).toBeTruthy();
    expect(commentMatches!.length).toBeGreaterThanOrEqual(2);
  });

  it("Should handle continuous HTML with word diff", () => {
    const oldCode = "const foo = 'old';";
    const newCode = "const foo = 'new';";

    // Continuous HTML format
    const oldRenderedLines =
      '<code class="hljs"><span class="hljs-keyword">const</span> foo = <span class="hljs-string">\'old\'</span>;</code>';
    const newRenderedLines =
      '<code class="hljs"><span class="hljs-keyword">const</span> foo = <span class="hljs-string">\'new\'</span>;</code>';

    const { container } = render(
      <DiffViewer
        oldValue={oldCode}
        newValue={newCode}
        oldRenderedLines={oldRenderedLines}
        newRenderedLines={newRenderedLines}
        splitView={true}
        disableWordDiff={false}
      />,
    );

    // Should have word-level diffs with syntax highlighting preserved
    const htmlContent = container.innerHTML;
    expect(htmlContent).toContain("hljs-keyword");
    expect(htmlContent).toContain("hljs-string");

    // Should have ins/del tags for word diff
    const insertions = container.querySelectorAll("ins");
    const deletions = container.querySelectorAll("del");
    expect(insertions.length).toBeGreaterThan(0);
    expect(deletions.length).toBeGreaterThan(0);
  });

  it("Should handle mixed continuous HTML with nested elements", () => {
    const oldCode = "function test() {}";
    const newCode = "function test() {}";

    // Complex nested structure like highlight.js produces
    const oldRenderedLines =
      '<code><span class="hljs-keyword">function</span> <span class="hljs-title">test</span>() {}</code>';
    const newRenderedLines =
      '<code><span class="hljs-keyword">function</span> <span class="hljs-title">test</span>() {}</code>';

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

    const htmlContent = container.innerHTML;
    expect(htmlContent).toContain("hljs-keyword");
    expect(htmlContent).toContain("hljs-title");
  });
});

describe("Testing word-level diff with HTML highlighting (substring bug fix)", () => {
  it("Should correctly highlight word that is substring of another word", () => {
    // This tests the bug where "option" was incorrectly highlighted as "option.avatarU"
    // instead of highlighting "selectedOption"
    const oldCode = "!selectedOption.avatarUrl";
    const newCode = "!option.avatarUrl";

    const oldRenderedLines =
      '!<span class="var">selectedOption</span>.<span class="prop">avatarUrl</span>';
    const newRenderedLines =
      '!<span class="var">option</span>.<span class="prop">avatarUrl</span>';

    const { container } = render(
      <DiffViewer
        oldValue={oldCode}
        newValue={newCode}
        oldRenderedLines={oldRenderedLines}
        newRenderedLines={newRenderedLines}
        splitView={true}
        disableWordDiff={false}
        compareMethod="diffWords"
      />,
    );

    const htmlContent = container.innerHTML;

    // The removed line should have "selectedOption" highlighted, not "option.avatarU"
    const deletions = container.querySelectorAll("del");
    let foundCorrectDeletion = false;
    deletions.forEach((del) => {
      if (del.textContent?.includes("selectedOption")) {
        foundCorrectDeletion = true;
      }
    });
    expect(foundCorrectDeletion).toBe(true);

    // The added line should have "option" highlighted correctly
    const insertions = container.querySelectorAll("ins");
    let foundCorrectInsertion = false;
    insertions.forEach((ins) => {
      if (ins.textContent === "option") {
        foundCorrectInsertion = true;
      }
    });
    expect(foundCorrectInsertion).toBe(true);

    // Syntax highlighting should be preserved
    expect(htmlContent).toContain('class="var"');
    expect(htmlContent).toContain('class="prop"');
  });

  it("Should handle complex JSX with nested syntax highlighting", () => {
    // Real-world example from the bug report
    const oldCode =
      "<span className={clsx(!selectedOption.avatarUrl && 'ml-1')}>{selectedOption.label}</span>";
    const newCode =
      "<span className={clsx(!option.avatarUrl && 'ml-1')}>{option.label}</span>";

    const oldRenderedLines =
      '<span class="tag">&lt;span</span> <span class="attr">className</span>={<span class="fn">clsx</span>(!<span class="var">selectedOption</span>.<span class="prop">avatarUrl</span> &amp;&amp; <span class="str">\'ml-1\'</span>)}&gt;{<span class="var">selectedOption</span>.<span class="prop">label</span>}<span class="tag">&lt;/span&gt;</span>';
    const newRenderedLines =
      '<span class="tag">&lt;span</span> <span class="attr">className</span>={<span class="fn">clsx</span>(!<span class="var">option</span>.<span class="prop">avatarUrl</span> &amp;&amp; <span class="str">\'ml-1\'</span>)}&gt;{<span class="var">option</span>.<span class="prop">label</span>}<span class="tag">&lt;/span&gt;</span>';

    const { container } = render(
      <DiffViewer
        oldValue={oldCode}
        newValue={newCode}
        oldRenderedLines={oldRenderedLines}
        newRenderedLines={newRenderedLines}
        splitView={true}
        disableWordDiff={false}
        compareMethod="diffWords"
      />,
    );

    const htmlContent = container.innerHTML;

    // Both occurrences of "selectedOption" should be in deletions
    const deletions = container.querySelectorAll("del");
    let selectedOptionCount = 0;
    deletions.forEach((del) => {
      if (del.textContent?.includes("selectedOption")) {
        selectedOptionCount++;
      }
    });
    expect(selectedOptionCount).toBeGreaterThanOrEqual(2);

    // Both occurrences of "option" should be in insertions
    const insertions = container.querySelectorAll("ins");
    let optionCount = 0;
    insertions.forEach((ins) => {
      if (ins.textContent === "option") {
        optionCount++;
      }
    });
    expect(optionCount).toBeGreaterThanOrEqual(2);

    // Syntax highlighting should be preserved
    expect(htmlContent).toContain('class="var"');
    expect(htmlContent).toContain('class="prop"');
    expect(htmlContent).toContain('class="tag"');
    expect(htmlContent).toContain('class="attr"');
  });

  it("Should handle repeated words correctly", () => {
    const oldCode = "test test test";
    const newCode = "test best test";

    const oldRenderedLines =
      '<span class="w">test</span> <span class="w">test</span> <span class="w">test</span>';
    const newRenderedLines =
      '<span class="w">test</span> <span class="w">best</span> <span class="w">test</span>';

    const { container } = render(
      <DiffViewer
        oldValue={oldCode}
        newValue={newCode}
        oldRenderedLines={oldRenderedLines}
        newRenderedLines={newRenderedLines}
        splitView={true}
        disableWordDiff={false}
        compareMethod="diffWords"
      />,
    );

    // Should only highlight the middle word change
    const deletions = container.querySelectorAll("del");
    const insertions = container.querySelectorAll("ins");

    // Should have exactly one deletion (second "test")
    let testDeletionCount = 0;
    deletions.forEach((del) => {
      if (del.textContent === "test") {
        testDeletionCount++;
      }
    });
    expect(testDeletionCount).toBe(1);

    // Should have exactly one insertion ("best")
    let bestInsertionCount = 0;
    insertions.forEach((ins) => {
      if (ins.textContent === "best") {
        bestInsertionCount++;
      }
    });
    expect(bestInsertionCount).toBe(1);
  });

  it("Should handle edge case with empty tokens gracefully", () => {
    const oldCode = "foo bar";
    const newCode = "foo baz";

    const oldRenderedLines =
      '<span class="x">foo</span> <span class="y">bar</span>';
    const newRenderedLines =
      '<span class="x">foo</span> <span class="y">baz</span>';

    const { container } = render(
      <DiffViewer
        oldValue={oldCode}
        newValue={newCode}
        oldRenderedLines={oldRenderedLines}
        newRenderedLines={newRenderedLines}
        splitView={true}
        disableWordDiff={false}
        compareMethod="diffWords"
      />,
    );

    // Should render without crashing
    const htmlContent = container.innerHTML;
    expect(htmlContent).toContain('class="x"');
    expect(htmlContent).toContain('class="y"');

    // Should have proper word diff
    const deletions = container.querySelectorAll("del");
    const insertions = container.querySelectorAll("ins");
    expect(deletions.length).toBeGreaterThan(0);
    expect(insertions.length).toBeGreaterThan(0);
  });
});
