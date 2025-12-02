import { jsx as _jsx } from "react/jsx-runtime";
import './style.scss';
import hljs from 'highlight.js';
import 'highlight.js/styles/vs2015.min.css';
import { useState } from 'react';
import ReactDiff, { DiffMethod } from '../../src/index';
import { createRoot } from "react-dom/client";
import typescript from 'highlight.js/lib/languages/typescript';
hljs.registerLanguage('typescript', typescript);
const oldTS = `import { Language, Parser } from 'web-tree-sitter';

let parserInitPromise: Promise<void> | null = null;
const languageCache = new Map<string, Promise<Language>>();

/**
 * Initializes the Parser library (only once, subsequent calls return cached promise)
 */
export const initParser = (): Promise<void> => {
  if (!parserInitPromise) {
    parserInitPromise = Parser.init({
      locateFile() {
        return \`/grammar/engine.wasm\`;
      },
    });
  }
  return parserInitPromise;
};

/**
 * Loads a language WASM file (cached per language)
 */
export const loadLanguage = async (language: string): Promise<Language> => {
  const normalizedLanguage = language.toLowerCase();

  if (!languageCache.has(normalizedLanguage)) {
    const languagePromise = Language.load(\`/grammar/\${normalizedLanguage}.wasm\`);
    languageCache.set(normalizedLanguage, languagePromise);
  }

  return languageCache.get(normalizedLanguage)!;
};

/**
 * Creates and configures a parser for the given language
 */
export const getParser = async (language: string): Promise<Parser> => {
  await initParser();
  const newParser = new Parser();
  const lang = await loadLanguage(language);
  newParser.setLanguage(lang);
  return newParser;
};
`;
const newTS = `import { Language, Parser } from 'web-tree-sitter';

let parserInitPromise: Promise<void> | null = null;
const languageCache = new Map<string, Promise<Language>>();

/**
 * Initializes the Parser library (only once, subsequent calls return cached promise)
 */
export const initParser = (): Promise<void> => {
  if (!parserInitPromise) {
    parserInitPromise = Parser.init({
      locateFile() {
        return \`/grammar/engine.wasm\`;
      },
    });
  }
  return parserInitPromise;
};

/**
 * Loads a language WASM file (cached per language)
 */
export const loadLanguage = async (language: string): Promise<Language> => {
  const normalizedLanguage = language.toLowerCase();

  if (!languageCache.has(normalizedLanguage)) {
    const languagePromise = Language.load(\`/grammar/\${normalizedLanguage}.wasm\`);
    languageCache.set(normalizedLanguage, languagePromise);
  }

  return languageCache.get(normalizedLanguage)!;
};

/**
 * Creates and configures a parser for the given language
 * Returns null if the language is not supported
 */
export const getParser = async (language: string): Promise<Parser | null> => {
  try {
    await initParser();
    const newParser = new Parser();
    const lang = await loadLanguage(language);
    newParser.setLanguage(lang);
    return newParser;
  } catch (error) {
    console.warn(\`Failed to create parser for language "\${language}", falling back to plain text\`);
    return null;
  }
};
`;
const newRendered = `<span class="hljs-keyword">import</span> { <span class="hljs-title class_">Language</span>, <span class="hljs-title class_">Parser</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;web-tree-sitter&#x27;</span>;

<span class="hljs-keyword">let</span> <span class="hljs-attr">parserInitPromise</span>: <span class="hljs-title class_">Promise</span>&lt;<span class="hljs-built_in">void</span>&gt; | <span class="hljs-literal">null</span> = <span class="hljs-literal">null</span>;
<span class="hljs-keyword">const</span> languageCache = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>&lt;<span class="hljs-built_in">string</span>, <span class="hljs-title class_">Promise</span>&lt;<span class="hljs-title class_">Language</span>&gt;&gt;();

<span class="hljs-comment">/**
 * Initializes the Parser library (only once, subsequent calls return cached promise)
 */</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> initParser = (): <span class="hljs-title class_">Promise</span>&lt;<span class="hljs-built_in">void</span>&gt; =&gt; {
  <span class="hljs-keyword">if</span> (!parserInitPromise) {
    parserInitPromise = <span class="hljs-title class_">Parser</span>.<span class="hljs-title function_">init</span>({
      <span class="hljs-title function_">locateFile</span>(<span class="hljs-params"></span>) {
        <span class="hljs-keyword">return</span> <span class="hljs-string">\`/grammar/engine.wasm\`</span>;
      },
    });
  }
  <span class="hljs-keyword">return</span> parserInitPromise;
};

<span class="hljs-comment">/**
 * Loads a language WASM file (cached per language)
 */</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> loadLanguage = <span class="hljs-title function_">async</span> (<span class="hljs-attr">language</span>: <span class="hljs-built_in">string</span>): <span class="hljs-title class_">Promise</span>&lt;<span class="hljs-title class_">Language</span>&gt; =&gt; {
  <span class="hljs-keyword">const</span> normalizedLanguage = language.<span class="hljs-title function_">toLowerCase</span>();

  <span class="hljs-keyword">if</span> (!languageCache.<span class="hljs-title function_">has</span>(normalizedLanguage)) {
    <span class="hljs-keyword">const</span> languagePromise = <span class="hljs-title class_">Language</span>.<span class="hljs-title function_">load</span>(<span class="hljs-string">\`/grammar/<span class="hljs-subst">\${normalizedLanguage}</span>.wasm\`</span>);
    languageCache.<span class="hljs-title function_">set</span>(normalizedLanguage, languagePromise);
  }

  <span class="hljs-keyword">return</span> languageCache.<span class="hljs-title function_">get</span>(normalizedLanguage)!;
};

<span class="hljs-comment">/**
 * Creates and configures a parser for the given language
 * Returns null if the language is not supported
 */</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> getParser = <span class="hljs-title function_">async</span> (<span class="hljs-attr">language</span>: <span class="hljs-built_in">string</span>): <span class="hljs-title class_">Promise</span>&lt;<span class="hljs-title class_">Parser</span> | <span class="hljs-literal">null</span>&gt; =&gt; {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> <span class="hljs-title function_">initParser</span>();
    <span class="hljs-keyword">const</span> newParser = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Parser</span>();
    <span class="hljs-keyword">const</span> lang = <span class="hljs-keyword">await</span> <span class="hljs-title function_">loadLanguage</span>(language);
    newParser.<span class="hljs-title function_">setLanguage</span>(lang);
    <span class="hljs-keyword">return</span> newParser;
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">warn</span>(<span class="hljs-string">\`Failed to create parser for language &quot;<span class="hljs-subst">\${language}</span>&quot;, falling back to plain text\`</span>);
    <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  }
};
`;
const oldRendered = `<span class="hljs-keyword">import</span> { <span class="hljs-title class_">Language</span>, <span class="hljs-title class_">Parser</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;web-tree-sitter&#x27;</span>;

<span class="hljs-keyword">let</span> <span class="hljs-attr">parserInitPromise</span>: <span class="hljs-title class_">Promise</span>&lt;<span class="hljs-built_in">void</span>&gt; | <span class="hljs-literal">null</span> = <span class="hljs-literal">null</span>;
<span class="hljs-keyword">const</span> languageCache = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>&lt;<span class="hljs-built_in">string</span>, <span class="hljs-title class_">Promise</span>&lt;<span class="hljs-title class_">Language</span>&gt;&gt;();

<span class="hljs-comment">/**
 * Initializes the Parser library (only once, subsequent calls return cached promise)
 */</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> initParser = (): <span class="hljs-title class_">Promise</span>&lt;<span class="hljs-built_in">void</span>&gt; =&gt; {
  <span class="hljs-keyword">if</span> (!parserInitPromise) {
    parserInitPromise = <span class="hljs-title class_">Parser</span>.<span class="hljs-title function_">init</span>({
      <span class="hljs-title function_">locateFile</span>(<span class="hljs-params"></span>) {
        <span class="hljs-keyword">return</span> <span class="hljs-string">\`/grammar/engine.wasm\`</span>;
      },
    });
  }
  <span class="hljs-keyword">return</span> parserInitPromise;
};

<span class="hljs-comment">/**
 * Loads a language WASM file (cached per language)
 */</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> loadLanguage = <span class="hljs-title function_">async</span> (<span class="hljs-attr">language</span>: <span class="hljs-built_in">string</span>): <span class="hljs-title class_">Promise</span>&lt;<span class="hljs-title class_">Language</span>&gt; =&gt; {
  <span class="hljs-keyword">const</span> normalizedLanguage = language.<span class="hljs-title function_">toLowerCase</span>();

  <span class="hljs-keyword">if</span> (!languageCache.<span class="hljs-title function_">has</span>(normalizedLanguage)) {
    <span class="hljs-keyword">const</span> languagePromise = <span class="hljs-title class_">Language</span>.<span class="hljs-title function_">load</span>(<span class="hljs-string">\`/grammar/<span class="hljs-subst">\${normalizedLanguage}</span>.wasm\`</span>);
    languageCache.<span class="hljs-title function_">set</span>(normalizedLanguage, languagePromise);
  }

  <span class="hljs-keyword">return</span> languageCache.<span class="hljs-title function_">get</span>(normalizedLanguage)!;
};

<span class="hljs-comment">/**
 * Creates and configures a parser for the given language
 * Returns null if the language is not supported
 */</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> getParser = <span class="hljs-title function_">async</span> (<span class="hljs-attr">language</span>: <span class="hljs-built_in">string</span>): <span class="hljs-title class_">Promise</span>&lt;<span class="hljs-title class_">Parser</span> | <span class="hljs-literal">null</span>&gt; =&gt; {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> <span class="hljs-title function_">initParser</span>();
    <span class="hljs-keyword">const</span> newParser = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Parser</span>();
    <span class="hljs-keyword">const</span> lang = <span class="hljs-keyword">await</span> <span class="hljs-title function_">loadLanguage</span>(language);
    newParser.<span class="hljs-title function_">setLanguage</span>(lang);
    <span class="hljs-keyword">return</span> newParser;
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">warn</span>(<span class="hljs-string">\`Failed to create parser for language &quot;<span class="hljs-subst">\${language}</span>&quot;, falling back to plain text\`</span>);
    <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  }
};
`;
const Example = () => {
    const [compareMethod, setCompareMethod] = useState(DiffMethod.WORDS);
    return (_jsx("div", { className: "react-diff-viewer-example", children: _jsx("div", { className: "diff-viewer", children: _jsx(ReactDiff, { oldValue: oldTS, compareMethod: DiffMethod.WORDS, splitView: true, newValue: newTS, oldRenderedLines: oldRendered, newRenderedLines: newRendered, useDarkTheme: true, summary: compareMethod === DiffMethod.JSON ? 'package.json' : 'webpack.config.js' }) }) }));
};
const root = createRoot(document.getElementById('app'));
root.render(_jsx(Example, {}));
