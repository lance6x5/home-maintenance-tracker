/*
 * Extra service-worker handlers, imported by the Workbox-generated sw.js.
 *
 * - periodicsync: when the browser grants Periodic Background Sync (installed
 *   Chromium PWAs only), read tasks from IndexedDB and notify about due ones.
 *   The browser controls how often this runs; it is best effort, not a push.
 * - notificationclick: focus or open the app.
 *
 * Keep DB_NAME / STORE in sync with src/lib/db.js.
 */
/* eslint-env serviceworker */
(function () {
  var DB_NAME = 'home-maintenance-tracker';
  var STORE = 'tasks';

  function pad(n) { return String(n).padStart(2, '0'); }
  function localToday() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function readTasks() {
    return new Promise(function (resolve) {
      var req = indexedDB.open(DB_NAME);
      req.onerror = function () { resolve([]); };
      req.onsuccess = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(STORE)) { db.close(); return resolve([]); }
        var getAll = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
        getAll.onsuccess = function () { db.close(); resolve(getAll.result || []); };
        getAll.onerror = function () { db.close(); resolve([]); };
      };
    });
  }

  async function checkDue() {
    if (self.Notification && Notification.permission !== 'granted') return;
    var ref = localToday();
    var tasks = await readTasks();
    var due = tasks.filter(function (t) { return t.nextDue && t.nextDue <= ref; });
    if (due.length === 0) return;
    var title = due.length === 1 ? 'Home maintenance due' : due.length + ' home maintenance tasks due';
    var names = due.slice(0, 3).map(function (t) { return t.name; }).join(', ');
    var more = due.length > 3 ? ' and ' + (due.length - 3) + ' more' : '';
    await self.registration.showNotification(title, {
      body: names + more,
      tag: 'hmt-due',
      icon: 'icon-192.png',
      badge: 'icon.svg'
    });
  }

  self.addEventListener('periodicsync', function (event) {
    if (event.tag === 'hmt-due-check') event.waitUntil(checkDue());
  });

  self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
        for (var i = 0; i < list.length; i++) {
          if ('focus' in list[i]) return list[i].focus();
        }
        return self.clients.openWindow(self.registration.scope);
      })
    );
  });
})();
