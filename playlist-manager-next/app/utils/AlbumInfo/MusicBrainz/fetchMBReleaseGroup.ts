import { IReleaseGroup } from 'musicbrainz-api';
import mbApi from '../../../../lib/musicbrainz';
import fetchMBReleaseGroupMatch from './fetchMBReleaseGroupMatch';

const fetchMBReleaseGroup = async (albumName: string, firstArtistName: string): Promise<IReleaseGroup | null> => {
  const mbReleaseGroupMatch = await fetchMBReleaseGroupMatch(albumName, firstArtistName);
  if (!mbReleaseGroupMatch) return null;
  return mbApi.lookup('release-group', mbReleaseGroupMatch.id, ['url-rels', 'genres', 'tags']);
};

export default fetchMBReleaseGroup;
