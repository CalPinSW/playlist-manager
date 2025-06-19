import { Artist, SimplifiedArtist } from '@spotify/web-api-ts-sdk';
import { artist } from '../../generated/prisma';

const renderArtistList = (artists: (artist | SimplifiedArtist | Artist)[]): string =>
  artists.map(a => a.name).join(', ');

export default renderArtistList;
