import { describe, it, expect } from 'vitest';
import { diffObjects } from './diffObjects';

describe('diffObjects', () => {
  it('reports changed, added and removed dotted paths only', () => {
    const rows = diffObjects({ name: 'A', price: { amount: 10, currency: 'USD' }, tags: ['x'] }, { name: 'A', price: { amount: 12, currency: 'USD' }, tags: ['x', 'y'], sku: 'S1' });
    expect(rows.map((r) => r.path)).toEqual(['price.amount', 'sku', 'tags[1]']);
    expect(rows[0]).toEqual({ path: 'price.amount', before: '10', after: '12' });
    expect(rows[1].before).toBeUndefined();
  });
  it('returns nothing for identical objects', () => {
    expect(diffObjects({ a: 1 }, { a: 1 })).toEqual([]);
  });
});
