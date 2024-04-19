import React from "react";
import { Outlet } from "react-router-dom";
import PlaybackFooter from "./PlaybackFooter";
import Header from "./Header";

const Layout = () => {
  return (
    <div className="text-text-primary bg-background flex flex-col h-full w-full flex-nowrap overflow-none">
      <Header />
      <div className="h-fit overflow-y-scroll inline-block">
        <Outlet />
      </div>
      <PlaybackFooter />
    </div>
  );
};

export default Layout;
