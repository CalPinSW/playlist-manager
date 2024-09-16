import React, { FC } from "react";

const Button: FC<
  React.DetailedHTMLProps<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  >
> = ({className, ...props}) => {
  return (
    <a
      {...props}
      className={`bg-secondary-300 rounded p-2 cursor-pointer hover:bg-secondary-500 active:bg-secondary-600 ${className}`}
    ></a>
  );
};

export default Button;
