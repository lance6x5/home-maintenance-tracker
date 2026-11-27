/**
 * Create / edit form for a task: interval or fixed seasonal dates, notes,
 * supplies and seasonal checklist tags.
 */
import { useState } from 'react';
import { navigate, useTasks } from '../hooks.js';
import { MONTH_NAMES, isValidISODate, today } from '../lib/dates.js';
import { SEASONS, UNITS } from '../lib/schedule.js';
import { useToast } from '../components/Toast.jsx';

const blank = {
  name: '',
  scheduleType: 'interval',
  every: 3,
  unit: 'months',
  dates: [{ month: 4, day: 15 }],
  notes: '',
  supplies: '',
  seasons: [],
  date: '' // "last done" for new tasks, "next due" when editing
};

function fromTask(t) {
  return {
    name: t.name,
    scheduleType: t.schedule.type,
    every: t.schedule.every ?? 3,
    unit: t.schedule.unit ?? 'months',
    dates: t.schedule.dates ?? [{ month: 4, day: 15 }],
    notes: t.notes,
    supplies: t.supplies,
    seasons: t.seasons || [],
    date: t.nextDue
  };
}

export default function TaskForm({ id }) {
  const store = useTasks();
  const toast = useToast();
  const existing = id ? store.find(id) : null;
  const [f, setF] = useState(() => (existing ? fromTask(existing) : blank));
  const [errors, setErrors] = useState({});

  if (id && !existing) {
    return <p>Task not found. <a href="#/tasks">Back to tasks</a></p>;
  }

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setDate = (i, k, v) => setF({ ...f, dates: f.dates.map((d, j) => (j === i ? { ...d, [k]: Number(v) } : d)) });
  const toggleSeason = (s) =>
    setF({ ...f, seasons: f.seasons.includes(s) ? f.seasons.filter((x) => x !== s) : [...f.seasons, s] });

  const validate = () => {
    const e = {};
    if (!f.name.trim()) e.name = 'Please enter a task name.';
    if (f.scheduleType === 'interval' && !(Number(f.every) >= 1 && Number(f.every) <= 3650)) e.every = 'Enter a number from 1 to 3650.';
    if (f.scheduleType === 'seasonal' && f.dates.some((d) => !(d.day >= 1 && d.day <= 31))) e.dates = 'Each day must be 1–31.';
    if (f.date && !isValidISODate(f.date)) e.date = 'Enter a valid date.';
    if (!existing && f.date && f.date > today()) e.date = 'Last done can’t be in the future.';
    if (existing && !f.date) e.date = 'Next due date is required.';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(`f-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    const schedule =
      f.scheduleType === 'interval'
        ? { type: 'interval', every: Number(f.every), unit: f.unit }
        : { type: 'seasonal', dates: f.dates };
    const data = { name: f.name.trim(), schedule, notes: f.notes, supplies: f.supplies, seasons: f.seasons };
    try {
      if (existing) {
        const scheduleChanged = JSON.stringify(existing.schedule) !== JSON.stringify(schedule);
        // If the schedule changed and the user didn't touch the due date, let it recalculate.
        const nextDue = scheduleChanged && f.date === existing.nextDue ? undefined : f.date;
        const t = await store.update(existing.id, { ...data, nextDue });
        toast(`Saved “${t.name}”.`);
        navigate(`task/${t.id}`);
      } else {
        const t = await store.add(data, f.date);
        toast(`Added “${t.name}”.`);
        navigate(`task/${t.id}`);
      }
    } catch (err) {
      setErrors({ form: err.message });
    }
  };

  const err = (k) => errors[k] && <p className="field-error" id={`e-${k}`}>{errors[k]}</p>;

  return (
    <form onSubmit={submit} noValidate className="form">
      <h1>{existing ? 'Edit task' : 'New task'}</h1>
      {errors.form && <p className="alert" role="alert">{errors.form}</p>}

      <div className="field">
        <label htmlFor="f-name">Task name</label>
        <input id="f-name" value={f.name} onChange={set('name')} required maxLength={200}
          aria-invalid={!!errors.name} aria-describedby={errors.name ? 'e-name' : undefined} />
        {err('name')}
      </div>

      <fieldset className="field">
        <legend>Repeats</legend>
        <div className="radio-row">
          <label><input type="radio" name="stype" value="interval" checked={f.scheduleType === 'interval'} onChange={set('scheduleType')} /> On an interval</label>
          <label><input type="radio" name="stype" value="seasonal" checked={f.scheduleType === 'seasonal'} onChange={set('scheduleType')} /> On fixed dates each year</label>
        </div>

        {f.scheduleType === 'interval' ? (
          <div className="inline-fields">
            <label htmlFor="f-every">Every</label>
            <input id="f-every" type="number" min="1" max="3650" inputMode="numeric" value={f.every} onChange={set('every')}
              className="input-short" aria-invalid={!!errors.every} aria-describedby={errors.every ? 'e-every' : undefined} />
            <label htmlFor="f-unit" className="visually-hidden">Unit</label>
            <select id="f-unit" value={f.unit} onChange={set('unit')}>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        ) : (
          <div>
            {f.dates.map((d, i) => (
              <div className="inline-fields" key={i}>
                <label htmlFor={`f-m-${i}`} className="visually-hidden">Month {i + 1}</label>
                <select id={`f-m-${i}`} value={d.month} onChange={(e) => setDate(i, 'month', e.target.value)}>
                  {MONTH_NAMES.map((m, j) => <option key={m} value={j + 1}>{m}</option>)}
                </select>
                <label htmlFor={i === 0 ? 'f-dates' : `f-d-${i}`} className="visually-hidden">Day {i + 1}</label>
                <input id={i === 0 ? 'f-dates' : `f-d-${i}`} type="number" min="1" max="31" className="input-short" value={d.day}
                  onChange={(e) => setDate(i, 'day', e.target.value)} />
                {f.dates.length > 1 && (
                  <button type="button" className="btn btn-small" aria-label={`Remove date ${i + 1}`}
                    onClick={() => setF({ ...f, dates: f.dates.filter((_, j) => j !== i) })}>Remove</button>
                )}
              </div>
            ))}
            {err('dates')}
            {f.dates.length < 12 && (
              <button type="button" className="btn btn-small" onClick={() => setF({ ...f, dates: [...f.dates, { month: 10, day: 15 }] })}>
                + Add another date
              </button>
            )}
          </div>
        )}
        {err('every')}
      </fieldset>

      <div className="field">
        <label htmlFor="f-date">{existing ? 'Next due date' : 'Last done (optional)'}</label>
        <input id="f-date" type="date" value={f.date} onChange={set('date')} max={existing ? undefined : today()}
          aria-invalid={!!errors.date} aria-describedby={errors.date ? 'e-date' : 'h-date'} />
        <p className="hint" id="h-date">
          {existing ? 'Override when this is next due.' : 'If you know when you last did this, the first due date is scheduled from it.'}
        </p>
        {err('date')}
      </div>

      <div className="field">
        <label htmlFor="f-supplies">Supplies (optional)</label>
        <input id="f-supplies" value={f.supplies} onChange={set('supplies')} maxLength={500} placeholder="e.g. Filter size 16x25x1" />
      </div>

      <div className="field">
        <label htmlFor="f-notes">Notes (optional)</label>
        <textarea id="f-notes" rows={3} value={f.notes} onChange={set('notes')} maxLength={2000} />
      </div>

      <fieldset className="field">
        <legend>Show in seasonal checklist</legend>
        <p className="hint">Leave empty to place fixed-date tasks automatically by month.</p>
        <div className="radio-row">
          {SEASONS.map((s) => (
            <label key={s.id}>
              <input type="checkbox" checked={f.seasons.includes(s.id)} onChange={() => toggleSeason(s.id)} /> {s.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="btn-row">
        <button type="submit" className="btn btn-primary">{existing ? 'Save changes' : 'Add task'}</button>
        <a className="btn" href={existing ? `#/task/${existing.id}` : '#/tasks'}>Cancel</a>
      </div>
    </form>
  );
}
