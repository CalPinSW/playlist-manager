import React, { FC } from "react";
import Button from "./components/Button";
import { useAuth0 } from "@auth0/auth0-react";

export const Login: FC = () => {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="w-full flex">
      <Button className="w-1/3 mx-auto mt-12" onClick={() => loginWithRedirect()}>
        Click to login
      </Button>
    </div>
  );
};
