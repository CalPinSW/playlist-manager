import React, { FC } from "react";

const CustomButton: FC<
  React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
> = (props) => {
  return (
    <button
      {...props}
      className={`bg-secondary-500 rounded p-2 ${props.className}`}
    ></button>
  );
};

export default CustomButton;
