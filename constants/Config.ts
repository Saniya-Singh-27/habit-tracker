import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiUrl = () => {
  // Use local server during development
  if (__DEV__) {
    if (Platform.OS === 'web') {
      return 'http://localhost:4000';
    }

    // For native devices, try to get the machine's IP from Expo constants
    const debuggerHost = Constants.expoConfig?.hostUri;
    if (debuggerHost) {
      const ip = debuggerHost.split(':')[0];
      return `http://${ip}:4000`;
    }

    // Fallback for emulators
    return Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
  }

  // Fallback to environment variable or default production URL
  return process.env.EXPO_PUBLIC_API_URL || 'https://habittracker-lvhn6xn7r-saniyasingh27mar-gmailcoms-projects.vercel.app';
};

export const API_URL = getApiUrl();
