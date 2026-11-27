/**
 * Settings: reminders (with an honest explanation), calendar export,
 * JSON backup/restore and reset.
 */
import { useEffect, useRef, useState } from 'react';
import { navigate, useTasks } from '../hooks.js';
import { buildExport, parseImport } from '../lib/backup.js';
import { buildICS } from '../lib/ics.js';
import { downloadText } from '../lib/download.js';
import { today } from '../lib/dates.js';
import {
  checkAndNotify, notificationsSupported, permissionState, registerPeriodicCheck, requestPermission, sendTestNotification
} from '../lib/notify.js';
import ConfirmButton from '../components/ConfirmButton.jsx';
import { useToast } from '../components/Toast.jsx';

const PERMISSION_TEXT = {
  granted: 'Notifications are on.',
  denied: 'Notifications are blocked. You can re-enable them in your browser’s site settings.',
  default: 'Notifications are off.',
  unsupported: 'This browser does not support notifications.'
};

export default function Settings() {
  const store = useTasks();
  const toast = useToast();
  const fileRef = useRef(null);
  const [perm, setPerm] = useState(permissionState());
  const [explained, setExplained] = useState(false);
  const [periodic, setPeriodic] = useState(null);
  const [importMsg, setImportMsg] = useState('');

  useEffect(() => {
    if (perm === 'granted') registerPeriodicCheck().then(setPeriodic);
  }, [perm]);

  const enable = async () => {
    const result = await requestPermission();
    setPerm(result);
    setExplained(false);
    if (result === 'granted') {
      toast('Notifications enabled.');
      checkAndNotify(store.tasks, { force: true });
    }
  };

  const exportJSON = () => {
    downloadText(`home-maintenance-backup-${today()}.json`, JSON.stringify(buildExport(store.tasks), null, 2));
    toast('Backup downloaded.');
  };

  const exportAllICS = () => {
    downloadText('home-maintenance.ics', buildICS(store.tasks), 'text/calendar');
    toast('Calendar file downloaded.');
  };

  const importJSON = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const { tasks, skipped } = parseImport(await file.text());
      await store.replaceAll(tasks);
      setImportMsg(`Imported ${tasks.length} task${tasks.length === 1 ? '' : 's'}${skipped ? ` (${skipped} invalid entr${skipped === 1 ? 'y' : 'ies'} skipped)` : ''}.`);
    } catch (err) {
      setImportMsg(`Import failed: ${err.message}`);
    }
  };

  return (
    <>
      <h1>Settings</h1>

      <section aria-labelledby="rem-h" className="group panel">
        <h2 id="rem-h">Reminders</h2>
        <p role="status">{PERMISSION_TEXT[perm]}</p>
        <div className="callout">
          <p><strong>How reminders work (honestly):</strong></p>
          <ul>
            <li>This is a static website with no server, so it can’t send push messages.</li>
            <li>When you open the app (or the installed app), it checks for due and overdue tasks and shows one notification per day.</li>
            <li>
              Some browsers (Chrome/Edge with the app installed) may also run a background check roughly daily — but the browser
              decides when, and it typically only works if you’ve used the app recently.
              {perm === 'granted' && periodic !== null && (
                <> Background check on this device: <strong>{periodic ? 'enabled' : 'not available'}</strong>.</>
              )}
            </li>
            <li><strong>For reliable reminders, use “Add to calendar” below</strong> — your calendar app will remind you on schedule.</li>
          </ul>
        </div>
        {notificationsSupported() && perm === 'default' && !explained && (
          <button type="button" className="btn btn-primary" onClick={() => setExplained(true)}>Turn on notifications…</button>
        )}
        {explained && (
          <div className="confirm">
            <p>Your browser will now ask for permission. We’ll only notify you about due maintenance tasks — nothing else.</p>
            <div className="btn-row">
              <button type="button" className="btn btn-primary" onClick={enable}>Continue</button>
              <button type="button" className="btn" onClick={() => setExplained(false)}>Not now</button>
            </div>
          </div>
        )}
        {perm === 'granted' && (
          <button type="button" className="btn" onClick={() => sendTestNotification()}>Send test notification</button>
        )}
      </section>

      <section aria-labelledby="cal-h" className="group panel">
        <h2 id="cal-h">Calendar</h2>
        <p>Download every task as repeating calendar events (.ics). Import the file into Google Calendar, Apple Calendar or Outlook.</p>
        <p className="hint">Re-export after you mark tasks done or change schedules; calendars repeat from the original start date.</p>
        <button type="button" className="btn" onClick={exportAllICS} disabled={store.tasks.length === 0}>📅 Export all to calendar</button>
      </section>

      <section aria-labelledby="bk-h" className="group panel">
        <h2 id="bk-h">Backup &amp; restore</h2>
        <p>Your data lives only in this browser. Export a JSON backup to keep it safe or move it to another device.</p>
        <div className="btn-row">
          <button type="button" className="btn" onClick={exportJSON}>Export JSON</button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>Import JSON…</button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="visually-hidden" onChange={importJSON}
            aria-label="Choose a backup file to import" tabIndex={-1} />
        </div>
        <p className="hint">Importing replaces all current tasks.</p>
        {importMsg && <p role="status">{importMsg}</p>}
      </section>

      <section aria-labelledby="rs-h" className="group panel danger-zone">
        <h2 id="rs-h">Reset</h2>
        <p>Permanently delete all tasks and history from this browser.</p>
        <ConfirmButton
          label="Reset all data"
          prompt="Delete ALL tasks and history? This can’t be undone (export a backup first)."
          confirmLabel="Yes, delete everything"
          onConfirm={async () => {
            await store.resetAll();
            toast('All data deleted.');
            navigate('');
          }}
        />
      </section>
    </>
  );
}
