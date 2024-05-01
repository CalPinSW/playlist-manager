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
        className={`fixed top-0 left-0 w-[100vw] h-[100vh] z-40 bg-black opacity-20`}
      ></div>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-background-popover w-fit h-fit fixed opacity-100 left-[40vw] top-[40vh] rounded-xl shadow p-6 z-50`}
      >
        {children}
      </div>
    </>
  );
};

export default Modal;
