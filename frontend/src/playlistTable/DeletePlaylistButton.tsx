import React, { FC } from "react";
import { MdDelete } from "react-icons/md";

interface IDeletePlaylistButton {
  onClick: () => void;
}

const DeletePlaylistButton: FC<IDeletePlaylistButton> = ({ onClick }) => {
  return (
    <button onClick={onClick}>
      <MdDelete className="w-6 h-6 fill-primary-darker hover:fill-primary cursor-pointer" />
    </button>
  );
};

export default DeletePlaylistButton;
