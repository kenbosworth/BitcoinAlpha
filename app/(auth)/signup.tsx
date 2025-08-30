// app/(auth)/signup.tsx
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
import { supabase } from '../../lib/supabase';
import { router, Link } from 'expo-router';
import { useTheme } from '../../lib/theme';

export default function SignUp() {
  const { colors, resolved } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSignUp() {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter your email and password.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setBusy(false);

    if (error) {
      Alert.alert('Sign up failed', error.message);
      return;
    }
    Alert.alert('Success', 'Check your email to confirm your account.');
    router.replace('/(auth)/signin');
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
        <View style={styles.header}>
          <Image
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
          <Text style={[styles.cardTitle, { color: colors.text }]}>Create account</Text>

          <Text style={[styles.label, { color: colors.inactive, marginTop: 12 }]}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="username"
            placeholder="you@example.com"
            placeholderTextColor={colors.inactive}
            style={[
              styles.input,
              { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg },
            ]}
            accessibilityLabel="Email"
            returnKeyType="next"
          />

          <Text style={[styles.label, { color: colors.inactive, marginTop: 12 }]}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password"
            placeholderTextColor={colors.inactive}
            secureTextEntry
            textContentType="password"
            style={[
              styles.input,
              { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg },
            ]}
            accessibilityLabel="Password"
            returnKeyType="go"
            onSubmitEditing={onSignUp}
          />

          <Pressable
            onPress={onSignUp}
            disabled={busy}
            style={[
              styles.button,
              { backgroundColor: busy ? colors.inactive : colors.active, opacity: busy ? 0.9 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Create account"
          >
            <Text style={styles.buttonText}>{busy ? 'Creating…' : 'Create account'}</Text>
          </Pressable>
        </View>

        {/* Footer link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.inactive }]}>Already have an account?</Text>
          <Link href="/(auth)/signin">
            <Text style={[styles.link, { color: colors.active, marginLeft: 6 }]}>Sign in</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 188, height: 188, marginBottom: 20 },
  subtitle: { fontSize: 14 },
  card: { borderWidth: 1, borderRadius: 16, padding: 20, marginBottom: 24 },
  cardTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  label: { fontSize: 13, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 14,
  },
  button: { marginTop: 16, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  footer: { marginTop: 8, flexDirection: 'row', justifyContent: 'center' },
  footerText: { fontSize: 14 },
  link: { fontWeight: '600' },
});
