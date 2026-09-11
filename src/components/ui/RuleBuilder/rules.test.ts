import { describe, it, expect } from 'vitest';
import { validate, coerce, emptyGroup, RuleNode } from './rules';

describe('rule tree validation (mirrors server RuleCondition.Validate)', () => {
  it('accepts a well-formed tree', () => {
    const tree: RuleNode = { and: [{ field: 'order.total', op: 'gte', value: 50 }, { or: [{ field: 'customer.group', op: 'in', value: ['vip'] }, { not: { field: 'customer.orders', op: 'eq', value: 0 } }] }] };
    expect(validate(tree)).toEqual([]);
  });
  it('flags missing field, empty groups, bad arity', () => {
    expect(validate({ field: '', op: 'eq', value: 'x' })).toContain('$: field is required');
    expect(validate({ and: [] })).toContain('$: group is empty');
    expect(validate({ field: 'a', op: 'between', value: [1] })[0]).toMatch(/two values/);
    expect(validate({ field: 'a', op: 'in', value: [] })[0]).toMatch(/list must not be empty/);
    expect(validate({ field: 'a', op: 'exists' })).toEqual([]);
  });
  it('coerces typed values and emptyGroup starts with one leaf', () => {
    expect(coerce('12.5', 'number')).toBe(12.5);
    expect(coerce('true', 'boolean')).toBe(true);
    expect(coerce('abc', 'number')).toBe('abc');
    const g = emptyGroup('and');
    expect('and' in g ? g.and.length : 0).toBe(1);
  });
});
