// app/_layout.tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { ThemeProvider, useTheme } from '../lib/theme';

function ThemedTabs() {
  const { colors, resolved } = useTheme(); // resolved: 'light' | 'dark'

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.active,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent', // let BlurView show through
          borderTopWidth: 0,
          height: 56,
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={30}
            tint={resolved === 'dark' ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        ),
      }}
    >
      {/* 1. Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 2. Alerts (inbox route) */}
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 3. Alpha Notes */}
      <Tabs.Screen
        name="alpha-notes"
        options={{
          title: 'Alpha Notes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 4. About */}
      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="information-circle-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* 5. Settings (last) */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function Layout() {
  return (
    <ThemeProvider>
      <ThemedTabs />
    </ThemeProvider>
  );
}
