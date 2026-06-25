import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { NotificationsProvider } from '../context/NotificationsContext';
import { ChallengeProvider } from '../context/ChallengeContext';
import { navigationRef } from '../services/navigationRef';
import NotificationToast from '../components/NotificationToast';
import { WorldMark } from '../components/BondLogo';

// Tab screens
import HomeScreen from '../screens/HomeScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import LiveHubScreen from '../screens/LiveHubScreen';
import MyProfileScreen from '../screens/MyProfileScreen';

// Stack screens (pushed on top)
import ProfileScreen from '../screens/ProfileScreen';
import ChatScreen from '../screens/ChatScreen';
import EventsScreen from '../screens/EventsScreen';
import ExperiencesScreen from '../screens/ExperiencesScreen';
import PlaceDetailScreen from '../screens/PlaceDetailScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import CallScreen from '../screens/CallScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LiveScreen from '../screens/LiveScreen';
import LiveWatchScreen from '../screens/LiveWatchScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import LegalScreen from '../screens/LegalScreen';
import WalletScreen from '../screens/WalletScreen';
import MonumentChallengeScreen from '../screens/MonumentChallengeScreen';
import CountryStampChallengeScreen from '../screens/CountryStampChallengeScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabIcon({ icon, color, focused, activeBg }) {
  return (
    <View style={[tabStyles.iconWrap, focused && { backgroundColor: activeBg || '#FF008018' }]}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
    </View>
  );
}

function HomeTabIcon({ color, focused }) {
  const bondC  = focused ? '#FF0080' : color;
  const globeC = focused ? '#fff'    : color;
  return (
    <View style={[tabStyles.homeWrap, focused && tabStyles.homeWrapActive]}>
      <WorldMark size={26} color={globeC} bondColor={bondC} />
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap:       { width: 44, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  homeWrap:       { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  homeWrapActive: { backgroundColor: '#FF008018' },
});

function HomeTabs({ user, onLogout }) {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBg,
          borderTopColor: colors.tabBorder,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 0 },
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => <HomeTabIcon color={color} focused={focused} />,
        }}
      >
        {props => <HomeScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen
        name="Discover"
        options={{
          tabBarLabel: 'Connect',
          tabBarIcon: ({ color, focused }) => <TabIcon icon="🌐" color={color} focused={focused} activeBg="#FF008018" />,
        }}
      >
        {props => <DiscoverScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen
        name="LiveHub"
        options={{
          tabBarLabel: 'Live',
          tabBarIcon: ({ color, focused }) => <TabIcon icon="📡" color={color} focused={focused} activeBg="#e5393518" />,
        }}
      >
        {props => <LiveHubScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen
        name="Me"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabIcon icon="👤" color={color} focused={focused} activeBg="#FF008018" />,
        }}
      >
        {props => <MyProfileScreen {...props} user={user} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function AppNavigator({ user, onLogout }) {
  return (
    <ChallengeProvider>
    <NotificationsProvider>
      <View style={{ flex: 1 }}>
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main">
              {props => <HomeTabs {...props} user={user} onLogout={onLogout} />}
            </Stack.Screen>

            <Stack.Screen name="Call" component={CallScreen} options={{ presentation: 'modal' }} />

            {/* People */}
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />

            {/* Explore */}
            <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} />
            <Stack.Screen name="Events" component={EventsScreen} />
            <Stack.Screen name="Experiences" component={ExperiencesScreen} />

            {/* Notifications */}
            <Stack.Screen name="Notifications" component={NotificationsScreen} />

            {/* Settings */}
            <Stack.Screen name="Subscription" component={SubscriptionScreen} />
            <Stack.Screen name="Settings">
              {props => <SettingsScreen {...props} onLogout={onLogout} />}
            </Stack.Screen>

            {/* Live */}
            <Stack.Screen name="Live"      component={LiveScreen}      options={{ presentation: 'modal', gestureEnabled: false }} />
            <Stack.Screen name="LiveWatch" component={LiveWatchScreen} options={{ presentation: 'modal',           gestureEnabled: false }} />

            {/* Settings sub-screens */}
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="Legal"          component={LegalScreen} />

            {/* Wallet & monetization */}
            <Stack.Screen name="Wallet" component={WalletScreen} />
            <Stack.Screen name="MonumentChallenge"     component={MonumentChallengeScreen} />
            <Stack.Screen name="CountryStampChallenge" component={CountryStampChallengeScreen} />
          </Stack.Navigator>
        </NavigationContainer>

        {/* Toast lives outside NavigationContainer so the navigator's gesture handler can't intercept taps */}
        <NotificationToast />
      </View>
    </NotificationsProvider>
    </ChallengeProvider>
  );
}
