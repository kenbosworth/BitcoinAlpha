// app.config.ts
import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Bitcoin Alpha',
  slug: 'bitcoin-alpha',
  scheme: 'bitcoinalpha',
  plugins: ['expo-router', 'expo-notifications'],
  extra: {
    eas: { projectId: 'd9f3fe64-24fb-4c8d-ab01-67723c1a409a' },
  },
  ios: { bundleIdentifier: 'com.kennethbosworth.bitcoinalpha' },
  android: { package: 'com.kennethbosworth.bitcoinalpha' },

  splash: {
    image: './assets/logo.png',         // Make sure this file exists
    resizeMode: 'contain',
    backgroundColor: '#000000',
  },
};

export default config;
