import React, { FC } from 'react';
import Link from 'next/link';

import NavBarItem from './NavBarItem';

interface PageLinkProps {
  children: React.ReactNode;
  href: string;
  className?: string;
  icon?: React.ReactNode;
  tabIndex?: number;
  testId?: string;
}

const PageLink: FC<PageLinkProps> = ({ children, href, className, icon, tabIndex, testId }) => {
  return (
    <Link legacyBehavior href={href}>
      <a>
        <NavBarItem href={href} className={className} icon={icon} tabIndex={tabIndex} testId={testId}>
          {children}
        </NavBarItem>
      </a>
    </Link>
  );
};

export default PageLink;
