import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../../../context/AppContext';
import { ServiceHeroCarousel } from '../ServiceHeroCarousel';

function renderCarousel() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <ServiceHeroCarousel id="test-service-carousel" />
      </AppProvider>
    </MemoryRouter>
  );
}

function setViewport(width: number, height: number = 800) {
  window.innerWidth = width;
  window.innerHeight = height;
  window.dispatchEvent(new Event('resize'));
}

describe('ServiceHeroCarousel - 50:50 Grid Layout Constraints & Text Wrapping', () => {
  beforeEach(() => {
    setViewport(1024, 768);
  });

  describe('50:50 Grid Structure Constraints', () => {
    it('renders slides inside a uniform 2-column grid container (grid grid-cols-2)', () => {
      const { container } = renderCarousel();
      const slideGrids = container.querySelectorAll('.grid.grid-cols-2');
      expect(slideGrids.length).toBeGreaterThan(0);

      slideGrids.forEach((gridEl) => {
        expect(gridEl.classList.contains('grid')).toBe(true);
        expect(gridEl.classList.contains('grid-cols-2')).toBe(true);
        expect(gridEl.classList.contains('items-center')).toBe(true);
      });
    });

    it('replaces fixed-width illustration container with an equal-width min-w-0 w-full column', () => {
      const { container } = renderCarousel();
      const slideGrids = container.querySelectorAll('.grid.grid-cols-2');

      slideGrids.forEach((gridEl) => {
        const columns = gridEl.children;
        expect(columns.length).toBe(2);

        const leftColumn = columns[0] as HTMLElement;
        const rightColumn = columns[1] as HTMLElement;

        // Left text column has min-w-0 and w-full for width-based column sizing
        expect(leftColumn.classList.contains('min-w-0')).toBe(true);
        expect(leftColumn.classList.contains('w-full')).toBe(true);
        expect(leftColumn.classList.contains('z-10')).toBe(true);

        // Right illustration column has min-w-0 and w-full for 50% allocation without fixed width constraints
        expect(rightColumn.classList.contains('min-w-0')).toBe(true);
        expect(rightColumn.classList.contains('w-full')).toBe(true);

        // Verify that old fixed-width breakpoint classes are absent
        const fixedWidthClasses = ['w-24', 'w-28', 'w-40', 'w-52', 'w-60', 'shrink-0'];
        fixedWidthClasses.forEach((cls) => {
          expect(rightColumn.classList.contains(cls)).toBe(false);
        });
      });
    });

    it('renders illustration image with object-contain object-right to fit within the 50% column', () => {
      const { container } = renderCarousel();
      const images = container.querySelectorAll<HTMLImageElement>('img[src*="/illustrations/services/"]');
      expect(images.length).toBeGreaterThan(0);

      images.forEach((img) => {
        expect(img.classList.contains('object-contain')).toBe(true);
        expect(img.classList.contains('object-right')).toBe(true);
        expect(img.classList.contains('w-full')).toBe(true);
        expect(img.classList.contains('h-full')).toBe(true);
      });
    });
  });

  describe('Text Wrapping & Content Containment', () => {
    it('ensures text elements in the left column have wrapping classes without overflow', () => {
      const { container } = renderCarousel();
      const slideGrids = container.querySelectorAll('.grid.grid-cols-2');

      slideGrids.forEach((gridEl) => {
        const leftColumn = gridEl.children[0] as HTMLElement;
        const heading = leftColumn.querySelector('h2');
        const description = leftColumn.querySelector('p');

        expect(heading).not.toBeNull();
        expect(description).not.toBeNull();

        // Check text hierarchy classes
        expect(heading?.classList.contains('type-h2')).toBe(true);
        expect(description?.classList.contains('type-body')).toBe(true);
        expect(description?.classList.contains('max-w-2xl')).toBe(true);

        // Visual distinction between title and supporting line
        expect(heading?.classList.contains('font-bold')).toBe(true);
        expect(heading?.classList.contains('text-ui-content-primary')).toBe(true);
        expect(heading?.classList.contains('tracking-tight')).toBe(true);

        expect(description?.classList.contains('font-normal')).toBe(true);
        expect(description?.classList.contains('text-ui-content-secondary')).toBe(true);

        // Neither heading nor description should have whitespace-nowrap preventing text wrap
        expect(heading?.classList.contains('whitespace-nowrap')).toBe(false);
        expect(description?.classList.contains('whitespace-nowrap')).toBe(false);
      });
    });

    it('enforces clear scale and typographic hierarchy between title and supporting line', () => {
      const { container } = renderCarousel();
      const slideGrids = container.querySelectorAll('.grid.grid-cols-2');

      slideGrids.forEach((gridEl) => {
        const leftColumn = gridEl.children[0] as HTMLElement;
        const heading = leftColumn.querySelector('h2');
        const description = leftColumn.querySelector('p');

        // Heading has responsive scale and prominent tight leading
        expect(heading?.className).toContain('!text-base');
        expect(heading?.className).toContain('md:!text-2xl');
        expect(heading?.className).toContain('!leading-tight');

        // Supporting line has distinct smaller secondary scale and relaxed leading
        expect(description?.className).toContain('!text-xs');
        expect(description?.className).toContain('sm:!text-base');
        expect(description?.className).toContain('!leading-snug');
      });
    });

    it('renders primary CTA button inside left column', () => {
      renderCarousel();
      const ctaButtons = screen.getAllByRole('button', { name: /রিপোর্ট করুন|Report issue/i });
      expect(ctaButtons.length).toBeGreaterThan(0);
      ctaButtons.forEach((btn) => {
        expect(btn.closest('.grid.grid-cols-2')?.firstElementChild?.contains(btn)).toBe(true);
      });
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
      it(`maintains 50:50 grid structure and column integrity at ${name}`, () => {
        setViewport(width, height);
        const { container } = renderCarousel();

        const gridContainers = container.querySelectorAll('.grid.grid-cols-2');
        expect(gridContainers.length).toBe(4);

        gridContainers.forEach((gridEl) => {
          const cols = gridEl.children;
          expect(cols.length).toBe(2);

          const leftCol = cols[0] as HTMLElement;
          const rightCol = cols[1] as HTMLElement;

          expect(leftCol.classList.contains('min-w-0')).toBe(true);
          expect(leftCol.classList.contains('w-full')).toBe(true);
          expect(rightCol.classList.contains('min-w-0')).toBe(true);
          expect(rightCol.classList.contains('w-full')).toBe(true);

          // Verify illustration is preserved
          const img = rightCol.querySelector('img');
          expect(img).not.toBeNull();
          expect(img?.getAttribute('src')).toBeTruthy();
        });
      });
    });
  });
});
