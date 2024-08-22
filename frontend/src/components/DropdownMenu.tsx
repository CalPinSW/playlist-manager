import React, { FC, ReactNode, useEffect, useRef } from "react";

interface ModalProps {
  children: ReactNode;
  trigger: ReactNode;
  isMenuOpen: boolean;
  closeMenu: () => void;
}

const DropdownMenu: FC<ModalProps> = ({ children, trigger, isMenuOpen, closeMenu }) => {
    const dropdownRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = ({target}: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(target as Node)) {
                closeMenu();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef, closeMenu]);

  return (
    <div className="relative" ref={dropdownRef}>
    {trigger}
    {isMenuOpen &&
      <div
        
        className={`bg-background-popover w-full h-fit absolute opacity-100 origin-top-right left-0 rounded-xl shadow p-6 z-50`}
        role={"menu"}
      >
        {children}
      </div>
}
    </div>
  );
};

export default DropdownMenu;
