"use client"

import React from 'react';
import { useUser } from '@auth0/nextjs-auth0';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { usePathname } from 'next/navigation';
import PageLink from './PageLink';
import { ProfileSettings } from './Profile';

export default function NavBar() {
  const { user } = useUser();
  const pathname = usePathname();

  const unprotectedRoutes = [
    { name: 'Home', href: '/' },
  ]

  const protectedRoutes = [
    
    { name: 'Client-side rendered page', href: '/examples/csr'},
    { name: 'Server-side rendered page', href: '/examples/ssr' },
    { name: 'External API', href: '/examples/external' },
  ]

  const settingsRoutes = [
    { name: 'Profile', href: '/profile' },
    { name: 'Settings', href: '/settings' },
  ]

  const isActive = (href: string) => {
    return pathname === href;
  }
  return (
    <Disclosure as="nav">
      <div className="mx-auto  px-2 sm:px-6 lg:px-8 relative flex h-16 items-center justify-between z-20 bg-gray-800">
        <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
          {/* Mobile menu button*/}
          <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-hidden focus:ring-inset">
            <span className="absolute -inset-0.5" />
            <span className="sr-only">Open main menu</span>
            <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
            <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
          </DisclosureButton>
        </div>
        <div className="flex flex-1 h-full items-center justify-center sm:items-stretch sm:justify-start">
          <div className="hidden sm:flex shrink-0 items-center">
            <img
              alt="Your Company"
              src="../images/playlist-manager-icon.png"
              className="h-auto w-16"
            />
          </div>
          <div className="hidden sm:ml-6 sm:block">
            <div className="flex h-full items-center space-between gap-4">
              {unprotectedRoutes.map((item) => (
                <PageLink
                  key={item.name}
                  href={item.href}                    
                >
                  {item.name}
                </PageLink>
              ))}
              {user && protectedRoutes.map((item) => (
                <PageLink
                  key={item.name}
                  href={item.href}
                >
                  {item.name}
                </PageLink>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
          <ProfileSettings />
        </div>
      </div>
      <DisclosurePanel className="flex transition duration-200 ease-out data-closed:-translate-y-6 z-10 bg-gray-800" transition>
            {unprotectedRoutes.map((item) => (
              <PageLink
                className='text-center'
                key={item.name}
                href={item.href}                    
              >
                {item.name}
              </PageLink>
            ))}
            {user && protectedRoutes.map((item) => (
              <PageLink
                className='text-center'
                key={item.name}
                href={item.href}
              >
                {item.name}
              </PageLink>
            ))}
          </DisclosurePanel>
    </Disclosure>
  )
}
