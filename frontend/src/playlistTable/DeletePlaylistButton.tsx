import { Delete } from "@mui/icons-material";
import { Button } from "@mui/material";
import React, { FC } from "react";

interface IDeletePlaylistButton {
  onClick: () => void;
}

const DeletePlaylistButton: FC<IDeletePlaylistButton> = ({ onClick }) => {
  return (
    <Button onClick={onClick}>
      <Delete color="primary" />
    </Button>
  );
};

export default DeletePlaylistButton;
