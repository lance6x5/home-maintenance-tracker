/**
 * Date helpers. All dates in the app are stored as local calendar-day strings
 * ("YYYY-MM-DD") so that time zones and DST never shift a due date.
 * Arithmetic is performed on UTC Date objects built from those parts.
 */

const pad = (n) => String(n).padStart(2, '0');

/** Convert a Date (local time) into a YYYY-MM-DD string. */
export function toISODate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Today's local date as YYYY-MM-DD. */
export function today() {
  return toISODate(new Date());
}

/** Parse YYYY-MM-DD into { y, m (1-12), d }. Returns null when invalid. */
export function parseISODate(str) {
  if (typeof str !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > daysInMonth(y, mo)) return null;
  return { y, m: mo, d };
}

export function isValidISODate(str) {
  return parseISODate(str) !== null;
}

/** Number of days in month `m` (1-12) of year `y`. */
export function daysInMonth(y, m) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function fromParts(y, m, d) {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/** Add whole days (may be negative). */
export function addDays(str, n) {
  const p = parseISODate(str);
  return fromParts(p.y, p.m, p.d + n);
}

/**
 * Add whole months, clamping to the end of the month
 * (e.g. Jan 31 + 1 month = Feb 28/29).
 */
export function addMonths(str, n) {
  const p = parseISODate(str);
  const total = p.y * 12 + (p.m - 1) + n;
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  return fromParts(y, m, Math.min(p.d, daysInMonth(y, m)));
}

/** Whole-day difference b - a. */
export function diffDays(a, b) {
  const pa = parseISODate(a);
  const pb = parseISODate(b);
  return Math.round((Date.UTC(pb.y, pb.m - 1, pb.d) - Date.UTC(pa.y, pa.m - 1, pa.d)) / 86400000);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/** Human friendly date, e.g. "Mar 5, 2026". */
export function formatDate(str) {
  const p = parseISODate(str);
  if (!p) return '—';
  return `${MONTHS[p.m - 1]} ${p.d}, ${p.y}`;
}

/** Short month/day label, e.g. "Oct 15". */
export function formatMonthDay(month, day) {
  return `${MONTHS[month - 1]} ${day}`;
}

/** Relative description of a due date compared with `ref` (default today). */
export function relativeLabel(str, ref = today()) {
  const n = diffDays(ref, str);
  if (n === 0) return 'Due today';
  if (n === 1) return 'Due tomorrow';
  if (n === -1) return '1 day overdue';
  if (n < 0) return `${-n} days overdue`;
  return `Due in ${n} days`;
}
