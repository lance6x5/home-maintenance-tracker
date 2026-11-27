import { describe, it, expect } from 'vitest';
import { buildICS, escapeText, foldLine, intervalRRule, icsFilename } from '../src/lib/ics.js';
import { buildExport, parseImport } from '../src/lib/backup.js';
import { TEMPLATES } from '../src/lib/templates.js';
import { sanitizeTask } from '../src/lib/backup.js';
import { tasksNeedingReminder, reminderText } from '../src/lib/notify.js';

const stamp = new Date('2026-11-27T12:00:00Z');

describe('ics', () => {
  it('escapes and folds', () => {
    expect(escapeText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');
    const long = 'DESCRIPTION:' + 'x'.repeat(200);
    const folded = foldLine(long);
    expect(folded.split('\r\n').every((l) => l.length <= 75)).toBe(true);
    expect(folded.replace(/\r\n /g, '')).toBe(long);
  });

  it('builds interval RRULEs', () => {
    expect(intervalRRule({ every: 90, unit: 'days' })).toBe('FREQ=DAILY;INTERVAL=90');
    expect(intervalRRule({ every: 1, unit: 'months' })).toBe('FREQ=MONTHLY');
    expect(intervalRRule({ every: 2, unit: 'weeks' })).toBe('FREQ=WEEKLY;INTERVAL=2');
  });

  it('builds a calendar with one event per seasonal date', () => {
    const tasks = [
      { id: 'a', name: 'Filter', schedule: { type: 'interval', every: 90, unit: 'days' }, nextDue: '2026-12-01', notes: '', supplies: '16x25x1' },
      { id: 'b', name: 'Gutters', schedule: { type: 'seasonal', dates: [{ month: 4, day: 15 }, { month: 11, day: 1 }] }, nextDue: '2027-04-15', notes: '' }
    ];
    const ics = buildICS(tasks, stamp);
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(3);
    expect(ics).toContain('DTSTART;VALUE=DATE:20261201');
    expect(ics).toContain('RRULE:FREQ=DAILY;INTERVAL=90');
    expect(ics).toContain('DTSTART;VALUE=DATE:20270415');
    expect(ics).toContain('DTSTART;VALUE=DATE:20271101');
    expect(ics).toContain('RRULE:FREQ=YEARLY;BYMONTH=11;BYMONTHDAY=1');
    expect(ics).toContain('DTSTAMP:20261127T120000Z');
  });

  it('makes safe filenames', () => {
    expect(icsFilename('Clean gutters!')).toBe('clean-gutters.ics');
  });
});

describe('backup', () => {
  it('round-trips export/import', () => {
    const t = sanitizeTask({ ...TEMPLATES[0], id: 'x1', nextDue: '2026-12-01', history: [{ date: '2026-09-02', note: 'hi', prevDue: '2026-09-01' }] });
    const text = JSON.stringify(buildExport([t], stamp));
    const { tasks, skipped } = parseImport(text);
    expect(skipped).toBe(0);
    expect(tasks[0]).toEqual(t);
  });

  it('skips invalid entries and rejects bad files', () => {
    const { tasks, skipped } = parseImport(JSON.stringify({ tasks: [{ name: 'ok', schedule: { type: 'interval', every: 1, unit: 'years' } }, { name: '' }, { name: 'bad', schedule: { type: 'interval', every: 0, unit: 'days' } }] }));
    expect(tasks).toHaveLength(1);
    expect(skipped).toBe(2);
    expect(() => parseImport('not json')).toThrow(/not valid JSON/);
    expect(() => parseImport('{"foo":1}')).toThrow(/No tasks/);
    expect(() => parseImport('{"app":"other","tasks":[]}')).toThrow(/different app/);
  });

  it('de-duplicates ids', () => {
    const base = { id: 'same', name: 'A', schedule: { type: 'interval', every: 1, unit: 'years' } };
    const { tasks } = parseImport(JSON.stringify([base, { ...base, name: 'B' }]));
    expect(new Set(tasks.map((t) => t.id)).size).toBe(2);
  });

  it('all templates are valid', () => {
    for (const tpl of TEMPLATES) expect(sanitizeTask(tpl)).not.toBeNull();
    expect(TEMPLATES).toHaveLength(11);
  });
});

describe('reminders', () => {
  it('selects overdue and due-today tasks', () => {
    const tasks = [
      { name: 'A', nextDue: '2026-11-20' },
      { name: 'B', nextDue: '2026-11-27' },
      { name: 'C', nextDue: '2026-11-28' }
    ];
    const due = tasksNeedingReminder(tasks, '2026-11-27');
    expect(due.map((t) => t.name)).toEqual(['A', 'B']);
    expect(reminderText(due)).toEqual({ title: '2 home maintenance tasks due', body: 'A, B' });
    expect(reminderText([])).toBeNull();
  });
});
