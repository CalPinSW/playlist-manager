import { BiSolidPlaylist } from "react-icons/bi";
import React, { FC } from "react";

interface IPlaylistIcon {
  className?: string;
}

const PlaylistIcon: FC<IPlaylistIcon> = (props) => {
  return <BiSolidPlaylist {...props} color="primary" />;
};

export default PlaylistIcon;
