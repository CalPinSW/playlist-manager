import React, { FC } from "react";
import { UseFormRegisterReturn } from "react-hook-form";

interface CustomInputProps {
  name: string;
  register: UseFormRegisterReturn;
  defaultValue?: string;
  placeholder: string;
  type: React.HTMLInputTypeAttribute;
}

const InputWithLabelPlaceholder: FC<CustomInputProps> = ({
  name,
  register,
  defaultValue,
  placeholder,
  type,
}) => (
<div className="relative my-4">
  <input
    {...register}
    type={type}
    id={name}
    defaultValue={defaultValue}
    required
    className="peer px-2 h-10 w-full rounded-md border border-primary-lighter bg-background-offset placeholder-transparent focus:outline-none focus:border-primary"
  />
  <label
    htmlFor={name}
    className="absolute left-2 top-2 text-text-secondary text-sm transition-all duration-200 ease-out peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-primary peer-focus:top-[-18px] peer-focus:text-sm peer-focus:text-primary peer-valid:top-[-18px] peer-valid:text-sm peer-valid:text-primary">
    {placeholder}
  </label>
</div>
);

export default InputWithLabelPlaceholder;
