import React, { FC } from "react";

const CustomButton: FC<
  React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
> = (props) => {
  return (
    <button {...props} className={"bg-secondary-600 rounded p-2"}></button>
  );
};

export default CustomButton;
