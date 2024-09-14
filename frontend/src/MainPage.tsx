import React, { FC, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPlaylists } from "./api";
import { Playlist } from "./interfaces/Playlist";
import PlaylistTable from "./playlistTable/PlaylistTable";
import Box from "./components/Box";
import AddPlaylistForm from "./AddPlaylistForm";
import { GoArrowLeft, GoArrowRight } from "react-icons/go";
import CustomButton from "./components/Button";
import useWindowSize from "./hooks/useWindowSize";

interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export const Index: FC = () => {
  const { isMobileView } = useWindowSize();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: isMobileView ? 5 : 8,
  });

  useEffect(() => {
    const previousIndex = pagination.pageSize * pagination.pageIndex;
    const pageSize = isMobileView ? 8 : 8;
    const newIndex = Math.floor(previousIndex / pageSize);

    setPagination({
      pageIndex: newIndex,
      pageSize: pageSize,
    });
  }, [isMobileView]);

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
    <div className="py-4 px-2 space-y-2">
      <Box>
        <PlaylistTable playlists={data} />
        <div className="flex justify-between">
          <CustomButton className="flex space-x-2" onClick={onClickPrevious}>
            <GoArrowLeft className="my-auto" />
            <div>Previous</div>
          </CustomButton>

          <CustomButton className="flex space-x-2" onClick={onClickNext}>
            <GoArrowRight className="my-auto" />
            <div>Next</div>
          </CustomButton>
        </div>
      </Box>
      <Box>
        <AddPlaylistForm />
      </Box>
    </div>
  );
};
