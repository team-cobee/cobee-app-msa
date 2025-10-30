import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../types/navigation';
import HomeScreen from '../components/HomeScreen';
import MapScreen from '../components/MapScreen.native';
import ChatScreen from '../components/ChatScreen';
import NotificationScreen from '../components/NotificationScreen';
import ProfileScreen from '../components/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Map':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'Chat':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Notification':
              iconName = focused ? 'notifications' : 'notifications-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#F7B32B',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          tabBarLabel: '홈',
          lazy: true,
        }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{ 
          tabBarLabel: '지도',
          lazy: true,
        }}
      />
      <Tab.Screen name="Chat" options={{ tabBarLabel: '채팅', lazy: true }}>
      {(navProps) => (
        <ChatScreen
          {...navProps} // navigation, route 전달하려면 타입도 합쳐주세요 (아래 참고)
          onBack={() => navProps.navigation.goBack()}
          onNavigateToSettings={() => navProps.navigation.navigate('Settings')}
          onNavigateToCreateRoom={() => navProps.navigation.navigate('CreateRoom')}
          onLeaveChatRoom={() => {
            // 방 나가기 후 이동/정리 로직
            // ex) 상태 초기화 + 리스트로 이동
            navProps.navigation.navigate('ChatList');
          }}
          chatRoomState={{ hasRoom: false, isOwner: false, roomId: 1 }}
        />
      )}
    </Tab.Screen>


      <Tab.Screen 
        name="Notification" 
        component={NotificationScreen}
        options={{ 
          tabBarLabel: '알림',
          lazy: true,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          tabBarLabel: '프로필',
          lazy: true,
        }}
      />
    </Tab.Navigator>
  );
}