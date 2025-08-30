// app/(auth)/signin.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';


export default function SignIn() {
  const { colors, resolved } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSignIn() {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter your email and password.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);

    if (error) {
      Alert.alert('Sign in failed', error.message);
      return;
    }
    // Land on HOME (tabs default)
    router.replace('/(tabs)');
  }

  return (
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={[styles.flex, { backgroundColor: '#000000' }]}
      >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Header */}
        <View style={[styles.container, { backgroundColor: '#000000' }]}>
          <Image
            // Add these files (see notes below)
            source={
              resolved === 'dark'
                ? require('../../assets/ba_logo.png')
                : require('../../assets/ba_logo.png')
            }
            resizeMode="contain"
            style={styles.logo}
          />
          <Text style={[styles.subtitle, { color: colors.inactive }]}>
            Signals. Notes. Clarity.
          </Text>
        </View>

        {/* Card / Form */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Sign in</Text>

          <Text style={[styles.label, { color: colors.inactive, marginTop: 12, marginBottom: 12  }]}>Email</Text>
          <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="username"
              placeholder="you@example.com"
              placeholderTextColor="#aaa"
              style={[
                styles.input,
                {
                  borderColor: '#333',
                  backgroundColor: '#111',
                  color: '#ffffff', // <--- white text
                },
              ]}
              accessibilityLabel="Email"
              returnKeyType="next"
            />

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              placeholderTextColor="#aaa"
              secureTextEntry
              textContentType="password"
              style={[
                styles.input,
                {
                  borderColor: '#333',
                  backgroundColor: '#111',
                  color: '#ffffff', // <--- white text
                },
              ]}
              accessibilityLabel="Password"
              returnKeyType="go"
              onSubmitEditing={onSignIn}
            />


          <Pressable
            onPress={onSignIn}
            disabled={busy}
            style={[
              styles.button,
              {
                backgroundColor: busy ? colors.inactive : colors.active, marginBottom: 22,
                opacity: busy ? 0.9 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            <Text style={styles.buttonText}>{busy ? 'Signing in…' : 'Sign in'}</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/(auth)/forgot-password')} style={styles.linkRow}>
            <Text style={[styles.link, { color: colors.active, marginBottom: 22 }]}>Forgot password?</Text>
          </Pressable>
        </View>

        {/* Footer links */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.inactive, marginBottom: 22 }]}>New here?</Text>
          <Pressable onPress={() => router.push('/(auth)/signup')}>
            <Text style={[styles.link, { color: colors.active, marginLeft: 6, marginBottom: 100 }]}>Create account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    marginBottom: 16,
    backgroundColor: '#111',
  },
  button: {
    width: '100%',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f7931a',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
