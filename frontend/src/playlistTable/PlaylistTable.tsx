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
      size: 20,
      id: "image",
      cell: ({ row }) => {
        if (row.original.images[0]?.url) {
          return <img src={row.original.images[0].url} className="w-40"></img>;
        }
        return <PlaylistIcon className="w-24 h-24 fill-primary-500" />;
      },
    }),
    columnHelper.accessor("name", {
      size: 10,
      cell: (info) => info.getValue(),
      footer: (props) => props.column.id,
    }),
    columnHelper.accessor("description", {
      cell: (info) => info.getValue(),
    }),
    columnHelper.display({
      id: "edit",
      cell: ({ row }) => {
        return <EditPlaylistButton playlistId={row.original.id} />;
      },
    }),
    columnHelper.display({
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
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="flex">
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
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
            <tr key={row.id} className="h-20">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          {table.getFooterGroups().map((footerGroup) => (
            <tr key={footerGroup.id}>
              {footerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.footer,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </tfoot>
      </table>
    </div>
  );
};

export default PlaylistTable;
