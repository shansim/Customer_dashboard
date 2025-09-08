/**
 * Dashboard Shell Main Entry Point
 * 
 * This is the main entry point for the dashboard shell application.
 * Sets up the complete routing and authentication system.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);