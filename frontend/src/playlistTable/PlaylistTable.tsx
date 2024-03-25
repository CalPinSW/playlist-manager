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

interface IPlaylistTable {
  playlists: Playlist[];
}

const PlaylistTable: FC<IPlaylistTable> = ({ playlists }) => {
  const onDeletePlaylistClick = (playlist: Playlist) => {
    deletePlaylist(playlist);
  };
  const columnHelper = createColumnHelper<Playlist>();
  const defaultColumns = [
    columnHelper.display({
      id: "image",
      size: 20,
      cell: ({ row }) => {
        if (row.original.images?.[0]?.url) {
          return (
            <img src={row.original.images[0].url} className="w-full"></img>
          );
        }
        return <PlaylistIcon className="w-full h-full fill-primary-500" />;
      },
    }),
    columnHelper.accessor("name", {
      size: 200,
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("description", {
      size: 200,
      cell: (info) => info.getValue(),
    }),
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
    data: playlists,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <table style={{ tableLayout: "fixed", width: "100%" }}>
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
          {table.getRowModel().rows.map((row) => (
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
