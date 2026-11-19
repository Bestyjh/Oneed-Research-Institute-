import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import reportWebVitals from './reportWebVitals';

// Capture the initial callback state before importing App/Supabase.
const initialUrl = new URL(window.location.href);
const initialHash = new URLSearchParams(initialUrl.hash.slice(1));

const initialAuthCallback = {
  pathname: initialUrl.pathname,
  hasCredentials:
    initialUrl.searchParams.has('code') ||
    (
      initialHash.has('access_token') &&
      initialHash.has('refresh_token')
    ),
  hasError:
    initialUrl.searchParams.has('error') ||
    initialHash.has('error'),
};

const root = ReactDOM.createRoot(document.getElementById('root'));

async function startApp() {
  const { default: App } = await import('./App');

  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App initialAuthCallback={initialAuthCallback} />
      </BrowserRouter>
    </React.StrictMode>
  );
}

startApp();

reportWebVitals();