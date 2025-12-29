/**
 * @vitest-environment happy-dom
 */

import { describe, expect, it } from "vitest";
import {
  isContinuousHTML,
  processRenderedLines,
  splitContinuousHTML,
} from "../src/split-highlighted-html";

describe("split-highlighted-html utilities", () => {
  describe("isContinuousHTML", () => {
    it("should detect continuous HTML with <code> wrapper", () => {
      const html = '<code class="hljs">const foo = "bar";</code>';
      expect(isContinuousHTML(html)).toBe(true);
    });

    it("should detect continuous HTML with <pre> wrapper", () => {
      const html = '<pre class="language-js">const foo = "bar";</pre>';
      expect(isContinuousHTML(html)).toBe(true);
    });

    it("should detect continuous HTML with wrapper tags", () => {
      const html =
        '<span class="keyword">const</span> foo;\n<span class="keyword">let</span> bar;';
      // No wrapper tags, so should be false
      expect(isContinuousHTML(html)).toBe(false);

      const continuousHtml = '<code><span class="comment">// line 1\nline 2</span></code>';
      expect(isContinuousHTML(continuousHtml)).toBe(true);
    });

    it("should return false for line-separated HTML", () => {
      const html =
        '<span class="keyword">const</span> foo;\n<span class="keyword">let</span> bar;';
      expect(isContinuousHTML(html)).toBe(false);
    });

    it("should return false for empty or invalid input", () => {
      expect(isContinuousHTML("")).toBe(false);
      expect(isContinuousHTML(null as any)).toBe(false);
      expect(isContinuousHTML(undefined as any)).toBe(false);
    });

    it("should return false for single line HTML", () => {
      const html = '<span class="keyword">const</span> foo;';
      expect(isContinuousHTML(html)).toBe(false);
    });
  });

  describe("splitContinuousHTML", () => {
    it("should split simple continuous HTML", () => {
      const html =
        '<code><span class="keyword">const</span> foo;\n<span class="keyword">let</span> bar;</code>';
      const lines = splitContinuousHTML(html);

      expect(lines).toHaveLength(2);
      expect(lines[0]).toContain('class="keyword"');
      expect(lines[0]).toContain("const");
      expect(lines[0]).toContain("foo");
      expect(lines[1]).toContain('class="keyword"');
      expect(lines[1]).toContain("let");
      expect(lines[1]).toContain("bar");
    });

    it("should handle spans crossing multiple lines", () => {
      const html =
        '<code><span class="comment">// Comment line 1\n// Comment line 2</span></code>';
      const lines = splitContinuousHTML(html);

      expect(lines).toHaveLength(2);
      // Both lines should have the comment class
      expect(lines[0]).toContain('class="comment"');
      expect(lines[0]).toContain("Comment line 1");
      expect(lines[1]).toContain('class="comment"');
      expect(lines[1]).toContain("Comment line 2");
    });

    it("should strip wrapper elements", () => {
      const html =
        '<code class="hljs"><span class="hljs-keyword">const</span> foo;</code>';
      const lines = splitContinuousHTML(html);

      expect(lines).toHaveLength(1);
      // Should not contain the <code> wrapper
      expect(lines[0]).not.toContain("<code");
      // Should contain the span with class
      expect(lines[0]).toContain('class="hljs-keyword"');
      expect(lines[0]).toContain("const");
    });

    it("should handle nested spans", () => {
      const html =
        '<code><span class="outer"><span class="inner">text</span></span>\nsecond line</code>';
      const lines = splitContinuousHTML(html);

      expect(lines).toHaveLength(2);
      expect(lines[0]).toContain('class="outer"');
      expect(lines[0]).toContain('class="inner"');
      expect(lines[0]).toContain("text");
      expect(lines[1]).toContain("second line");
    });

    it("should handle empty lines", () => {
      const html = "<code>line1\n\nline3</code>";
      const lines = splitContinuousHTML(html);

      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe("line1");
      expect(lines[1]).toBe("");
      expect(lines[2]).toBe("line3");
    });

    it("should handle complex highlight.js output", () => {
      const html =
        '<code class="hljs language-javascript"><span class="hljs-keyword">function</span> <span class="hljs-title">test</span>() {\n  <span class="hljs-keyword">return</span> <span class="hljs-number">42</span>;\n}</code>';
      const lines = splitContinuousHTML(html);

      expect(lines).toHaveLength(3);
      expect(lines[0]).toContain("function");
      expect(lines[0]).toContain("test");
      expect(lines[1]).toContain("return");
      expect(lines[1]).toContain("42");
      expect(lines[2]).toContain("}");
    });

    it("should preserve attributes in duplicated tags", () => {
      const html =
        '<code><span class="comment" data-line="1">// line 1\n// line 2</span></code>';
      const lines = splitContinuousHTML(html);

      expect(lines).toHaveLength(2);
      // Both lines should have the span with attributes
      expect(lines[0]).toContain('class="comment"');
      expect(lines[1]).toContain('class="comment"');
    });

    it("should return empty array for empty input", () => {
      expect(splitContinuousHTML("")).toEqual([]);
      expect(splitContinuousHTML(null as any)).toEqual([]);
    });
  });

  describe("processRenderedLines", () => {
    it("should use splitContinuousHTML for continuous HTML", () => {
      const html =
        '<code><span class="keyword">const</span> foo;\n<span class="keyword">let</span> bar;</code>';
      const lines = processRenderedLines(html);

      expect(lines).toHaveLength(2);
      expect(lines[0]).toContain("const");
      expect(lines[1]).toContain("let");
    });

    it("should use simple split for line-separated HTML", () => {
      const html =
        '<span class="keyword">const</span> foo;\n<span class="keyword">let</span> bar;';
      const lines = processRenderedLines(html);

      expect(lines).toHaveLength(2);
      expect(lines[0]).toBe('<span class="keyword">const</span> foo;');
      expect(lines[1]).toBe('<span class="keyword">let</span> bar;');
    });

    it("should return empty array for undefined input", () => {
      expect(processRenderedLines(undefined)).toEqual([]);
      expect(processRenderedLines("")).toEqual([]);
    });

    it("should handle mixed content appropriately", () => {
      // Line-separated format
      const lineSeparated =
        '<span class="a">line1</span>\n<span class="b">line2</span>';
      const linesFromSeparated = processRenderedLines(lineSeparated);
      expect(linesFromSeparated).toHaveLength(2);

      // Continuous format
      const continuous = '<code><span class="a">line1\nline2</span></code>';
      const linesFromContinuous = processRenderedLines(continuous);
      expect(linesFromContinuous).toHaveLength(2);
    });
  });

  describe("Edge cases", () => {
    it("should handle self-closing tags", () => {
      const html = "<code>line1<br/>line2</code>";
      const lines = splitContinuousHTML(html);

      // Note: DOMParser might normalize this differently
      expect(lines.length).toBeGreaterThan(0);
    });

    it("should handle HTML entities", () => {
      const html = '<code><span>&lt;div&gt;</span>\n<span>&amp;</span></code>';
      const lines = splitContinuousHTML(html);

      expect(lines).toHaveLength(2);
      // HTML entities should be preserved in the output
      // This ensures that syntax-highlighted code like <div> doesn't get interpreted as HTML
      expect(lines[0]).toContain("&lt;div&gt;");
      expect(lines[1]).toContain("&amp;");
    });

    it("should handle deeply nested structures", () => {
      const html =
        '<code><span class="a"><span class="b"><span class="c">text\nmore text</span></span></span></code>';
      const lines = splitContinuousHTML(html);

      expect(lines).toHaveLength(2);
      // All nested classes should be preserved on both lines
      expect(lines[0]).toContain('class="a"');
      expect(lines[0]).toContain('class="b"');
      expect(lines[0]).toContain('class="c"');
      expect(lines[1]).toContain('class="a"');
      expect(lines[1]).toContain('class="b"');
      expect(lines[1]).toContain('class="c"');
    });

    it("should handle multiple wrapper elements", () => {
      const html =
        '<pre><code class="hljs"><span class="keyword">const</span> foo;</code></pre>';
      const lines = splitContinuousHTML(html);

      expect(lines).toHaveLength(1);
      // Both wrappers should be stripped
      expect(lines[0]).not.toContain("<pre");
      expect(lines[0]).not.toContain("<code");
      expect(lines[0]).toContain('class="keyword"');
    });
  });
});
