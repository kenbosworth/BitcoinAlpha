// ==========================
// FILE: app/(auth)/terms.tsx
// Purpose: Terms & Disclaimer screen. Calls agree-terms Edge Function, then goes to promo.
// ==========================
import { useState } from "react";
import { ScrollView, View, Text, Pressable, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import { agreeToTerms } from "../../lib/functions";

export default function TermsScreen() {
  const [busy, setBusy] = useState(false);

  const onAgree = async () => {
    try {
      setBusy(true);
      await agreeToTerms();
      router.replace("/(auth)/promo");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to save agreement.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Text style={{ color: "white", fontSize: 28, fontWeight: "700" }}>Terms & Disclaimer</Text>
        <Text style={{ color: "#bbb", lineHeight: 20 }}>
          {/* Replace with your actual Terms. Keep it scrollable. */}
          By using Bitcoin Alpha, you agree that nothing herein is financial advice. Market data and alerts may be delayed.
          Past performance is not indicative of future results. You must be over the age of majority in your jurisdiction.
        </Text>
        <Pressable
          onPress={onAgree}
          disabled={busy}
          style={{
            backgroundColor: busy ? "#333" : "#fff",
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
          }}
        >
          {busy ? (
            <ActivityIndicator />
          ) : (
            <Text style={{ color: "black", fontWeight: "700" }}>Agree & Continue</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

