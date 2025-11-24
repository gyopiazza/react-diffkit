"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseHTML = parseHTML;
exports.injectDiffTags = injectDiffTags;
exports.treeToReactElements = treeToReactElements;
exports.mergeHTMLWithDiff = mergeHTMLWithDiff;
const React = __importStar(require("react"));
/**
 * Parse HTML string into a tree structure with character position mapping
 */
function parseHTML(html) {
    const tree = [];
    let plainText = "";
    let charPosition = 0;
    // Simple HTML parser using regex
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<root>${html}</root>`, "text/html");
    const rootElement = doc.querySelector("root");
    if (!rootElement) {
        return { tree: [], plainText: "" };
    }
    function traverseNode(node) {
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
            const element = node;
            const attributes = {};
            for (let i = 0; i < element.attributes.length; i++) {
                const attr = element.attributes[i];
                attributes[attr.name] = attr.value;
            }
            const children = [];
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
 * Inject diff tags (<ins>/<del>) into the HTML tree at the specified positions
 */
function injectDiffTags(tree, changes, cssClasses) {
    if (changes.length === 0) {
        return tree;
    }
    function splitTextNode(node, splitPositions) {
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
        const result = [];
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
    function wrapWithDiffTag(nodes, changeType) {
        const tagName = changeType === "added"
            ? "ins"
            : changeType === "removed"
                ? "del"
                : "span";
        const classNames = [];
        // Add CSS classes if provided
        if (cssClasses === null || cssClasses === void 0 ? void 0 : cssClasses.wordDiff) {
            classNames.push(cssClasses.wordDiff);
        }
        if (changeType === "added" && (cssClasses === null || cssClasses === void 0 ? void 0 : cssClasses.wordAdded)) {
            classNames.push(cssClasses.wordAdded);
        }
        if (changeType === "removed" && (cssClasses === null || cssClasses === void 0 ? void 0 : cssClasses.wordRemoved)) {
            classNames.push(cssClasses.wordRemoved);
        }
        return {
            type: "element",
            tagName,
            attributes: classNames.length > 0 ? { class: classNames.join(" ") } : {},
            children: nodes,
        };
    }
    function processNode(node) {
        if (node.type === "text") {
            const { startPos = 0, endPos = 0 } = node;
            // Find all changes that overlap with this text node
            const overlappingChanges = changes.filter((change) => !(change.end <= startPos || change.start >= endPos));
            if (overlappingChanges.length === 0) {
                return [node];
            }
            // Collect all split positions
            const splitPositions = [];
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
            const result = [];
            for (const splitNode of splitNodes) {
                const nodeStart = splitNode.startPos || 0;
                const nodeEnd = splitNode.endPos || 0;
                // Find the change type for this segment
                const change = changes.find((c) => c.start <= nodeStart && c.end >= nodeEnd);
                if (change && change.type !== "default") {
                    result.push(wrapWithDiffTag([splitNode], change.type));
                }
                else {
                    result.push(splitNode);
                }
            }
            return result;
        }
        if (node.type === "element") {
            // Process children recursively
            const newChildren = [];
            for (const child of node.children || []) {
                newChildren.push(...processNode(child));
            }
            return [
                Object.assign(Object.assign({}, node), { children: newChildren }),
            ];
        }
        return [node];
    }
    const result = [];
    for (const node of tree) {
        result.push(...processNode(node));
    }
    return result;
}
/**
 * Parse CSS string to React style object
 * Converts "color: red; font-size: 14px" to { color: 'red', fontSize: '14px' }
 */
function parseCSSStringToObject(cssString) {
    const styleObject = {};
    if (!cssString || typeof cssString !== "string") {
        return styleObject;
    }
    // Split by semicolon and process each property
    const declarations = cssString.split(";").filter((d) => d.trim());
    for (const declaration of declarations) {
        const colonIndex = declaration.indexOf(":");
        if (colonIndex === -1)
            continue;
        const property = declaration.substring(0, colonIndex).trim();
        const value = declaration.substring(colonIndex + 1).trim();
        if (!property || !value)
            continue;
        // Convert kebab-case to camelCase (e.g., font-size -> fontSize)
        const camelCaseProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        styleObject[camelCaseProperty] = value;
    }
    return styleObject;
}
/**
 * Convert HTML tree to React elements
 */
function treeToReactElements(tree) {
    return tree.map((node, index) => nodeToReactElement(node, index));
}
function nodeToReactElement(node, key) {
    if (node.type === "text") {
        return React.createElement(React.Fragment, { key }, node.text);
    }
    if (node.type === "element") {
        const { tagName = "span", attributes = {}, children = [] } = node;
        const props = { key };
        // Copy attributes to props
        for (const [attrName, attrValue] of Object.entries(attributes)) {
            if (attrName === "class") {
                props.className = attrValue;
            }
            else if (attrName === "style") {
                // Parse inline CSS string to React style object
                props.style = parseCSSStringToObject(attrValue);
            }
            else {
                props[attrName] = attrValue;
            }
        }
        const childElements = children.map((child, i) => nodeToReactElement(child, `${key}-${i}`));
        return React.createElement(tagName, props, ...childElements);
    }
    return React.createElement(React.Fragment, { key });
}
/**
 * Main function to merge HTML with word-level diffs
 *
 * @param html The pre-rendered syntax-highlighted HTML
 * @param changes Array of change ranges from word-level diff
 * @param cssClasses Optional CSS classes to apply to diff tags
 * @returns Array of React elements with diff tags injected
 */
function mergeHTMLWithDiff(html, changes, cssClasses) {
    if (!html) {
        return [];
    }
    const { tree, plainText } = parseHTML(html);
    const treeWithDiffs = injectDiffTags(tree, changes, cssClasses);
    return treeToReactElements(treeWithDiffs);
}
