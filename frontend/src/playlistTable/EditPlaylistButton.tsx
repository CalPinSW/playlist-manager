import { Edit } from "@mui/icons-material";
import { Button } from "@mui/material";
import React, { FC } from "react";

interface IEditPlaylistButton {
  onClick: () => void;
}

const EditPlaylistButton: FC<IEditPlaylistButton> = ({ onClick }) => {
  return (
    <Button onClick={onClick}>
      <Edit color="primary" />
    </Button>
  );
};

export default EditPlaylistButton;