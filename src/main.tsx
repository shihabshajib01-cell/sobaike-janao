import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { hydratePublishedBannerContent } from './services/bannerRuntime';
import './index.css';
import './theme/color-system.css';
import './theme/desktop-horizontal-scroll.css';
import './theme/design-system-extensions.css';
import './theme/design-system.css';

const SPA_REDIRECT_KEY = 'sobaike_spa_redirect_v1';

const restoreInitialRoute = () => {
  if (typeof window === 'undefined') return;

  try {
    const pendingRedirect = window.sessionStorage.getItem(SPA_REDIRECT_KEY);
    if (pendingRedirect) {
      window.sessionStorage.removeItem(SPA_REDIRECT_KEY);
      const target = new URL(pendingRedirect, window.location.origin);
      if (target.origin === window.location.origin) {
        window.history.replaceState(
          null,
          '',
          `${target.pathname}${target.search}${target.hash}`
        );
      }
    }
  } catch {
    // Continue with the current URL if session storage is unavailable.
  }

  if (window.location.pathname === '/' && window.location.hash.startsWith('#/')) {
    const legacyRoute = window.location.hash.slice(1) || '/';
    window.history.replaceState(null, '', legacyRoute);
  }
};

restoreInitialRoute();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

// Banner CMS content is progressive enhancement. Never block first paint on a network request.
void hydratePublishedBannerContent();
