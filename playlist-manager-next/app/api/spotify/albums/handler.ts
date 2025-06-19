import { MaxInt, PartialSearchResult, SpotifyApi } from '@spotify/web-api-ts-sdk';

interface SearchParams {
  search?: string;
  limit?: MaxInt<50>;
  offset?: number;
}

export const searchSpotifyAlbums = async (spotifySdk: SpotifyApi, searchParams: SearchParams): Promise<Required<Pick<PartialSearchResult, "albums">>> => {
  const search = searchParams.search || '';
  const limit: MaxInt<50> = searchParams.limit || 20;
  const offset = searchParams.offset || 0;

  return spotifySdk.search(search, ['album'], 'GB', limit, offset);
};
