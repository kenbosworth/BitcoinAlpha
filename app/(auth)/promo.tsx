
// ==========================
// FILE: app/(auth)/promo.tsx
// Purpose: Offer selection. Calls claim-promo or start-trial, then unlocks tabs (Home).
// ==========================
import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import { claimPromo, startTrial } from "../../lib/functions";

function Card({ title, subtitle, cta, onPress, disabled }: {
  title: string;
  subtitle: string;
  cta: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        opacity: disabled ? 0.6 : 1,
        backgroundColor: "#111",
        borderColor: "#333",
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        gap: 8,
      }}
    >
      <Text style={{ color: "white", fontSize: 20, fontWeight: "700" }}>{title}</Text>
      <Text style={{ color: "#aaa" }}>{subtitle}</Text>
      <Text style={{ color: "black", backgroundColor: "white", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, fontWeight: "700", marginTop: 8 }}>{cta}</Text>
    </Pressable>
  );
}

export default function PromoScreen() {
  const [busy, setBusy] = useState<"trial" | "promo" | null>(null);
  const [promoDisabled, setPromoDisabled] = useState(false);

  const goHome = () => router.replace("/");

  const onPromo = async () => {
    try {
      setBusy("promo");
      const res = await claimPromo();
      if ((res as any)?.cappedOut) {
        setPromoDisabled(true);
        Alert.alert("Promo full", "The $1/month lifetime offer has reached its cap. Try the 30-day trial.");
        return;
      }
      goHome();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to claim promo.");
    } finally {
      setBusy(null);
    }
  };

  const onTrial = async () => {
    try {
      setBusy("trial");
      await startTrial();
      goHome();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to start trial.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "black", padding: 20, gap: 16 }}>
      <Text style={{ color: "white", fontSize: 28, fontWeight: "800", marginBottom: 8 }}>Choose your plan</Text>

      <View style={{ gap: 12 }}>
        <Pressable onPress={onPromo} disabled={promoDisabled || busy === "trial"}>
          <View style={{ position: "relative" }}>
            <Card
              title="$1/month for life"
              subtitle="Limited to the first 1000 users. Lock in a lifetime price."
              cta={busy === "promo" ? "One moment…" : "Claim $1 Lifetime"}
              onPress={onPromo}
              disabled={promoDisabled || busy === "trial"}
            />
            {busy === "promo" && (
              <View style={{ position: "absolute", right: 16, top: 16 }}>
                <ActivityIndicator />
              </View>
            )}
          </View>
        </Pressable>

        <Pressable onPress={onTrial} disabled={busy === "promo"}>
          <View style={{ position: "relative" }}>
            <Card
              title="30‑day free trial → $2.99/mo"
              subtitle="Full access for 30 days. Cancel anytime."
              cta={busy === "trial" ? "One moment…" : "Start Free Trial"}
              onPress={onTrial}
              disabled={busy === "promo"}
            />
            {busy === "trial" && (
              <View style={{ position: "absolute", right: 16, top: 16 }}>
                <ActivityIndicator />
              </View>
            )}
          </View>
        </Pressable>
      </View>

      <Text style={{ color: "#777", marginTop: 12, fontSize: 12 }}>
        Prices may change for new users. Taxes may apply. You agree to the Terms & Disclaimer.
      </Text>
    </View>
  );
}