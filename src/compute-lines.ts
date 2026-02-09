import type { StructuredPatch } from 'diff';
import * as diff from 'diff';
import memoize from 'memoize-one';
import { processRenderedLines } from './split-highlighted-html.js';

const jsDiff: { [key: string]: any } = diff;

// Memoize HTML parsing to avoid redundant DOMParser operations
const processRenderedLinesMemoized = memoize(
  (renderedLines?: string) => processRenderedLines(renderedLines)
);

export enum DiffType {
  DEFAULT = 0,
  ADDED = 1,
  REMOVED = 2,
  CHANGED = 3,
}

// See https://github.com/kpdecker/jsdiff/tree/v4.0.1#api for more info on the below JsDiff methods
export enum DiffMethod {
  CHARS = 'diffChars',
  WORDS = 'diffWords',
  WORDS_WITH_SPACE = 'diffWordsWithSpace',
  LINES = 'diffLines',
  TRIMMED_LINES = 'diffTrimmedLines',
  SENTENCES = 'diffSentences',
  CSS = 'diffCss',
  JSON = 'diffJson',
}

export interface DiffInformation {
  value?: string | DiffInformation[];
  lineNumber?: number;
  type?: DiffType;
  // Pre-rendered HTML for this line (when oldRenderedLines/newRenderedLines are provided)
  renderedHTML?: string;
}

export interface LineInformation {
  left?: DiffInformation;
  right?: DiffInformation;
}

export interface ComputedLineInformation {
  lineInformation: LineInformation[];
  diffLines: number[];
}

export interface ComputedDiffInformation {
  left?: DiffInformation[];
  right?: DiffInformation[];
}

// See https://github.com/kpdecker/jsdiff/tree/v4.0.1#change-objects for more info on JsDiff
// Change Objects
export interface JsDiffChangeObject {
  added?: boolean;
  removed?: boolean;
  value?: string;
}

/**
 * Splits diff text by new line and computes final list of diff lines based on
 * conditions.
 *
 * @param value Diff text from the js diff module.
 */
const constructLines = (value: string): string[] => {
  if (value === '') return [];

  const lines = value.replace(/\n$/, '').split('\n');

  return lines;
};

/**
 * Computes word diff information in the line.
 * [TODO]: Consider adding options argument for JsDiff text block comparison
 *
 * @param oldValue Old word in the line.
 * @param newValue New word in the line.
 * @param compareMethod JsDiff text diff method from https://github.com/kpdecker/jsdiff/tree/v4.0.1#api
 */
const computeDiff = (
  oldValue: string | Record<string, unknown>,
  newValue: string | Record<string, unknown>,
  compareMethod:
    | DiffMethod
    | ((oldStr: string, newStr: string) => diff.Change[]) = DiffMethod.CHARS,
): ComputedDiffInformation => {
  const compareFunc =
    typeof compareMethod === 'string' ? jsDiff[compareMethod] : compareMethod;
  const diffArray: JsDiffChangeObject[] = compareFunc(oldValue, newValue);
  const computedDiff: ComputedDiffInformation = {
    left: [],
    right: [],
  };
  diffArray.forEach(({ added, removed, value }): DiffInformation => {
    const diffInformation: DiffInformation = {};
    if (added) {
      diffInformation.type = DiffType.ADDED;
      diffInformation.value = value;
      computedDiff.right.push(diffInformation);
    }
    if (removed) {
      diffInformation.type = DiffType.REMOVED;
      diffInformation.value = value;
      computedDiff.left.push(diffInformation);
    }
    if (!removed && !added) {
      diffInformation.type = DiffType.DEFAULT;
      diffInformation.value = value;
      computedDiff.right.push(diffInformation);
      computedDiff.left.push(diffInformation);
    }
    return diffInformation;
  });
  return computedDiff;
};

/**
 * Converts a StructuredPatch (from diff.parsePatch or diff.structuredPatch)
 * into the Change[] format used by computeLineInformation.
 *
 * This allows reusing all existing line processing logic while skipping
 * the expensive diff computation step.
 *
 * @param patch Pre-computed structured patch
 * @param oldValue Full old file content (for context lines)
 * @param newValue Full new file content (for context lines)
 * @returns Change[] array compatible with existing pipeline
 */
