import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LocationSelector } from './LocationSelector';

export interface MobileCategoryLocationPortalProps {
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
}

export const MobileCategoryLocationPortal: React.FC<MobileCategoryLocationPortalProps> = ({
  selectedDistrict,
  onSelectDistrict,
}) => {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(document.getElementById('mobile-category-location-slot'));
  }, []);

  if (!target) return null;

  return createPortal(
    <LocationSelector
      id="mobile-category-location-filter-select"
      variant="compact"
      selectedDistrict={selectedDistrict}
      onSelectDistrict={onSelectDistrict}
    />,
    target
  );
};
