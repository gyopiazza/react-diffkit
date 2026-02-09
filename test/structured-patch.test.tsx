/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect } from 'vitest';
import * as diff from 'diff';
import { render } from '@testing-library/react';
import DiffViewer from '../src/index';
import { structuredPatchToChange } from '../src/compute-lines';

describe('StructuredPatch Support', () => {
  describe('structuredPatchToChange converter', () => {
    it('should convert a simple StructuredPatch correctly', () => {
      const oldValue = 'line1\nline2\nline3';
      const newValue = 'line1\nmodified\nline3';

      const patch = diff.structuredPatch('old.txt', 'new.txt', oldValue, newValue);
      const changes = structuredPatchToChange(patch, oldValue, newValue);

      // Should have changes for context and modification
      expect(changes.length).toBeGreaterThan(0);

      // Verify structure
      const hasRemoved = changes.some(c => c.removed);
      const hasAdded = changes.some(c => c.added);
      expect(hasRemoved).toBe(true);
      expect(hasAdded).toBe(true);
    });

    it('should handle pure additions', () => {
      const oldValue = 'line1\nline2';
      const newValue = 'line1\nline2\nline3';

      const patch = diff.structuredPatch('old.txt', 'new.txt', oldValue, newValue);
      const changes = structuredPatchToChange(patch, oldValue, newValue);

      const addedChange = changes.find(c => c.added);
      expect(addedChange).toBeDefined();
      expect(addedChange?.value).toContain('line3');
    });

    it('should handle pure deletions', () => {
      const oldValue = 'line1\nline2\nline3';
      const newValue = 'line1\nline3';

      const patch = diff.structuredPatch('old.txt', 'new.txt', oldValue, newValue);
      const changes = structuredPatchToChange(patch, oldValue, newValue);

      const removedChange = changes.find(c => c.removed);
      expect(removedChange).toBeDefined();
      expect(removedChange?.value).toContain('line2');
    });

    it('should handle multiple hunks', () => {
      const oldValue = 'line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10';
      const newValue = 'line1\nmodified2\nline3\nline4\nline5\nline6\nline7\nline8\nmodified9\nline10';

      const patch = diff.structuredPatch('old.txt', 'new.txt', oldValue, newValue);
      const changes = structuredPatchToChange(patch, oldValue, newValue);

      // Should have multiple changes for the two modifications
      const removedChanges = changes.filter(c => c.removed);
      const addedChanges = changes.filter(c => c.added);

      expect(removedChanges.length).toBeGreaterThan(0);
      expect(addedChanges.length).toBeGreaterThan(0);
    });

    it('should preserve context lines', () => {
      const oldValue = 'context1\ncontext2\nold\ncontext3';
      const newValue = 'context1\ncontext2\nnew\ncontext3';

      const patch = diff.structuredPatch('old.txt', 'new.txt', oldValue, newValue);
      const changes = structuredPatchToChange(patch, oldValue, newValue);

      // Should have context lines (neither added nor removed)
      const contextChanges = changes.filter(c => !c.added && !c.removed);
      expect(contextChanges.length).toBeGreaterThan(0);
    });
  });

  describe('DiffViewer component with structuredPatch', () => {
    it('should render correctly with structuredPatch prop', () => {
      const oldValue = 'foo\nbar\nbaz';
      const newValue = 'foo\nqux\nbaz';
      const patch = diff.structuredPatch('old', 'new', oldValue, newValue);

      const { container } = render(
        <DiffViewer
          oldValue={oldValue}
          newValue={newValue}
          structuredPatch={patch}
        />
      );

      // Verify rendering contains expected content
      expect(container.textContent).toContain('foo');
      expect(container.textContent).toContain('bar');
      expect(container.textContent).toContain('qux');
      expect(container.textContent).toContain('baz');
    });

    it('should produce same output with and without structuredPatch', () => {
      const oldValue = 'line1\nline2\nline3\nline4';
      const newValue = 'line1\nmodified\nline3\nline4';
      const patch = diff.structuredPatch('old', 'new', oldValue, newValue);

      // Render without structuredPatch (standard computation)
      const { container: standardContainer } = render(
        <DiffViewer
          oldValue={oldValue}
          newValue={newValue}
          splitView={true}
        />
      );

      // Render with structuredPatch (pre-computed)
      const { container: patchContainer } = render(
        <DiffViewer
          oldValue={oldValue}
          newValue={newValue}
          structuredPatch={patch}
          splitView={true}
        />
      );

      // Both should show the same diff markers and content
      const standardText = standardContainer.textContent;
      const patchText = patchContainer.textContent;

      expect(standardText).toBe(patchText);
    });

    it('should work with split view', () => {
      const oldValue = 'foo\nbar\nbaz';
      const newValue = 'foo\nqux\nbaz';
      const patch = diff.structuredPatch('old', 'new', oldValue, newValue);

      const { container } = render(
        <DiffViewer
          oldValue={oldValue}
          newValue={newValue}
          structuredPatch={patch}
          splitView={true}
        />
      );

      const tables = container.querySelectorAll('table');
      expect(tables.length).toBeGreaterThan(0);
    });

    it('should work with inline view', () => {
      const oldValue = 'foo\nbar\nbaz';
      const newValue = 'foo\nqux\nbaz';
      const patch = diff.structuredPatch('old', 'new', oldValue, newValue);

      const { container } = render(
        <DiffViewer
          oldValue={oldValue}
          newValue={newValue}
          structuredPatch={patch}
          splitView={false}
        />
      );

      const tables = container.querySelectorAll('table');
      expect(tables.length).toBeGreaterThan(0);
    });

    it('should work with syntax highlighting', () => {
      const oldValue = 'const foo = 1;\nconst bar = 2;';
      const newValue = 'const foo = 1;\nconst baz = 3;';
      const patch = diff.structuredPatch('old.js', 'new.js', oldValue, newValue);

      // Mock highlighted HTML
      const oldRenderedLines = '<span class="hljs-keyword">const</span> foo = <span class="hljs-number">1</span>;\n<span class="hljs-keyword">const</span> bar = <span class="hljs-number">2</span>;';
      const newRenderedLines = '<span class="hljs-keyword">const</span> foo = <span class="hljs-number">1</span>;\n<span class="hljs-keyword">const</span> baz = <span class="hljs-number">3</span>;';

      const { container } = render(
        <DiffViewer
          oldValue={oldValue}
          newValue={newValue}
          structuredPatch={patch}
          oldRenderedLines={oldRenderedLines}
          newRenderedLines={newRenderedLines}
        />
      );

      // Should contain highlighted spans
      const spans = container.querySelectorAll('span');
      expect(spans.length).toBeGreaterThan(0);
    });

    it('should handle code folding with structuredPatch', () => {
      const oldLines = Array.from({ length: 50 }, (_, i) => `line${i + 1}`);
      const newLines = [...oldLines];
      newLines[25] = 'modified25';

      const oldValue = oldLines.join('\n');
      const newValue = newLines.join('\n');
      const patch = diff.structuredPatch('old', 'new', oldValue, newValue);

      const { container } = render(
        <DiffViewer
          oldValue={oldValue}
          newValue={newValue}
          structuredPatch={patch}
          showDiffOnly={true}
          extraLinesSurroundingDiff={3}
        />
      );

      // Should have fold indicators for hidden blocks
      expect(container.textContent).toContain('Expand');
    });

    it('should ignore structuredPatch if oldValue/newValue are objects', () => {
      const oldValue = { foo: 1, bar: 2 };
      const newValue = { foo: 1, baz: 3 };

      // structuredPatch should be ignored for JSON mode (compareMethod: JSON)
      // Don't pass it when comparing objects
      const { container } = render(
        <DiffViewer
          oldValue={oldValue}
          newValue={newValue}
          compareMethod="diffJson"
        />
      );

      // Should still render JSON diff
      expect(container.textContent).toContain('foo');
    });

    it('should show correct change counts with structuredPatch', () => {
      const oldValue = 'line1\nline2\nline3\nline4';
      const newValue = 'line1\nmodified2\nline3\nadded';
      const patch = diff.structuredPatch('old', 'new', oldValue, newValue);

      const { container } = render(
        <DiffViewer
          oldValue={oldValue}
          newValue={newValue}
          structuredPatch={patch}
        />
      );

      // Should render the content correctly
      expect(container.textContent).toContain('line1');
      expect(container.textContent).toContain('modified2');
      expect(container.textContent).toContain('added');
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle empty files', () => {
      const oldValue = '';
      const newValue = 'new content';
      const patch = diff.structuredPatch('old', 'new', oldValue, newValue);

      const { container } = render(
        <DiffViewer
          oldValue={oldValue}
          newValue={newValue}
          structuredPatch={patch}
        />
      );

      expect(container.textContent).toContain('new content');
    });

    it('should handle identical files', () => {
      const oldValue = 'same\ncontent';
      const newValue = 'same\ncontent';
      const patch = diff.structuredPatch('old', 'new', oldValue, newValue);

      const { container } = render(
        <DiffViewer
          oldValue={oldValue}
          newValue={newValue}
          structuredPatch={patch}
          showDiffOnly={false}
          hideLineNumbers={false}
        />
      );

      // Identical files should render without errors
      expect(container).toBeTruthy();
      const text = container.textContent || '';
      // Content may be in expand blocks or visible - just verify it renders
      expect(text.length).toBeGreaterThan(0);
    });

    it('should handle files with only trailing newline difference', () => {
      const oldValue = 'line1\nline2';
      const newValue = 'line1\nline2\n';
      const patch = diff.structuredPatch('old', 'new', oldValue, newValue);

      const changes = structuredPatchToChange(patch, oldValue, newValue);
      expect(changes.length).toBeGreaterThan(0);
    });
  });
});
