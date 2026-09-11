import { describe, it, expect } from 'vitest';
import { menuTitleKey } from './Sidebar';

describe('menuTitleKey', () => {
  it('slugs a server menu title into a valid translation key', () => {
    expect(menuTitleKey('Role Permissions')).toBe('menu.role_permissions');
    expect(menuTitleKey('  IAM ')).toBe('menu.iam');
    expect(menuTitleKey('Site-Settings & More')).toBe('menu.site_settings_more');
  });
  it('only produces [a-z0-9_] segments (the server key rule)', () => {
    expect(menuTitleKey('Weird/Title (v2)!')).toMatch(/^menu\.[a-z0-9_]+$/);
  });
});
