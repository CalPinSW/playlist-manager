import React, { FC } from "react";

const CustomInputLabel: FC<
  React.DetailedHTMLProps<
    React.LabelHTMLAttributes<HTMLLabelElement>,
    HTMLLabelElement
  >
> = (props) => <label {...props} className="m-2"></label>;

export default CustomInputLabel;
