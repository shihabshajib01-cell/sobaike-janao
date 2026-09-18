import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { hydratePublishedBannerContent } from './services/bannerRuntime';
import './index.css';
import './theme/desktop-horizontal-scroll.css';
import './theme/design-system-extensions.css';
import './theme/design-system.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);

const bootstrap = async () => {
  await hydratePublishedBannerContent();

  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
};

void bootstrap();
