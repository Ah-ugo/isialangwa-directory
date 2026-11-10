// Single source of truth for the permission model.
export const PERMISSION_TREE = {
  dashboard: ['view'],
  people: ['view', 'create', 'edit', 'delete', 'viewPhone', 'viewAddress', 'contact', 'whatsapp', 'viewConsent', 'manageConsent', 'viewImage', 'viewVoterCard'],
  wards: ['view', 'create', 'edit', 'delete'],
  pollingUnits: ['view', 'create', 'edit', 'delete'],
  administrators: ['view', 'create', 'edit', 'deactivate'],
  imports: ['view', 'execute'],
  exports: ['view', 'execute'],
  activityLogs: ['view'],
  settings: ['view', 'edit'],
};

const build = (v) =>
  Object.fromEntries(Object.entries(PERMISSION_TREE).map(([m, acts]) => [m, Object.fromEntries(acts.map((a) => [a, v]))]));

export const emptyPermissions = () => build(false);
export const fullPermissions = () => build(true);

/** Keep only known module/action keys and coerce to boolean. */
export function sanitizePermissions(input = {}) {
  const out = emptyPermissions();
  for (const [m, acts] of Object.entries(PERMISSION_TREE)) {
    for (const a of acts) out[m][a] = input?.[m]?.[a] === true;
  }
  return out;
}

export function effectivePermissions(user) {
  if (user.role === 'super_admin') return fullPermissions();
  return sanitizePermissions(user.permissions?.toObject ? user.permissions.toObject() : user.permissions);
}

export function can(user, key) {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  const [m, a] = key.split('.');
  return user.permissions?.[m]?.[a] === true;
}
