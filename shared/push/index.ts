import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Returns an Expo push token (not a raw FCM token). Expo's push service
// relays this to FCM on Android / APNs on iOS for us, so a small app never
// has to touch the FCM Admin SDK or run a paid Cloud Function to send pushes
// -- see registerForPush usage: notifications are triggered by a direct
// client-side fetch to Expo's push endpoint at the moment an order is placed
// or its status changes, keeping the whole flow on Firebase's free Spark plan.
export async function registerForPushTokenAsync(
  projectId: string | undefined
): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device.');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2E7D32',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.warn('Push notification permission not granted.');
    return null;
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenResponse.data;
}

interface SendPushArgs {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// Free endpoint, no auth token required for a low-volume single-shop app.
export async function sendPushNotification({ to, title, body, data }: SendPushArgs) {
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, title, body, data, sound: 'default', priority: 'high' }),
    });
  } catch (err) {
    // Best-effort: the in-app Firestore listener is still the source of
    // truth, so a failed push just means a delayed/quiet update.
    console.warn('Push notification failed to send', err);
  }
}
