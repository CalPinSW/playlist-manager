import { Album } from '@spotify/web-api-ts-sdk';
import { IReleaseGroupMatch } from 'musicbrainz-api';
import mbApi from '../../../lib/musicbrainz';

const fetchMBReleaseGroupMatch = async (album: Album): Promise<IReleaseGroupMatch> => {
  const artist = album.artists[0].name;
  const title = album.name;
  const query = `query=artist:"${artist}" AND release:"${title}"`;
  const results = await mbApi.search('release-group', { query });
  return results['release-groups'].find(rg => rg['primary-type'] == 'Album');
};

export default fetchMBReleaseGroupMatch;
