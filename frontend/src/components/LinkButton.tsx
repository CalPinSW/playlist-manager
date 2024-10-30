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
      className={`bg-secondary-darker rounded p-2 cursor-pointer hover:bg-secondary active:bg-secondary-lighter ${className}`}
    ></a>
  );
};

export default Button;
