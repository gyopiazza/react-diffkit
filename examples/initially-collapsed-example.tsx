import * as React from 'react';
import DiffViewer from '../src/index';

/**
 * Example demonstrating the initiallyCollapsed prop with lazy evaluation.
 *
 * When initiallyCollapsed={true}, the diff computation is deferred until
 * the user clicks "Load diff". This provides a performance benefit for
 * file lists or review interfaces where most files remain collapsed.
 */
const InitiallyCollapsedExample: React.FC = () => {
  // Simulate a large file that would be expensive to diff
  const oldCode = Array.from({ length: 1000 }, (_, i) => `Line ${i + 1}: This is some content`).join('\n');
  const newCode = Array.from({ length: 1000 }, (_, i) => {
    // Change every 10th line
    if (i % 10 === 0) {
      return `Line ${i + 1}: This content has been MODIFIED`;
    }
    return `Line ${i + 1}: This is some content`;
  }).join('\n');

  return (
    <div>
      <h2>Initially Collapsed with Lazy Evaluation</h2>
      <p>
        This large diff is not computed until you click "Load diff".
        Open your browser's DevTools Performance tab to see the difference.
      </p>

      <div style={{ marginBottom: '2rem' }}>
        <h3>With initiallyCollapsed (lazy evaluation)</h3>
        <DiffViewer
          oldValue={oldCode}
          newValue={newCode}
          splitView={true}
          initiallyCollapsed={true}
          collapsedMessage="This is a large file (1000 lines). Click to load diff."
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Without initiallyCollapsed (immediate computation)</h3>
        <DiffViewer
          oldValue={oldCode}
          newValue={newCode}
          splitView={true}
          initiallyCollapsed={false}
        />
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
        <h4>Performance Tips:</h4>
        <ul>
          <li>Use <code>initiallyCollapsed={'{true}'}</code> for file lists where most files remain collapsed</li>
          <li>Diff computation is deferred until first expansion</li>
          <li>After first expansion, normal memoization applies</li>
          <li>Particularly beneficial for large files or syntax-highlighted diffs</li>
        </ul>
      </div>
    </div>
  );
};

export default InitiallyCollapsedExample;
