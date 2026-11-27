/**
 * Tasks view: quick-add from templates and a list of every task.
 */
import { useTasks } from '../hooks.js';
import { TEMPLATES } from '../lib/templates.js';
import { describeSchedule, statusOf } from '../lib/schedule.js';
import { formatDate } from '../lib/dates.js';
import { useToast } from '../components/Toast.jsx';

export default function TasksView() {
  const store = useTasks();
  const toast = useToast();
  const enabled = new Set(store.tasks.map((t) => t.templateId).filter(Boolean));
  const available = TEMPLATES.filter((t) => !enabled.has(t.templateId));
  const sorted = [...store.tasks].sort((a, b) => a.name.localeCompare(b.name));

  const addTemplate = async (tpl) => {
    const task = await store.add(tpl);
    toast(`Added “${task.name}”. First due ${formatDate(task.nextDue)}.`);
  };

  const addAll = async () => {
    for (const tpl of available) await store.add(tpl);
    toast(`Added ${available.length} tasks.`);
  };

  return (
    <>
      <div className="title-row">
        <h1>Tasks</h1>
        <a className="btn btn-primary" href="#/new">+ Custom task</a>
      </div>

      <section aria-labelledby="tpl-h" className="group">
        <h2 id="tpl-h">Quick add from templates</h2>
        {available.length === 0 ? (
          <p className="muted">All templates are enabled.</p>
        ) : (
          <>
            <p className="muted">
              Interval tasks start due today (edit the date if you did it recently); seasonal tasks start on their next date.
            </p>
            <ul className="template-list">
              {available.map((tpl) => (
                <li key={tpl.templateId} className="template">
                  <div>
                    <strong>{tpl.name}</strong>
                    <span className="muted"> — {describeSchedule(tpl.schedule)}</span>
                  </div>
                  <button type="button" className="btn btn-small" onClick={() => addTemplate(tpl)} aria-label={`Add ${tpl.name}`}>
                    + Add
                  </button>
                </li>
              ))}
            </ul>
            {available.length > 1 && (
              <button type="button" className="btn" onClick={addAll}>Add all {available.length}</button>
            )}
          </>
        )}
      </section>

      <section aria-labelledby="all-h" className="group">
        <h2 id="all-h">Your tasks ({sorted.length})</h2>
        {sorted.length === 0 ? (
          <p className="muted">No tasks yet.</p>
        ) : (
          <ul className="task-list">
            {sorted.map((t) => (
              <li key={t.id} className={`task-row status-${statusOf(t)}`}>
                <a href={`#/task/${t.id}`}>{t.name}</a>
                <span className="muted">
                  {describeSchedule(t.schedule)} · next {formatDate(t.nextDue)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
