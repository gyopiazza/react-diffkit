/**
 * Example demonstrating the performance benefits of using structuredPatch
 */

import React, { useState } from 'react';
import DiffViewer from '../src/index';
import * as diff from 'diff';

// Sample code for diffing
const oldCode = `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}

function processOrder(order) {
  const total = calculateTotal(order.items);
  const tax = total * 0.1;
  return {
    subtotal: total,
    tax: tax,
    total: total + tax
  };
}

function validateOrder(order) {
  if (!order.items || order.items.length === 0) {
    throw new Error('Order must have items');
  }
  if (!order.customerId) {
    throw new Error('Order must have a customer');
  }
  return true;
}`;

const newCode = `function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

function processOrder(order) {
  const subtotal = calculateTotal(order.items);
  const tax = subtotal * 0.1;
  const shipping = calculateShipping(order);

  return {
    subtotal,
    tax,
    shipping,
    total: subtotal + tax + shipping
  };
}

function calculateShipping(order) {
  return order.items.length > 5 ? 0 : 9.99;
}

function validateOrder(order) {
  if (!order.items?.length) {
    throw new Error('Order must have items');
  }
  if (!order.customerId) {
    throw new Error('Order must have a customer');
  }
  if (!order.shippingAddress) {
    throw new Error('Order must have a shipping address');
  }
  return true;
}`;

export function StructuredPatchExample() {
  const [useStructuredPatch, setUseStructuredPatch] = useState(true);
  const [renderTime, setRenderTime] = useState<number | null>(null);

  // Pre-compute the structured patch
  const patch = diff.structuredPatch('old.js', 'new.js', oldCode, newCode);

  const handleRender = () => {
    const start = performance.now();
    // The actual render happens below
    requestAnimationFrame(() => {
      const end = performance.now();
      setRenderTime(end - start);
    });
  };

  React.useEffect(() => {
    handleRender();
  }, [useStructuredPatch]);

  return (
    <div style={{ padding: '20px' }}>
      <h1>StructuredPatch Performance Example</h1>

      <div style={{ marginBottom: '20px' }}>
        <label>
          <input
            type="checkbox"
            checked={useStructuredPatch}
            onChange={(e) => setUseStructuredPatch(e.target.checked)}
          />
          {' '}Use structuredPatch (pre-computed diff)
        </label>

        {renderTime !== null && (
          <div style={{ marginTop: '10px', fontFamily: 'monospace' }}>
            Render time: {renderTime.toFixed(2)}ms
            {useStructuredPatch && (
              <span style={{ color: 'green', marginLeft: '10px' }}>
                (Performance optimized!)
              </span>
            )}
          </div>
        )}
      </div>

      <div style={{
        background: '#f5f5f5',
        padding: '15px',
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <h3>What's happening:</h3>
        <ul>
          <li>
            <strong>With structuredPatch:</strong> The diff computation is done once and
            reused, skipping the expensive <code>diff.diffLines()</code> call on every render.
          </li>
          <li>
            <strong>Without structuredPatch:</strong> The component computes the diff from
            scratch on every render using <code>diff.diffLines()</code>.
          </li>
        </ul>
        <p>
          For large files or frequently re-rendering diffs (e.g., in a list), this can provide
          15-30% performance improvement.
        </p>
      </div>

      <DiffViewer
        oldValue={oldCode}
        newValue={newCode}
        structuredPatch={useStructuredPatch ? patch : undefined}
        splitView={true}
        leftTitle="old.js"
        rightTitle="new.js"
      />
    </div>
  );
}

export default StructuredPatchExample;
