import React, { useState, useEffect } from 'react';

export const ViewportDiagnostic: React.FC = () => {
  const [dimensions, setDimensions] = useState<{ width: number; height: number; dpr: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    dpr: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
  });
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio || 1,
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const getBreakpointName = (width: number) => {
    if (width < 640) return '< sm (Mobile)';
    if (width < 768) return 'sm (Large Mobile)';
    if (width < 1024) return 'md (Tablet)';
    if (width < 1280) return 'lg (Laptop)';
    if (width < 1440) return 'xl (Desktop)';
    return '2xl (Wide Rail)';
  };

  const isMobileLayout = dimensions.width < 768;

  return (
    <aside
      id="viewport-diagnostic-badge"
      aria-label="Viewport Diagnostic"
      className="fixed z-50 bottom-16 right-2 md:bottom-3 md:right-3 bg-surface-elevated/95 text-primary backdrop-blur-md border border-subtle rounded-xl shadow-lg text-[11px] font-mono select-none transition-all"
    >
      {isMinimized ? (
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="px-2 py-1 flex items-center gap-1 font-semibold text-secondary hover:text-primary cursor-pointer"
          title="Expand Viewport Diagnostic"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{dimensions.width}px</span>
        </button>
      ) : (
        <div className="p-2 space-y-1 min-w-[170px]">
          <div className="flex items-center justify-between border-b border-subtle pb-1">
            <span className="font-bold flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Viewport Diagnostic
            </span>
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="text-muted hover:text-primary px-1 text-[12px] leading-none cursor-pointer"
              title="Minimize"
            >
              ✕
            </button>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted">Width × Height:</span>
            <span className="font-bold text-primary">
              {dimensions.width} × {dimensions.height}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted">Breakpoint:</span>
            <span className="font-semibold text-accent">
              {getBreakpointName(dimensions.width)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted">Active Shell:</span>
            <span className="font-semibold text-primary">
              {isMobileLayout ? 'Mobile Shell' : 'Desktop/Tablet'}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-muted pt-0.5 border-t border-subtle">
            <span>DPR: {dimensions.dpr.toFixed(1)}x</span>
            <span>DOM: Mounted</span>
          </div>
        </div>
      )}
    </aside>
  );
};
