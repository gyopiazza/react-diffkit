/**
 * Utilities for splitting continuous HTML (like from highlight.js) into line-by-line HTML fragments.
 *
 * This module handles the conversion of continuous HTML structures into self-contained HTML fragments
 * per line, ensuring all tags are properly closed on each line.
 */

interface HTMLNode {
  type: 'element' | 'text';
  tagName?: string;
  attributes?: Record<string, string>;
  children?: HTMLNode[];
  text?: string;
}

/**
 * Parse HTML string into a tree structure
 */
function parseHTMLToTree(html: string): HTMLNode[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<root>${html}</root>`, 'text/html');
  const rootElement = doc.querySelector('root');

  if (!rootElement) {
    return [];
  }

  function traverseNode(node: Node): HTMLNode | null {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      return {
        type: 'text',
        text,
      };
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const attributes: Record<string, string> = {};

      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        attributes[attr.name] = attr.value;
      }

      const children: HTMLNode[] = [];
      for (let i = 0; i < node.childNodes.length; i++) {
        const childNode = traverseNode(node.childNodes[i]);
        if (childNode) {
          children.push(childNode);
        }
      }

      return {
        type: 'element',
        tagName: element.tagName.toLowerCase(),
        attributes,
        children,
      };
    }

    return null;
  }

  const tree: HTMLNode[] = [];
  for (let i = 0; i < rootElement.childNodes.length; i++) {
    const node = traverseNode(rootElement.childNodes[i]);
    if (node) {
      tree.push(node);
    }
  }

  return tree;
}

/**
 * Check if an HTML node is a wrapper element that should be stripped
 * (e.g., <code>, <pre> tags that highlight.js adds)
 */
function isWrapperElement(node: HTMLNode): boolean {
  if (node.type !== 'element') {
    return false;
  }

  const wrapperTags = ['code', 'pre'];
  return wrapperTags.includes(node.tagName || '');
}

/**
 * Flatten wrapper elements, keeping only their children
 */
function unwrapElements(nodes: HTMLNode[]): HTMLNode[] {
  const result: HTMLNode[] = [];

  for (const node of nodes) {
    if (isWrapperElement(node)) {
      // Recursively unwrap children
      const unwrappedChildren = unwrapElements(node.children || []);
      result.push(...unwrappedChildren);
    } else if (node.type === 'element' && node.children) {
      // Recursively process children of non-wrapper elements
      result.push({
        ...node,
        children: unwrapElements(node.children),
      });
    } else {
      result.push(node);
    }
  }

  return result;
}

/**
 * HTML-escape text content to preserve special characters
 */
function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Split HTML nodes by newline characters, creating separate lines
 * Each line maintains the proper tag context from parent elements
 */
function splitNodesByNewlines(
  nodes: HTMLNode[],
  tagContext: HTMLNode[] = [],
): string[] {
  const lines: string[] = [];
  let currentLine: string = '';

  function flushLine() {
    lines.push(currentLine);
    currentLine = '';
  }

  function processNodes(nodeList: HTMLNode[], context: HTMLNode[]): void {
    for (const node of nodeList) {
      if (node.type === 'text') {
        const text = node.text || '';
        const parts = text.split('\n');

        for (let i = 0; i < parts.length; i++) {
          if (i > 0) {
            // Close all open tags
            for (let j = context.length - 1; j >= 0; j--) {
              currentLine += `</${context[j].tagName}>`;
            }
            flushLine();
            // Reopen all tags for the new line
            for (let j = 0; j < context.length; j++) {
              const ctx = context[j];
              const attrs = Object.entries(ctx.attributes || {})
                .map(
                  ([key, value]) => `${key}="${value.replace(/"/g, '&quot;')}"`,
                )
                .join(' ');
              currentLine += attrs
                ? `<${ctx.tagName} ${attrs}>`
                : `<${ctx.tagName}>`;
            }
          }
          // HTML-escape text content to preserve special characters like <, >, &
          currentLine += escapeHTML(parts[i]);
        }
      } else if (node.type === 'element') {
        // Open the element tag
        const attrs = Object.entries(node.attributes || {})
          .map(([key, value]) => `${key}="${value.replace(/"/g, '&quot;')}"`)
          .join(' ');
        currentLine += attrs
          ? `<${node.tagName} ${attrs}>`
          : `<${node.tagName}>`;

        // Process children with this element in context
        const newContext = [...context, node];
        processNodes(node.children || [], newContext);

        // Close the element tag
        currentLine += `</${node.tagName}>`;
      }
    }
  }

  processNodes(nodes, tagContext);

  // Flush remaining content
  if (currentLine || lines.length === 0) {
    flushLine();
  }

  return lines;
}

/**
 * Check if HTML string is likely continuous (from highlight.js) vs line-separated
 * Heuristic: check for common wrapper elements or if splitting by \n yields invalid HTML
 */
export function isContinuousHTML(html: string): boolean {
  if (!html || typeof html !== 'string') {
    return false;
  }

  // Check for common highlighter wrapper elements
  const hasWrapperTags = /<(code|pre)[^>]*>/.test(html);
  if (hasWrapperTags) {
    return true;
  }

  // Check if any line after split has unclosed tags
  const lines = html.split('\n');
  if (lines.length <= 1) {
    return false;
  }

  // Check multiple lines (not just the first) for unclosed tags
  // This handles cases where early lines are balanced but later lines have spans crossing multiple lines
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i];
    // Count opening and closing tags
    const openTags = (line.match(/<[^/][^>]*>/g) || []).length;
    const closeTags = (line.match(/<\/[^>]+>/g) || []).length;

    // If any line has more opening tags than closing tags, likely continuous
    if (openTags > closeTags) {
      return true;
    }
  }

  return false;
}

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
export function splitContinuousHTML(html: string): string[] {
  if (!html) {
    return [];
  }

  // Parse HTML into tree
  const tree = parseHTMLToTree(html);

  // Unwrap wrapper elements
  const unwrapped = unwrapElements(tree);

  // Split by newlines while maintaining tag context
  const lines = splitNodesByNewlines(unwrapped);

  return lines;
}

/**
 * Process rendered lines input - handles both continuous and line-separated formats.
 * Returns an array of HTML strings, one per line.
 *
 * @param renderedLines Input from oldRenderedLines or newRenderedLines prop
 * @returns Array of HTML strings, one per line
 */
export function processRenderedLines(renderedLines?: string): string[] {
  if (!renderedLines) {
    return [];
  }

  // Check if it's continuous HTML
  if (isContinuousHTML(renderedLines)) {
    return splitContinuousHTML(renderedLines);
  }

  // Already line-separated format (backward compatible)
  return renderedLines.split('\n');
}
