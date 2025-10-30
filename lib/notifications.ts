import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** 포그라운드 수신 시 표시 방식 (원하면 App.tsx에서 한 번만 설정해도 OK) */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Android 채널 생성 (Android 8.0+) */
export async function ensureAndroidChannelAsync() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** 사용자 권한 요청(안드로이드 13+ 포함) */
export async function requestPushPermissionsAsync(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }
  const req = await Notifications.requestPermissionsAsync();
  return req.granted || req.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

/** FCM 디바이스 토큰 가져오기 (Expo Go에선 불가, Dev Client/빌드 앱에서만) */
export async function getFcmDeviceTokenAsync(): Promise<string | null> {
  // provider: 'fcm' 이 포인트!
  const token = await Notifications.getDevicePushTokenAsync();  // { provider: 'fcm' } 원래있었는데 없는거랑 어떤차이? 
  return token?.data ?? null;
}
