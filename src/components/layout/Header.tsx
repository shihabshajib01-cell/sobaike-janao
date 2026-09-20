import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, PlusCircle } from 'lucide-react';
import { useApp, RoutePath } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { BrandLogo } from '../branding/BrandLogo';
import { PublicMenuDrawer } from './PublicMenuDrawer';

export const Header: React.FC = () => {
  const {
    language,
    setIsTabletMenuOpen,
    openReportComposer,
  } = useApp();

  const localizePath = (path: RoutePath) =>
    language === 'en' ? (path === '/' ? '/en' : `/en${path}`) : path;

  return (
    <>
      <header
        id="tablet-compact-header"
        className="hidden md:block min-[1440px]:hidden sticky top-0 z-40 w-full bg-ui-surface border-b border-ui-stroke-subtle"
      >
        <div className="w-full max-w-[900px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link
              to={localizePath('/')}
              aria-label={
                language === 'bn'
                  ? 'সবাইকে জানাও — মূলপাতা'
                  : 'Sobaike Janao — Home'
              }
              className="rounded-[var(--radius-control)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
            >
              <BrandLogo
                id="tablet-brand-logo"
                size="sm"
                englishClassName="hidden min-[900px]:block type-meta leading-tight text-ui-content-secondary font-[var(--font-weight-medium)]"
              />
            </Link>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Button
                id="tablet-report-cta"
                variant="primary"
                size="md"
                leftIcon={
                  <PlusCircle
                    className="w-4 h-4 text-ui-content-inverse"
                    aria-hidden="true"
                  />
                }
                onClick={() => openReportComposer()}
                className="font-[var(--font-weight-semibold)]"
              >
                {language === 'bn' ? 'ঘটনা জানান' : 'Report incident'}
              </Button>

              <IconButton
                id="tablet-menu-button"
                icon={
                  <Menu
                    className="w-5 h-5 text-ui-content-primary"
                    aria-hidden="true"
                  />
                }
                aria-label={language === 'bn' ? 'মেনু খুলুন' : 'Open menu'}
                aria-haspopup="dialog"
                aria-controls="public-menu-drawer"
                size="md"
                onClick={() => setIsTabletMenuOpen(true)}
                className="border border-ui-stroke-subtle ui-radius-control bg-ui-surface-subtle"
              />
            </div>
          </div>
        </div>
      </header>

      <PublicMenuDrawer />
    </>
  );
};
