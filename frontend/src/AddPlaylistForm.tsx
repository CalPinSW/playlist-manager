import React, { FC } from "react";
import { Link } from "react-router-dom";
import Input from "./components/Input";
import InputLabel from "./components/InputLabel";
import Button from "./components/Button";
import { Form, useForm } from "react-hook-form";

const AddPlaylistForm: FC = () => {
  const { control, register } = useForm({});

  return (
    <div>
      <div className="m-2">
        <h2 className="text-xl">New Playlist</h2>
      </div>
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
          <div className="flex flex-row">
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
          </div>

          <div className="space-x-4 justify-stretch">
            <Button type="submit">Submit</Button>
            <Link to={`/`}>Back</Link>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default AddPlaylistForm;
