/**
 * Scheduling logic: next-due calculation, status, grouping and seasons.
 *
 * A task's `schedule` is one of:
 *   { type: 'interval', every: 3, unit: 'days' | 'weeks' | 'months' | 'years' }
 *   { type: 'seasonal', dates: [{ month: 4, day: 15 }, { month: 10, day: 15 }] }
 * Seasonal tasks recur every year on each listed month/day.
 */
import { addDays, addMonths, diffDays, daysInMonth, parseISODate, today, formatMonthDay } from './dates.js';

export const UNITS = ['days', 'weeks', 'months', 'years'];

export const SEASONS = [
  { id: 'spring', label: 'Spring', months: [3, 4, 5] },
  { id: 'summer', label: 'Summer', months: [6, 7, 8] },
  { id: 'fall', label: 'Fall', months: [9, 10, 11] },
  { id: 'winter', label: 'Winter', months: [12, 1, 2] }
];

/** Number of days ahead that counts as "due this week". */
export const SOON_DAYS = 7;

/** Add an interval (every N units) to a date string. */
export function addInterval(date, every, unit) {
  const n = Math.max(1, Math.floor(Number(every) || 1));
  switch (unit) {
    case 'days': return addDays(date, n);
    case 'weeks': return addDays(date, n * 7);
    case 'months': return addMonths(date, n);
    case 'years': return addMonths(date, n * 12);
    default: throw new Error(`Unknown unit: ${unit}`);
  }
}

/** Build a date string for month/day in year y, clamping Feb 29 etc. */
function seasonalDateInYear(y, month, day) {
  const d = Math.min(day, daysInMonth(y, month));
  return `${y}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/**
 * Next occurrence of any of the seasonal `dates` on/after `from`
 * (or strictly after when `strict` is true).
 */
export function nextSeasonalDate(dates, from, strict = false) {
  if (!dates || dates.length === 0) return null;
  const { y } = parseISODate(from);
  const candidates = [];
  for (const year of [y, y + 1]) {
    for (const { month, day } of dates) candidates.push(seasonalDateInYear(year, month, day));
  }
  candidates.sort();
  return candidates.find((c) => (strict ? c > from : c >= from)) ?? null;
}

/**
 * Next due date after the task is completed on `doneDate`.
 * Seasonal tasks advance past both the completion date and the current due
 * date, so finishing a little early still counts for this occurrence.
 */
export function computeNextDue(task, doneDate) {
  const s = task.schedule;
  if (s.type === 'interval') return addInterval(doneDate, s.every, s.unit);
  if (s.type === 'seasonal') {
    const anchor = task.nextDue && task.nextDue > doneDate ? task.nextDue : doneDate;
    return nextSeasonalDate(s.dates, anchor, true);
  }
  throw new Error(`Unknown schedule type: ${s.type}`);
}

/**
 * First due date for a newly created task. If the user knows when it was
 * last done we schedule from that; otherwise interval tasks are due today
 * and seasonal tasks are due on their next seasonal date.
 */
export function initialNextDue(schedule, lastDone, ref = today()) {
  if (schedule.type === 'interval') {
    return lastDone ? addInterval(lastDone, schedule.every, schedule.unit) : ref;
  }
  return nextSeasonalDate(schedule.dates, lastDone || ref, Boolean(lastDone));
}

/** 'overdue' | 'soon' | 'ok' relative to `ref`. */
export function statusOf(task, ref = today()) {
  const n = diffDays(ref, task.nextDue);
  if (n < 0) return 'overdue';
  if (n <= SOON_DAYS) return 'soon';
  return 'ok';
}

/** Group tasks for the dashboard, each group sorted by due date then name. */
export function groupTasks(tasks, ref = today()) {
  const groups = { overdue: [], soon: [], ok: [] };
  for (const t of tasks) groups[statusOf(t, ref)].push(t);
  const byDate = (a, b) => (a.nextDue < b.nextDue ? -1 : a.nextDue > b.nextDue ? 1 : a.name.localeCompare(b.name));
  for (const k of Object.keys(groups)) groups[k].sort(byDate);
  return groups;
}

/** Season id for a given month (1-12). */
export function seasonForMonth(month) {
  return SEASONS.find((s) => s.months.includes(month)).id;
}

export function currentSeason(ref = today()) {
  return seasonForMonth(parseISODate(ref).m);
}

/**
 * Seasons a task belongs to for the seasonal checklist: explicit tags win,
 * otherwise seasonal tasks are placed by the months of their dates.
 */
export function seasonsForTask(task) {
  if (Array.isArray(task.seasons) && task.seasons.length) return task.seasons;
  if (task.schedule?.type === 'seasonal') {
    return [...new Set(task.schedule.dates.map((d) => seasonForMonth(d.month)))];
  }
  return [];
}

/** Date window { start, end } of one season in a given year (winter spans into y+1). */
export function seasonWindowForYear(seasonId, y) {
  switch (seasonId) {
    case 'spring': return { start: `${y}-03-01`, end: `${y}-05-31` };
    case 'summer': return { start: `${y}-06-01`, end: `${y}-08-31` };
    case 'fall': return { start: `${y}-09-01`, end: `${y}-11-30` };
    case 'winter': return { start: `${y}-12-01`, end: seasonalDateInYear(y + 1, 2, 29) };
    default: throw new Error(`Unknown season: ${seasonId}`);
  }
}

/** The current or most recent window of a season relative to `ref`. */
export function latestSeasonWindow(seasonId, ref = today()) {
  const { y } = parseISODate(ref);
  for (const year of [y, y - 1]) {
    const w = seasonWindowForYear(seasonId, year);
    if (w.start <= ref) return { ...w, year };
  }
  return null;
}

/** True if the task has a completion inside the latest window of the season. */
export function doneInSeason(task, seasonId, ref = today()) {
  const w = latestSeasonWindow(seasonId, ref);
  return (task.history || []).some((h) => h.date >= w.start && h.date <= w.end);
}

/** Human readable schedule, e.g. "Every 90 days" or "Yearly on Apr 15, Oct 15". */
export function describeSchedule(schedule) {
  if (schedule.type === 'interval') {
    const n = Number(schedule.every);
    const unit = n === 1 ? schedule.unit.replace(/s$/, '') : schedule.unit;
    return n === 1 ? `Every ${unit}` : `Every ${n} ${unit}`;
  }
  const dates = [...schedule.dates].sort((a, b) => a.month - b.month || a.day - b.day);
  return `Yearly on ${dates.map((d) => formatMonthDay(d.month, d.day)).join(', ')}`;
}
