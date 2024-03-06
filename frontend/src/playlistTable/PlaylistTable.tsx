import * as React from "react";
import Box from "@mui/material/Box";
import { DataGrid, GridCellParams, GridColDef } from "@mui/x-data-grid";
import { Playlist } from "../interfaces/Playlist";
import { FC } from "react";
import EditPlaylistButton from "./EditPlaylistButton";
import DeletePlaylistButton from "./DeletePlaylistButton";

interface IPlaylistTable {
  playlists: Playlist[];
}

const PlaylistTable: FC<IPlaylistTable> = ({ playlists }) => {
  const onEditPlaylistClick = (playlist: Playlist) => {
    null;
  };

  const onDeletePlaylistClick = (playlist: Playlist) => {
    null;
  };

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 90 },
    {
      field: "title",
      headerName: "Title",
      width: 150,
      editable: true,
    },
    {
      field: "description",
      headerName: "Description",
      width: 300,
    },
    {
      field: "createdAt",
      headerName: "Created At",
      width: 200,
      renderCell: (gridCellParams: GridCellParams<Playlist>) => {
        return gridCellParams.row.createdAt.format("DD/MM/YYYY hh:mm:ss");
      },
    },
    {
      field: "edit",
      headerName: "",
      description: "",
      align: "center",
      sortable: false,
      width: 160,
      renderCell: (gridCellParams: GridCellParams<Playlist>) => {
        return <EditPlaylistButton playlistId={gridCellParams.row.id} />;
      },
    },
    {
      field: "delete",
      headerName: "",
      description: "",
      align: "center",
      sortable: false,
      width: 160,
      renderCell: (gridCellParams: GridCellParams<Playlist>) => {
        return (
          <DeletePlaylistButton
            onClick={() => onDeletePlaylistClick(gridCellParams.row)}
          />
        );
      },
    },
  ];

  return (
    <Box sx={{ height: 400, width: "100%" }}>
      <DataGrid
        rows={playlists}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 5,
            },
          },
        }}
        pageSizeOptions={[5]}
        checkboxSelection
        disableRowSelectionOnClick
      />
    </Box>
  );
};

export default PlaylistTable;
