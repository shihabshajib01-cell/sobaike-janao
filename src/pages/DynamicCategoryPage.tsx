import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { StandardCategoryPage } from './StandardCategoryPage';
import { useTaxonomy } from '../services/taxonomyService';
import { SectionKey } from '../theme/tokens';

export const DynamicCategoryPage: React.FC = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const { segments, refreshTaxonomy } = useTaxonomy();
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let active = true;
    refreshTaxonomy().finally(() => {
      if (active) setResolved(true);
    });
    return () => {
      active = false;
    };
  }, [slug]);

  const segment = useMemo(
    () =>
      Object.values(segments).find((item) => {
        const normalized = item.slug?.replace(/^\/category\//, '').replace(/^\//, '');
        return normalized === slug || item.id === slug;
      }),
    [segments, slug]
  );

  if (!segment && !resolved) {
    return (
      <div className="px-4 py-12 text-center type-body text-ui-content-secondary md:px-6">
        Loading category…
      </div>
    );
  }

  if (!segment) {
    return <Navigate to="/" replace />;
  }

  return <StandardCategoryPage section={segment.id as SectionKey} />;
};

export default DynamicCategoryPage;
