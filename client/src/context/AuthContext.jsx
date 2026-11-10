import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { setDateMode } from '../utils/format';
import { APP_NAME } from '../branding';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try { const r = await api.get('/settings/public'); setSettings(r.data.data); setDateMode(r.data.data.dateFormat); document.title = r.data.data.appName; } catch { /* non-fatal */ }
  }, []);

  useEffect(() => {
    document.title = APP_NAME;
    loadSettings();
    api.get('/auth/me').then((r) => setUser(r.data.data)).catch(() => setUser(null)).finally(() => setLoading(false));
    const expired = () => setUser(null);
    window.addEventListener('auth:expired', expired);
    return () => window.removeEventListener('auth:expired', expired);
  }, [loadSettings]);

  const login = async (identifier, password) => {
    const r = await api.post('/auth/login', { identifier, password });
    setUser(r.data.data);
    loadSettings();
    return r.data.data;
  };
  const logout = async () => { try { await api.post('/auth/logout'); } finally { setUser(null); } };

  /** can('people.view') or can(['wards.view','people.view']) = any of */
  const can = useCallback((perm) => {
    if (!perm) return true;
    if (!user) return false;
    return (Array.isArray(perm) ? perm : [perm]).some((k) => { const [m, a] = k.split('.'); return user.permissions?.[m]?.[a] === true; });
  }, [user]);

  const value = useMemo(() => ({ user, setUser, settings, setSettings: (s) => { setSettings(s); setDateMode(s?.dateFormat); }, loading, login, logout, can, isSuper: user?.role === 'super_admin' }), [user, settings, loading, can]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
