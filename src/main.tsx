import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import '@fontsource/ibm-plex-mono';
import { Analytics } from '@vercel/analytics/react';
import App from './App.tsx';
import './index.css';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>,
);
