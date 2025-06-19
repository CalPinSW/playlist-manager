import { IReleaseGroup } from 'musicbrainz-api';
import mbApi from '../../../../lib/musicbrainz';
import fetchMBReleaseGroupMatch from './fetchMBReleaseGroupMatch';

const fetchMBReleaseGroup = async (albumName: string, firstArtistName: string): Promise<IReleaseGroup> => {
  const mbReleaseGroupMatch = await fetchMBReleaseGroupMatch(albumName, firstArtistName);
  return mbApi.lookup('release-group', mbReleaseGroupMatch.id, ['url-rels', 'genres']);
};

export default fetchMBReleaseGroup;
