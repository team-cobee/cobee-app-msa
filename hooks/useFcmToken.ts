// import { useCallback, useEffect, useMemo, useState } from 'react';
// import { Platform } from 'react-native';
// import * as Notifications from 'expo-notifications';
// import Constants from 'expo-constants';
// import { FCM_PROJECT_ID } from '@env';

// interface UseFcmTokenOptions {
//   enabled?: boolean;
//   autoRegister?: boolean;
// }

// interface UseFcmTokenResult {
//   fcmToken: string | null;
//   permissionStatus: Notifications.PermissionStatus | null;
//   isLoading: boolean;
//   error: string | null;
//   refreshToken: () => Promise<void>;
// }

// const resolveProjectId = () => {
//   const expoProjectId =
//     Constants?.expoConfig?.extra?.eas?.projectId ||
//     Constants?.easConfig?.projectId 
//     //Constants?.expoConfig?.projectId;

//   return (FCM_PROJECT_ID || expoProjectId || '').trim();
// };

// const ensureAndroidChannelAsync = async () => {
//   if (Platform.OS !== 'android') {
//     return;
//   }

//   const existingChannel = await Notifications.getNotificationChannelAsync('default');

//   if (!existingChannel) {
//     await Notifications.setNotificationChannelAsync('default', {
//       name: 'default',
//       importance: Notifications.AndroidImportance.MAX,
//       vibrationPattern: [0, 250, 250, 250],
//       lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
//     });
//   }
// };

// export const useFcmToken = (options: UseFcmTokenOptions = {}): UseFcmTokenResult => {
//   const { enabled = true, autoRegister = true } = options;
//   const [fcmToken, setFcmToken] = useState<string | null>(null);
//   const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);

//   const projectId = useMemo(resolveProjectId, []);

//   const getTokenAsync = useCallback(async () => {
//     setIsLoading(true);
//     setError(null);

//     try {
//       const existingPermissions = await Notifications.getPermissionsAsync();
//       let status = existingPermissions.status;

//       if (status !== Notifications.PermissionStatus.GRANTED) {
//         const permissionResponse = await Notifications.requestPermissionsAsync();
//         status = permissionResponse.status;
//       }

//       setPermissionStatus(status);

//       if (status !== Notifications.PermissionStatus.GRANTED) {
//         throw new Error('푸시 알림 권한이 허용되지 않았습니다.');
//       }

//       await ensureAndroidChannelAsync();

//       if (!projectId) {
//         throw new Error('FCM 토큰을 발급하려면 EAS projectId 또는 FCM_PROJECT_ID가 필요합니다.');
//       }

//       const devicePushToken = await Notifications.getDevicePushTokenAsync();

//       setFcmToken(devicePushToken.data);
//     } catch (err) {
//       console.error('[useFcmToken] Failed to fetch FCM token', err);
//       setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
//     } finally {
//       setIsLoading(false);
//     }
//   }, [projectId]);

//   useEffect(() => {
//     if (enabled && autoRegister) {
//       getTokenAsync();
//     }
//   }, [getTokenAsync, enabled, autoRegister]);

//   return {
//     fcmToken,
//     permissionStatus,
//     isLoading,
//     error,
//     refreshToken: getTokenAsync,
//   };
// };

// src/hooks/useFcmToken.ts
import { useEffect, useState } from 'react';
import {
  ensureAndroidChannelAsync,
  requestPushPermissionsAsync,
  getFcmDeviceTokenAsync,
} from '../lib/notifications';
import { registerPushToken } from '../service/push';

export function useFcmToken(userId?: string) {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await ensureAndroidChannelAsync();
        const granted = await requestPushPermissionsAsync();
        if (!granted) {
          setError(new Error('푸시 권한이 거부되었습니다.'));
          return;
        }

        const t = await getFcmDeviceTokenAsync();  // ← 여기서 새 파일의 함수를 사용!
        if (cancelled) return;

        if (t) {
          setToken(t);
          // 로그인 후 userId가 있다면 서버에 등록
          if (userId) {
            await registerPushToken({ userId, token: t, platform: 'ANDROID' });
          }
        } else {
          setError(new Error('FCM 토큰을 가져오지 못했습니다.'));
        }
      } catch (e: any) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [userId]);

  return { token, ready, error };
}
