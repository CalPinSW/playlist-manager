import * as React from "react";
import { Link } from "react-router-dom";
import { getCurrentUserDetails, login} from "../../api";
import { useQuery } from "@tanstack/react-query";
import { User } from "../../interfaces/User";
import UserMenu from "./UserMenu";

const Header = () => {
  const { data: userData } = useQuery<User>({
    queryKey: ["current-user"],
    queryFn: () => {
      return getCurrentUserDetails();
    },
  });

  return (
    <div className="flex justify-between top-0 h-16 sm:h-20 bg-primary-300">
      <Link to="/" className="flex mx-4 my-auto text-lg">
        Playlist Manager
      </Link>
      <div className="flex mx-4">
        {userData ? (
          <UserMenu userData={userData} />
        ) : (
          <button onClick={login}>Login</button>
        )}
      </div>
    </div>
  );
};

export default Header;
