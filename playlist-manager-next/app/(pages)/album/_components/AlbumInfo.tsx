import { FC } from 'react';
import { AlbumWithTracks } from '../[albumId]/page';
import wikipedia from 'wikipedia';

interface AlbumInfoProps {
  album: AlbumWithTracks;
}

const AlbumInfo: FC<AlbumInfoProps> = async ({ album }) => {
  const wikiAlbumInfo = await fetchWikipediaAlbumInfo(album);
  if (!wikiAlbumInfo) return null;
  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: wikiAlbumInfo.extract_html }}></div>
    </div>
  );
};

export default AlbumInfo;

const fetchWikipediaAlbumInfo = async (album: AlbumWithTracks) => {
  try {
    const results = await wikipedia.summary(`${album.name}_(album)`);
    return results;
  } catch (_) {
    return null;
  }
};
