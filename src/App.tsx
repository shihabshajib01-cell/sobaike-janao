/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider } from './context/AppContext';
import { TextSizeProvider } from './context/TextSizeContext';
import { AppShell } from './components/layout/AppShell';

export default function App() {
  return (
    <ThemeProvider>
      <TextSizeProvider>
        <BrowserRouter>
          <AppProvider>
            <AppShell />
          </AppProvider>
        </BrowserRouter>
      </TextSizeProvider>
    </ThemeProvider>
  );
}


