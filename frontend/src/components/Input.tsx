import React, { FC } from "react";

const Input: FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className={`m-1 border-solid border-2 border-primary-500`}
  ></input>
);

export default Input;
