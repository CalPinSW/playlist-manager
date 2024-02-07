import { Input, InputBaseProps, InputProps } from "@mui/material";
import React, { FC } from "react";

const CustomInput: FC<InputProps> = (props) => (
  <Input
    {...props}
    className="m-2 border-solid border-2 border-primary-800"
  ></Input>
);

export default CustomInput;
