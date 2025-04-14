import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useAuth0 } from 'react-native-auth0';


export default function SignIn() {
  const { authorize } = useAuth0();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text
        onPress={() => {
            authorize();
          // Navigate after signing in. You may want to tweak this to ensure sign-in is
          // successful before navigating.
          router.replace('/');
        }}>
        Sign In
      </Text>
    </View>
  );
}
