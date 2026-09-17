import React from 'react';

export interface PublicPageContainerProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
}

/**
 * Canonical outer container for all public portal pages.
 * Horizontal/vertical gutters resolve from the central design-system layer.
 */
export const PublicPageContainer: React.FC<PublicPageContainerProps> = ({
  children,
  id,
  className = '',
}) => {
  return (
    <div
      id={id}
      className={`ui-page-shell space-y-5 md:space-y-6 min-[1440px]:space-y-7 text-left ${className}`}
    >
      {children}
    </div>
  );
};
