require('dotenv').config();
const fs = require('fs');
const path = require('path');

// google-services.json only exists once you've downloaded it from the
// Firebase console (Project settings > Your apps > Android app). Omitting
// the key entirely when the file is missing keeps `expo start` working
// before Firebase is wired up.
const googleServicesPath = process.env.GOOGLE_SERVICES_JSON_CUSTOMER ?? './google-services.json';
const hasGoogleServices = fs.existsSync(path.resolve(__dirname, googleServicesPath));

/** @type {import('@expo/config-types').ExpoConfig} */
module.exports = {
  expo: {
    name: 'Grocery Customer',
    slug: 'grocery-customer-app',
    scheme: 'grocerycustomer',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.localgrocery.customer',
    },
    android: {
      package: 'com.localgrocery.customer',
      adaptiveIcon: {
        backgroundColor: '#E9F9EE',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
      ...(hasGoogleServices ? { googleServicesFile: googleServicesPath } : {}),
    },
    web: {
      favicon: './assets/favicon.png',
    },
    notification: {
      icon: './assets/icon.png',
      color: '#2E7D32',
    },
    plugins: [
      'expo-image',
      'expo-notifications',
      [
        'expo-image-picker',
        {
          photosPermission: 'Allow the app to access your photos so you can attach a picture if needed.',
        },
      ],
    ],
    extra: {
      firebase: {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID_CUSTOMER,
      },
      eas: {
        projectId: process.env.EAS_PROJECT_ID_CUSTOMER,
      },
    },
  },
};
