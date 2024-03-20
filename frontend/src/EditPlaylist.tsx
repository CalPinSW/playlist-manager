import React, { FC } from "react";
import { Playlist } from "./interfaces/Playlist";
import { Link, useLoaderData } from "react-router-dom";
import Input from "./components/Input";
import InputLabel from "./components/InputLabel";
import Button from "./components/Button";
import { Form, useForm } from "react-hook-form";
import { updatePlaylist } from "./api";

export const EditPlaylist: FC = () => {
  const playlist = useLoaderData() as Playlist;
  const { control, register } = useForm({
    defaultValues: playlist,
  });

  return (
    <div>
      <div>
        <div className="m-2">
          <h2 className="text-xl">Edit Playlist</h2>
        </div>
        <div className="m-2">
          <Form
            method="post"
            action={`http://localhost:5000/edit-playlist/${playlist.id}`}
            control={control}
            onSuccess={() => {
              alert("Success");
            }}
            onError={() => {
              alert("error");
            }}
          >
            <div>
              <InputLabel>Title:</InputLabel>
              <Input
                register={register("name")}
                type="text"
                name="name"
                defaultValue={playlist.name}
              />
            </div>
            <div>
              <InputLabel>Description:</InputLabel>
              <Input
                register={register("description")}
                type="text"
                name="description"
                defaultValue={playlist.description}
              />
            </div>
            <div className="space-x-4 justify-stretch">
              <Button type="submit">Submit</Button>
              <Link to={`/`}>Back</Link>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};
