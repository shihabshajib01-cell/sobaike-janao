import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { StandardCategoryPage } from './StandardCategoryPage';
import { useApp } from '../context/AppContext';
import { useTaxonomy } from '../services/taxonomyService';
import { SectionKey } from '../theme/tokens';
import {
  BRAND_NAME,
  SeoMetadata,
  buildBrandedSeoTitle,
  normalizeSeoDescription,
} from '../lib/seo';

export const TopicPage: React.FC = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const { language } = useApp();
  const { segments, subcategories, refreshTaxonomy } = useTaxonomy();
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

  const match = useMemo(() => {
    for (const [segmentId, items] of Object.entries(subcategories)) {
      const subcategory = items.find((item) => {
        const stableSlug = (item.slug || item.id.replace(/_/g, '-')).replace(/^\/+/, '');
        return stableSlug === slug || item.id === slug;
      });
      if (subcategory) return { segmentId, subcategory };
    }
    return null;
  }, [slug, subcategories]);

  if (!match && !resolved) {
    return (
      <div className="px-4 py-12 text-center type-body text-ui-content-secondary md:px-6">
        {language === 'bn' ? 'বিষয় লোড হচ্ছে…' : 'Loading topic…'}
      </div>
    );
  }

  if (!match) {
    return <Navigate to={language === 'en' ? '/en/issues' : '/issues'} replace />;
  }

  const segment = segments[match.segmentId];
  if (!segment) {
    return <Navigate to={language === 'en' ? '/en/issues' : '/issues'} replace />;
  }

  const stableSlug = (
    match.subcategory.slug || match.subcategory.id.replace(/_/g, '-')
  ).replace(/^\/+/, '');
  const logicalTopicPath = `/topic/${encodeURIComponent(stableSlug)}`;
  const currentCanonicalPath =
    language === 'en' ? `/en${logicalTopicPath}` : logicalTopicPath;

  if (
    slug !== stableSlug &&
    (typeof window === 'undefined' || window.location.pathname !== currentCanonicalPath)
  ) {
    return <Navigate to={currentCanonicalPath} replace />;
  }

  const categoryPath = segment.slug.startsWith('/') ? segment.slug : `/${segment.slug}`;
  const topicName = language === 'bn' ? match.subcategory.nameBn : match.subcategory.nameEn;
  const categoryName = language === 'bn' ? segment.nameBn : segment.nameEn;

  const seoOverride: SeoMetadata = {
    title:
      language === 'bn'
        ? buildBrandedSeoTitle(`${topicName} সংক্রান্ত প্রতিবেদন`, BRAND_NAME.bn)
        : buildBrandedSeoTitle(`${topicName} Reports`, BRAND_NAME.en),
    description: normalizeSeoDescription(
      language === 'bn'
        ? `${topicName} সংক্রান্ত প্রকাশিত নাগরিক প্রতিবেদন, এলাকা, উৎস ও সর্বশেষ আপডেট দেখুন। ${categoryName} বিষয়ের প্রাসঙ্গিক প্রতিবেদন ব্রাউজ করুন।`
        : `Browse published citizen reports about ${topicName}, including locations, sources, and latest updates within ${categoryName} on Sobaike Janao.`,
      language
    ),
    robots: 'index, follow, max-image-preview:large',
    ogType: 'website',
    ogSiteName: BRAND_NAME[language],
    canonicalPath: logicalTopicPath,
    pageType: 'collection',
    breadcrumbs: [
      {
        name: BRAND_NAME[language],
        path: '/',
      },
      {
        name: categoryName,
        path: categoryPath,
      },
      {
        name: topicName,
        path: logicalTopicPath,
      },
    ],
  };

  return (
    <StandardCategoryPage
      section={match.segmentId as SectionKey}
      initialSubcategoryId={match.subcategory.id}
      seoOverride={seoOverride}
    />
  );
};

export default TopicPage;
