import React, { ReactNode } from "react";
import PlaybackFooter from "./PlaybackFooter";
import Header from "./Header/Header";

interface LayoutProps {
  children: ReactNode;
  withFooter?: boolean;
};

const Layout: React.FC<LayoutProps> = ({ children, withFooter }) => {
  return (
    <div className="flex flex-col h-screen w-screen text-text-primary bg-background">
      <Header />
      <div className="flex-grow overflow-y-scroll">{children}</div>
      {withFooter && <PlaybackFooter />}
    </div>
  );
};

export default Layout;