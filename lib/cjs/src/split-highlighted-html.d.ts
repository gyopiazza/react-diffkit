/**
 * Utilities for splitting continuous HTML (like from highlight.js) into line-by-line HTML fragments.
 *
 * This module handles the conversion of continuous HTML structures into self-contained HTML fragments
 * per line, ensuring all tags are properly closed on each line.
 */
/**
 * Check if HTML string is likely continuous (from highlight.js) vs line-separated
 * Heuristic: check for common wrapper elements or if splitting by \n yields invalid HTML
 */
export declare function isContinuousHTML(html: string): boolean;
/**
 * Split continuous HTML (like from highlight.js) into line-by-line HTML fragments.
 * Each line will be a self-contained HTML string with properly closed tags.
 *
 * @param html Continuous HTML string from a syntax highlighter
 * @returns Array of HTML strings, one per line
 *
 * @example
 * ```typescript
 * const hljs = require('highlight.js');
 * const code = "const foo = 'bar';\nconst baz = 'qux';";
 * const highlighted = hljs.highlight(code, { language: 'javascript' }).value;
 * const lines = splitContinuousHTML(highlighted);
 * // Result: [
 * //   "<span class=\"hljs-keyword\">const</span> foo = <span class=\"hljs-string\">'bar'</span>;",
 * //   "<span class=\"hljs-keyword\">const</span> baz = <span class=\"hljs-string\">'qux'</span>;"
 * // ]
 * ```
 */
export declare function splitContinuousHTML(html: string): string[];
/**
 * Process rendered lines input - handles both continuous and line-separated formats.
 * Returns an array of HTML strings, one per line.
 *
 * @param renderedLines Input from oldRenderedLines or newRenderedLines prop
 * @returns Array of HTML strings, one per line
 */
export declare function processRenderedLines(renderedLines?: string): string[];
