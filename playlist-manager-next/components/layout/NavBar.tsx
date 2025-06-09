"use client"
import React from 'react';
import { useUser } from '@auth0/nextjs-auth0';
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { usePathname } from 'next/navigation';
import PageLink from './PageLink';
import { ProfileSettings } from './Profile';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function NavBar() {
  const { user, isLoading } = useUser();
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
    <Disclosure as="nav" className="bg-gray-800">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            {/* Mobile menu button*/}
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-hidden focus:ring-inset">
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
              <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
            </DisclosureButton>
          </div>
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex shrink-0 items-center">
              <img
                alt="Your Company"
                src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
                className="h-8 w-auto"
              />
            </div>
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
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
      </div>
    </Disclosure>
  )
}
