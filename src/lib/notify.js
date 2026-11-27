/**
 * Browser notification helpers.
 *
 * Honesty note: this is a static site with no push server. Notifications can
 * only be shown when the app is opened, or when the browser decides to run a
 * Periodic Background Sync for an installed PWA (Chromium only, best effort).
 */
import { today } from './dates.js';
import { statusOf } from './schedule.js';

const LAST_KEY = 'hmt-last-notified';
export const NOTIFY_TAG = 'hmt-due';
export const SYNC_TAG = 'hmt-due-check';

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function permissionState() {
  return notificationsSupported() ? Notification.permission : 'unsupported';
}

export async function requestPermission() {
  if (!notificationsSupported()) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/** Tasks that warrant a reminder: overdue or due today. */
export function tasksNeedingReminder(tasks, ref = today()) {
  return tasks.filter((t) => statusOf(t, ref) === 'overdue' || t.nextDue === ref);
}

/** Build notification title/body for a list of due tasks. */
export function reminderText(due) {
  if (due.length === 0) return null;
  const title = due.length === 1 ? 'Home maintenance due' : `${due.length} home maintenance tasks due`;
  const names = due.slice(0, 3).map((t) => t.name).join(', ');
  const more = due.length > 3 ? ` and ${due.length - 3} more` : '';
  return { title, body: `${names}${more}` };
}

async function show(title, options) {
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) return await reg.showNotification(title, options);
    }
    new Notification(title, options);
  } catch (e) {
    console.warn('Could not show notification', e);
  }
}

/**
 * Called on app open: notify about due tasks at most once per day.
 * `force` bypasses the once-a-day throttle (used by the "send test" button).
 */
export async function checkAndNotify(tasks, { force = false } = {}) {
  if (permissionState() !== 'granted') return false;
  const ref = today();
  let last = null;
  try {
    last = localStorage.getItem(LAST_KEY);
  } catch {
    /* ignore */
  }
  if (!force && last === ref) return false;
  const text = reminderText(tasksNeedingReminder(tasks, ref));
  if (!text) return false;
  await show(text.title, { body: text.body, tag: NOTIFY_TAG, icon: 'icon-192.png', badge: 'icon.svg' });
  try {
    localStorage.setItem(LAST_KEY, ref);
  } catch {
    /* ignore */
  }
  return true;
}

/** Show a sample notification so the user can confirm it works. */
export async function sendTestNotification() {
  if (permissionState() !== 'granted') return false;
  await show('Notifications are working', {
    body: 'You will be reminded about due tasks when the app is opened.',
    tag: 'hmt-test',
    icon: 'icon-192.png'
  });
  return true;
}

/**
 * Try to register Periodic Background Sync (installed Chromium PWAs only).
 * Returns true if registered. The browser decides how often it actually runs.
 */
export async function registerPeriodicCheck() {
  try {
    if (!('serviceWorker' in navigator)) return false;
    const reg = await navigator.serviceWorker.ready;
    if (!('periodicSync' in reg)) return false;
    const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
    if (status.state !== 'granted') return false;
    await reg.periodicSync.register(SYNC_TAG, { minInterval: 12 * 60 * 60 * 1000 });
    return true;
  } catch {
    return false;
  }
}
