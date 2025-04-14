import React, {
    FC,
    ReactElement,
    createContext,
    useEffect,
    useState,
  } from "react";
  
  import { useAuth0, User as Auth0User } from "@auth0/auth0-react";
  import { getSpotifyStatus } from "../api/auth";
import { useAuthorizedRequest } from "../../../react-native-frontend/PlaylistManager/hooks/useAuthorizedRequest";
  
  interface SpotifyAuthContext {
    user?: Auth0User;
    isSpotifyLinked?: boolean;
    linkSpotify?: () => void
  }
  
  export const SpotifyAuthContext = createContext<SpotifyAuthContext>({});
  
  interface SpotifyAuthContextProviderProps {
    children: ReactElement;
  }
  
  export const SpotifyAuthContextProvider: FC<SpotifyAuthContextProviderProps> = ({
    children,
  }) => {
    const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
    const [isSpotifyLinked, setIsSpotifyLinked] = useState(true);
    const authorizedRequest = useAuthorizedRequest();
    useEffect(() => {
      if (isAuthenticated) {
        const checkSpotifyLink = async () => {
          const response = await authorizedRequest(getSpotifyStatus())
          setIsSpotifyLinked(response.spotifyLinked);
        };
  
        checkSpotifyLink();
      }
    }, [isAuthenticated, getAccessTokenSilently]);
  
    const linkSpotify = () => {
      window.location.href = "http://localhost:5000/auth/spotify/login";
    };
  
  
    return (
      <SpotifyAuthContext.Provider value={{ user, isSpotifyLinked, linkSpotify }}>
        {children}
      </SpotifyAuthContext.Provider>
    );
  };
  