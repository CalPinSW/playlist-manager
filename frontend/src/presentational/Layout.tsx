import React from "react";
import { Outlet } from "react-router-dom";
import PlaybackFooter from "./PlaybackFooter";
import Header from "./Header";

const Layout = () => {
  return (
    <div className="flex flex-col h-full w-full flex-nowrap overflow-none">
      <Header />
      <div className="flex h-fit overflow-y-scroll">
        <Outlet />
      </div>
      <PlaybackFooter />
    </div>
  );
};

export default Layout;
