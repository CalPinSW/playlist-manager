import React, { FC } from "react";
import Box from "./components/Box";
import { login } from "./api";

export const Login: FC = () => {
  return (
    <div>
      <Box>
        <button onClick={login}>Test</button>
      </Box>
    </div>
  );
};
