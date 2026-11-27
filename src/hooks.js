/**
 * React hooks: hash router and the task store (IndexedDB-backed).
 */
import { createContext, createElement, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as db from './lib/db.js';
import { createTask, markDone, undoLastDone, applyEdits } from './lib/tasks.js';

// ---------- Hash routing ----------

const readHash = () => window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);

/** Returns the current route as an array of path parts, e.g. ['task', 'abc']. */
export function useHashRoute() {
  const [parts, setParts] = useState(readHash);
  useEffect(() => {
    const onChange = () => {
      setParts(readHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return parts;
}

export function navigate(path) {
  window.location.hash = `#/${path}`;
}

// ---------- Task store ----------

const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  // Always-current copy so async callbacks (e.g. toast "Undo") never act on stale state.
  const tasksRef = useRef(tasks);

  const commit = (next) => {
    tasksRef.current = next;
    setTasks(next);
  };

  useEffect(() => {
    db.getAllTasks()
      .then((t) => commit(t || []))
      .catch((e) => setError(`Could not load your data: ${e.message}`))
      .finally(() => setLoaded(true));
  }, []);

  const api = useMemo(() => {
    const find = (id) => tasksRef.current.find((t) => t.id === id);

    /** Persist one task and update state. */
    const save = async (task) => {
      const prev = tasksRef.current;
      const exists = prev.some((t) => t.id === task.id);
      commit(exists ? prev.map((t) => (t.id === task.id ? task : t)) : [...prev, task]);
      try {
        await db.putTask(task);
      } catch (e) {
        setError(`Could not save: ${e.message}`);
      }
      return task;
    };

    return {
      tasks,
      loaded,
      error,
      clearError: () => setError(''),
      find,
      add: (data, lastDone) => save(createTask(data, lastDone)),
      update: (id, data) => save(applyEdits(find(id), data)),
      markDone: (id, date, note) => save(markDone(find(id), date, note)),
      undoDone: (id) => save(undoLastDone(find(id))),
      remove: async (id) => {
        commit(tasksRef.current.filter((t) => t.id !== id));
        await db.deleteTask(id);
      },
      replaceAll: async (list) => {
        commit(list);
        await db.replaceAllTasks(list);
      },
      resetAll: async () => {
        commit([]);
        await db.clearAllTasks();
      }
    };
  }, [tasks, loaded, error]);

  return createElement(TaskContext.Provider, { value: api }, children);
}

export function useTasks() {
  return useContext(TaskContext);
}
