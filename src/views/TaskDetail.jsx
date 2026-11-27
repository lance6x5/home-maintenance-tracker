/**
 * Task detail: info, mark-done with date/note, completion history,
 * calendar export, edit and delete.
 */
import { useState } from 'react';
import { navigate, useTasks } from '../hooks.js';
import { formatDate, relativeLabel, today } from '../lib/dates.js';
import { describeSchedule, seasonsForTask, statusOf, SEASONS } from '../lib/schedule.js';
import { buildICS, icsFilename } from '../lib/ics.js';
import { downloadText } from '../lib/download.js';
import ConfirmButton from '../components/ConfirmButton.jsx';
import { useToast } from '../components/Toast.jsx';

export default function TaskDetail({ id }) {
  const store = useTasks();
  const toast = useToast();
  const task = store.find(id);
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');

  if (!task) return <p>Task not found. <a href="#/tasks">Back to tasks</a></p>;

  const status = statusOf(task);
  const seasons = seasonsForTask(task).map((s) => SEASONS.find((x) => x.id === s).label);

  const done = async (e) => {
    e.preventDefault();
    if (!date || date > today()) return;
    const updated = await store.markDone(task.id, date, note.trim());
    setNote('');
    setDate(today());
    toast(`Logged. Next due ${formatDate(updated.nextDue)}.`, { label: 'Undo', onClick: () => store.undoDone(task.id) });
  };

  const exportICS = () => {
    downloadText(icsFilename(task.name), buildICS([task]), 'text/calendar');
    toast('Calendar file downloaded. Open it to add the recurring event.');
  };

  return (
    <>
      <p><a href="#/">← Dashboard</a></p>
      <article className={`detail status-${status}`}>
        <h1>{task.name}</h1>
        <p className="card-due">
          <span className={`badge badge-${status}`}>{relativeLabel(task.nextDue)}</span>
          <span>Next due <time dateTime={task.nextDue}>{formatDate(task.nextDue)}</time></span>
        </p>
        <dl className="facts">
          <dt>Schedule</dt><dd>{describeSchedule(task.schedule)}</dd>
          {task.supplies && (<><dt>Supplies</dt><dd>{task.supplies}</dd></>)}
          {seasons.length > 0 && (<><dt>Seasons</dt><dd>{seasons.join(', ')}</dd></>)}
          {task.notes && (<><dt>Notes</dt><dd className="pre">{task.notes}</dd></>)}
        </dl>
      </article>

      <section aria-labelledby="done-h" className="group panel">
        <h2 id="done-h">Mark done</h2>
        <form onSubmit={done} className="inline-form">
          <div className="field">
            <label htmlFor="d-date">Date completed</label>
            <input id="d-date" type="date" value={date} max={today()} required onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field grow">
            <label htmlFor="d-note">Note (optional)</label>
            <input id="d-note" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Used MERV 11 filter" />
          </div>
          <button type="submit" className="btn btn-primary">✓ Mark done</button>
        </form>
      </section>

      <section aria-labelledby="hist-h" className="group">
        <h2 id="hist-h">History ({task.history.length})</h2>
        {task.history.length === 0 ? (
          <p className="muted">Not completed yet.</p>
        ) : (
          <>
            <ol className="history">
              {task.history.map((h, i) => (
                <li key={`${h.date}-${i}`}>
                  <time dateTime={h.date}>{formatDate(h.date)}</time>
                  {h.note && <span className="muted"> — {h.note}</span>}
                </li>
              ))}
            </ol>
            <button type="button" className="btn btn-small" onClick={() => { store.undoDone(task.id); toast('Removed latest completion.'); }}>
              Undo latest completion
            </button>
          </>
        )}
      </section>

      <section aria-labelledby="act-h" className="group">
        <h2 id="act-h">Actions</h2>
        <div className="btn-row">
          <button type="button" className="btn" onClick={exportICS}>📅 Add to calendar (.ics)</button>
          <a className="btn" href={`#/edit/${task.id}`}>Edit</a>
        </div>
        <p className="hint">The calendar file contains a repeating event, so your calendar app can remind you even when this app is closed.</p>
        <ConfirmButton
          label="Delete task"
          prompt={`Delete “${task.name}” and its history?`}
          confirmLabel="Yes, delete"
          onConfirm={async () => {
            await store.remove(task.id);
            toast('Task deleted.');
            navigate('tasks');
          }}
        />
      </section>
    </>
  );
}
