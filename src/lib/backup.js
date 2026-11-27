/**
 * JSON export / import with validation so a malformed or foreign file can
 * never corrupt stored data.
 */
import { isValidISODate, today } from './dates.js';
import { UNITS, SEASONS, initialNextDue } from './schedule.js';

export const APP_ID = 'home-maintenance-tracker';
export const FORMAT_VERSION = 1;
const SEASON_IDS = SEASONS.map((s) => s.id);

const str = (v, max = 2000) => (typeof v === 'string' ? v.slice(0, max) : '');

/** Generate a reasonably unique id without dependencies. */
export function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Validate a schedule object; returns a clean copy or null. */
export function sanitizeSchedule(s) {
  if (!s || typeof s !== 'object') return null;
  if (s.type === 'interval') {
    const every = Math.floor(Number(s.every));
    if (!Number.isFinite(every) || every < 1 || every > 3650) return null;
    if (!UNITS.includes(s.unit)) return null;
    return { type: 'interval', every, unit: s.unit };
  }
  if (s.type === 'seasonal') {
    if (!Array.isArray(s.dates)) return null;
    const dates = s.dates
      .map((d) => ({ month: Math.floor(Number(d?.month)), day: Math.floor(Number(d?.day)) }))
      .filter((d) => d.month >= 1 && d.month <= 12 && d.day >= 1 && d.day <= 31);
    if (dates.length === 0 || dates.length > 12) return null;
    return { type: 'seasonal', dates };
  }
  return null;
}

/** Validate one task; returns a clean task or null if unusable. */
export function sanitizeTask(t) {
  if (!t || typeof t !== 'object') return null;
  const name = str(t.name, 200).trim();
  const schedule = sanitizeSchedule(t.schedule);
  if (!name || !schedule) return null;
  const history = Array.isArray(t.history)
    ? t.history
        .filter((h) => h && isValidISODate(h.date))
        .map((h) => {
          const entry = { date: h.date, note: str(h.note, 500) };
          // prevDue lets the user undo a completion and restore the old due date.
          if (isValidISODate(h.prevDue)) entry.prevDue = h.prevDue;
          return entry;
        })
        .sort((a, b) => (a.date < b.date ? 1 : -1))
    : [];
  const nextDue = isValidISODate(t.nextDue) ? t.nextDue : initialNextDue(schedule, history[0]?.date);
  return {
    id: str(t.id, 100) || newId(),
    templateId: str(t.templateId, 100) || null,
    name,
    schedule,
    notes: str(t.notes),
    supplies: str(t.supplies, 500),
    seasons: Array.isArray(t.seasons) ? t.seasons.filter((s) => SEASON_IDS.includes(s)) : [],
    nextDue,
    history,
    createdAt: isValidISODate(t.createdAt) ? t.createdAt : today()
  };
}

/** Build the export payload. */
export function buildExport(tasks, now = new Date()) {
  return { app: APP_ID, version: FORMAT_VERSION, exportedAt: now.toISOString(), tasks };
}

/**
 * Parse an import file's text. Throws an Error with a user-facing message
 * when the file is not a valid backup.
 */
export function parseImport(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  const list = Array.isArray(data) ? data : data?.tasks;
  if (!Array.isArray(list)) throw new Error('No tasks found in that file.');
  if (!Array.isArray(data) && data.app && data.app !== APP_ID) {
    throw new Error('That backup is from a different app.');
  }
  const tasks = list.map(sanitizeTask).filter(Boolean);
  // De-duplicate ids so IndexedDB keys stay unique.
  const seen = new Set();
  for (const t of tasks) {
    if (seen.has(t.id)) t.id = newId();
    seen.add(t.id);
  }
  return { tasks, skipped: list.length - tasks.length };
}