const structuredPatchToChange = (
  patch: StructuredPatch,
  oldValue: string,
  newValue: string,
): diff.Change[] => {
  const changes: diff.Change[] = [];

  // Split full file content into lines for reference
  const oldLines = oldValue.split('\n');
  const newLines = newValue.split('\n');

  let oldLineIndex = 0;
  let newLineIndex = 0;

  // Process each hunk in the patch
  for (const hunk of patch.hunks) {
    // Add context before hunk (unchanged lines)
    const contextBefore = hunk.oldStart - 1 - oldLineIndex;
    if (contextBefore > 0) {
      const contextLines = oldLines.slice(oldLineIndex, oldLineIndex + contextBefore);
      changes.push({
        value: contextLines.join('\n') + '\n',
        count: contextBefore,
        added: undefined,
        removed: undefined,
      });
      oldLineIndex += contextBefore;
      newLineIndex += contextBefore;
    }

    // Process hunk lines (format: " " = context, "-" = removed, "+" = added)
    let currentChange: diff.Change | null = null;

    for (const line of hunk.lines) {
      const prefix = line[0];
      const content = line.slice(1); // Remove prefix

      if (prefix === ' ') {
        // Context line - flush current change and add context
        if (currentChange) {
          changes.push(currentChange);
          currentChange = null;
        }
        changes.push({
          value: content + '\n',
          count: 1,
          added: undefined,
          removed: undefined,
        });
        oldLineIndex++;
        newLineIndex++;
      } else if (prefix === '-') {
        // Removed line
        if (!currentChange || !currentChange.removed) {
          if (currentChange) changes.push(currentChange);
          currentChange = { value: '', removed: true, added: undefined, count: 0 };
        }
        currentChange.value += content + '\n';
        currentChange.count!++;
        oldLineIndex++;
      } else if (prefix === '+') {
        // Added line
        if (!currentChange || !currentChange.added) {
          if (currentChange) changes.push(currentChange);
          currentChange = { value: '', added: true, removed: undefined, count: 0 };
        }
        currentChange.value += content + '\n';
        currentChange.count!++;
        newLineIndex++;
      }
    }

    // Flush final change from hunk
    if (currentChange) {
      changes.push(currentChange);
      currentChange = null;
    }
  }

  // Add remaining context after all hunks
  const remainingOld = oldLines.length - oldLineIndex;
  if (remainingOld > 0) {
    const contextLines = oldLines.slice(oldLineIndex);
    changes.push({
      value: contextLines.join('\n') + '\n',
      count: remainingOld,
      added: undefined,
      removed: undefined,
    });
  }

  return changes;
};

/**
 * [TODO]: Think about moving common left and right value assignment to a
 * common place. Better readability?
 *
 * Computes line wise information based in the js diff information passed. Each
 * line contains information about left and right section. Left side denotes
 * deletion and right side denotes addition.
 *
 * @param oldString Old string to compare.
 * @param newString New string to compare with old string.
 * @param disableWordDiff Flag to enable/disable word diff.
 * @param lineCompareMethod JsDiff text diff method from https://github.com/kpdecker/jsdiff/tree/v4.0.1#api
 * @param linesOffset line number to start counting from
 * @param showLines lines that are always shown, regardless of diff
 * @param oldRenderedLines Pre-rendered HTML for old string (optional)
 * @param newRenderedLines Pre-rendered HTML for new string (optional)
 * @param ignoreWhitespace Flag to enable/disable whitespace ignoring in line comparison
 * @param preComputedDiff Pre-computed diff array (optional) - when provided, skips diff.diffLines()
 */
