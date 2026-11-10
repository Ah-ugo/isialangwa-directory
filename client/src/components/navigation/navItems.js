import { Home2, People, Map, Location, Profile2User, DocumentText, DocumentUpload, Setting2 } from 'iconsax-react';

export const NAV = [
  { group: 'Main', items: [
    { label: 'Dashboard', to: '/', icon: Home2, perm: 'dashboard.view' },
    { label: 'People', to: '/people', icon: People, perm: 'people.view' },
  ] },
  { group: 'Organisation', items: [
    { label: 'Wards', to: '/wards', icon: Map, perm: 'wards.view' },
    { label: 'Polling Units', to: '/polling-units', icon: Location, perm: 'pollingUnits.view' },
  ] },
  { group: 'Administration', items: [
    { label: 'Administrators', to: '/administrators', icon: Profile2User, perm: 'administrators.view' },
    { label: 'Import & Export', to: '/data', icon: DocumentUpload, perm: ['imports.view', 'exports.view'] },
    { label: 'Activity Logs', to: '/activity-logs', icon: DocumentText, perm: 'activityLogs.view' },
  ] },
  { group: 'Preferences', items: [{ label: 'Settings', to: '/settings', icon: Setting2, perm: null }] },
];
export const flatNav = NAV.flatMap((g) => g.items);
