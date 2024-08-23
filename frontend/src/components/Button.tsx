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
      className={`bg-secondary-300 rounded p-2 cursor-pointer hover:bg-secondary-500 active:bg-secondary-600 ${className}`}
    ></button>
  );
};

export default Button;
