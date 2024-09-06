import React, { FC } from "react";

const Box: FC<
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
> = ({className, ...props}) => {
  return (
    <div
      className={`p-2 rounded border-solid border border-background-offset ${className}`}
      {...props}
    >
      {props.children}
    </div>
  );
};

export default Box;
