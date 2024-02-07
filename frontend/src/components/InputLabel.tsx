import { InputLabel, InputLabelProps, InputLabelTypeMap } from "@mui/material";
import { OverridableComponent } from "@mui/material/OverridableComponent";
import React, { FC } from "react";

const CustomInputLabel: FC<InputLabelProps> = (props) => (
  <InputLabel {...props} className="m-2"></InputLabel>
);

export default CustomInputLabel;
