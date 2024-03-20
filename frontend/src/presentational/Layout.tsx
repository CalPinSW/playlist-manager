import * as React from "react";
import { Link, Outlet } from "react-router-dom";

const Header = () => {
  return (
    <div className="flex-grow">
      <div className="flex static top-0 h-16 bg-primary-500">
        <Link to="/" className="flex relative mx-4 my-auto text-lg text-white">
          Playlist Manager
        </Link>
      </div>
      <Outlet />
    </div>
  );
};

export default Header;
