// components/MapScreen.web.tsx
import React from "react";
import { View, Text, StyleSheet, Dimensions, TextInput, TouchableOpacity, ScrollView, Modal, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import RNSlider from '@react-native-community/slider';
// import MapView from "react-native-maps"; // 🚨 웹 빌드 시 오류 방지를 위해 import 제거

// MapScreen.web.tsx에서는 MapView 대신 일반 View를 사용하여 지도 화면을 대체합니다.

const screenHeight = Dimensions.get("window").height;

// MapScreen.tsx (원본)의 props와 동일하게 정의합니다.
interface MapScreenProps {
  onBack?: () => void;
  onNavigateToJob?: (jobId: string) => void;
  onNavigateToSearch?: () => void;
  mapScreenState?: any; // 복잡한 상태는 web에서는 제거하거나 간소화합니다.
}

// 웹에서 MapScreen이 호출될 때 렌더링될 Placeholder 컴포넌트입니다.
export default function MapScreenWeb({
  onNavigateToSearch
}: MapScreenProps) {
  // 모바일과 동일한 스타일을 유지하기 위해 기본적인 컨테이너 스타일만 사용합니다.
  const MIN_SHEET_HEIGHT = 100;

  const BottomJobSheet = () => (
    <View
      style={styles.bottomSheet}
    >
      <View style={styles.sheetHandle} />
      <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>
              웹 환경에서는 지도 기능을 지원하지 않습니다
          </Text>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
          <View style={styles.webMessageContainer}>
              <Ionicons name="map-outline" size={48} color="#9ca3af" />
              <Text style={styles.webMessageTitle}>지도 기능 미리보기 불가</Text>
              <Text style={styles.webMessageText}>
                  이 기능은 네이티브(iOS/Android) 앱 환경에서만 지원됩니다.
                  {'\n'}앱 빌드를 통해 확인하거나, 웹 전용 지도 솔루션을 통합해야 합니다.
              </Text>
          </View>
          
          <TouchableOpacity
              onPress={onNavigateToSearch}
              style={styles.searchButton}
          >
              <Ionicons name="search" size={16} color="white" />
              <Text style={styles.searchButtonText}>목록 검색으로 대체</Text>
          </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 웹 미리보기 환경임을 알리는 상단 바 */}
      <View style={styles.topBar}>
          <Text style={styles.topBarText}>🌐 웹 미리보기 - 지도 기능 비활성화</Text>
      </View>
      
      {/* 지도 영역 대체 */}
      <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>지도 로드 불가</Text>
      </View>

      {/* 하단 시트 대체 (모바일과 유사하게) */}
      <View style={{ height: MIN_SHEET_HEIGHT }} />
      <BottomJobSheet />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  topBar: {
    backgroundColor: "#ffebcd",
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f7b32b',
  },
  topBarText: {
    color: '#a0522d',
    fontWeight: '600',
    fontSize: 14,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  mapPlaceholderText: {
    fontSize: 20,
    color: "#6b7280",
    fontWeight: 'bold',
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 350, // 충분한 높이 확보
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 20,
    zIndex: 30,
  },
  sheetHandle: {
    alignItems: "center", 
    paddingVertical: 8,
    marginBottom: 8,
  },
  sheetHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sheetTitle: {
    fontWeight: "600", 
    fontSize: 16, 
    textAlign: 'center',
    color: '#111827',
  },
  webMessageContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  webMessageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  webMessageText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  searchButton: {
    backgroundColor: '#F7B32B',
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  }
});