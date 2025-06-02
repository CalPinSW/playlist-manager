import React from "react";
import PlaybackFooter from "./PlaybackFooter";
import Header from "./Header/Header";
import { Outlet } from "react-router-dom";

interface LayoutProps {
  withFooter?: boolean;
};

const Layout: React.FC<LayoutProps> = ({ withFooter }) => {
  return (
    <div className="flex flex-col h-screen w-screen text-text-primary bg-background">
      <Header />
      <div className="flex-grow overflow-y-scroll"><Outlet /></div>
      {withFooter && <PlaybackFooter />}
    </div>
  );
};

export default Layout;