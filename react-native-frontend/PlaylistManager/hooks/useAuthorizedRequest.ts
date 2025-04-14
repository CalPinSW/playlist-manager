import { router } from "expo-router";
import { useAuth0 } from "react-native-auth0";

export const useAuthorizedRequest = () => {
    const { getCredentials, clearSession } = useAuth0();

    return async <T>(request: (token: string) => Promise<T>) => {
        const credentials = await getCredentials()
        if (credentials) {
            const token = await credentials?.accessToken;
            return request(token);
        } else {
            await clearSession()
            router.push("/")
            throw Error("Error sending authorized request, signing out")
        }
        
    };
};