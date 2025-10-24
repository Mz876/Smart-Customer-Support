import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Routings from './routings.js'; 
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
     <Routings />
  </StrictMode>,
)
