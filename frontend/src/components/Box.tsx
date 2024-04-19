import React, { FC } from "react";

const Box: FC<
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
> = (props) => {
  return (
    <div
      className={`p-2 rounded border-solid border border-primary-500 ${props.className}`}
      {...props}
    >
      {props.children}
    </div>
  );
};

export default Box;
