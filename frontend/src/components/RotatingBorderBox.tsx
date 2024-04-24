import React, { FC, ReactNode } from "react";

interface RotatingBorderBoxProps {
  children: ReactNode;
  active?: boolean;
}

export const RotatingBorderBox: FC<RotatingBorderBoxProps> = ({
  children,
  active,
}) => {
  return (
    <div className="relative w-fit h-fit overflow-hidden">
      {active && (
        <>
          <span className="block w-full h-full absolute rotate-0">
            <i className="block absolute left-0 top-0 w-[200%] border-b-2 border-dashed border-primary animate-slideDash" />
          </span>
          <span className="block w-full h-full absolute rotate-90">
            <i className="block absolute left-0 top-0 w-[200%] border-b-2 border-dashed border-primary animate-slideDash" />
          </span>
          <span className="block w-full h-full absolute rotate-180">
            <i className="block absolute left-0 top-0 w-[200%] border-b-2 border-dashed border-primary animate-slideDash" />
          </span>
          <span className="block w-full h-full absolute -rotate-90">
            <i className="block absolute left-0 top-0 w-[200%] border-b-2 border-dashed border-primary animate-slideDash" />
          </span>
        </>
      )}
      {children}
    </div>
  );
};
