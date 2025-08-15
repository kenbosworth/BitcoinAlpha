import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Bitcoin Alpha',
  slug: 'bitcoin-alpha',
  scheme: 'bitcoinalpha',
  plugins: ['expo-router'],
  ios: { supportsTablet: false, bundleIdentifier: 'com.example.bitcoinalpha' },
  android: { package: 'com.example.bitcoinalpha' },
  extra: {},
};

export default config;
