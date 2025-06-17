import { MusicBrainzApi } from 'musicbrainz-api';

const mbApi = new MusicBrainzApi({
  appName: 'Playlist Manager',
  appVersion: '0.1.0',
  appContactInfo: 'calumpinder@gmail.com'
});

export default mbApi;
