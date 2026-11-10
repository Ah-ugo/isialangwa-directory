let mode = 'short';
export const setDateMode = (m) => { mode = m || 'short'; };
export function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return '—';
  return mode === 'numeric' ? dt.toLocaleDateString('en-GB') : dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
export const fmtDateTime = (d) => (d ? `${fmtDate(d)}, ${new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : '—');
export const num = (n) => (n ?? 0).toLocaleString('en-NG');

/** Nigerian phone normalisation (mirrors the server). */
export function normalizePhone(raw) {
  if (!raw) return null;
  let s = String(raw).trim().replace(/[\s\-().]/g, '');
  if (s.startsWith('+')) s = s.slice(1); else if (s.startsWith('00')) s = s.slice(2);
  if (!/^\d+$/.test(s)) return null;
  if (s.startsWith('234')) s = s.slice(3);
  if (s.length === 11 && s.startsWith('0')) s = s.slice(1);
  return /^[789]\d{9}$/.test(s) ? '+234' + s : null;
}
export const waLink = (phone) => `https://wa.me/${String(phone).replace(/\D/g, '')}`;
export const telLink = (phone) => `tel:${phone}`;
export const prettyPhone = (p) => (p && p.startsWith('+234') ? `0${p.slice(4, 7)} ${p.slice(7, 10)} ${p.slice(10)}` : p || '');

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
