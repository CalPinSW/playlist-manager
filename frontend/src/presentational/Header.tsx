import * as React from "react";
import { Link } from "react-router-dom";
import Box from "../components/Box";
import { getCurrentUserDetails, login } from "../api";
import { useQuery } from "@tanstack/react-query";
import { User } from "../interfaces/User";

const Header = () => {
  const { isLoading, error, data } = useQuery<User>({
    queryKey: ["current-user"],
    queryFn: () => {
      return getCurrentUserDetails();
    },
  });
  return (
    <div className="flex justify-between top-0 h-16 sm:h-20 bg-primary-500">
      <Link to="/" className="flex mx-4 my-auto text-lg text-white">
        Playlist Manager
      </Link>
      <Box className="flex mx-4 text-white">
        {data ? (
          <div className="flex space-x-4">
            <div className="my-auto">{data.display_name}</div>
            {data.images && (
              <img
                src={data.images[data.images.length - 1].url}
                className="h-16 sm:h-20 rounded-full"
              ></img>
            )}
          </div>
        ) : (
          <button onClick={login}>Login</button>
        )}
      </Box>
    </div>
  );
};

export default Header;
