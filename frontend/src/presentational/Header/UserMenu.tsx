import React, { FC, useState } from "react";
import DropdownMenu from "../../components/DropdownMenu";
import { User } from "../../interfaces/User";
import Button from "../../components/Button";
import { logout } from "../../api";
import LinkButton from "../../components/LinkButton";

interface UserMenuProps {
    userData: User;
}

const UserMenu: FC<UserMenuProps> = ({userData}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
    return (
    <DropdownMenu isMenuOpen={isMenuOpen} closeMenu={() => setIsMenuOpen(false)} trigger={
        <button className="flex space-x-4" onClick={() => setIsMenuOpen((open) => !open)}>
          <div className="my-auto">{userData.display_name}</div>
          {userData.images && (
            <img
              src={userData.images[userData.images.length - 1].url}
              className="h-16 sm:h-20 rounded-full"
            ></img>
          )}
        </button>
        }
      >
        <LinkButton className={"flex w-full"} href={'/settings'}>Settings</LinkButton>
        <Button className={"flex w-full"} onClick={logout}>Logout</Button>
      </DropdownMenu>)
}

export default UserMenu
