import React from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App.tsx';
import { register } from './services/serviceWorker.ts';

const rootElement = document.getElementById('root') as HTMLElement;
createRoot(rootElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
register();

postMessage({ payload: 'removeLoading' }, '*');
