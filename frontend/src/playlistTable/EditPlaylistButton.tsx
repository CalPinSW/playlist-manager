import { Edit } from "@mui/icons-material";
import React, { FC } from "react";
import { Link } from "react-router-dom";

interface IEditPlaylistButton {
  playlistId: number;
}

const EditPlaylistButton: FC<IEditPlaylistButton> = ({ playlistId }) => {
  return (
    <Link to={`edit/${playlistId}`}>
      <Edit color="primary" />
    </Link>
  );
};

export default EditPlaylistButton;
