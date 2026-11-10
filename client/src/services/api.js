import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '');
const apiBaseUrl = import.meta.env.PROD
  ? '/api'
  : configuredApiUrl
  ? (/\/api$/i.test(configuredApiUrl) ? configuredApiUrl : `${configuredApiUrl}/api`)
  : '/api';

const api = axios.create({ baseURL: apiBaseUrl, withCredentials: true, timeout: 25000 });

const RETRYABLE = [502, 503, 504];
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const cfg = error.config || {};
    const status = error.response?.status;
    // One automatic retry for transient network / gateway errors on safe requests.
    if ((cfg.method || 'get') === 'get' && !cfg._retried && !axios.isCancel(error) && (!error.response || RETRYABLE.includes(status))) {
      cfg._retried = true;
      await new Promise((r) => setTimeout(r, 600));
      return api(cfg);
    }
    if (status === 401 && !/\/auth\/(login|me)/.test(cfg.url || '')) window.dispatchEvent(new Event('auth:expired'));
    return Promise.reject(error);
  }
);

export const errMsg = (e) => e?.response?.data?.message || (e?.code === 'ERR_NETWORK' ? 'Cannot reach the server. Check your connection.' : e?.message) || 'Something went wrong';
export default api;
