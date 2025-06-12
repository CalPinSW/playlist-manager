"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Link from "next/link";
import useDbUser from "../../app/hooks/useDbUser";

export const ProfileSettings = () => {
  const { user, isLoading } = useDbUser();

  return (
    <div className="flex flex-col gap-2">
      {/* Desktop */}
      <div className="flex items-center">
        {!isLoading && !user && (
          <Link
            href="/auth/login"
            className="bg-primary text-white px-4 py-2 rounded shadow hover:bg-primary-darker transition"
            data-testid="navbar-login-desktop"
          >
            Log in
          </Link>
        )}
        {user && (
          <Menu as="div" className="relative">
            <MenuButton className="flex items-center gap-2 focus:outline-none">
              <img
                src={user.image_url ?? ""}
                alt="Profile"
                className="rounded-full w-10 h-10"
                data-testid="navbar-picture-desktop"
              />
              <span className="font-medium text-primary">{user.display_name}</span>
            </MenuButton>
            <MenuItems className="absolute right-0 mt-2 w-48 origin-top-right bg-white dark:bg-background rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              <div className="py-1">
                <MenuItem>
                  {({ active }) => (
                    <span
                      className={`block px-4 py-2 text-sm text-gray-700 dark:text-text-secondary ${
                        active ? "bg-gray-100 dark:bg-background-offset" : ""
                      }`}
                      data-testid="navbar-user-desktop"
                    >
                      {user.display_name}
                    </span>
                  )}
                </MenuItem>
                <MenuItem>
                  {({ active }) => (
                    <Link
                      href="/profile"
                      className={`block px-4 py-2 text-sm ${
                        active ? "bg-gray-100 dark:bg-background-offset" : ""
                      }`}
                      data-testid="navbar-profile-desktop"
                    >
                      Profile
                    </Link>
                  )}
                </MenuItem>
                <MenuItem>
                  {({ active }) => (
                    <Link
                      href="/pages/link-user-to-spotify"
                      className={`block px-4 py-2 text-sm ${
                        active ? "bg-gray-100 dark:bg-background-offset" : ""
                      }`}
                      data-testid="navbar-profile-desktop"
                    >
                      Link with Spotify
                    </Link>
                  )}
                </MenuItem>
                <MenuItem>
                  {({ active }) => (
                    <Link
                      href="/auth/logout"
                      className={`block px-4 py-2 text-sm text-red-600 ${
                        active ? "bg-gray-100 dark:bg-background-offset" : ""
                      }`}
                      data-testid="navbar-logout-desktop"
                    >
                      Log out
                    </Link>
                  )}
                </MenuItem>
              </div>
            </MenuItems>
          </Menu>
        )}
      </div>
    </div>
  );
};