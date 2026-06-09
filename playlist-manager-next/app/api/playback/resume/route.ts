import { withAuth } from '../../withAuth';
import { withSpotifyAccessToken } from '../../spotify/utilities/getAccessTokensFromRequest';
import { resumePlaybackHandler } from './handler';

export const POST = withAuth(withSpotifyAccessToken(resumePlaybackHandler));
