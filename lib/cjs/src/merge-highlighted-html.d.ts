import type { ReactElement } from "react";
/**
 * Represents a node in the HTML tree
 */
interface HTMLNode {
    type: "element" | "text";
    tagName?: string;
    attributes?: Record<string, string>;
    children?: HTMLNode[];
    text?: string;
    startPos?: number;
    endPos?: number;
}
/**
 * Parse HTML string into a tree structure with character position mapping
 */
export declare function parseHTML(html: string): {
    tree: HTMLNode[];
    plainText: string;
};
/**
 * Information about a change range in the plain text
 */
export interface ChangeRange {
    start: number;
    end: number;
    type: "added" | "removed" | "default";
}
/**
 * CSS classes to apply to diff tags
 */
export interface DiffTagClasses {
    wordDiff?: string;
    wordAdded?: string;
    wordRemoved?: string;
}
/**
 * Inject diff tags (<ins>/<del>) into the HTML tree at the specified positions
 */
export declare function injectDiffTags(tree: HTMLNode[], changes: ChangeRange[], cssClasses?: DiffTagClasses): HTMLNode[];
/**
 * Convert HTML tree to React elements
 */
export declare function treeToReactElements(tree: HTMLNode[]): ReactElement[];
/**
 * Main function to merge HTML with word-level diffs
 *
 * @param html The pre-rendered syntax-highlighted HTML
 * @param changes Array of change ranges from word-level diff
 * @param cssClasses Optional CSS classes to apply to diff tags
 * @returns Array of React elements with diff tags injected
 */
export declare function mergeHTMLWithDiff(html: string, changes: ChangeRange[], cssClasses?: DiffTagClasses): ReactElement[];
export {};
