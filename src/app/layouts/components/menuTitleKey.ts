// Menu titles are stored server-side in English. Each is looked up as menu.<slug> (e.g.
// "Role Permissions" -> menu.role_permissions; segments must match the server's key rule
// [A-Za-z0-9_]). A language without that key falls back to the stored title, so a new menu item
// is never blank.
export const menuTitleKey = (title: string) =>
  `menu.${title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '')}`;
