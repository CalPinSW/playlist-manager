import React, { FC } from "react";
import { Link } from "react-router-dom";
import Input from "./components/Input";
import InputLabel from "./components/InputLabel";
import Button from "./components/Button";
import { Form, useForm } from "react-hook-form";
import { addPlaylist } from "./api";
import { Playlist } from "./interfaces/Playlist";

const AddPlaylistForm: FC = () => {
  const { control, register, getValues } = useForm<Playlist>({});

  return (
    <div className="m-2">
      <Form
        onSubmit={() => {
          addPlaylist(getValues());
        }}
        control={control}
      >
        <div className="flex flex-col sm:flex-row sm:space-x-8">
          <div>
            <InputLabel>Title:</InputLabel>
            <Input register={register("name")} type="text" name="name" />
          </div>
          <div>
            <InputLabel>Description:</InputLabel>
            <Input
              register={register("description")}
              type="text"
              name="description"
            />
          </div>
          <Button type="submit" className="mb-1 mt-auto px-2 align-bottom">
            Add Playlist
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default AddPlaylistForm;
