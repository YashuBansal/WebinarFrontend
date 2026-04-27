/**
 * Client-side PII display mask (same rule as table cells): first 3 chars + "***".
 * @param {unknown} value
 * @param {boolean} masked
 * @returns {string}
 */
export function maskPiiDisplay(value, masked) {
  if (value == null || value === "") return "—";
  const s = String(value);
  if (!masked) return s;
  if (s.length <= 3) return "***";
  return `${s.slice(0, 3)}***`;
}
