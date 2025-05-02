import React, { FC } from "react";
import { Album } from "../../interfaces/Album";
import ButtonAsync from "../../components/ButtonAsync";
import Button from "../../components/Button";
import { Playlist } from "../../interfaces/Playlist";
import { addAlbumToPlaylist, resumePlayback } from "../../api";
import { useAuthorizedRequest } from "../../hooks/useAuthorizedRequest";

interface AlbumActionsProps {
    album: Album
    associatedPlaylists: Playlist[]
    contextPlaylist: Playlist
}

const AlbumActions: FC<AlbumActionsProps> = ({album, associatedPlaylists, contextPlaylist}) => {
    const authorizedRequest = useAuthorizedRequest();
    
    return (
        <div className="flex flex-col my-2 gap-2">
            {associatedPlaylists.map((associatedPlaylist) => (
                <ButtonAsync
                    onClick={() => authorizedRequest(addAlbumToPlaylist(associatedPlaylist.id, album.id))}
                    key={associatedPlaylist.id}
                >
                    Add to {associatedPlaylist.name}
                </ButtonAsync>
        ))}
            <Button
                onClick={() => authorizedRequest(resumePlayback({id: album.id, context_uri: contextPlaylist.uri}))}
            >
                Resume Album
            </Button>

        </div>
    )
}

export default AlbumActions
