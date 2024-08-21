import React, { FC } from "react";
import { login } from "./api";
import Button from "./components/Button";

export const Login: FC = () => {
  return (
    <div className="w-full flex">
      <Button className="w-1/3 mx-auto mt-12" onClick={login}>
        Click to login
      </Button>
    </div>
  );
};
