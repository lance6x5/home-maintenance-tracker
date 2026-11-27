import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { TaskProvider } from './hooks.js';
import { ToastProvider } from './components/Toast.jsx';
import './styles.css';

// The service worker is registered automatically by vite-plugin-pwa
// (registerType: 'autoUpdate'), which injects registerSW.js into index.html.

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <TaskProvider>
        <App />
      </TaskProvider>
    </ToastProvider>
  </StrictMode>
);
