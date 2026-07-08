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
import AdminStripeScreen from '../screens/AdminStripeScreen';
import PhotoFeedScreen from '../screens/PhotoFeedScreen';
import GroupsScreen from '../screens/GroupsScreen';
import GroupChatScreen from '../screens/GroupChatScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeTabIcon({ color, focused }) {
  const bondC  = focused ? '#FF0080' : color;
  const globeC = focused ? '#fff'    : color;
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
      <WorldMark size={24} color={globeC} bondColor={bondC} />
    </View>
  );
}

function LiveTabIcon({ color, focused }) {
  const c = focused ? '#e53935' : color;
  return (
    <View style={[tabStyles.iconWrap, focused && { backgroundColor: '#e5393518' }]}>
      <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: c, opacity: 0.3 }} />
        <View style={{ position: 'absolute', width: 17, height: 17, borderRadius: 9,  borderWidth: 1.5, borderColor: c, opacity: 0.6 }} />
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c }} />
      </View>
    </View>
  );
}

function ConnectTabIcon({ color, focused }) {
  const c = focused ? '#FF0080' : color;
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
      <View style={{ width: 30, height: 22, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', left: 0,  width: 19, height: 19, borderRadius: 10, borderWidth: 2, borderColor: c, opacity: focused ? 0.6 : 0.5 }} />
        <View style={{ position: 'absolute', right: 0, width: 19, height: 19, borderRadius: 10, borderWidth: 2, borderColor: c }} />
      </View>
    </View>
  );
}

function ProfileTabIcon({ color, focused, user }) {
  const initial = (user?.display_name || user?.username || '?')[0].toUpperCase();
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
      <View style={[tabStyles.profileCircle, focused
        ? { backgroundColor: '#FF0080', borderColor: '#FF0080' }
        : { backgroundColor: 'transparent', borderColor: color }
      ]}>
        <Text style={{ color: focused ? '#fff' : color, fontSize: 12, fontWeight: '800' }}>{initial}</Text>
      </View>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap:       { width: 44, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  iconWrapActive: { backgroundColor: '#FF008018' },
  profileCircle:  { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
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
        name="LiveHub"
        options={{
          tabBarLabel: 'Live',
          tabBarIcon: ({ color, focused }) => <LiveTabIcon color={color} focused={focused} />,
          tabBarActiveTintColor: '#e53935',
        }}
      >
        {props => <LiveHubScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen
        name="Discover"
        options={{
          tabBarLabel: 'Connect',
          tabBarIcon: ({ color, focused }) => <ConnectTabIcon color={color} focused={focused} />,
        }}
      >
        {props => <DiscoverScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen
        name="Me"
        options={{
          tabBarLabel: 'Me',
          tabBarIcon: ({ color, focused }) => <ProfileTabIcon color={color} focused={focused} user={user} />,
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

            {/* Admin (server also enforces ADMIN_USER_IDS — this entry is just UI gating) */}
            <Stack.Screen name="AdminStripe" component={AdminStripeScreen} />

            {/* Photos / Groups — real backends that previously had no screen */}
            <Stack.Screen name="PhotoFeed" component={PhotoFeedScreen} />
            <Stack.Screen name="Groups"    component={GroupsScreen} />
            <Stack.Screen name="GroupChat" component={GroupChatScreen} />
          </Stack.Navigator>
        </NavigationContainer>

        {/* Toast lives outside NavigationContainer so the navigator's gesture handler can't intercept taps */}
        <NotificationToast />
      </View>
    </NotificationsProvider>
    </ChallengeProvider>
  );
}
