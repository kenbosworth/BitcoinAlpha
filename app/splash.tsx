// app/splash.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(1)).current;
  const bFlash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(bFlash, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(bFlash, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(bFlash, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(bFlash, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(bFlash, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      Animated.timing(textFade, { toValue: 0, duration: 500, useNativeDriver: true }).start();
    });

    Animated.timing(fadeAnim, { toValue: 1, duration: 1000, delay: 1800, useNativeDriver: true }).start();

    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      router.replace(data.session ? '/' : '/signin');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bIcon, { opacity: bFlash }]}> 
        <Ionicons name="logo-bitcoin" size={96} color="orange" />
      </Animated.View>

      <Animated.Text style={[styles.title, { opacity: textFade }]}>BITCOIN ALPHA</Animated.Text>
      <Animated.View style={{ opacity: fadeAnim }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    position: 'absolute',
    bottom: 150,
  },
  bIcon: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
