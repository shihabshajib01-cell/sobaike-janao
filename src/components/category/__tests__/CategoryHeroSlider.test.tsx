import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../../../context/AppContext';
import { CategoryHeroSlider, CategoryHeroSlide } from '../CategoryHeroSlider';

const mockSlides: CategoryHeroSlide[] = [
  {
    id: 'harassment-primary',
    titleBn: 'হয়রানি ও নির্যাতন',
    titleEn: 'Harassment & abuse',
    descriptionBn: 'শারীরিক বা মানসিক নির্যাতন, নিপীড়ন ও অনলাইনে হেনস্তার তথ্য জানান। দীর্ঘ বিবরণী পরীক্ষা করার জন্য অতিরিক্ত বাক্য যাতে কোনো ওভারফ্লো না হয়।',
    descriptionEn: 'Report incidents of harassment, abuse, or safety violations. Additional test sentence to rigorously verify multi-line text wrapping.',
    illustrationSrc: '/illustrations/services/harassment-hero-public-harassment-v02.png',
    action: {
      labelBn: 'প্রতিবেদন জমা দিন',
      labelEn: 'Submit report',
      onClick: () => {},
    },
  },
];

function renderSlider(slides: CategoryHeroSlide[] = mockSlides) {
  return render(
    <MemoryRouter>
      <AppProvider>
        <CategoryHeroSlider
          id="test-category-slider"
          section="harassment"
          slides={slides}
        />
      </AppProvider>
    </MemoryRouter>
  );
}

function setViewport(width: number, height: number = 800) {
  window.innerWidth = width;
  window.innerHeight = height;
  window.dispatchEvent(new Event('resize'));
}

