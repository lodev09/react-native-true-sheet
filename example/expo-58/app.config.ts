import { type ExpoConfig, type ConfigContext } from 'expo/config';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY ?? '';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'TrueSheetExpo58Example',
  slug: 'TrueSheetExpo58Example',
  version: '1.0.0',
  orientation: 'default',
  icon: './assets/images/icon.png',
  scheme: 'expoexample58',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    requireFullScreen: false,
    bundleIdentifier: 'com.lodev09.truesheet.expo58',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.lodev09.truesheet.expo58',
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-web-browser',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
    ],
    [
      '@lugg/maps',
      {
        iosGoogleMapsApiKey: GOOGLE_MAPS_API_KEY,
        androidGoogleMapsApiKey: GOOGLE_MAPS_API_KEY,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
