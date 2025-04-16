import { useAuth0 } from "@auth0/auth0-react";

export const useAuthorizedRequest = () => {
    const { getAccessTokenSilently } = useAuth0();

    return async <T>(request: (token: string) => Promise<T>) => {
        const token = await getAccessTokenSilently();
        return request(token);
    };
};