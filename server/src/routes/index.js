import { Router } from 'express';
import { authenticate, requirePermission as need, requireAny, requireSuperAdmin } from '../middleware/auth.js';
import { loginLimiter, validIdParam } from '../middleware/security.js';
import * as auth from '../controllers/auth.controller.js';
import * as admins from '../controllers/admins.controller.js';
import * as wards from '../controllers/wards.controller.js';
import * as units from '../controllers/pollingUnits.controller.js';
import * as people from '../controllers/people.controller.js';
import * as dash from '../controllers/dashboard.controller.js';
import * as activity from '../controllers/activity.controller.js';
import * as settings from '../controllers/settings.controller.js';
import * as data from '../controllers/data.controller.js';
import { globalSearch } from '../controllers/search.controller.js';

import multer from 'multer';

const r = Router();
const id = validIdParam('id');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, Boolean(file.mimetype && file.mimetype.startsWith('image/'))),
});

// Auth
r.post('/auth/login', loginLimiter, auth.login);
r.post('/auth/logout', auth.logout);
r.get('/auth/me', authenticate, auth.me);
r.put('/auth/change-password', authenticate, auth.changePassword);
r.put('/auth/profile', authenticate, auth.updateProfile);
r.post('/auth/logout-all', authenticate, auth.logoutAll);

// Everything below requires a valid session
r.use(authenticate);

// Administrators (view by permission; every mutation is Super Admin only)
r.get('/admins', need('administrators.view'), admins.list);
r.post('/admins', requireSuperAdmin, admins.create);
r.get('/admins/:id', id, need('administrators.view'), admins.getOne);
r.put('/admins/:id', id, requireSuperAdmin, admins.update);
r.patch('/admins/:id/permissions', id, requireSuperAdmin, admins.updatePermissions);
r.patch('/admins/:id/status', id, requireSuperAdmin, admins.setStatus);
r.post('/admins/:id/reset-password', id, requireSuperAdmin, admins.resetPassword);

// Wards (list is also readable by anyone who needs ward pickers)
r.get('/wards', requireAny('wards.view', 'pollingUnits.view', 'people.view', 'people.create', 'people.edit', 'imports.execute', 'exports.execute'), wards.list);
r.post('/wards', need('wards.create'), wards.create);
r.get('/wards/:id', id, need('wards.view'), wards.getOne);
r.put('/wards/:id', id, need('wards.edit'), wards.update);
r.delete('/wards/:id', id, need('wards.delete'), wards.remove);

// Polling units
r.get('/polling-units', requireAny('pollingUnits.view', 'wards.view', 'people.view', 'people.create', 'people.edit', 'imports.execute', 'exports.execute'), units.list);
r.post('/polling-units/bulk', need('pollingUnits.create'), units.bulk);
r.post('/polling-units', need('pollingUnits.create'), units.create);
r.get('/polling-units/:id', id, need('pollingUnits.view'), units.getOne);
r.put('/polling-units/:id', id, need('pollingUnits.edit'), units.update);
r.delete('/polling-units/:id', id, need('pollingUnits.delete'), units.remove);
r.post('/polling-units/:id/reassign', id, need('pollingUnits.edit', 'people.edit'), units.reassignPeople);

// People
r.get('/people/search', need('people.view'), people.search);
r.get('/people/check-duplicate', requireAny('people.create', 'people.edit'), people.checkDuplicate);
r.get('/people', need('people.view'), people.list);
r.post('/people', need('people.create'), people.create);
r.post('/people/upload-image', requireAny('people.create', 'people.edit'), upload.single('image'), people.uploadPersonImage);
r.get('/people/:id', id, need('people.view'), people.getOne);
r.put('/people/:id', id, need('people.edit'), people.update);
r.patch('/people/:id/consent', id, need('people.manageConsent'), people.setConsent);
r.delete('/people/:id', id, need('people.delete'), people.remove);

// Search, dashboard, logs, settings
r.get('/search', globalSearch);
r.get('/dashboard/stats', need('dashboard.view'), dash.stats);
r.get('/dashboard/recent-people', need('dashboard.view', 'people.view'), dash.recentPeople);
r.get('/dashboard/ward-summary', need('dashboard.view', 'wards.view'), dash.wardSummary);
r.get('/activity-logs', need('activityLogs.view'), activity.list);
r.get('/settings/public', settings.getPublic);
r.get('/settings', need('settings.view'), settings.getAll);
r.put('/settings', need('settings.edit'), settings.update);

// CSV
r.post('/import/preview', need('imports.execute', 'people.create'), data.importPreview);
r.post('/import/commit', need('imports.execute', 'people.create'), data.importCommit);
r.get('/export/people', need('exports.execute'), data.exportPeople);

export default r;
