import React, { FC } from "react";
import { Playlist } from "./interfaces/Playlist";
import { Link, useLoaderData } from "react-router-dom";
import Input from "./components/Input";
import InputLabel from "./components/InputLabel";
import Button from "./components/Button";

export const EditPlaylist: FC = () => {
  const playlist = useLoaderData() as Playlist;

  return (
    <div>
      <div>
        <div className="m-2">
          <h2 className="text-xl">Edit Playlist</h2>
        </div>
        <div className="m-2">
          <form
            method="post"
            action="{{url_for('post_edit_playlist', id=playlist.id)}}"
          >
            <div>
              <InputLabel>Title:</InputLabel>
              <Input
                type="text"
                id="title"
                name="title"
                defaultValue={playlist.title}
              />
            </div>
            <div>
              <InputLabel>Description:</InputLabel>
              <Input
                type="text"
                id="description"
                name="description"
                defaultValue={playlist.description}
              />
            </div>
            <div className="space-x-4 justify-stretch">
              <Button>Submit</Button>
              <Link to={`/`}>Back</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
