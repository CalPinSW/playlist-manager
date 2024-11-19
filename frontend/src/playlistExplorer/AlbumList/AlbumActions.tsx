import React, { FC } from "react";
import { Album } from "../../interfaces/Album";
import ButtonAsync from "../../components/ButtonAsync";
import Button from "../../components/Button";
import { Playlist } from "../../interfaces/Playlist";
import { addAlbumToPlaylist, startPlayback } from "../../api";

interface AlbumActionsProps {
    album: Album
    associatedPlaylists: Playlist[]
    contextPlaylist: Playlist
}

const AlbumActions: FC<AlbumActionsProps> = ({album, associatedPlaylists, contextPlaylist}) => {
    return (
        <div className="flex flex-col my-2 gap-2">
            {associatedPlaylists.map((associatedPlaylist) => (
                <ButtonAsync
                    onClick={() => addAlbumToPlaylist(associatedPlaylist.id, album.id)}
                    key={associatedPlaylist.id}
                >
                    Add to {associatedPlaylist.name}
                </ButtonAsync>
        ))}
            <Button
                onClick={() => (startPlayback({context_uri: contextPlaylist.uri, offset: {album_id: album.id} }))}
            >
                Play Album
            </Button>
        </div>
    )
}

export default AlbumActions
