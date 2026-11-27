/**
 * Seasonal checklist: tasks tagged (or scheduled) for Spring/Summer/Fall/Winter,
 * showing whether each was completed during the latest window of that season.
 */
import { useTasks } from '../hooks.js';
import { formatDate, today } from '../lib/dates.js';
import { SEASONS, currentSeason, doneInSeason, latestSeasonWindow, seasonsForTask } from '../lib/schedule.js';
import { useToast } from '../components/Toast.jsx';

export default function Seasonal({ season }) {
  const store = useTasks();
  const toast = useToast();
  const now = currentSeason();
  const active = SEASONS.some((s) => s.id === season) ? season : now;
  const win = latestSeasonWindow(active);
  const items = store.tasks
    .filter((t) => seasonsForTask(t).includes(active))
    .sort((a, b) => a.name.localeCompare(b.name));
  const doneCount = items.filter((t) => doneInSeason(t, active)).length;

  const toggle = async (t, isDone) => {
    if (isDone) {
      await store.undoDone(t.id);
      toast(`Unchecked “${t.name}”.`);
    } else {
      const u = await store.markDone(t.id, today(), 'Seasonal checklist');
      toast(`“${t.name}” done. Next due ${formatDate(u.nextDue)}.`);
    }
  };

  return (
    <>
      <h1>Seasonal checklist</h1>
      <nav aria-label="Seasons">
        <ul className="tabs">
          {SEASONS.map((s) => (
            <li key={s.id}>
              <a href={`#/seasonal/${s.id}`} aria-current={s.id === active ? 'page' : undefined}>
                {s.label}{s.id === now ? ' (now)' : ''}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <p className="muted">
        Checklist for {formatDate(win.start)} – {formatDate(win.end)}
        {active !== now && ' (most recent)'}. {items.length > 0 && `${doneCount} of ${items.length} done.`}
      </p>

      {items.length === 0 ? (
        <p className="muted">
          No tasks for this season. Fixed-date tasks appear automatically; tag interval tasks with a season from their edit screen.
        </p>
      ) : (
        <ul className="checklist">
          {items.map((t) => {
            const isDone = doneInSeason(t, active);
            const canToggle = active === now;
            return (
              <li key={t.id} className={isDone ? 'checked' : ''}>
                <label>
                  <input
                    type="checkbox"
                    checked={isDone}
                    disabled={!canToggle}
                    onChange={() => toggle(t, isDone)}
                  />
                  <span>{t.name}</span>
                </label>
                <a href={`#/task/${t.id}`} className="muted small">
                  next due {formatDate(t.nextDue)}
                </a>
              </li>
            );
          })}
        </ul>
      )}
      {active !== now && items.length > 0 && (
        <p className="hint">Only the current season can be checked off here. Use a task’s page to log a past date.</p>
      )}
    </>
  );
}
