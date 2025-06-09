import React, { FC } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface PageLinkProps {
  children: React.ReactNode;
  href: string;
  className?: string;
  icon?: React.ReactNode;
  tabIndex?: number;
  testId?: string;
}

const PageLink: FC<PageLinkProps> = ({ children, href, className, icon, tabIndex, testId }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={
        `${isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} rounded-md px-3 py-2 text-sm font-medium`
      }
    >
      {children}
    </Link>
  );
};

export default PageLink;
