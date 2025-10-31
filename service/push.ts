// import { Platform } from 'react-native';
// import * as Notifications from 'expo-notifications';
// import { api } from '../api/api';

// // // 알림 채널 설정 (안드로이드 전용)
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: false,
//     shouldShowBanner: true,
//     shouldShowList: true,
//   }),
// });

// export async function registerPushToken(params: {
//   userId: string;
//   token: string;
//   platform?: 'ANDROID' | 'IOS';
// }) {
//   const res = await api.post(`/alarm/register`, {
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       userId: params.userId,
//       token: params.token,
//       platform: params.platform ?? 'ANDROID',
//     }),
//   });
//   if (!res.data.data) throw new Error(`Failed to register token: ${res.data.message}`);
// }

// // FCM 토큰을 요청하고 반환하는 함수
// export async function registerForPushNotificationsAsync(): Promise<string | null> {
//   let token;

//   // 안드로이드 기기이거나 실제 디바이스에서 실행하는 경우에만 권한 요청
//   if (Platform.OS === 'android' || (Device.isDevice)) {
//     const { status: existingStatus } = await Notifications.getPermissionsAsync();
//     let finalStatus = existingStatus;

//     // 권한이 부여되지 않았다면 다시 요청
//     if (existingStatus !== 'granted') {
//       const { status } = await Notifications.requestPermissionsAsync();
//       finalStatus = status;
//     }

//     // 최종적으로 권한이 부여되지 않았다면 null 반환
//     if (finalStatus !== 'granted') {
//       console.log('푸시 알림 권한이 거부되었습니다.');
//       return null;
//     }

//     // FCM 토큰 가져오기
//     token = (await Notifications.getExpoPushTokenAsync()).data;
//     console.log('FCM 토큰:', token);

//     // 안드로이드 전용 알림 채널 설정
//     if (Platform.OS === 'android') {
//       await Notifications.setNotificationChannelAsync('default', {
//         name: 'default',
//         importance: Notifications.AndroidImportance.MAX,
//         vibrationPattern: [0, 250, 250, 250],
//         lightColor: '#FF231F7C',
//       });
//     }

//     return token;
//   } else {
//     // 시뮬레이터에서는 푸시 토큰을 받을 수 없음
//     console.log('푸시 알림은 실제 기기에서만 작동합니다.');
//     return null;
//   }
// }
// push.ts (예시)
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { api } from '../api/api';

// 알림 핸들러 (필요 시 조정)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type PlatformType = 'ANDROID' | 'IOS';

export async function registerPushToken(params: {
  userId: string;
  token: string;
  platform?: PlatformType;
}) {
  // axios 스타일로 수정: data와 config 분리
  const { userId, token, platform } = params;
  const res = await api.post(
    '/alarm/register',
    {
      userId,
      token,
      platform: platform ?? (Platform.OS === 'ios' ? 'IOS' : 'ANDROID'),
    },
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (!res?.data?.data) {
    throw new Error(`Failed to register token: ${res?.data?.message ?? 'unknown error'}`);
  }
}

/**
 * 실제 기기에서 FCM/Expo Push 토큰 요청
 * - expo-device 의존성 제거
 * - 권한 요청 + 토큰 발급만 expo-notifications로 처리
 * - iOS/Android 동시 지원
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // 1) 권한 상태 확인 및 요청
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('푸시 알림 권한이 거부되었습니다.');
    return null;
  }

  // 2) 토큰 발급
  // 최신 SDK는 projectId 지정이 필요할 수 있음.
  // app.json(app.config.ts)의 extra 또는 EAS 프로젝트 ID를 넣어주세요.
  // 예: { projectId: 'YOUR_EAS_PROJECT_ID' }
  const expoPushToken = await Notifications.getExpoPushTokenAsync(/* { projectId: 'YOUR_EAS_PROJECT_ID' } */);
  const token = expoPushToken.data;
  console.log('Expo Push Token:', token);

  // 3) Android 채널 설정
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token ?? null;
}
