import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import {
  AlertTriangle,
  CheckCircle2,
  FileBadge,
  RefreshCw,
} from "lucide-react-native";
import { Button, Card } from "@/components/ui";
import { useTheme } from "@/theme";
import {
  computeCertStatus,
  fetchMyEmployeeProfile,
  getCertificationLabel,
  type EmployeeProfile,
} from "./profile.api";
import { MobileApiError } from "@/lib/api-client";

function formatDateFr(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR");
}

const STATUS_LABELS: Record<EmployeeProfile["status"], string> = {
  active: "Actif",
  inactive: "Inactif",
  suspended: "Suspendu",
  terminated: "Terminé",
};

export function MyEmployeeCard() {
  const { colors } = useTheme();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMyEmployeeProfile();
      setProfile(result);
    } catch (e) {
      const message =
        e instanceof MobileApiError
          ? e.message
          : "Impossible de charger votre dossier";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <Card className="gap-3">
        <View className="flex-row items-center gap-2">
          <ActivityIndicator />
          <Text
            className="text-sm"
            style={{ color: colors.foreground }}
          >
            Chargement de votre dossier RH...
          </Text>
        </View>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="gap-3">
        <View className="flex-row items-center gap-2">
          <AlertTriangle size={18} color={colors.destructive} />
          <Text
            className="text-sm font-medium"
            style={{ color: colors.destructive }}
          >
            {error}
          </Text>
        </View>
        <Button variant="outline" size="sm" onPress={load}>
          <RefreshCw size={16} color={colors.foreground} />
          <Text className="ml-2" style={{ color: colors.foreground }}>
            Réessayer
          </Text>
        </Button>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="gap-2">
        <Text
          className="text-sm font-medium"
          style={{ color: colors.foreground }}
        >
          Aucun dossier RH lié à votre compte.
        </Text>
        <Text
          className="text-xs"
          style={{ color: colors.mutedForeground }}
        >
          Contactez votre RH pour être rattaché à un dossier salarié.
        </Text>
      </Card>
    );
  }

  const valid = profile.certifications.filter(
    (c) => computeCertStatus(c.expiryDate) === "valid",
  ).length;
  const expiring = profile.certifications.filter(
    (c) => computeCertStatus(c.expiryDate) === "expiring-soon",
  ).length;
  const expired = profile.certifications.filter(
    (c) => computeCertStatus(c.expiryDate) === "expired",
  ).length;

  return (
    <Card className="gap-4">
      <View className="flex-row items-center justify-between">
        <Text
          className="text-base font-semibold"
          style={{ color: colors.foreground }}
        >
          Mon dossier RH
        </Text>
        <Button variant="ghost" size="sm" onPress={load}>
          <RefreshCw size={16} color={colors.foreground} />
        </Button>
      </View>

      <View className="gap-2">
        <Row label="Matricule" value={profile.employeeNumber ?? "—"} />
        <Row label="Poste" value={profile.position ?? "—"} />
        <Row label="Statut" value={STATUS_LABELS[profile.status]} />
        <Row label="Embauche" value={formatDateFr(profile.hireDate)} />
        <Row label="Email" value={profile.email ?? profile.user.email ?? "—"} />
      </View>

      <View>
        <View className="mb-2 flex-row items-center gap-2">
          <FileBadge size={16} color={colors.foreground} />
          <Text
            className="text-sm font-semibold"
            style={{ color: colors.foreground }}
          >
            Certifications ({profile.certifications.length})
          </Text>
        </View>
        <View className="flex-row gap-2">
          <CountChip
            label="Valides"
            value={valid}
            color="#16a34a"
          />
          <CountChip
            label="Expire bientôt"
            value={expiring}
            color="#f97316"
          />
          <CountChip label="Expirées" value={expired} color="#dc2626" />
        </View>

        <View className="mt-3 gap-2">
          {profile.certifications.length === 0 ? (
            <Text
              className="text-xs"
              style={{ color: colors.foreground, opacity: 0.6 }}
            >
              Aucune certification enregistrée.
            </Text>
          ) : (
            profile.certifications.map((cert) => {
              const status = computeCertStatus(cert.expiryDate);
              const dotColor =
                status === "valid"
                  ? "#16a34a"
                  : status === "expiring-soon"
                    ? "#f97316"
                    : "#dc2626";
              return (
                <View
                  key={cert.id}
                  className="flex-row items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <View className="flex-row items-center gap-2">
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: dotColor,
                      }}
                    />
                    <View>
                      <Text
                        className="text-sm font-medium"
                        style={{ color: colors.foreground }}
                      >
                        {getCertificationLabel(cert.type)}
                      </Text>
                      <Text
                        className="text-xs"
                        style={{ color: colors.foreground, opacity: 0.6 }}
                      >
                        n° {cert.number}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text
                      className="text-xs"
                      style={{ color: colors.foreground }}
                    >
                      Expire le {formatDateFr(cert.expiryDate)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        <CheckCircle2 size={14} color={colors.foreground} />
        <Text
          className="text-xs"
          style={{ color: colors.foreground, opacity: 0.7 }}
        >
          {profile.documents.length} document(s) au dossier
        </Text>
      </View>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View className="flex-row justify-between">
      <Text
        className="text-sm"
        style={{ color: colors.foreground, opacity: 0.7 }}
      >
        {label}
      </Text>
      <Text
        className="text-sm font-medium"
        style={{ color: colors.foreground }}
      >
        {value}
      </Text>
    </View>
  );
}

function CountChip({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      className="flex-1 items-center rounded-lg border border-border px-2 py-2"
      style={{ borderColor: value > 0 ? color : undefined }}
    >
      <Text className="text-lg font-bold" style={{ color }}>
        {value}
      </Text>
      <Text
        className="text-[10px]"
        style={{ color: colors.foreground, opacity: 0.7 }}
      >
        {label}
      </Text>
    </View>
  );
}
