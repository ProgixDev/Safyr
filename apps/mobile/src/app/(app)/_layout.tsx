import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function AppLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="main-courante/new" />
        <Stack.Screen name="main-courante/new-api" />
        <Stack.Screen name="sos" />
        <Stack.Screen name="profile/index" />
        <Stack.Screen name="pointage/index" />
        <Stack.Screen name="documents/index" />
        <Stack.Screen name="documents/payroll" />
        <Stack.Screen name="documents/schedule" />
      </Stack>
    </>
  );
}
