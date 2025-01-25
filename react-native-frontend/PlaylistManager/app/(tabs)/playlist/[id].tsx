import { useLocalSearchParams } from "expo-router";
import { Image, Text, View, StyleSheet } from "react-native";
import ParallaxScrollView from "../../../components/ParallaxScrollView";

export default function PlaylistExplorer() {
    const { id } = useLocalSearchParams();

    
    return (
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
        headerImage={
          <Image
            source={require('@/assets/images/partial-react-logo.png')}
            style={styles.reactLogo}
          />
        }>
        <View style={styles.box}>
            <Text>{id}</Text>
        </View>
      </ParallaxScrollView>
    );
  }
  
  const styles = StyleSheet.create({
    box: {
      marginBottom: 16,
      padding: 16,
      borderRadius: 8,
      backgroundColor: "#fff",
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 3,
    },
    reactLogo: {
      height: 178,
      width: 290,
      bottom: 0,
      left: 0,
      position: 'absolute',
    },
  });
  