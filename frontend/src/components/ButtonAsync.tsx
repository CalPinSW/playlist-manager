import React, { FC, useState, MouseEvent } from "react";

const ButtonAsync: FC<
  React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
> = ({className, onClick, ...props}) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleClick = async (event: MouseEvent<HTMLButtonElement>): Promise<void>  => {
    if (onClick) {
      setIsLoading(true)
      await onClick(event)
      setIsLoading(false);
    }
  }
  return (
    <button
      {...props}
      disabled={isLoading}
      onClick={handleClick}
      className={`bg-primary rounded p-2 cursor-pointer hover:bg-primary-lighter active:bg-primary-lighter disabled:bg-background-offset ${className}`}
    />
  );
};

export default ButtonAsync;
