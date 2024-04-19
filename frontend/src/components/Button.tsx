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
      className={`bg-secondary-300 rounded p-2 cursor-pointer hover:bg-secondary-500 ${props.className}`}
    ></button>
  );
};

export default CustomButton;
