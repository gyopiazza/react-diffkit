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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
require("./style.scss");
const react_1 = require("react");
const index_1 = __importStar(require("../../src/index"));
const logo_png_1 = __importDefault(require("../../logo.png"));
const classnames_1 = __importDefault(require("classnames"));
const client_1 = require("react-dom/client");
const old_rjs_raw_1 = __importDefault(require("./diff/javascript/old.rjs?raw"));
const new_rjs_raw_1 = __importDefault(require("./diff/javascript/new.rjs?raw"));
const old_yaml_raw_1 = __importDefault(require("./diff/massive/old.yaml?raw"));
const new_yaml_raw_1 = __importDefault(require("./diff/massive/new.yaml?raw"));
const old_json_1 = __importDefault(require("./diff/json/old.json"));
const new_json_1 = __importDefault(require("./diff/json/new.json"));
const P = window.Prism;
class Example extends react_1.Component {
    constructor(props) {
        super(props);
        this.onLineNumberClick = (id, e) => {
            let highlightLine = [id];
            if (e.shiftKey && this.state.highlightLine.length === 1) {
                const [dir, oldId] = this.state.highlightLine[0].split('-');
                const [newDir, newId] = id.split('-');
                if (dir === newDir) {
                    highlightLine = [];
                    const lowEnd = Math.min(Number(oldId), Number(newId));
                    const highEnd = Math.max(Number(oldId), Number(newId));
                    for (let i = lowEnd; i <= highEnd; i++) {
                        highlightLine.push(`${dir}-${i}`);
                    }
                }
            }
            this.setState({
                highlightLine,
            });
        };
        this.state = {
            highlightLine: [],
            theme: 'dark',
            splitView: true,
            columnHeaders: true,
            lineNumbers: true,
            customGutter: true,
            enableSyntaxHighlighting: true,
            dataType: 'javascript',
            compareMethod: index_1.DiffMethod.CHARS
        };
    }
    render() {
        let oldValue = '';
        let newValue = '';
        if (this.state.dataType === 'json') {
            oldValue = old_json_1.default;
            newValue = new_json_1.default;
        }
        else if (this.state.dataType === 'javascript') {
            oldValue = old_rjs_raw_1.default;
            newValue = new_rjs_raw_1.default;
        }
        else {
            oldValue = old_yaml_raw_1.default;
            newValue = new_yaml_raw_1.default;
        }
        return ((0, jsx_runtime_1.jsxs)("div", { className: "react-diff-viewer-example", children: [(0, jsx_runtime_1.jsx)("div", { className: "radial" }), (0, jsx_runtime_1.jsxs)("div", { className: "banner", children: [(0, jsx_runtime_1.jsx)("div", { className: "img-container", children: (0, jsx_runtime_1.jsx)("img", { src: logo_png_1.default, alt: "React Diff Viewer Logo" }) }), (0, jsx_runtime_1.jsxs)("p", { children: ["A simple and beautiful text diff viewer made with", ' ', (0, jsx_runtime_1.jsxs)("a", { href: "https://github.com/kpdecker/jsdiff", target: "_blank", children: ["Diff", ' '] }), "and", ' ', (0, jsx_runtime_1.jsxs)("a", { href: "https://reactjs.org", target: "_blank", children: ["React.", ' '] }), "Featuring split view, inline view, word diff, line highlight and more."] }), (0, jsx_runtime_1.jsx)("p", { children: "This documentation is for the `next` release branch, e.g. v4.x" }), (0, jsx_runtime_1.jsx)("div", { className: "cta", children: (0, jsx_runtime_1.jsx)("a", { href: "https://github.com/aeolun/react-diff-viewer-continued#install", children: (0, jsx_runtime_1.jsx)("button", { type: "button", className: "btn btn-primary btn-lg", children: "Documentation" }) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "options", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("label", { className: "switch", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: this.state.theme === 'dark', onChange: () => {
                                                        if (this.state.theme === 'dark') {
                                                            document.body.classList.add('light');
                                                        }
                                                        else {
                                                            document.body.classList.remove('light');
                                                        }
                                                        this.setState({
                                                            theme: this.state.theme === 'dark' ? 'light' : 'dark',
                                                        });
                                                    } }), (0, jsx_runtime_1.jsx)("span", { className: "slider round" })] }), (0, jsx_runtime_1.jsx)("span", { children: "Dark theme" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("label", { className: 'switch', children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: this.state.splitView, onChange: () => {
                                                        this.setState({
                                                            splitView: !this.state.splitView,
                                                        });
                                                    } }), (0, jsx_runtime_1.jsx)("span", { className: "slider round" })] }), (0, jsx_runtime_1.jsx)("span", { children: "Split pane" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("label", { className: 'switch', children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: this.state.enableSyntaxHighlighting, onChange: () => {
                                                        this.setState({
                                                            enableSyntaxHighlighting: !this.state.enableSyntaxHighlighting,
                                                        });
                                                    } }), (0, jsx_runtime_1.jsx)("span", { className: "slider round" })] }), (0, jsx_runtime_1.jsx)("span", { children: "Syntax highlighting" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("label", { className: 'switch', children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: this.state.columnHeaders, onChange: () => {
                                                        this.setState({
                                                            columnHeaders: !this.state.columnHeaders,
                                                        });
                                                    } }), (0, jsx_runtime_1.jsx)("span", { className: "slider round" })] }), (0, jsx_runtime_1.jsx)("span", { children: "Column Headers" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("label", { className: 'switch', children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: this.state.customGutter, onChange: () => {
                                                        this.setState({
                                                            customGutter: !this.state.customGutter,
                                                        });
                                                    } }), (0, jsx_runtime_1.jsx)("span", { className: "slider round" })] }), (0, jsx_runtime_1.jsx)("span", { children: "Custom gutter" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("label", { className: 'switch', children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: this.state.lineNumbers, onChange: () => {
                                                        this.setState({
                                                            lineNumbers: !this.state.lineNumbers,
                                                        });
                                                    } }), (0, jsx_runtime_1.jsx)("span", { className: "slider round" })] }), (0, jsx_runtime_1.jsx)("span", { children: "Line Numbers" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: 'select', children: (0, jsx_runtime_1.jsxs)("select", { value: this.state.dataType, onChange: (e) => {
                                                    this.setState({
                                                        dataType: e.currentTarget.value,
                                                        compareMethod: e.currentTarget.value === 'json' ? index_1.DiffMethod.JSON : index_1.DiffMethod.CHARS
                                                    });
                                                }, children: [(0, jsx_runtime_1.jsx)("option", { children: "javascript" }), (0, jsx_runtime_1.jsx)("option", { children: "json" }), (0, jsx_runtime_1.jsx)("option", { children: "yaml" })] }) }), (0, jsx_runtime_1.jsx)("span", { children: "Data" })] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "diff-viewer", children: (0, jsx_runtime_1.jsx)(index_1.default, { highlightLines: this.state.highlightLine, onLineNumberClick: this.onLineNumberClick, alwaysShowLines: ['L-30'], extraLinesSurroundingDiff: 1, hideLineNumbers: !this.state.lineNumbers, oldValue: oldValue, compareMethod: this.state.compareMethod, splitView: this.state.splitView, newValue: newValue, renderGutter: this.state.customGutter
                            ? (diffData) => {
                                return ((0, jsx_runtime_1.jsx)("td", { className: diffData.type !== undefined
                                        ? (0, classnames_1.default)(diffData.styles.gutter)
                                        : (0, classnames_1.default)(diffData.styles.gutter, diffData.styles.emptyGutter, {}), title: 'extra info', children: (0, jsx_runtime_1.jsx)("pre", { className: (0, classnames_1.default)(diffData.styles.lineNumber, {}), children: diffData.type == 3
                                            ? 'CHG'
                                            : diffData.type == 2
                                                ? 'DEL'
                                                : diffData.type == 1
                                                    ? 'ADD'
                                                    : diffData.type
                                                        ? '==='
                                                        : undefined }) }));
                            }
                            : undefined, useDarkTheme: this.state.theme === 'dark', summary: this.state.compareMethod === index_1.DiffMethod.JSON ? 'package.json' : 'webpack.config.js', leftTitle: this.state.columnHeaders ? `master@2178133 - pushed 2 hours ago.` : undefined, rightTitle: this.state.columnHeaders ? `master@64207ee - pushed 13 hours ago.` : undefined }) }), (0, jsx_runtime_1.jsxs)("footer", { children: ["Originally made with \uD83D\uDC93 by", ' ', (0, jsx_runtime_1.jsx)("a", { href: "https://praneshravi.in", target: "_blank", children: "Pranesh Ravi" }), ' ', "and extended by", ' ', (0, jsx_runtime_1.jsx)("a", { href: "https://serial-experiments.com", target: "_blank", children: "Bart Riepe" })] })] }));
    }
}
const root = (0, client_1.createRoot)(document.getElementById('app'));
root.render((0, jsx_runtime_1.jsx)(Example, {}));
