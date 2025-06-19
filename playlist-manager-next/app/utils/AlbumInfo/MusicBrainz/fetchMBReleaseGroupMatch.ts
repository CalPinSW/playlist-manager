import { IReleaseGroupMatch } from 'musicbrainz-api';
import mbApi from '../../../../lib/musicbrainz';

const fetchMBReleaseGroupMatch = async (albumName: string, firstArtistName: string): Promise<IReleaseGroupMatch> => {
  const artist = firstArtistName;
  const title = albumName;
  const query = `query=artist:"${artist}" AND release:"${title}"`;
  const results = await mbApi.search('release-group', { query });
  return (
    results['release-groups'].find(rg => rg['primary-type'] == 'Album') ??
    results['release-groups'].find(rg => rg['primary-type'] == 'EP') ??
    results['release-groups'].find(rg => rg['primary-type'] == 'Other') // Often Live Albums
  );
};

export default fetchMBReleaseGroupMatch;
