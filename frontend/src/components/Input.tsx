import React, { FC } from "react";
import { UseFormRegisterReturn } from "react-hook-form";

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
    <input
      id={name}
      {...register}
      type={type}
      defaultValue={defaultValue}
      className="m-2 border-solid border border-primary-800 bg-background-offset rounded-md"
    />
  </div>
);

export default CustomInput;
