/**
 * Anonymous visit counter using the open-source Abacus service
 * (https://github.com/JasonLovesDoggo/abacus). No signup, no keys.
 *
 * - The first page load in a browser session calls /hit (count +1); later
 *   loads in the same session only read the total with /get.
 * - Nothing is counted on localhost, or when Do Not Track / Global Privacy
 *   Control is on (the total is still read so the footer can show it).
 * - No cookies, credentials, headers or query params; no app or task data is
 *   sent. Any failure (offline, timeout, non-OK) resolves to null.
 */
export const COUNTER_BASE = 'https://abacus.jasoncameron.dev';
export const COUNTER_KEY = 'lance6x5.github.io/home-maintenance-tracker';
export const SESSION_FLAG = 'home-maintenance-tracker:visit-counted';
const TIMEOUT_MS = 4000;

function isLocalHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1';
}

/** True when the browser asks not to be tracked (DNT or GPC). */
export function prefersNoTracking(nav) {
  if (!nav) return false;
  return nav.doNotTrack === '1' || nav.globalPrivacyControl === true;
}

function readFlag(storage) {
  try { return storage?.getItem(SESSION_FLAG) === '1'; } catch { return false; }
}

function writeFlag(storage) {
  try { storage?.setItem(SESSION_FLAG, '1'); } catch { /* storage unavailable */ }
}

async function request(fetchFn, path) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), TIMEOUT_MS) : null;
  try {
    const res = await fetchFn(`${COUNTER_BASE}/${path}/${COUNTER_KEY}`, {
      method: 'GET',
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: controller?.signal
    });
    if (!res || !res.ok) return null;
    const data = await res.json();
    const value = Number(data?.value);
    return Number.isFinite(value) && value >= 0 ? value : null;
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Count this visit (at most once per session) and return the total, or null.
 * Dependencies are injectable for tests.
 */
export async function getVisitCount({
  fetchFn = typeof fetch !== 'undefined' ? fetch : undefined,
  storage = safeSessionStorage(),
  nav = typeof navigator !== 'undefined' ? navigator : undefined,
  hostname = typeof location !== 'undefined' ? location.hostname : ''
} = {}) {
  try {
    if (typeof fetchFn !== 'function') return null;
    if (isLocalHost(hostname)) return null;
    if (nav && nav.onLine === false) return null;
    const shouldHit = !prefersNoTracking(nav) && !readFlag(storage);
    if (shouldHit) {
      const value = await request(fetchFn, 'hit');
      if (value !== null) writeFlag(storage);
      return value;
    }
    return await request(fetchFn, 'get');
  } catch {
    return null;
  }
}

function safeSessionStorage() {
  try { return typeof sessionStorage !== 'undefined' ? sessionStorage : null; } catch { return null; }
}

/** Format a count for display, e.g. "12,345 visits". */
export function formatVisits(value, locale) {
  const n = new Intl.NumberFormat(locale).format(value);
  return `${n} ${value === 1 ? 'visit' : 'visits'}`;
}
