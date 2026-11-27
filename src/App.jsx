/**
 * App shell: header, navigation and hash-based view switching.
 */
import { useEffect, useRef, useState } from 'react';
import { useHashRoute, useTasks } from './hooks.js';
import { checkAndNotify } from './lib/notify.js';
import { buildIssueUrl } from './lib/feedback.js';
import { getVisitCount, formatVisits } from './lib/visits.js';
import Dashboard from './views/Dashboard.jsx';
import Seasonal from './views/Seasonal.jsx';
import TasksView from './views/TasksView.jsx';
import TaskForm from './views/TaskForm.jsx';
import TaskDetail from './views/TaskDetail.jsx';
import Settings from './views/Settings.jsx';

/* global __APP_VERSION__ */
// Injected at build time by vite.config.js (define).
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';

const UA = typeof navigator !== 'undefined' ? navigator.userAgent : '';
const bugUrl = buildIssueUrl('bug', { version: APP_VERSION, userAgent: UA });
const featureUrl = buildIssueUrl('feature', { version: APP_VERSION });

const NAV = [
  { path: '', label: 'Dashboard' },
  { path: 'seasonal', label: 'Seasonal' },
  { path: 'tasks', label: 'Tasks' },
  { path: 'settings', label: 'Settings' }
];

function View({ parts }) {
  const [view, id] = parts;
  switch (view) {
    case undefined: return <Dashboard />;
    case 'seasonal': return <Seasonal season={id} />;
    case 'tasks': return <TasksView />;
    case 'new': return <TaskForm />;
    case 'edit': return <TaskForm id={id} />;
    case 'task': return <TaskDetail id={id} />;
    case 'settings': return <Settings />;
    default:
      return (
        <section>
          <h1>Page not found</h1>
          <p><a href="#/">Back to the dashboard</a></p>
        </section>
      );
  }
}

export default function App() {
  const parts = useHashRoute();
  const store = useTasks();
  const mainRef = useRef(null);
  const checked = useRef(false);
  const [visits, setVisits] = useState(null);
  const active = ['new', 'edit', 'task'].includes(parts[0]) ? 'tasks' : parts[0] || '';

  // On app open, remind about due tasks (only if the user already granted permission).
  useEffect(() => {
    if (store.loaded && !checked.current) {
      checked.current = true;
      checkAndNotify(store.tasks);
    }
  }, [store.loaded, store.tasks]);

  // Anonymous visit count (fails silently; never blocks the app).
  useEffect(() => {
    let alive = true;
    getVisitCount().then((v) => { if (alive && v !== null) setVisits(v); });
    return () => { alive = false; };
  }, []);

  return (
    <>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}>
        Skip to content
      </a>
      <header className="app-header">
        <a className="brand" href="#/">
          <img src="icon.svg" alt="" width="36" height="36" />
          <span className="brand-text">
            <span className="brand-name">Hearth<span className="brand-accent">keep</span></span>
            <span className="brand-tagline">Home care, season by season</span>
          </span>
        </a>
        <nav aria-label="Main">
          <ul className="nav">
            {NAV.map((n) => (
              <li key={n.path}>
                <a href={`#/${n.path}`} aria-current={active === n.path ? 'page' : undefined}>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="main" ref={mainRef} tabIndex={-1}>
        {store.error && (
          <div className="alert" role="alert">
            {store.error}{' '}
            <button type="button" className="btn btn-small" onClick={store.clearError}>Dismiss</button>
          </div>
        )}
        {store.loaded ? <View parts={parts} /> : <p aria-busy="true">Loading…</p>}
      </main>
      <footer className="app-footer">
        <p>Your task data stays in this browser; the only outside request is an anonymous visit count. Use Settings → Export to back it up.</p>
        <p>
          Hearthkeep <span className="version">v{APP_VERSION}</span> ·{' '}
          <a href="https://github.com/lance6x5/home-maintenance-tracker/blob/main/CHANGELOG.md">Changelog</a>
        </p>
        <p className="visits" aria-live="polite" hidden={visits === null}>
          {visits !== null ? formatVisits(visits) : ''}
        </p>
        <nav className="feedback" aria-labelledby="feedback-heading">
          <h2 id="feedback-heading" className="feedback-heading">Feedback</h2>
          <ul className="feedback-actions">
            <li>
              <a className="btn btn-small" href={bugUrl} target="_blank" rel="noopener noreferrer">
                Report a bug<span className="visually-hidden"> (opens GitHub in a new tab)</span>
              </a>
            </li>
            <li>
              <a className="btn btn-small" href={featureUrl} target="_blank" rel="noopener noreferrer">
                Request a feature<span className="visually-hidden"> (opens GitHub in a new tab)</span>
              </a>
            </li>
          </ul>
          <p className="feedback-note">Opens GitHub — a free GitHub account is required. Don't include personal data.</p>
        </nav>
      </footer>
    </>
  );
}
