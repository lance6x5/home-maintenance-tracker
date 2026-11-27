/**
 * Pure task operations (no storage, no React) so they are easy to test.
 */
import { today } from './dates.js';
import { computeNextDue, initialNextDue } from './schedule.js';
import { newId, sanitizeTask } from './backup.js';

/** Create a new task from form/template data. `lastDone` is optional. */
export function createTask(data, lastDone = '', ref = today()) {
  const history = lastDone ? [{ date: lastDone, note: 'Recorded when task was added' }] : [];
  const task = sanitizeTask({
    ...data,
    id: newId(),
    history,
    nextDue: initialNextDue(data.schedule, lastDone, ref),
    createdAt: ref
  });
  if (!task) throw new Error('Task needs a name and a valid schedule.');
  return task;
}

/** Return a copy of the task marked done on `date`, with the next due date scheduled. */
export function markDone(task, date = today(), note = '') {
  const entry = { date, note, prevDue: task.nextDue };
  const history = [entry, ...task.history].sort((a, b) => (a.date < b.date ? 1 : -1));
  return { ...task, history, nextDue: computeNextDue(task, date) };
}

/** Undo the most recent completion, restoring the previous due date when known. */
export function undoLastDone(task) {
  if (!task.history.length) return task;
  const [last, ...rest] = task.history;
  return { ...task, history: rest, nextDue: last.prevDue || task.nextDue };
}

/**
 * Apply edits from the form. If the schedule changed, the next due date is
 * recalculated from the latest completion (or kept if never done).
 */
export function applyEdits(task, data, ref = today()) {
  const scheduleChanged = JSON.stringify(task.schedule) !== JSON.stringify(data.schedule);
  let nextDue = data.nextDue || task.nextDue;
  if (scheduleChanged && !data.nextDue) {
    const last = task.history[0]?.date;
    nextDue = last ? computeNextDue({ ...task, schedule: data.schedule, nextDue: null }, last) : initialNextDue(data.schedule, '', ref);
  }
  const updated = sanitizeTask({ ...task, ...data, nextDue });
  if (!updated) throw new Error('Task needs a name and a valid schedule.');
  return updated;
}
