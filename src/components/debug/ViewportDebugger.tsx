import React, { useState, useEffect } from 'react';

export const ViewportDebugger: React.FC = () => {
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return (
    <div
      id="viewport-debugger"
      className="fixed bottom-20 right-3 md:bottom-4 md:right-4 z-[9999] pointer-events-none select-none bg-black/80 text-white font-mono text-xs px-2.5 py-1.5 rounded-lg border border-white/20 shadow-lg backdrop-blur-sm"
      style={{ willChange: 'transform' }}
    >
      <span className="font-semibold text-emerald-400">{dimensions.width}</span>
      <span className="text-white/60 mx-1">×</span>
      <span className="font-semibold text-sky-400">{dimensions.height}</span>
      <span className="ml-1.5 text-[10px] text-white/50 font-sans uppercase">px</span>
    </div>
  );
};

export default ViewportDebugger;
