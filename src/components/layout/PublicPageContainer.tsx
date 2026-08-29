import React from 'react';

export interface PublicPageContainerProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
}

/**
 * PublicPageContainer
 * Canonical outer container for all public portal pages.
 * Controls unified page width (100% of workspace), responsive horizontal gutters,
 * vertical breathing room, and rhythmic section spacing.
 */
export const PublicPageContainer: React.FC<PublicPageContainerProps> = ({
  children,
  id,
  className = '',
}) => {
  return (
    <div
      id={id}
      className={`w-full text-left px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6 min-[1440px]:px-0 min-[1440px]:py-6 space-y-5 md:space-y-6 min-[1440px]:space-y-7 ${className}`}
    >
      {children}
    </div>
  );
};
