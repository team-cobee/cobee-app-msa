import React, { useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { api, BASE_URL, DEV_HOST } from '@/api/api';
import { saveTokens, getAccessToken, getRefreshToken } from '@/api/tokenStorage';

interface LoginScreenProps {
  onLogin?: () => void;
  onSkip?: () => void;
  onSignup?: () => void; 
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48, backgroundColor: '#ffffff' },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 160, height: 128, resizeMode: 'contain' },
  subtitle: { marginTop: 8, textAlign: 'center', fontSize: 14, color: '#6b7280' },
  buttonContainer: { gap: 16 },
  skipContainer: { marginTop: 32, paddingTop: 16 },
  skipButton: { alignItems: 'center', paddingVertical: 12 },
  skipText: { fontSize: 16, color: '#6b7280' },
  kakaoLoginButton: { width: '100%', height: 48, resizeMode: 'contain' },
  googleLoginButton: { width: '100%', height: 48, resizeMode: 'contain' },
  webviewWrap: { position: 'absolute', inset: 0, backgroundColor: '#fff' },
  webviewHeader: {
    height: 52, paddingHorizontal: 16, borderBottomColor: '#e5e7eb', borderBottomWidth: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  headerBtn: { padding: 8 },
});

export default function LoginScreen({ onSkip, onSignup }: LoginScreenProps) {
  const [webUrl, setWebUrl] = useState<string | null>(null);
  const webRef = useRef<WebView>(null);

  // ✅ 백엔드 콜백 (카카오 콘솔에도 동일 문자열로 등록되어야 합니다)
  const redirectUri = `${DEV_HOST}/oauth2/callback?mode=api`;

  // ① 모든 페이지 로드 후 1차 자동 추출 스크립트 (섞인 텍스트에서도 첫 JSON만 보냄)
  const INJECT_AFTER_LOAD = `
    (function() {
      try {
        var root = document.querySelector('pre') || document.body;
        var txt = root ? root.innerText : '';
        var s = txt.indexOf('{');
        var e = txt.lastIndexOf('}');
        if (s !== -1 && e !== -1 && e > s) {
          window.ReactNativeWebView.postMessage(txt.slice(s, e+1));
        }
      } catch (e) {}
    })();
    true;
  `;

  // ② 콜백 도달 시 강제로 2차 추출
  const FORCE_EXTRACT = `
    (function() {
      try {
        var root = document.querySelector('pre') || document.body;
        var txt = root ? root.innerText : '';
        var s = txt.indexOf('{');
        var e = txt.lastIndexOf('}');
        var jsonText = (s !== -1 && e !== -1 && e > s) ? txt.slice(s, e+1) : '';
        window.ReactNativeWebView.postMessage(jsonText || '{"error":"empty"}');
      } catch (e) {
        window.ReactNativeWebView.postMessage('{"error":"postMessage-failed"}');
      }
    })();
    true;
  `;

  const allowedTopNavPrefixes = [
    BASE_URL,
    'http:172.20.5.74:8080/oauth2/authorization/naver'
  ];

  const openNaver = () => {
    const authUrl = `${BASE_URL}/oauth2/authorization/naver`;
    setWebUrl(authUrl);
  }

  // 네비게이션 변화마다 콜백 URL이면 2차 주입 (약간의 지연을 줘 DOM 준비 보장)
  const onNavChange = useCallback((nav: any) => {
    const url: string = nav?.url ?? '';
    // 디버깅용 로그
    console.log('[WebView] nav url =', url);
    if (url.startsWith(redirectUri)) {
      setTimeout(() => webRef.current?.injectJavaScript(FORCE_EXTRACT), 50);
    }
  }, [redirectUri]);

  // 콜백 JSON 수신 → 토큰 저장 → 바로 회원가입 화면 이동
  const onMessage = useCallback(async (e: any) => {
    const raw = e?.nativeEvent?.data || '';
    console.log('[WebView] onMessage raw =', raw.slice(0, 120)); // 디버깅
    // 첫/마지막 중괄호만 다시 한 번 보정
    const s = raw.indexOf('{');
    const t = raw.lastIndexOf('}');
    const jsonText = (s !== -1 && t !== -1 && t > s) ? raw.slice(s, t + 1) : raw;

    let payload: any = null;
    try { payload = JSON.parse(jsonText); } catch { payload = null; }
    if (!payload) return; // JSON 아니면 무시

    // 주신 응답형: { success, data: { accessToken, refreshToken } }
    const at = payload?.data?.accessToken ?? payload?.accessToken;
    const rt = payload?.data?.refreshToken ?? payload?.refreshToken;
    if (!at || !rt) {
      Alert.alert('로그인 실패', '토큰을 찾지 못했습니다.');
      setWebUrl(null);
      return;
    }

    await saveTokens({ accessToken: at, refreshToken: rt });

    // ✅ 저장 확인용 로그 (원하면 나중에 제거)
    const atSaved = await getAccessToken();
    const rtSaved = await getRefreshToken();
    console.log('[TOKENS] saved access =', atSaved?.slice(0, 14), '..., refresh =', rtSaved?.slice(0, 14), '...');

    setWebUrl(null);   // WebView 닫기
    onSignup?.();      // 회원가입 화면으로
  }, [onSignup]);

  // localhost 리다이렉트 방지
  const onShouldStartLoadWithRequest = useCallback((req: any) => {
    const url: string = req?.url ?? '';
    // if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
    //   Alert.alert('로그인 오류', '앱에서 localhost로 리다이렉트되었습니다. 서버 설정을 확인해주세요.');
    //   setWebUrl(null);
    //   return false;
    // }
    if (url.startsWith(redirectUri)) return true;
    if (allowedTopNavPrefixes.some(p => url.startsWith(p))) return true;
    return true;
  }, [redirectUri]);

  const handleSignupBtn = () => onSignup?.();

  return (
    <View style={styles.container}>
      {/* 디자인 유지 */}
      <View style={styles.logoContainer}>
        <Image source={require('../assets/images/cobee-logo.png')} style={styles.logo} />
        <Text style={styles.subtitle}>완벽한 룸메이트를 찾아보세요</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={openNaver} activeOpacity={0.8}>
          <Image source={require('../assets/images/naverLogin.png')} style={styles.kakaoLoginButton} />
        </TouchableOpacity>

        <View style={styles.skipContainer}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSignupBtn}>
            <Text style={styles.skipText}>회원가입하기</Text>
          </TouchableOpacity>
        </View>

        {onSkip && (
          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Text style={styles.skipText}>다음에 하기</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 풀스크린 WebView */}
      {webUrl && (
        <View style={styles.webviewWrap}>
          <View style={styles.webviewHeader}>
            <Text style={styles.headerTitle}>소셜 로그인</Text>
            <TouchableOpacity style={styles.headerBtn} onPress={() => setWebUrl(null)}>
              <Text>닫기</Text>
            </TouchableOpacity>
          </View>

          <WebView
            ref={webRef}
            source={{ uri: webUrl }}
            // 🔑 모든 페이지 로드 후 1차 자동 추출
            injectedJavaScript={INJECT_AFTER_LOAD}
            // 🔑 콜백 URL 감지 시 2차 강제 추출
            onNavigationStateChange={onNavChange}
            onMessage={onMessage}
            onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
            startInLoadingState
            javaScriptEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            // mixedContentMode="always" // 필요 시
          />
        </View>
      )}
    </View>
  );
}

