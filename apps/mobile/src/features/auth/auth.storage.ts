import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const SESSION_KEY = "safyr.session.v2";
const TOKEN_KEY = "safyr.bearer.v2";

export type Session = {
  userId: string;
  fullName: string;
  email: string;
};

async function setSecureItem(key: string, value: string) {
  try {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    });
    return true;
  } catch {
    return false;
  }
}

async function getSecureItem(key: string) {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function deleteSecureItem(key: string) {
  try {
    await SecureStore.deleteItemAsync(key);
    return true;
  } catch {
    return false;
  }
}

export async function getSession(): Promise<Session | null> {
  const raw =
    (await getSecureItem(SESSION_KEY)) ??
    (await AsyncStorage.getItem(SESSION_KEY));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export async function setSession(session: Session): Promise<void> {
  const raw = JSON.stringify(session);
  const ok = await setSecureItem(SESSION_KEY, raw);
  if (!ok) {
    await AsyncStorage.setItem(SESSION_KEY, raw);
  } else {
    await AsyncStorage.removeItem(SESSION_KEY);
  }
}

export async function clearSession(): Promise<void> {
  const ok = await deleteSecureItem(SESSION_KEY);
  if (!ok) {
    await AsyncStorage.removeItem(SESSION_KEY);
  } else {
    await AsyncStorage.removeItem(SESSION_KEY);
  }
  await clearBearerToken();
}

export async function getBearerToken(): Promise<string | null> {
  return (
    (await getSecureItem(TOKEN_KEY)) ?? (await AsyncStorage.getItem(TOKEN_KEY))
  );
}

export async function setBearerToken(token: string): Promise<void> {
  const ok = await setSecureItem(TOKEN_KEY, token);
  if (!ok) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

export async function clearBearerToken(): Promise<void> {
  const ok = await deleteSecureItem(TOKEN_KEY);
  if (!ok) {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}
