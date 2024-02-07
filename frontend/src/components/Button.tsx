import { Button, ButtonProps, ButtonTypeMap, ExtendButtonBase } from "@mui/material";
import React, { FC } from "react";

const CustomButton: FC<ButtonProps> = (
  props
) => {
  return (
    <Button {...props} className={"bg-secondary-600 rounded p-2"}></Button>
  );
};

export default CustomButton;
