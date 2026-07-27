import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({ 
  children, 
  className, 
  interactive = false,
  ...props 
}) => {
  return (
    <div 
      className={twMerge(
        clsx(
          "bg-surface-glass border border-surface-border backdrop-blur-md",
          interactive && "hover:bg-surface-glass-hover hover:border-vertical-accent/30 transition-all duration-300 cursor-pointer",
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
