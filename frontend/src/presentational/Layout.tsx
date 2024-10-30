import React from "react";
import { Outlet } from "react-router-dom";
import PlaybackFooter from "./PlaybackFooter";
import Header from "./Header/Header";

const Layout = () => {
  return (
    <div className="flex flex-col h-screen w-screen text-text-primary bg-background  ">
      <Header />
      <div className="flex-grow overflow-y-scroll">
        <Outlet />
      </div>
      <PlaybackFooter />
    </div>
  );
};

export default Layout;
