export const PERMISSION_SECTIONS = [
  { key: 'dashboard', title: 'Dashboard', actions: [['view', 'View dashboard']] },
  { key: 'people', title: 'People management', actions: [['view', 'View people'], ['create', 'Create people'], ['edit', 'Edit people'], ['delete', 'Delete people'], ['viewPhone', 'View phone numbers'], ['viewAddress', 'View addresses'], ['contact', 'Use call actions'], ['whatsapp', 'Use WhatsApp actions'], ['viewConsent', 'View consent information'], ['manageConsent', 'Manage consent requests'], ['viewImage', 'View photographs'], ['viewVoterCard', 'View voter’s cards']] },
  { key: 'wards', title: 'Ward management', actions: [['view', 'View wards'], ['create', 'Create wards'], ['edit', 'Edit wards'], ['delete', 'Delete wards']] },
  { key: 'pollingUnits', title: 'Polling-unit management', actions: [['view', 'View polling units'], ['create', 'Create polling units'], ['edit', 'Edit polling units'], ['delete', 'Delete polling units']] },
  { key: 'administrators', title: 'Administrators', actions: [['view', 'View administrators'], ['create', 'Create administrators'], ['edit', 'Edit administrators'], ['deactivate', 'Deactivate administrators']] },
  { key: 'imports', title: 'CSV import', actions: [['view', 'View import page'], ['execute', 'Run imports']] },
  { key: 'exports', title: 'CSV export', actions: [['view', 'View export page'], ['execute', 'Run exports']] },
  { key: 'activityLogs', title: 'Activity logs', actions: [['view', 'View activity logs']] },
  { key: 'settings', title: 'Settings', actions: [['view', 'View settings'], ['edit', 'Edit settings']] },
];
export const emptyPermissions = () => Object.fromEntries(PERMISSION_SECTIONS.map((s) => [s.key, Object.fromEntries(s.actions.map(([a]) => [a, false]))]));
export const countPermissions = (p) => PERMISSION_SECTIONS.reduce((n, s) => n + s.actions.filter(([a]) => p?.[s.key]?.[a]).length, 0);
export const TOTAL_PERMISSIONS = PERMISSION_SECTIONS.reduce((n, s) => n + s.actions.length, 0);
