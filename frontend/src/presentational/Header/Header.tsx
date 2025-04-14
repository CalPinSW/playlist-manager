import * as React from "react";
import { Link } from "react-router-dom";
import { getCurrentUserDetails} from "../../api";
import { useQuery } from "@tanstack/react-query";
import { User } from "../../interfaces/User";
import UserMenu from "./UserMenu";
import { useAuth0 } from "@auth0/auth0-react";
import { useAuthorizedRequest } from "../../../../react-native-frontend/PlaylistManager/hooks/useAuthorizedRequest";

const Header = () => {
  const { loginWithRedirect } = useAuth0();
  const authorizedRequest = useAuthorizedRequest()
  const { data: userData } = useQuery<User>({
    queryKey: ["current-user"],
    queryFn: () => authorizedRequest(getCurrentUserDetails()),
    refetchInterval: 1000000,
    retryDelay: 1000000
  });
  return (
    <div className="flex flex-shrink-0 justify-between h-16 sm:h-20 bg-background-offset">
      <Link to="/" className="flex mx-4 my-auto text-lg">
        Playlist Manager
      </Link>
      <div className="flex mx-4">
        {userData ? (
          <UserMenu userData={userData} />
        ) : (
          <button onClick={() => loginWithRedirect()}>Login</button>
        )}
      </div>
    </div>
  );
};

export default Header;
