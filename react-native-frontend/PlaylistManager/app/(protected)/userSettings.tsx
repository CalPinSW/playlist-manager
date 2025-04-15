import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useAuth } from '../../contexts/authContext';
import { useColorTheme } from '../../hooks/useColorTheme';
import { populateAdditionalAlbumDetails, populateUniversalGenreList, populateUserAlbumGenres, populateUserData } from '../../api';
import AsyncButton from '../../components/ButtonWithLoadingState';
import { useQueryClient } from '@tanstack/react-query';

export default function ModalScreen() {
  const theme = useColorTheme()
  const {signOut, isLoading, authorizedRequest} = useAuth()
  const queryClient = useQueryClient()
  const invalidatePlaylistAndAlbumQueries = () => {
    queryClient.invalidateQueries({queryKey: ['playlists']})
    queryClient.invalidateQueries({queryKey: ['albums']})
  }
  return (
    <View style={styles.container}>
      <Text noBackground style={styles.title}>User settings</Text>
      <View style={styles.separator}/>
      <AsyncButton text="Populate user data" onPressAsync={async () => {await authorizedRequest(populateUserData());
        invalidatePlaylistAndAlbumQueries()
      }} />
      <AsyncButton text="Populate additional album details" onPressAsync={async () => {await authorizedRequest(populateAdditionalAlbumDetails()); invalidatePlaylistAndAlbumQueries()}} />
      <AsyncButton text="Populate universal genre list" onPressAsync={async () => {await authorizedRequest(populateUniversalGenreList()); invalidatePlaylistAndAlbumQueries();}} />
      <AsyncButton text="Populate user album genres" onPressAsync={async () => {await authorizedRequest(populateUserAlbumGenres()); invalidatePlaylistAndAlbumQueries();}} />
      <TouchableOpacity
        style={[styles.button, {backgroundColor: theme.primary.default}]}
        onPress={signOut}
        disabled={isLoading}
      >
        <Text noBackground style={styles.buttonText}>Sign out</Text>
      </TouchableOpacity>      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  button: {
    padding: 10,
    borderRadius: 4,
    minWidth: 100,
    margin: 15
  },
  buttonText: {
    margin: "auto",
    fontSize: 14,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
