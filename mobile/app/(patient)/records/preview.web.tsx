import React from 'react';
import { Platform } from 'react-native';

import FilePreviewScreen from './preview.native';

export default function WebFilePreviewScreen() {
  if (Platform.OS === 'web') {
    // Re-export native implementation on web via react-native-web (WebView + layout work in Expo web).
    return <FilePreviewScreen />;
  }
  return <FilePreviewScreen />;
}
