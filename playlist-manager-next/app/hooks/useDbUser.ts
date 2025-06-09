import { useUser as useAuth0User } from "@auth0/nextjs-auth0";
import { useEffect, useState } from "react";
import { user } from "../generated/prisma";
import { User } from "@auth0/nextjs-auth0/types";

interface UseDbUserReturn {
    user: user | null;
    isLoading: boolean;
    error: Error | null;
    invalidate: () => Promise<User | undefined>;
}

const useDbUser = (): UseDbUserReturn => {
      const { user: auth0User, isLoading: isAuth0UserLoading, error: auth0Error, invalidate } = useAuth0User();
      const [user, setUser] = useState<user | null>(null);
      const [isLoading, setIsLoading] = useState(isAuth0UserLoading);
      const [error, setError] = useState(auth0Error);
      useEffect(() => {
        if (auth0User && !isAuth0UserLoading) {
            setIsLoading(true);
            fetch("/api/user")
                .then((res) => res.json())
                .then((data) => {
                    setUser(data.user);
                })
                .catch((e) => {
                    setUser(null); 
                    setError(e);
                })
                .finally(() => setIsLoading(false));
        }
      }, [auth0User, isAuth0UserLoading]);

      return {user, isLoading, error: auth0Error ?? error, invalidate};
}

export default useDbUser;