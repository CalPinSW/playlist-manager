import React, { FC } from "react";
import { Playlist } from "./interfaces/Playlist";
import { Link, useLoaderData } from "react-router-dom";
import Input from "./components/Input";

export const EditPlaylist: FC = () => {
  const playlist = useLoaderData() as Playlist;

  return (
    <div>
      <div>
        <div className="m-2">
          <h2 className="text-6xl">Edit Playlist</h2>
        </div>
        <form
          method="post"
          action="{{url_for('post_edit_playlist', id=playlist.id)}}"
        >
          <div>
            <label>Title:</label>
            <Input
              type="text"
              id="title"
              name="title"
              defaultValue={playlist.title}
            />
          </div>
          <div>
            <label>Description:</label>
            <input
              type="text"
              id="description"
              name="description"
              defaultValue={playlist.description}
            />
          </div>
          <div>
            <button type="submit">Submit</button>
            <Link to={`/`}>Back</Link>
          </div>
        </form>
      </div>
    </div>
  );
};
