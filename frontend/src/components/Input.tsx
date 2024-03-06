import { Input, InputLabel } from "@mui/material";
import React, { FC } from "react";
import {
  FieldValues,
  UseFormRegister,
  UseFormRegisterReturn,
} from "react-hook-form";

interface CustomInputProps {
  name: string;
  register: UseFormRegisterReturn;
  defaultValue?: string;
  type: React.HTMLInputTypeAttribute;
}

const CustomInput: FC<CustomInputProps> = ({
  name,
  register,
  defaultValue,
  type,
}) => (
  <div>
    <Input
      id={name}
      {...register}
      type={type}
      defaultValue={defaultValue}
      className="m-2 border-solid border-2 border-primary-800"
    />
  </div>
);

export default CustomInput;
