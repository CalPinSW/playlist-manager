import React, { FC } from "react";
import { Link } from "react-router-dom";
import Input from "./components/Input";
import InputLabel from "./components/InputLabel";
import Button from "./components/Button";
import { Form, useForm } from "react-hook-form";

const AddPlaylistForm: FC = () => {
  const { control, register } = useForm({});

  return (
    <div className="m-2">
      <Form
        method="post"
        action={`http://localhost:5000/create-playlist`}
        control={control}
        onSuccess={() => {
          alert("Success");
        }}
        onError={() => {
          alert("error");
        }}
      >
        <div className="flex flex-row space-x-8">
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
