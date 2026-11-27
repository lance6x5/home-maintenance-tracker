/**
 * Card for one task with a color-coded status and a quick "Mark done" action.
 */
import { formatDate, relativeLabel, today } from '../lib/dates.js';
import { describeSchedule, statusOf } from '../lib/schedule.js';
import { useTasks } from '../hooks.js';
import { useToast } from './Toast.jsx';

const STATUS_LABEL = { overdue: 'Overdue', soon: 'Due soon', ok: 'On track' };

export default function TaskCard({ task, showStatus = true }) {
  const store = useTasks();
  const toast = useToast();
  const status = statusOf(task);

  const done = async () => {
    const updated = await store.markDone(task.id, today(), '');
    toast(`“${task.name}” done. Next due ${formatDate(updated.nextDue)}.`, {
      label: 'Undo',
      onClick: () => store.undoDone(task.id)
    });
  };

  return (
    <article className={`card status-${status}`} aria-labelledby={`t-${task.id}`}>
      <div className="card-main">
        <h3 id={`t-${task.id}`} className="card-title">
          <a href={`#/task/${task.id}`}>{task.name}</a>
        </h3>
        <p className="card-due">
          {showStatus && <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>}
          <span>
            {relativeLabel(task.nextDue)} · <time dateTime={task.nextDue}>{formatDate(task.nextDue)}</time>
          </span>
        </p>
        <p className="card-meta">{describeSchedule(task.schedule)}</p>
        {task.supplies && <p className="card-meta">Supplies: {task.supplies}</p>}
      </div>
      <div className="card-actions">
        <button type="button" className="btn btn-primary" onClick={done} aria-label={`Mark “${task.name}” done today`}>
          ✓ Mark done
        </button>
      </div>
    </article>
  );
}
