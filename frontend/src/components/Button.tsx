import React, { FC } from "react";

const Button: FC<
  React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
> = ({className, ...props}) => {
  return (
    <button
      {...props}
      className={`bg-primary rounded p-2 cursor-pointer hover:bg-primary-lighter active:bg-primary-lighter ${className}`}
    />
  );
};

export default Button;
