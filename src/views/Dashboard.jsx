/**
 * Dashboard: tasks grouped into Overdue, Due this week and Upcoming.
 */
import { useTasks } from '../hooks.js';
import { groupTasks } from '../lib/schedule.js';
import TaskCard from '../components/TaskCard.jsx';

const GROUPS = [
  { key: 'overdue', title: 'Overdue', empty: 'Nothing overdue. Nice work!' },
  { key: 'soon', title: 'Due this week', empty: 'Nothing due in the next 7 days.' },
  { key: 'ok', title: 'Upcoming', empty: 'No upcoming tasks.' }
];

export default function Dashboard() {
  const { tasks } = useTasks();

  if (tasks.length === 0) {
    return (
      <section className="empty">
        <h1>Welcome!</h1>
        <p>Track furnace filters, gutter cleaning, detector tests and more. Start by adding a few common tasks.</p>
        <p className="btn-row">
          <a className="btn btn-primary" href="#/tasks">Add from templates</a>
          <a className="btn" href="#/new">Create a custom task</a>
        </p>
      </section>
    );
  }

  const groups = groupTasks(tasks);
  return (
    <>
      <h1>Dashboard</h1>
      <p className="summary">
        <span className="pill pill-overdue">{groups.overdue.length} overdue</span>
        <span className="pill pill-soon">{groups.soon.length} this week</span>
        <span className="pill pill-ok">{groups.ok.length} upcoming</span>
      </p>
      {GROUPS.map((g) => (
        <section key={g.key} aria-labelledby={`g-${g.key}`} className="group">
          <h2 id={`g-${g.key}`}>
            {g.title} <span className="count">({groups[g.key].length})</span>
          </h2>
          {groups[g.key].length === 0 ? (
            <p className="muted">{g.empty}</p>
          ) : (
            <div className="cards">
              {groups[g.key].map((t) => <TaskCard key={t.id} task={t} />)}
            </div>
          )}
        </section>
      ))}
    </>
  );
}
