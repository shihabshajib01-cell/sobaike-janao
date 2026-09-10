/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { SeoMetadata, applySeoMetadata, getStaticSeo } from '../../lib/seo';

interface SeoContextValue {
  setDynamicSeo: (meta: SeoMetadata | null) => void;
}

const SeoContext = createContext<SeoContextValue>({
  setDynamicSeo: () => {},
});

export const useSeo = () => useContext(SeoContext);

export interface SeoManagerProps {
  children: React.ReactNode;
}

export const SeoManager: React.FC<SeoManagerProps> = ({ children }) => {
  const { language } = useApp();
  const location = useLocation();
  const [dynamicSeo, setDynamicSeo] = useState<SeoMetadata | null>(null);

  // Clear dynamic override whenever pathname changes to prevent stale metadata
  useEffect(() => {
    setDynamicSeo(null);
  }, [location.pathname]);

  // Apply SEO metadata whenever route, language, or dynamic override changes
  useEffect(() => {
    if (dynamicSeo) {
      applySeoMetadata(dynamicSeo, language);
    } else {
      const staticMeta = getStaticSeo(location.pathname, language);
      applySeoMetadata(staticMeta, language);
    }
  }, [location.pathname, language, dynamicSeo]);

  const value = useMemo(
    () => ({
      setDynamicSeo,
    }),
    []
  );

  return <SeoContext.Provider value={value}>{children}</SeoContext.Provider>;
};
