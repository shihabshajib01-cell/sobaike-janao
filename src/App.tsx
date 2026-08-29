/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';

export default function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <AppProvider>
          <AppShell />
        </AppProvider>
      </HashRouter>
    </ThemeProvider>
  );
}


