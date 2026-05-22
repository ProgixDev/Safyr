import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import * as Location from "expo-location";
import { router } from "expo-router";
import { ArrowLeft, ClipboardList, Send } from "lucide-react-native";
import { Button, Card, Header, Input, Screen } from "@/components/ui";
import { useTheme } from "@/theme";
import { getBodyFont, getHeadingFont } from "@/utils/fonts";
import {
  createEvent,
  listMyEvents,
  type EventType,
  type LogbookEvent,
  type Severity,
} from "@/features/mainCourante/logbook.api";
import { MobileApiError } from "@/lib/api-client";

const TYPES: { value: EventType; label: string }[] = [
  { value: "event", label: "Événement" },
  { value: "incident", label: "Incident" },
  { value: "action", label: "Action" },
  { value: "control", label: "Contrôle" },
];

const SEVERITIES: { value: Severity; label: string; color: string }[] = [
  { value: "low", label: "Faible", color: "#16a34a" },
  { value: "medium", label: "Moyenne", color: "#f59e0b" },
  { value: "high", label: "Élevée", color: "#f97316" },
  { value: "critical", label: "Critique", color: "#dc2626" },
];

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NewLogbookEventApiScreen() {
  const { colors } = useTheme();
  const [type, setType] = useState<EventType>("event");
  const [severity, setSeverity] = useState<Severity>("low");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<LogbookEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const events = await listMyEvents();
      setHistory(events);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function getGps() {
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

  async function handleSubmit() {
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    try {
      const coords = await getGps();
      await createEvent({
        type,
        severity,
        title: title.trim(),
        description: description.trim() || undefined,
        ...coords,
      });
      setTitle("");
      setDescription("");
      setSeverity("low");
      setType("event");
      await refresh();
      Alert.alert("Événement enregistré", "Votre saisie a été transmise.");
    } catch (e) {
      const message =
        e instanceof MobileApiError ? e.message : "Échec de l'enregistrement";
      Alert.alert("Erreur", message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Header
        title="Main courante"
        subtitle="Nouvelle saisie"
        left={
          <Button variant="ghost" size="sm" onPress={() => router.back()}>
            <ArrowLeft size={18} color={colors.foreground} />
          </Button>
        }
      />
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          gap: 16,
          paddingBottom: 32,
        }}
      >
        <Card className="gap-4">
          <View className="flex-row items-center gap-2">
            <ClipboardList size={18} color={colors.foreground} />
            <Text
              className="text-base font-semibold"
              style={{
                color: colors.foreground,
                fontFamily: getHeadingFont(),
              }}
            >
              Décrire l&apos;événement
            </Text>
          </View>

          <View className="gap-2">
            <Text
              className="text-xs uppercase"
              style={{ color: colors.foreground, opacity: 0.7 }}
            >
              Type
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {TYPES.map((t) => {
                const sel = t.value === type;
                return (
                  <Pressable
                    key={t.value}
                    onPress={() => setType(t.value)}
                    style={{
                      borderWidth: 1.5,
                      borderColor: sel ? colors.primary : colors.border,
                      backgroundColor: sel
                        ? `${colors.primary}15`
                        : "transparent",
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: sel ? colors.primary : colors.foreground,
                        fontFamily: getBodyFont(sel ? "600" : "400"),
                      }}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="gap-2">
            <Text
              className="text-xs uppercase"
              style={{ color: colors.foreground, opacity: 0.7 }}
            >
              Gravité
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {SEVERITIES.map((s) => {
                const sel = s.value === severity;
                return (
                  <Pressable
                    key={s.value}
                    onPress={() => setSeverity(s.value)}
                    style={{
                      borderWidth: 1.5,
                      borderColor: sel ? s.color : colors.border,
                      backgroundColor: sel
                        ? `${s.color}20`
                        : "transparent",
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: sel ? s.color : colors.foreground,
                        fontFamily: getBodyFont(sel ? "600" : "400"),
                      }}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View>
            <Text
              className="mb-2 text-sm font-medium"
              style={{ color: colors.foreground }}
            >
              Titre *
            </Text>
            <Input
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Visiteur non autorisé tentant d'accéder"
              maxLength={160}
            />
          </View>

          <View>
            <Text
              className="mb-2 text-sm font-medium"
              style={{ color: colors.foreground }}
            >
              Description (optionnel)
            </Text>
            <Input
              value={description}
              onChangeText={setDescription}
              placeholder="Détails de la situation, contexte, actions menées…"
              multiline
              numberOfLines={4}
              maxLength={2000}
              style={{ textAlignVertical: "top", minHeight: 90 }}
            />
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={!title.trim() || submitting}
            style={{
              backgroundColor: colors.primary,
              opacity: !title.trim() || submitting ? 0.5 : 1,
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {submitting ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Send size={16} color={colors.primaryForeground} />
            )}
            <Text
              style={{
                color: colors.primaryForeground,
                fontFamily: getBodyFont("600"),
              }}
            >
              {submitting ? "Envoi…" : "Enregistrer l'événement"}
            </Text>
          </Pressable>

          <Text
            className="text-[10px]"
            style={{ color: colors.foreground, opacity: 0.5 }}
          >
            Le site est rattaché automatiquement à votre vacation en cours.
            Votre position GPS est enregistrée si disponible.
          </Text>
        </Card>

        <Card className="gap-3">
          <Text
            className="text-base font-semibold"
            style={{
              color: colors.foreground,
              fontFamily: getHeadingFont(),
            }}
          >
            Mes événements récents
          </Text>
          {loading ? (
            <ActivityIndicator />
          ) : history.length === 0 ? (
            <Text
              className="text-sm"
              style={{ color: colors.foreground, opacity: 0.6 }}
            >
              Aucun événement enregistré.
            </Text>
          ) : (
            history.map((e) => {
              const sev = SEVERITIES.find((s) => s.value === e.severity);
              return (
                <View
                  key={e.id}
                  className="rounded-lg border border-border px-3 py-2"
                >
                  <View className="flex-row items-start justify-between gap-2">
                    <Text
                      className="flex-1 text-sm font-medium"
                      style={{ color: colors.foreground }}
                    >
                      {e.title}
                    </Text>
                    {sev && (
                      <View
                        style={{
                          backgroundColor: `${sev.color}20`,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 6,
                        }}
                      >
                        <Text
                          style={{
                            color: sev.color,
                            fontSize: 10,
                            fontFamily: getBodyFont("600"),
                          }}
                        >
                          {sev.label}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    className="text-xs"
                    style={{ color: colors.foreground, opacity: 0.6 }}
                  >
                    {formatDateTime(e.occurredAt)} ·{" "}
                    {e.status === "open"
                      ? "En attente"
                      : e.status === "validated"
                        ? "Validé"
                        : e.status === "closed"
                          ? "Clôturé"
                          : "Refusé"}
                  </Text>
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}
