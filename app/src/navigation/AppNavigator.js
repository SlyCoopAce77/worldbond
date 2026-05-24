import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View, StyleSheet } from 'react-native';

// Tab screens
import HomeScreen from '../screens/HomeScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import GroupsScreen from '../screens/GroupsScreen';
import PhotoFeedScreen from '../screens/PhotoFeedScreen';
import ExploreScreen from '../screens/ExploreScreen';
import MyProfileScreen from '../screens/MyProfileScreen';

// Stack screens (pushed on top)
import ChatScreen from '../screens/ChatScreen';
import GroupChatScreen from '../screens/GroupChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MatchesScreen from '../screens/MatchesScreen';
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

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TABS = [
  { name: 'Home',     icon: '🌍', label: 'Home' },
  { name: 'Discover', icon: '🔍', label: 'Discover' },
  { name: 'Groups',   icon: '💬', label: 'Chats' },
  { name: 'Photos',   icon: '📸', label: 'Photos' },
  { name: 'Explore',  icon: '✈️', label: 'Explore' },
  { name: 'Me',       icon: '👤', label: 'Me' },
];

function TabIcon({ icon, color, focused }) {
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap:       { width: 44, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  iconWrapActive: { backgroundColor: '#5865f218' },
});

function HomeTabs({ user, onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0d0d1f',
          borderTopColor: '#1a1a2e',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#5865f2',
        tabBarInactiveTintColor: '#3a3a5a',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 0 },
      }}
    >
      <Tab.Screen
        name="Home"
        options={{ tabBarLabel: 'Home', tabBarIcon: ({ color, focused }) => <TabIcon icon="🌍" color={color} focused={focused} /> }}
      >
        {props => <HomeScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen
        name="Discover"
        options={{ tabBarLabel: 'Discover', tabBarIcon: ({ color, focused }) => <TabIcon icon="🔍" color={color} focused={focused} /> }}
      >
        {props => <DiscoverScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen
        name="Groups"
        options={{ tabBarLabel: 'Chats', tabBarIcon: ({ color, focused }) => <TabIcon icon="💬" color={color} focused={focused} /> }}
      >
        {props => <GroupsScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen
        name="Photos"
        options={{ tabBarLabel: 'Photos', tabBarIcon: ({ color, focused }) => <TabIcon icon="📸" color={color} focused={focused} /> }}
      >
        {props => <PhotoFeedScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen
        name="Explore"
        options={{ tabBarLabel: 'Explore', tabBarIcon: ({ color, focused }) => <TabIcon icon="✈️" color={color} focused={focused} /> }}
      >
        {props => <ExploreScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen
        name="Me"
        options={{ tabBarLabel: 'Me', tabBarIcon: ({ color, focused }) => <TabIcon icon="👤" color={color} focused={focused} /> }}
      >
        {props => <MyProfileScreen {...props} user={user} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function AppNavigator({ user, onLogout }) {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main">
          {props => <HomeTabs {...props} user={user} onLogout={onLogout} />}
        </Stack.Screen>

        {/* Chats */}
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="GroupChat" component={GroupChatScreen} />
        <Stack.Screen name="Call" component={CallScreen} options={{ presentation: 'modal' }} />

        {/* People */}
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Bond" component={MatchesScreen} />

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
        <Stack.Screen name="Live"      component={LiveScreen}      options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="LiveWatch" component={LiveWatchScreen} options={{ presentation: 'fullScreenModal' }} />

        {/* Settings sub-screens */}
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="Legal"          component={LegalScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
