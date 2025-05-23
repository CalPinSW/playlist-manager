import * as React from "react";
import { Playlist } from "../interfaces/Playlist";
import { FC } from "react";
import EditPlaylistButton from "./EditPlaylistButton";
import DeletePlaylistButton from "./DeletePlaylistButton";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import PlaylistIcon from "./PlaylistIcon";
import { deletePlaylist } from "../api";
import useWindowSize from "../hooks/useWindowSize";
import { UseQueryResult } from "@tanstack/react-query";
import LoadingSpinner from "../components/LoadingSpinner";

interface IPlaylistTable {
  playlistsQuery: UseQueryResult<Playlist[], Error>
}

const PlaylistTable: FC<IPlaylistTable> = ({ playlistsQuery }) => {
  const { isMobileView } = useWindowSize();

  const onDeletePlaylistClick = (playlist: Playlist) => {
    deletePlaylist(playlist);
  };
  const columnHelper = createColumnHelper<Playlist>();
  const defaultColumns = [
    columnHelper.display({
      id: "image",
      size: 50,
      cell: ({ row }) => {
        if (row.original.image_url) {
          return (
            <img src={row.original.image_url} className="w-full"></img>
          );
        }
        return <PlaylistIcon className="size-full fill-primary" />;
      },
    }),
    columnHelper.accessor("name", {
      size: 150,
      cell: (info) => info.getValue(),
    }),
    ...(isMobileView
      ? []
      : [
          columnHelper.accessor("description", {
            size: 150,
            cell: (info) => info.getValue(),
          }),
        ]),
    columnHelper.display({
      size: 50,
      id: "edit",
      cell: ({ row }) => {
        return <EditPlaylistButton playlistId={row.original.id} />;
      },
    }),
    columnHelper.display({
      size: 50,
      id: "delete",
      cell: ({ row }) => {
        return (
          <DeletePlaylistButton
            onClick={() => onDeletePlaylistClick(row.original)}
          />
        );
      },
    }),
  ];

  const table = useReactTable<Playlist>({
    columns: defaultColumns,
    data: playlistsQuery.data ?? [],
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <table style={{ tableLayout: "fixed", width: "100%"}}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="text-left"
                  style={{
                    width:
                      header.getSize() !== 150 ? header.getSize() : undefined,
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {playlistsQuery.isLoading ? <div className="m-auto"><LoadingSpinner /></div> :
          table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="h-16">
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  style={{
                    width:
                      cell.column.getSize() !== 150
                        ? cell.column.getSize()
                        : undefined,
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PlaylistTable;
