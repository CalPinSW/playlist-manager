import React, { FC, ReactNode } from 'react';

interface RotatingBorderBoxProps {
  children: ReactNode;
  active?: boolean;
}

export const RotatingBorderBox: FC<RotatingBorderBoxProps> = ({ children, active }) => {
  return (
    <div className="relative size-full overflow-hidden m-0">
      {active && (
        <>
          <span className="block size-full absolute rotate-0">
            <i className="block absolute left-0 top-0 w-[200%] border-b-2 border-dashed border-primary animate-slide-dash" />
          </span>
          <span className="block size-full absolute rotate-90">
            <i className="block absolute left-0 top-0 w-[200%] border-b-2 border-dashed border-primary animate-slide-dash" />
          </span>
          <span className="block size-full absolute rotate-180">
            <i className="block absolute left-0 top-0 w-[200%] border-b-2 border-dashed border-primary animate-slide-dash" />
          </span>
          <span className="block size-full absolute -rotate-90">
            <i className="block absolute left-0 top-0 w-[200%] border-b-2 border-dashed border-primary animate-slide-dash" />
          </span>
        </>
      )}
      {children}
    </div>
  );
};