const computeLineInformation = (
  oldString: string | Record<string, unknown>,
  newString: string | Record<string, unknown>,
  disableWordDiff = false,
  lineCompareMethod:
    | DiffMethod
    | ((oldStr: string, newStr: string) => diff.Change[]) = DiffMethod.CHARS,
  linesOffset = 0,
  showLines: string[] = [],
  oldRenderedLines?: string,
  newRenderedLines?: string,
  ignoreWhitespace = false,
  preComputedDiff?: diff.Change[],
): ComputedLineInformation => {
  let diffArray: diff.Change[] = [];

  // Use pre-computed diff if provided (SKIP EXPENSIVE COMPUTATION)
  if (preComputedDiff) {
    diffArray = preComputedDiff;
  } else {
    // Use diffLines for strings, and diffJson for objects...
    if (typeof oldString === 'string' && typeof newString === 'string') {
      diffArray = diff.diffLines(oldString, newString, {
        newlineIsToken: false,
        ignoreWhitespace,
      });
    } else {
      diffArray = diff.diffJson(oldString, newString);
    }
  }

  // Split pre-rendered HTML by lines if provided
  // Handles both continuous HTML (highlight.js) and line-separated formats
  const oldHTMLLines = processRenderedLinesMemoized(oldRenderedLines);
  const newHTMLLines = processRenderedLinesMemoized(newRenderedLines);

  // Convert showLines array to Set for O(1) lookups
  const showLinesSet: Set<string> | undefined = showLines && showLines.length > 0
    ? new Set(showLines)
    : undefined;

  let rightLineNumber = linesOffset;
  let leftLineNumber = linesOffset;
  let lineInformation: LineInformation[] = [];
  let counter = 0;
  const diffLines: number[] = [];
  const diffLinesSet: Set<number> = new Set();
  const ignoreDiffIndexes: Set<string> = new Set();
  const getLineInformation = (
    value: string,
    diffIndex: number,
    added?: boolean,
    removed?: boolean,
    evaluateOnlyFirstLine?: boolean,
  ): LineInformation[] => {
    const lines = constructLines(value);

    return lines
      .map((line: string, lineIndex): LineInformation => {
        const left: DiffInformation = {};
        const right: DiffInformation = {};
        if (
          ignoreDiffIndexes.has(`${diffIndex}-${lineIndex}`) ||
          (evaluateOnlyFirstLine && lineIndex !== 0)
        ) {
          return undefined;
        }
        if (added || removed) {
          let countAsChange = true;
          if (removed) {
            leftLineNumber += 1;
            left.lineNumber = leftLineNumber;
            left.type = DiffType.REMOVED;
            left.value = line || ' ';
            // Attach pre-rendered HTML if available (1-indexed to 0-indexed)
            if (oldHTMLLines.length > 0 && leftLineNumber > 0) {
              left.renderedHTML = oldHTMLLines[leftLineNumber - 1];
            }
            // When the current line is of type REMOVED, check the next item in
            // the diff array whether it is of type ADDED. If true, the current
            // diff will be marked as both REMOVED and ADDED. Meaning, the
            // current line is a modification.
            const nextDiff = diffArray[diffIndex + 1];
            if (nextDiff?.added) {
              const nextDiffLines = constructLines(nextDiff.value)[lineIndex];
              if (nextDiffLines) {
                const nextDiffLineInfo = getLineInformation(
                  nextDiffLines,
                  diffIndex,
                  true,
                  false,
                  true,
                );

                const {
                  value: rightValue,
                  lineNumber,
                  type,
                } = nextDiffLineInfo[0].right;

                // When identified as modification, add the next diff to ignore
                // set as the next value will be added in this line computation as
                // right and left values.
                ignoreDiffIndexes.add(`${diffIndex + 1}-${lineIndex}`);

                right.lineNumber = lineNumber;
                // Attach pre-rendered HTML if available (1-indexed to 0-indexed)
                if (newHTMLLines.length > 0 && lineNumber > 0) {
                  right.renderedHTML = newHTMLLines[lineNumber - 1];
                }
                if (left.value === rightValue) {
                  // The new value is exactly the same as the old
                  countAsChange = false;
                  right.type = 0;
                  left.type = 0;
                  right.value = rightValue;
                } else {
                  right.type = type;
                  // Do char level diff and assign the corresponding values to the
                  // left and right diff information object.
                  if (disableWordDiff) {
                    right.value = rightValue;
                  } else {
                    const computedDiff = computeDiff(
                      line,
                      rightValue as string,
                      lineCompareMethod,
                    );
                    right.value = computedDiff.right;
                    left.value = computedDiff.left;
                  }
                }
              }
            }
          } else {
            rightLineNumber += 1;
            right.lineNumber = rightLineNumber;
            right.type = DiffType.ADDED;
            right.value = line;
            // Attach pre-rendered HTML if available (1-indexed to 0-indexed)
            if (newHTMLLines.length > 0 && rightLineNumber > 0) {
              right.renderedHTML = newHTMLLines[rightLineNumber - 1];
            }
          }
          if (countAsChange && !evaluateOnlyFirstLine) {
            if (!diffLinesSet.has(counter)) {
              diffLines.push(counter);
              diffLinesSet.add(counter);
            }
          }
        } else {
          leftLineNumber += 1;
          rightLineNumber += 1;

          left.lineNumber = leftLineNumber;
          left.type = DiffType.DEFAULT;
          left.value = line;
          // Attach pre-rendered HTML if available (1-indexed to 0-indexed)
          if (oldHTMLLines.length > 0 && leftLineNumber > 0) {
            left.renderedHTML = oldHTMLLines[leftLineNumber - 1];
          }
          right.lineNumber = rightLineNumber;
          right.type = DiffType.DEFAULT;
          right.value = line;
          // Attach pre-rendered HTML if available (1-indexed to 0-indexed)
          if (newHTMLLines.length > 0 && rightLineNumber > 0) {
            right.renderedHTML = newHTMLLines[rightLineNumber - 1];
          }
        }

        if (
          showLinesSet?.has(`L-${left.lineNumber}`) ||
          (showLinesSet?.has(`R-${right.lineNumber}`) &&
            !diffLinesSet.has(counter))
        ) {
          diffLines.push(counter);
          diffLinesSet.add(counter);
        }

        if (!evaluateOnlyFirstLine) {
          counter += 1;
        }
        return { right, left };
      })
      .filter(Boolean);
  };

  diffArray.forEach(({ added, removed, value }: diff.Change, index): void => {
    const newLines = getLineInformation(value, index, added, removed);
    for (const line of newLines) {
      lineInformation.push(line);
    }
  });

  return {
    lineInformation,
    diffLines,
  };
};

export { computeLineInformation, structuredPatchToChange };
