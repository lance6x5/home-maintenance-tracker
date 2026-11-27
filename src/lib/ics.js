/**
 * iCalendar (.ics) export. Each task becomes an all-day recurring event with
 * an RRULE so the user's calendar app handles reminders reliably — no push
 * server needed.
 */
import { addDays, parseISODate } from './dates.js';
import { describeSchedule, nextSeasonalDate } from './schedule.js';

const FREQ = { days: 'DAILY', weeks: 'WEEKLY', months: 'MONTHLY', years: 'YEARLY' };

/** Escape text per RFC 5545 section 3.3.11. */
export function escapeText(str = '') {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Fold lines longer than 75 octets (RFC 5545 section 3.1). */
export function foldLine(line) {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const parts = [];
  let current = '';
  let bytes = 0;
  for (const ch of line) {
    const len = enc.encode(ch).length;
    // Continuation lines start with a space, which counts toward the limit.
    const limit = parts.length === 0 ? 75 : 74;
    if (bytes + len > limit) {
      parts.push(current);
      current = '';
      bytes = 0;
    }
    current += ch;
    bytes += len;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

const icsDate = (iso) => iso.replace(/-/g, '');

function utcStamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** RRULE string for an interval schedule. */
export function intervalRRule(schedule) {
  const freq = FREQ[schedule.unit];
  const n = Math.max(1, Math.floor(Number(schedule.every) || 1));
  return n === 1 ? `FREQ=${freq}` : `FREQ=${freq};INTERVAL=${n}`;
}

function description(task) {
  const lines = [describeSchedule(task.schedule)];
  if (task.notes) lines.push(task.notes);
  if (task.supplies) lines.push(`Supplies: ${task.supplies}`);
  return lines.join('\n');
}

/** Build VEVENT line arrays for one task (seasonal tasks produce one per date). */
export function taskEvents(task, stamp = new Date()) {
  const base = (uidSuffix, start, rrule) => [
    'BEGIN:VEVENT',
    `UID:${task.id}${uidSuffix}@home-maintenance-tracker`,
    `DTSTAMP:${utcStamp(stamp)}`,
    `DTSTART;VALUE=DATE:${icsDate(start)}`,
    `DTEND;VALUE=DATE:${icsDate(addDays(start, 1))}`,
    `RRULE:${rrule}`,
    `SUMMARY:${escapeText(task.name)}`,
    `DESCRIPTION:${escapeText(description(task))}`,
    'TRANSP:TRANSPARENT',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(task.name)}`,
    'TRIGGER;RELATED=START:PT9H',
    'END:VALARM',
    'END:VEVENT'
  ];

  if (task.schedule.type === 'interval') {
    return [base('', task.nextDue, intervalRRule(task.schedule))];
  }
  return task.schedule.dates.map((d, i) => {
    // Start each yearly series at its own next occurrence on/after the due date.
    const start = nextSeasonalDate([d], task.nextDue) ?? task.nextDue;
    const p = parseISODate(start);
    return base(`-${i}`, start, `FREQ=YEARLY;BYMONTH=${p.m};BYMONTHDAY=${d.day}`);
  });
}

/** Full VCALENDAR text for one or more tasks. */
export function buildICS(tasks, stamp = new Date()) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Home Maintenance Tracker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...tasks.flatMap((t) => taskEvents(t, stamp).flat()),
    'END:VCALENDAR'
  ];
  return lines.map(foldLine).join('\r\n') + '\r\n';
}

/** Safe filename from a task name. */
export function icsFilename(name) {
  const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${slug || 'tasks'}.ics`;
}
