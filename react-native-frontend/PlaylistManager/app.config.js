import 'dotenv/config';

export default {
  expo: {
    name: 'PlaylistManager',
    slug: 'playlistmanager',
    version: '1.0.2',
    orientation: 'portrait',
    icon: './assets/images/playlist-manager-icon.png',
    scheme: 'playlistmanager',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/images/playlist-manager-splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.calpin.playlistmanager'
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/playlist-manager-icon.png',
        backgroundColor: '#ffffff'
      },
      package: 'com.calpin.playlistmanager'
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png'
    },
    plugins: [
      'expo-router',
      [
        'react-native-auth0',
        {
          domain: process.env.AUTH0_DOMAIN,
          clientId: process.env.AUTH0_CLIENT_ID
        }
      ],
      'expo-secure-store',
      [
        'react-native-share',
        {
          ios: ['fb', 'instagram', 'twitter'],
          android: ['com.facebook.katana', 'com.instagram.android', 'com.twitter.android']
        }
      ],
      'expo-build-properties'
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {
        origin: false
      },
      eas: {
        projectId: 'cc408fb9-4834-40b8-8444-d0b9207aad13'
      },
      auth0Domain: process.env.AUTH0_DOMAIN,
      auth0ClientId: process.env.AUTH0_CLIENT_ID,
      backendUrl: process.env.BACKEND_URL,
      useCors: process.env.USE_CORS
    },
    owner: 'calpin'
  }
};