describe('CategoryHeroSlider - 50:50 Grid Layout Constraints & Text Wrapping', () => {
  beforeEach(() => {
    setViewport(1024, 768);
  });

  describe('50:50 Grid Structure Constraints', () => {
    it('renders category slides inside a uniform 2-column grid container (grid grid-cols-2)', () => {
      const { container } = renderSlider();
      const slideGrids = container.querySelectorAll('.grid.grid-cols-2');
      expect(slideGrids.length).toBe(1);

      const gridEl = slideGrids[0];
      expect(gridEl.classList.contains('grid')).toBe(true);
      expect(gridEl.classList.contains('grid-cols-2')).toBe(true);
      expect(gridEl.classList.contains('items-center')).toBe(true);
    });

    it('renders all slides inside uniform 2-column grids when multiple slides are provided', () => {
      const multiSlides = [
        ...mockSlides,
        {
          id: 'harassment-secondary',
          titleBn: 'জরুরি সহায়তা',
          titleEn: 'Emergency assistance',
          descriptionBn: '২৪ ঘণ্টা সহায়তা ও হেল্পলাইন সেবা।',
          descriptionEn: '24/7 hotline and rapid emergency assistance.',
          illustrationSrc: '/illustrations/services/harassment-hero-public-harassment-v02.png',
        },
      ];
      const { container } = renderSlider(multiSlides);
      const slideGrids = container.querySelectorAll('.grid.grid-cols-2');
      expect(slideGrids.length).toBe(2);

      slideGrids.forEach((gridEl) => {
        expect(gridEl.classList.contains('grid')).toBe(true);
        expect(gridEl.classList.contains('grid-cols-2')).toBe(true);
        expect(gridEl.classList.contains('items-center')).toBe(true);
      });
    });

    it('replaces fixed-width illustration container with an equal-width min-w-0 w-full column', () => {
      const { container } = renderSlider();
      const gridEl = container.querySelector('.grid.grid-cols-2');
      expect(gridEl).not.toBeNull();

      const columns = gridEl!.children;
      expect(columns.length).toBe(2);

      const leftColumn = columns[0] as HTMLElement;
      const rightColumn = columns[1] as HTMLElement;

      // Left text column has min-w-0 and w-full for proper width-based column sizing
      expect(leftColumn.classList.contains('min-w-0')).toBe(true);
      expect(leftColumn.classList.contains('w-full')).toBe(true);
      expect(leftColumn.classList.contains('z-10')).toBe(true);

      // Right illustration column has min-w-0 and w-full for equal 50:50 ratio
      expect(rightColumn.classList.contains('min-w-0')).toBe(true);
      expect(rightColumn.classList.contains('w-full')).toBe(true);

      // Verify that fixed-width classes from before are removed
      const legacyWidthClasses = ['w-28', 'w-40', 'w-52', 'w-60', 'shrink-0'];
      legacyWidthClasses.forEach((cls) => {
        expect(rightColumn.classList.contains(cls)).toBe(false);
      });
    });

    it('renders illustration image with object-contain object-right to fill 50% right column properly', () => {
      const { container } = renderSlider();
      const img = container.querySelector<HTMLImageElement>('img');
      expect(img).not.toBeNull();
      expect(img?.src).toContain('harassment-hero-public-harassment-v02.png');
      expect(img?.classList.contains('object-contain')).toBe(true);
      expect(img?.classList.contains('object-right')).toBe(true);
      expect(img?.classList.contains('w-full')).toBe(true);
      expect(img?.classList.contains('h-full')).toBe(true);
    });
  });

  describe('Text Wrapping & Content Containment', () => {
    it('ensures heading and description wrap properly without overflow', () => {
      const { container } = renderSlider();
      const leftColumn = container.querySelector('.grid.grid-cols-2 > div:first-child');
      expect(leftColumn).not.toBeNull();

      const heading = leftColumn?.querySelector('h1');
      const description = leftColumn?.querySelector('p');

      expect(heading).not.toBeNull();
      expect(description).not.toBeNull();
      expect(heading?.classList.contains('type-h1')).toBe(true);
      expect(description?.classList.contains('type-body')).toBe(true);

      // Visual distinction between title and supporting line
      expect(heading?.classList.contains('font-bold')).toBe(true);
      expect(heading?.classList.contains('text-ui-content-primary')).toBe(true);
      expect(heading?.classList.contains('tracking-tight')).toBe(true);

      expect(description?.classList.contains('font-normal')).toBe(true);
      expect(description?.classList.contains('text-ui-content-secondary')).toBe(true);

      // Must not prevent wrapping
      expect(heading?.classList.contains('whitespace-nowrap')).toBe(false);
      expect(description?.classList.contains('whitespace-nowrap')).toBe(false);
    });

    it('enforces clear scale and typographic hierarchy between title and supporting line in category banner', () => {
      const { container } = renderSlider();
      const leftColumn = container.querySelector('.grid.grid-cols-2 > div:first-child');
      const heading = leftColumn?.querySelector('h1');
      const description = leftColumn?.querySelector('p');

      // Heading has prominent responsive scale and tight leading
      expect(heading?.className).toContain('!text-lg');
      expect(heading?.className).toContain('md:!text-3xl');
      expect(heading?.className).toContain('!leading-tight');

      // Supporting line has distinct smaller secondary scale and relaxed leading
      expect(description?.className).toContain('!text-xs');
      expect(description?.className).toContain('sm:!text-base');
      expect(description?.className).toContain('!leading-snug');
    });

    it('places action CTA within the 50% text column without breaking layout', () => {
      renderSlider();
      const actionButton = screen.getByRole('button', { name: /প্রতিবেদন জমা দিন|Submit report/i });
      expect(actionButton).not.toBeNull();

      const gridContainer = actionButton.closest('.grid.grid-cols-2');
      expect(gridContainer).not.toBeNull();
      expect(gridContainer?.firstElementChild?.contains(actionButton)).toBe(true);
    });
  });

  describe('Simulated Viewports', () => {
    const viewports = [
      { name: 'Mobile Portrait (320px)', width: 320, height: 568 },
      { name: 'Mobile Standard (375px)', width: 375, height: 667 },
      { name: 'Tablet (768px)', width: 768, height: 1024 },
      { name: 'Desktop (1024px)', width: 1024, height: 768 },
      { name: 'Large Desktop (1440px)', width: 1440, height: 900 },
    ];

    viewports.forEach(({ name, width, height }) => {
      it(`preserves uniform 50:50 grid layout at ${name}`, () => {
        setViewport(width, height);
        const { container } = renderSlider();

        const gridEl = container.querySelector('.grid.grid-cols-2');
        expect(gridEl).not.toBeNull();
        expect(gridEl?.children.length).toBe(2);

        const [leftCol, rightCol] = Array.from(gridEl!.children) as HTMLElement[];
        expect(leftCol.classList.contains('min-w-0')).toBe(true);
        expect(leftCol.classList.contains('w-full')).toBe(true);
        expect(rightCol.classList.contains('min-w-0')).toBe(true);
        expect(rightCol.classList.contains('w-full')).toBe(true);

        const img = rightCol.querySelector('img');
        expect(img).not.toBeNull();
      });
    });
  });
});
