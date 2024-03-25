import * as React from "react";
import { Link, Outlet } from "react-router-dom";
import Box from "../components/Box";
import { login } from "../api";

const Header = () => {
  return (
    <div className="flex-grow">
      <div className="flex static justify-between top-0 h-16 bg-primary-500">
        <Link to="/" className="flex relative mx-4 my-auto text-lg text-white">
          Playlist Manager
        </Link>
        <Box className="flex mx-4 text-white">
          <button onClick={login}>Login</button>
        </Box>
      </div>

      <Outlet />
    </div>
  );
};

export default Header;
