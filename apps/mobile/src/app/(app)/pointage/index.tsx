import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import * as Location from "expo-location";
import { router } from "expo-router";
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  MapPin,
  Play,
  Square,
} from "lucide-react-native";
import { Button, Card, Header, Screen } from "@/components/ui";
import { useTheme } from "@/theme";
import { getBodyFont, getHeadingFont } from "@/utils/fonts";
import {
  clockIn,
  clockOut,
  getActiveTimeEntry,
  listMyTimeEntries,
  type TimeEntry,
} from "@/features/timeEntries/time-entries.api";
import { listSites, type Site } from "@/features/sites/sites.api";
import { MobileApiError } from "@/lib/api-client";

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(fromIso: string, toIso?: string | null): string {
  const from = new Date(fromIso).getTime();
  const to = toIso ? new Date(toIso).getTime() : Date.now();
  const minutes = Math.max(0, Math.floor((to - from) / 60000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m.toString().padStart(2, "0")}`;
}

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default function PointageScreen() {
  const { colors } = useTheme();
  const [active, setActive] = useState<TimeEntry | null>(null);
  const [history, setHistory] = useState<TimeEntry[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [activeEntry, todayEntries, siteList] = await Promise.all([
        getActiveTimeEntry(),
        listMyTimeEntries({ from: startOfTodayIso(), status: "all" }),
        listSites().catch(() => [] as Site[]),
      ]);
      setActive(activeEntry);
      setHistory(todayEntries);
      setSites(siteList.filter((s) => s.active));
    } catch (e) {
      const message =
        e instanceof MobileApiError ? e.message : "Erreur de chargement";
      setError(message);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await load();
      setLoading(false);
    })();
  }, [load]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  async function getGpsCoords(): Promise<{
    latitude?: number;
    longitude?: number;
  }> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return {};
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
    } catch {
      return {};
    }
  }

  async function handleClockIn() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const coords = await getGpsCoords();
      const chosenSite = sites.find((s) => s.id === selectedSiteId);
      const entry = await clockIn({
        siteName: chosenSite?.name ?? undefined,
        source: coords.latitude != null ? "gps" : "manual",
        ...coords,
      });
      setActive(entry);
      setSelectedSiteId(null);
      await load();
      Alert.alert("Prise de service", "Vacation enregistrée");
    } catch (e) {
      const message =
        e instanceof MobileApiError ? e.message : "Échec du pointage";
      setError(message);
      Alert.alert("Pointage impossible", message);
    } finally {
      setBusy(false);
    }
  }

  async function handleClockOut() {
    if (busy || !active) return;
    setBusy(true);
    setError(null);
    try {
      const coords = await getGpsCoords();
      await clockOut({ ...coords });
      setActive(null);
      await load();
      Alert.alert("Fin de service", "Vacation clôturée");
    } catch (e) {
      const message =
        e instanceof MobileApiError ? e.message : "Échec du pointage";
      setError(message);
      Alert.alert("Pointage impossible", message);
    } finally {
      setBusy(false);
    }
  }

  const headerSubtitle = useMemo(() => {
    if (loading) return "Chargement…";
    return active ? "Vacation en cours" : "Hors service";
  }, [loading, active]);

  return (
    <Screen>
      <Header
        title="Pointage"
        subtitle={headerSubtitle}
        left={
          <Button variant="ghost" size="sm" onPress={() => router.back()}>
            <ArrowLeft size={18} color={colors.foreground} />
          </Button>
        }
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 32,
          gap: 16,
          paddingTop: 16,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <ActivityIndicator />
        ) : (
          <>
            <Card className="gap-3">
              {active ? (
                <ActiveSession entry={active} />
              ) : (
                <View className="gap-3">
                  <Text
                    className="text-base font-semibold"
                    style={{
                      color: colors.foreground,
                      fontFamily: getHeadingFont(),
                    }}
                  >
                    Prendre votre service
                  </Text>
                  <Text
                    className="text-xs"
                    style={{ color: colors.foreground, opacity: 0.7 }}
                  >
                    Sélectionnez le site sur lequel vous prenez votre service.
                    Votre position GPS sera enregistrée pour rapprochement avec
                    le planning.
                  </Text>
                  {sites.length === 0 ? (
                    <Text
                      className="text-xs italic"
                      style={{ color: colors.foreground, opacity: 0.5 }}
                    >
                      Aucun site configuré. Contactez votre responsable.
                    </Text>
                  ) : (
                    <View className="gap-2">
                      {sites.map((s) => {
                        const selected = s.id === selectedSiteId;
                        return (
                          <Pressable
                            key={s.id}
                            onPress={() => setSelectedSiteId(s.id)}
                            style={{
                              borderWidth: 1.5,
                              borderColor: selected
                                ? "#16a34a"
                                : colors.border ?? "#cbd5e1",
                              borderRadius: 10,
                              padding: 12,
                              backgroundColor: selected
                                ? "rgba(22,163,74,0.08)"
                                : "transparent",
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <View
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: 7,
                                borderWidth: 2,
                                borderColor: selected
                                  ? "#16a34a"
                                  : colors.foreground,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {selected && (
                                <View
                                  style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: "#16a34a",
                                  }}
                                />
                              )}
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text
                                className="text-sm font-medium"
                                style={{ color: colors.foreground }}
                              >
                                {s.name}
                              </Text>
                              <Text
                                className="text-xs"
                                style={{
                                  color: colors.foreground,
                                  opacity: 0.65,
                                }}
                              >
                                {[s.clientName, s.city]
                                  .filter(Boolean)
                                  .join(" · ") || "—"}
                              </Text>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}

              {active ? (
                <Pressable
                  onPress={handleClockOut}
                  disabled={busy}
                  style={{
                    backgroundColor: "#dc2626",
                    paddingVertical: 18,
                    borderRadius: 12,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 10,
                    opacity: busy ? 0.7 : 1,
                  }}
                >
                  {busy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Square size={20} color="#fff" />
                  )}
                  <Text
                    style={{
                      color: "#fff",
                      fontFamily: getBodyFont("600"),
                      fontSize: 16,
                    }}
                  >
                    Fin de service
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleClockIn}
                  disabled={busy}
                  style={{
                    backgroundColor: "#16a34a",
                    paddingVertical: 18,
                    borderRadius: 12,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 10,
                    opacity: busy ? 0.7 : 1,
                  }}
                >
                  {busy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Play size={20} color="#fff" />
                  )}
                  <Text
                    style={{
                      color: "#fff",
                      fontFamily: getBodyFont("600"),
                      fontSize: 16,
                    }}
                  >
                    Prise de service
                  </Text>
                </Pressable>
              )}

              {error && (
                <View
                  className="flex-row items-center gap-2"
                  style={{ marginTop: 4 }}
                >
                  <AlertTriangle size={14} color={colors.destructive} />
                  <Text
                    className="text-xs"
                    style={{ color: colors.destructive }}
                  >
                    {error}
                  </Text>
                </View>
              )}
            </Card>

            <Card className="gap-3">
              <Text
                className="text-base font-semibold"
                style={{
                  color: colors.foreground,
                  fontFamily: getHeadingFont(),
                }}
              >
                Aujourd&apos;hui
              </Text>
              {history.length === 0 ? (
                <Text
                  className="text-sm"
                  style={{ color: colors.foreground, opacity: 0.6 }}
                >
                  Aucune vacation aujourd&apos;hui.
                </Text>
              ) : (
                history.map((entry) => (
                  <View
                    key={entry.id}
                    className="rounded-lg border border-border px-3 py-3"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Clock size={14} color={colors.foreground} />
                        <Text
                          className="text-sm font-medium"
                          style={{ color: colors.foreground }}
                        >
                          {formatTime(entry.clockInAt)}
                          {" → "}
                          {entry.clockOutAt
                            ? formatTime(entry.clockOutAt)
                            : "en cours"}
                        </Text>
                      </View>
                      <Text
                        className="text-xs font-semibold"
                        style={{
                          color: entry.clockOutAt
                            ? colors.foreground
                            : "#16a34a",
                        }}
                      >
                        {formatDuration(entry.clockInAt, entry.clockOutAt)}
                      </Text>
                    </View>
                    {entry.siteName && (
                      <View
                        className="flex-row items-center gap-1"
                        style={{ marginTop: 4 }}
                      >
                        <MapPin size={12} color={colors.foreground} />
                        <Text
                          className="text-xs"
                          style={{
                            color: colors.foreground,
                            opacity: 0.7,
                          }}
                        >
                          {entry.siteName}
                        </Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </Card>

            {Platform.OS !== "web" && (
              <Text
                className="text-[10px] text-center"
                style={{ color: colors.foreground, opacity: 0.5 }}
              >
                La position GPS est uniquement enregistrée pendant les
                vacations, conformément à la réglementation RGPD.
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function ActiveSession({ entry }: { entry: TimeEntry }) {
  const { colors } = useTheme();
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: "#16a34a",
          }}
        />
        <Text
          className="text-base font-semibold"
          style={{ color: colors.foreground, fontFamily: getHeadingFont() }}
        >
          En service
        </Text>
      </View>
      <Text
        className="text-3xl font-bold"
        style={{ color: colors.foreground, fontFamily: getHeadingFont() }}
      >
        {formatDuration(entry.clockInAt)}
      </Text>
      <Text
        className="text-xs"
        style={{ color: colors.foreground, opacity: 0.7 }}
      >
        Démarrée à {formatTime(entry.clockInAt)}
        {entry.siteName ? ` • ${entry.siteName}` : ""}
      </Text>
    </View>
  );
}
