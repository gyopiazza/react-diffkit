/**
 * @vitest-environment happy-dom
 */

import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import {
  type ChangeRange,
  type DiffTagClasses,
  mergeHTMLWithDiff,
} from "../src/merge-highlighted-html.js";

describe("CSS Classes in Diff Tags", () => {
  it("Should apply CSS classes to ins tags", () => {
    const html = '<span class="token keyword">const</span> foo = bar';
    const changes: ChangeRange[] = [{ start: 0, end: 5, type: "added" }];
    const cssClasses: DiffTagClasses = {
      wordDiff: "word-diff-class",
      wordAdded: "word-added-class",
    };

    const elements = mergeHTMLWithDiff(html, changes, cssClasses);
    const { container } = render(elements);

    // Find the ins tag
    const insTag = container.querySelector("ins");
    expect(insTag).toBeTruthy();
    expect(insTag?.className).toContain("word-diff-class");
    expect(insTag?.className).toContain("word-added-class");
  });

  it("Should apply CSS classes to del tags", () => {
    const html = '<span class="token keyword">const</span> foo = bar';
    const changes: ChangeRange[] = [{ start: 0, end: 5, type: "removed" }];
    const cssClasses: DiffTagClasses = {
      wordDiff: "word-diff-class",
      wordRemoved: "word-removed-class",
    };

    const elements = mergeHTMLWithDiff(html, changes, cssClasses);
    const { container } = render(elements);

    // Find the del tag
    const delTag = container.querySelector("del");
    expect(delTag).toBeTruthy();
    expect(delTag?.className).toContain("word-diff-class");
    expect(delTag?.className).toContain("word-removed-class");
  });

  it("Should preserve syntax highlighting classes alongside diff classes", () => {
    const html = '<span class="token keyword">const</span>';
    const changes: ChangeRange[] = [{ start: 0, end: 5, type: "added" }];
    const cssClasses: DiffTagClasses = {
      wordDiff: "word-diff-class",
      wordAdded: "word-added-class",
    };

    const elements = mergeHTMLWithDiff(html, changes, cssClasses);
    const { container } = render(elements);

    // The ins tag should wrap the span with keyword class
    const insTag = container.querySelector("ins");
    const keywordSpan = container.querySelector(".token.keyword");

    expect(insTag).toBeTruthy();
    expect(keywordSpan).toBeTruthy();
    expect(insTag?.className).toContain("word-diff-class");
    expect(insTag?.className).toContain("word-added-class");
    expect(keywordSpan?.className).toContain("token");
    expect(keywordSpan?.className).toContain("keyword");
  });
});
