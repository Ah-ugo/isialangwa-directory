import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import api, { errMsg } from '../services/api';

/** GET with automatic cancellation of obsolete requests. Keeps previous data while reloading. */
export default function useFetch(url, params = {}, { enabled = true } = {}) {
  const [state, setState] = useState({ payload: null, loading: enabled, error: null });
  const [tick, setTick] = useState(0);
  const key = JSON.stringify([url, params]);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => {
    if (!enabled || !url) { setState((s) => ({ ...s, loading: false })); return undefined; }
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    const clean = Object.fromEntries(Object.entries(paramsRef.current).filter(([, v]) => v !== '' && v != null));
    api.get(url, { params: clean, signal: ctrl.signal })
      .then((r) => setState({ payload: r.data, loading: false, error: null }))
      .catch((e) => { if (axios.isCancel(e) || e.code === 'ERR_CANCELED') return; setState((s) => ({ ...s, loading: false, error: errMsg(e) })); });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data: state.payload?.data, meta: state.payload?.meta, payload: state.payload, loading: state.loading, error: state.error, reload };
}
