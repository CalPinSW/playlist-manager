import { BiEdit } from "react-icons/bi";
import React, { FC } from "react";
import { Link } from "react-router-dom";

interface IEditPlaylistButton {
  playlistId: string;
}

const EditPlaylistButton: FC<IEditPlaylistButton> = ({ playlistId }) => {
  return (
    <Link to={`edit/${playlistId}`}>
      <BiEdit className="w-6 h-6 fill-primary-400 hover:fill-primary-500 cursor-pointer" />
    </Link>
  );
};

export default EditPlaylistButton;
