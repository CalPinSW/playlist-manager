import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";
import {useAuth0} from 'react-native-auth0';
import * as AuthSession from 'expo-auth-session';

export default function Home() {
    const { authorize, clearSession, user, getCredentials, isLoading, error } = useAuth0();
    const router = useRouter();
    const login = async () => {
        try {
          await authorize({
            audience: "https://playmanbackend.com", // optional, only needed if you have Auth0 APIs
          });
        } catch (e) {
          console.error(e);
        }
      };

      const logout = async () => {
        try {
        await clearSession()
        } catch (e) {
            console.error(error)
        }
      }
      
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Welcome to the app!</Text>
      {user ? (
        <>
          <Text>Hi, {user.name}</Text>
          <Button title="Go to Protected" onPress={() => router.push("/(app)/(tabs)")} />
          <Button title="Logout" onPress={logout} />
          
        </>
      ) : (
        <Button title="Login" onPress={login} />
      )}
    </View>
  );
}