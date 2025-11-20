import * as React from "react";
import type { ReactElement } from "react";

/**
 * Represents a node in the HTML tree
 */
interface HTMLNode {
  type: "element" | "text";
  // For element nodes
  tagName?: string;
  attributes?: Record<string, string>;
  children?: HTMLNode[];
  // For text nodes
  text?: string;
  // Character position mapping (start and end positions in plain text)
  startPos?: number;
  endPos?: number;
}

/**
 * Parse HTML string into a tree structure with character position mapping
 */
export function parseHTML(html: string): {
  tree: HTMLNode[];
  plainText: string;
} {
  const tree: HTMLNode[] = [];
  let plainText = "";
  let charPosition = 0;

  // Simple HTML parser using regex
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<root>${html}</root>`, "text/html");
  const rootElement = doc.querySelector("root");

  if (!rootElement) {
    return { tree: [], plainText: "" };
  }

  function traverseNode(node: Node): HTMLNode | null {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      const startPos = charPosition;
      charPosition += text.length;
      const endPos = charPosition;
      plainText += text;

      return {
        type: "text",
        text,
        startPos,
        endPos,
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
        type: "element",
        tagName: element.tagName.toLowerCase(),
        attributes,
        children,
      };
    }

    return null;
  }

  for (let i = 0; i < rootElement.childNodes.length; i++) {
    const node = traverseNode(rootElement.childNodes[i]);
    if (node) {
      tree.push(node);
    }
  }

  return { tree, plainText };
}

/**
 * Information about a change range in the plain text
 */
export interface ChangeRange {
  start: number;
  end: number;
  type: "added" | "removed" | "default";
}

/**
 * Inject diff tags (<ins>/<del>) into the HTML tree at the specified positions
 */
export function injectDiffTags(
  tree: HTMLNode[],
  changes: ChangeRange[],
): HTMLNode[] {
  if (changes.length === 0) {
    return tree;
  }

  function splitTextNode(
    node: HTMLNode,
    splitPositions: number[],
  ): HTMLNode[] {
    if (node.type !== "text" || !node.text) {
      return [node];
    }

    const { startPos = 0, endPos = 0 } = node;
    const relevantPositions = splitPositions
      .filter((pos) => pos > startPos && pos < endPos)
      .sort((a, b) => a - b);

    if (relevantPositions.length === 0) {
      return [node];
    }

    const result: HTMLNode[] = [];
    let currentPos = startPos;

    for (const splitPos of relevantPositions) {
      const textStart = currentPos - startPos;
      const textEnd = splitPos - startPos;
      const textSegment = node.text.substring(textStart, textEnd);

      if (textSegment.length > 0) {
        result.push({
          type: "text",
          text: textSegment,
          startPos: currentPos,
          endPos: splitPos,
        });
      }

      currentPos = splitPos;
    }

    // Add the last segment
    const textStart = currentPos - startPos;
    const textSegment = node.text.substring(textStart);
    if (textSegment.length > 0) {
      result.push({
        type: "text",
        text: textSegment,
        startPos: currentPos,
        endPos,
      });
    }

    return result;
  }

  function wrapWithDiffTag(nodes: HTMLNode[], changeType: string): HTMLNode {
    return {
      type: "element",
      tagName: changeType === "added" ? "ins" : changeType === "removed" ? "del" : "span",
      attributes: {},
      children: nodes,
    };
  }

  function processNode(node: HTMLNode): HTMLNode[] {
    if (node.type === "text") {
      const { startPos = 0, endPos = 0 } = node;

      // Find all changes that overlap with this text node
      const overlappingChanges = changes.filter(
        (change) =>
          !(change.end <= startPos || change.start >= endPos),
      );

      if (overlappingChanges.length === 0) {
        return [node];
      }

      // Collect all split positions
      const splitPositions: number[] = [];
      for (const change of overlappingChanges) {
        if (change.start > startPos && change.start < endPos) {
          splitPositions.push(change.start);
        }
        if (change.end > startPos && change.end < endPos) {
          splitPositions.push(change.end);
        }
      }

      // Split the text node
      const splitNodes = splitTextNode(node, splitPositions);

      // Wrap each segment with appropriate diff tag
      const result: HTMLNode[] = [];
      for (const splitNode of splitNodes) {
        const nodeStart = splitNode.startPos || 0;
        const nodeEnd = splitNode.endPos || 0;

        // Find the change type for this segment
        const change = changes.find(
          (c) => c.start <= nodeStart && c.end >= nodeEnd,
        );

        if (change && change.type !== "default") {
          result.push(wrapWithDiffTag([splitNode], change.type));
        } else {
          result.push(splitNode);
        }
      }

      return result;
    }

    if (node.type === "element") {
      // Process children recursively
      const newChildren: HTMLNode[] = [];
      for (const child of node.children || []) {
        newChildren.push(...processNode(child));
      }

      return [
        {
          ...node,
          children: newChildren,
        },
      ];
    }

    return [node];
  }

  const result: HTMLNode[] = [];
  for (const node of tree) {
    result.push(...processNode(node));
  }

  return result;
}

/**
 * Parse CSS string to React style object
 * Converts "color: red; font-size: 14px" to { color: 'red', fontSize: '14px' }
 */
function parseCSSStringToObject(cssString: string): Record<string, string> {
  const styleObject: Record<string, string> = {};

  if (!cssString || typeof cssString !== 'string') {
    return styleObject;
  }

  // Split by semicolon and process each property
  const declarations = cssString.split(';').filter(d => d.trim());

  for (const declaration of declarations) {
    const colonIndex = declaration.indexOf(':');
    if (colonIndex === -1) continue;

    const property = declaration.substring(0, colonIndex).trim();
    const value = declaration.substring(colonIndex + 1).trim();

    if (!property || !value) continue;

    // Convert kebab-case to camelCase (e.g., font-size -> fontSize)
    const camelCaseProperty = property.replace(/-([a-z])/g, (_, letter) =>
      letter.toUpperCase()
    );

    styleObject[camelCaseProperty] = value;
  }

  return styleObject;
}

/**
 * Convert HTML tree to React elements
 */
export function treeToReactElements(tree: HTMLNode[]): ReactElement[] {
  return tree.map((node, index) => nodeToReactElement(node, index));
}

function nodeToReactElement(node: HTMLNode, key: number | string): ReactElement {
  if (node.type === "text") {
    return React.createElement(React.Fragment, { key }, node.text);
  }

  if (node.type === "element") {
    const { tagName = "span", attributes = {}, children = [] } = node;
    const props: any = { key };

    // Copy attributes to props
    for (const [attrName, attrValue] of Object.entries(attributes)) {
      if (attrName === "class") {
        props.className = attrValue;
      } else if (attrName === "style") {
        // Parse inline CSS string to React style object
        props.style = parseCSSStringToObject(attrValue);
      } else {
        props[attrName] = attrValue;
      }
    }

    const childElements = children.map((child, i) =>
      nodeToReactElement(child, `${key}-${i}`),
    );

    return React.createElement(tagName, props, ...childElements);
  }

  return React.createElement(React.Fragment, { key });
}

/**
 * Main function to merge HTML with word-level diffs
 *
 * @param html The pre-rendered syntax-highlighted HTML
 * @param changes Array of change ranges from word-level diff
 * @returns Array of React elements with diff tags injected
 */
export function mergeHTMLWithDiff(
  html: string,
  changes: ChangeRange[],
): ReactElement[] {
  if (!html) {
    return [];
  }

  const { tree, plainText } = parseHTML(html);
  const treeWithDiffs = injectDiffTags(tree, changes);
  return treeToReactElements(treeWithDiffs);
}
