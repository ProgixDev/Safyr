import { useEffect } from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@/theme";
import { NotificationsProvider } from "@/features/notifications/NotificationsContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import "./global.css";

// Keep the splash screen visible while we load fonts
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Custom fonts (Aldrich + Space Grotesk) are not bundled in this repo —
  // we let the system font handle headings/body until proper .ttf files
  // are added under apps/mobile/assets/fonts/.
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <NotificationsProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(app)" />
            </Stack>
          </NotificationsProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
