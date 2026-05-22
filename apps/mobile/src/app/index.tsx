import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { router } from "expo-router";
import { getSession } from "@/features/auth/auth.storage";
import { fetchCurrentSession } from "@/features/auth/auth.api";
import { Screen } from "@/components/ui";
import { getBodyFont, getHeadingFont } from "@/utils/fonts";

export default function Index() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const timer = setTimeout(async () => {
      if (!mounted) return;

      try {
        const cached = await getSession();
        if (cached) {
          router.replace("/(app)/(tabs)");
        }

        const fresh = await fetchCurrentSession();
        if (!mounted) return;

        router.replace(fresh ? "/(app)/(tabs)" : "/(auth)/login");
      } catch (error) {
        console.error("Navigation error:", error);
        router.replace("/(auth)/login");
      } finally {
        if (mounted) setLoading(false);
      }
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <Screen contentClassName="items-center justify-center px-6">
      <View className="items-center">
        <Text
          className="text-3xl font-semibold text-foreground"
          style={{ fontFamily: getHeadingFont() }}
        >
          Safyr
        </Text>
        <Text
          className="mt-2 text-sm text-muted-foreground"
          style={{ fontFamily: getBodyFont("400") }}
        >
          Portail Agent • Sécurité • RH
        </Text>
        <View className="mt-6">{loading ? <ActivityIndicator /> : null}</View>
      </View>
    </Screen>
  );
}
