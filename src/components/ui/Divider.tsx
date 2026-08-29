import React from 'react';

export interface DividerProps {
  id?: string;
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({
  id,
  orientation = 'horizontal',
  label,
  className = '',
}) => {
  if (orientation === 'vertical') {
    return <div id={id} className={`w-[1px] h-full bg-subtle shrink-0 ${className}`} role="separator" aria-orientation="vertical" />;
  }

  if (label) {
    return (
      <div id={id} className={`flex items-center my-4 ${className}`} role="separator">
        <div className="flex-grow border-t border-subtle" />
        <span className="shrink-0 px-3 text-[14px] font-medium text-muted">{label}</span>
        <div className="flex-grow border-t border-subtle" />
      </div>
    );
  }

  return <hr id={id} className={`border-0 border-t border-subtle my-4 ${className}`} />;
};
