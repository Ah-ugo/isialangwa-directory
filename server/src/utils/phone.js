/** Normalise Nigerian mobile numbers to +234XXXXXXXXXX. Returns null when invalid. */
export function normalizePhone(raw) {
  if (!raw) return null;
  let s = String(raw).trim().replace(/[\s\-().]/g, '');
  if (s.startsWith('+')) s = s.slice(1);
  else if (s.startsWith('00')) s = s.slice(2);
  if (!/^\d+$/.test(s)) return null;
  if (s.startsWith('234')) s = s.slice(3);
  if (s.length === 11 && s.startsWith('0')) s = s.slice(1);
  if (!/^[789]\d{9}$/.test(s)) return null;
  return '+234' + s;
}
