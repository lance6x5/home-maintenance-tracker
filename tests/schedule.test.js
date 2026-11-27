import { describe, it, expect } from 'vitest';
import { addDays, addMonths, diffDays, relativeLabel } from '../src/lib/dates.js';
import {
  addInterval, computeNextDue, initialNextDue, nextSeasonalDate, statusOf, groupTasks,
  seasonsForTask, latestSeasonWindow, doneInSeason, describeSchedule, currentSeason
} from '../src/lib/schedule.js';
import { createTask, markDone, undoLastDone, applyEdits } from '../src/lib/tasks.js';

describe('dates', () => {
  it('adds days across month/year boundaries', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('clamps month addition to month end', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29');
    expect(addMonths('2026-11-15', 3)).toBe('2027-02-15');
  });
  it('diffs and labels', () => {
    expect(diffDays('2026-01-01', '2026-03-01')).toBe(59);
    expect(relativeLabel('2026-05-01', '2026-05-03')).toBe('2 days overdue');
    expect(relativeLabel('2026-05-03', '2026-05-03')).toBe('Due today');
  });
});

describe('schedule', () => {
  it('adds intervals', () => {
    expect(addInterval('2026-01-01', 90, 'days')).toBe('2026-04-01');
    expect(addInterval('2026-01-01', 2, 'weeks')).toBe('2026-01-15');
    expect(addInterval('2026-08-31', 6, 'months')).toBe('2027-02-28');
    expect(addInterval('2028-02-29', 1, 'years')).toBe('2029-02-28');
  });

  it('finds next seasonal date', () => {
    const dates = [{ month: 4, day: 15 }, { month: 11, day: 1 }];
    expect(nextSeasonalDate(dates, '2026-04-15')).toBe('2026-04-15');
    expect(nextSeasonalDate(dates, '2026-04-15', true)).toBe('2026-11-01');
    expect(nextSeasonalDate(dates, '2026-11-27')).toBe('2027-04-15');
  });

  it('seasonal completion done early advances past the current due date', () => {
    const task = { schedule: { type: 'seasonal', dates: [{ month: 4, day: 15 }, { month: 11, day: 1 }] }, nextDue: '2026-11-01' };
    expect(computeNextDue(task, '2026-10-20')).toBe('2027-04-15');
    expect(computeNextDue(task, '2026-11-20')).toBe('2027-04-15');
  });

  it('initial due date', () => {
    expect(initialNextDue({ type: 'interval', every: 90, unit: 'days' }, '', '2026-11-27')).toBe('2026-11-27');
    expect(initialNextDue({ type: 'interval', every: 90, unit: 'days' }, '2026-10-01', '2026-11-27')).toBe('2026-12-30');
    expect(initialNextDue({ type: 'seasonal', dates: [{ month: 3, day: 15 }] }, '', '2026-11-27')).toBe('2027-03-15');
  });

  it('status and grouping', () => {
    const ref = '2026-06-10';
    const tasks = [
      { name: 'b', nextDue: '2026-06-09' },
      { name: 'a', nextDue: '2026-06-01' },
      { name: 'c', nextDue: '2026-06-17' },
      { name: 'd', nextDue: '2026-06-18' }
    ];
    expect(statusOf(tasks[0], ref)).toBe('overdue');
    expect(statusOf(tasks[2], ref)).toBe('soon');
    expect(statusOf(tasks[3], ref)).toBe('ok');
    const g = groupTasks(tasks, ref);
    expect(g.overdue.map((t) => t.name)).toEqual(['a', 'b']);
    expect(g.soon.map((t) => t.name)).toEqual(['c']);
    expect(g.ok.map((t) => t.name)).toEqual(['d']);
  });

  it('seasons and windows', () => {
    expect(currentSeason('2026-01-10')).toBe('winter');
    expect(seasonsForTask({ schedule: { type: 'seasonal', dates: [{ month: 4, day: 1 }, { month: 10, day: 1 }] } })).toEqual(['spring', 'fall']);
    expect(seasonsForTask({ seasons: ['summer'], schedule: { type: 'interval', every: 1, unit: 'years' } })).toEqual(['summer']);
    expect(latestSeasonWindow('winter', '2026-01-10')).toMatchObject({ start: '2025-12-01', end: '2026-02-28' });
    expect(latestSeasonWindow('spring', '2026-01-10')).toMatchObject({ start: '2025-03-01', end: '2025-05-31' });
    const t = { history: [{ date: '2026-10-05' }] };
    expect(doneInSeason(t, 'fall', '2026-11-27')).toBe(true);
    expect(doneInSeason(t, 'spring', '2026-11-27')).toBe(false);
  });

  it('describes schedules', () => {
    expect(describeSchedule({ type: 'interval', every: 1, unit: 'months' })).toBe('Every month');
    expect(describeSchedule({ type: 'interval', every: 90, unit: 'days' })).toBe('Every 90 days');
    expect(describeSchedule({ type: 'seasonal', dates: [{ month: 11, day: 1 }, { month: 4, day: 15 }] })).toBe('Yearly on Apr 15, Nov 1');
  });
});

describe('task operations', () => {
  const data = { name: 'Filter', schedule: { type: 'interval', every: 90, unit: 'days' } };

  it('creates, marks done and undoes', () => {
    const t = createTask(data, '', '2026-01-01');
    expect(t.nextDue).toBe('2026-01-01');
    const d = markDone(t, '2026-01-05', 'MERV 11');
    expect(d.nextDue).toBe('2026-04-05');
    expect(d.history[0]).toMatchObject({ date: '2026-01-05', note: 'MERV 11', prevDue: '2026-01-01' });
    const u = undoLastDone(d);
    expect(u.history).toHaveLength(0);
    expect(u.nextDue).toBe('2026-01-01');
  });

  it('recalculates due date when schedule changes', () => {
    const t = markDone(createTask(data, '', '2026-01-01'), '2026-01-01');
    const e = applyEdits(t, { ...data, schedule: { type: 'interval', every: 30, unit: 'days' } });
    expect(e.nextDue).toBe('2026-01-31');
  });

  it('rejects invalid tasks', () => {
    expect(() => createTask({ name: '', schedule: data.schedule })).toThrow();
  });
});
