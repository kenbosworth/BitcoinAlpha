// app/(auth)/forgot-password.tsx
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
import { Link } from 'expo-router';
import { useTheme } from '../../lib/theme';

export default function ForgotPassword() {
  const { colors, resolved } = useTheme();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  async function onReset() {
    if (!email) {
      Alert.alert('Missing email', 'Please enter your email.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // TODO: if you're using your custom domain for auth flows, update this:
      // redirectTo: 'https://app.getbitcoinalpha.com/reset',
      redirectTo: 'https://bitcoinalpha.app/reset',
    });
    setBusy(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    Alert.alert('Email sent', 'Check your inbox to complete the reset.');
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
          <Text style={[styles.cardTitle, { color: colors.text }]}>Reset password</Text>

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
            returnKeyType="go"
            onSubmitEditing={onReset}
          />

          <Pressable
            onPress={onReset}
            disabled={busy}
            style={[
              styles.button,
              { backgroundColor: busy ? colors.inactive : colors.active, opacity: busy ? 0.9 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Send reset email"
          >
            <Text style={styles.buttonText}>{busy ? 'Sending…' : 'Send reset email'}</Text>
          </Pressable>
        </View>

        {/* Footer link */}
        <View style={styles.footer}>
          <Link href="/(auth)/signin">
            <Text style={[styles.link, { color: colors.active }]}>Back to Sign in</Text>
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
  footer: { marginTop: 8, alignItems: 'center' },
  link: { fontWeight: '600' },
});
