import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import GroupsScreen from '../screens/GroupsScreen';
import PhotoFeedScreen from '../screens/PhotoFeedScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import ExploreScreen from '../screens/ExploreScreen';
import EventsScreen from '../screens/EventsScreen';
import MyProfileScreen from '../screens/MyProfileScreen';

import ChatScreen from '../screens/ChatScreen';
import GroupChatScreen from '../screens/GroupChatScreen';
import PlaceDetailScreen from '../screens/PlaceDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import CallScreen from '../screens/CallScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeTabs({ user, onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0f0f1a', borderTopColor: '#1a1a2e', paddingBottom: 6, height: 60 },
        tabBarActiveTintColor: '#6c63ff',
        tabBarInactiveTintColor: '#444',
        tabBarLabelStyle: { fontSize: 10, marginTop: -2 },
      }}
    >
      <Tab.Screen
        name="People"
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🌍</Text>, tabBarLabel: 'People' }}
      >
        {props => <HomeScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen
        name="Groups"
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>💬</Text>, tabBarLabel: 'Groups' }}
      >
        {props => <GroupsScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen
        name="Photos"
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📸</Text>, tabBarLabel: 'Photos' }}
      >
        {props => <PhotoFeedScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen
        name="Discover"
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🔍</Text>, tabBarLabel: 'Discover' }}
      >
        {props => <DiscoverScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen
        name="Explore"
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>✈️</Text>, tabBarLabel: 'Explore' }}
      >
        {props => <ExploreScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen
        name="Events"
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🎉</Text>, tabBarLabel: 'Events' }}
      >
        {props => <EventsScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen
        name="Me"
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>👤</Text>, tabBarLabel: 'Me' }}
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
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="GroupChat" component={GroupChatScreen} />
        <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Subscription" component={SubscriptionScreen} />
        <Stack.Screen name="Call" component={CallScreen} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
