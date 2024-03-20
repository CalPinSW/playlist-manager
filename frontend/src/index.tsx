import React, { FC, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPlaylists } from "./api";
import { Playlist } from "./interfaces/Playlist";
import PlaylistTable from "./playlistTable/PlaylistTable";
import Box from "./components/Box";
import AddPlaylistForm from "./AddPlaylistForm";
import { GoArrowLeft, GoArrowRight } from "react-icons/go";
import CustomButton from "./components/Button";

interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export const Index: FC = () => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const onClickNext = () => {
    setPagination((state) => ({
      pageSize: state.pageSize,
      pageIndex: state.pageIndex + state.pageSize,
    }));
  };

  const onClickPrevious = () => {
    setPagination((state) => ({
      pageSize: state.pageSize,
      pageIndex: Math.max(state.pageIndex - state.pageSize, 0),
    }));
  };
  const { isLoading, error, data } = useQuery<Playlist[]>({
    queryKey: ["playlists", pagination],
    queryFn: () => {
      return getPlaylists(pagination.pageIndex, pagination.pageSize);
    },
  });

  if (isLoading || !data) return "Loading...";

  if (error) return "An error has occurred: " + error.message;

  return (
    <div>
      <Box>
        <PlaylistTable playlists={data} />
        <div className="flex justify-between">
          <CustomButton className="flex" onClick={onClickPrevious}>
            <GoArrowLeft />
            Previous
          </CustomButton>

          <CustomButton className="flex" onClick={onClickNext}>
            <GoArrowRight />
            Next
          </CustomButton>
        </div>
      </Box>
      <AddPlaylistForm />
    </div>
  );
};
