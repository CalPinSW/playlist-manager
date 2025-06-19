import { ArtistInfo } from '../interfaces/AlbumInfo/AlbumInfo';
import { AlbumInfo } from '../interfaces/AlbumInfo/AlbumInfo';
import fetchMBReleaseGroup from './MusicBrainz/fetchMBReleaseGroup';
import { fetchWikipediaAlbumInfo } from './Wikibase/fetchWikipediaData';

export const getAlbumInfo = async (
  albumName: string,
  artists: ArtistInfo[],
  albumImageUrl: string
): Promise<AlbumInfo> => {
  // The less said on this the better.
  try {
    const albumInfo: AlbumInfo = { name: albumName, artists: artists, albumImageUrl: albumImageUrl, genres: [] };
    const releaseGroup = await fetchMBReleaseGroup(albumName, artists[0].name);
    if (releaseGroup) {
      albumInfo.type = releaseGroup['primary-type'];
      if (releaseGroup['tags']) {
        albumInfo.genres = releaseGroup['tags'];
      }
      if (releaseGroup['genres']) {
        albumInfo.genres.push(...releaseGroup['genres']);
      }
    }

    const wikiRelation = releaseGroup['relations'].find(rel => rel.type === 'wikidata');
    if (wikiRelation) {
      const wikidata = await fetchWikipediaAlbumInfo(
        wikiRelation.url.resource.replace('https://www.wikidata.org/wiki/', '')
      );
      if (wikidata) {
        albumInfo.summary = wikidata.extract;
        albumInfo.summary_html = wikidata.extract_html;
      }
    }
    return albumInfo;
  } catch (_) {
    console.log(_);
    return null;
  }
};
