import React, { FC } from "react";
import Input from "./components/Inputs/Input";
import InputLabel from "./components/Inputs/InputLabel";
import Button from "./components/Button";
import { Form, useForm } from "react-hook-form";
import { addPlaylist } from "./api";
import { Playlist } from "./interfaces/Playlist";
import { useAuthorizedRequest } from "./hooks/useAuthorizedRequest";

const AddPlaylistForm: FC = () => {
  const { control, register, getValues } = useForm<Playlist>({});
  const authorizedRequest = useAuthorizedRequest()
  const onSubmit = () => {
    const values = getValues();
    if (values.name !== "") {
      authorizedRequest(addPlaylist(values));
    }
  };

  return (
    <div className="m-4">
      <Form onSubmit={onSubmit} control={control}>
        <div className="flex flex-col w-full sm:flex-row sm:space-x-8">
          <div className="flex flex-row sm:flex-col justify-between">
            <InputLabel>Title:</InputLabel>
            <Input register={register("name")} type="text" name="name" />
          </div>
          <div className="flex flex-row sm:flex-col justify-between">
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
