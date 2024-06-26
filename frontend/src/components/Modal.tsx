import React, { FC, ReactNode, useEffect, useRef, useState } from "react";

interface ModalProps {
  children: ReactNode;
  isModalOpen: boolean;
  closeModal: () => void;
}

const Modal: FC<ModalProps> = ({ children, isModalOpen, closeModal }) => {
  if (!isModalOpen) return null;
  return (
    <>
      <div
        onClick={closeModal}
        className={`fixed top-0 left-0 w-screen h-screen z-40 bg-black opacity-20`}
      ></div>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-background-popover w-fit h-fit fixed opacity-100 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl shadow p-6 z-50`}
      >
        {children}
      </div>
    </>
  );
};

export default Modal;
