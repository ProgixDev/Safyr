import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  ArrowLeft,
  CheckCircle,
  Loader,
  Lock,
  LogOut,
  RefreshCw,
  X,
} from "lucide-react-native";
import {
  Button,
  Card,
  Header,
  Input,
  MenuButton,
  Screen,
} from "@/components/ui";
import { getSession, type Session } from "@/features/auth/auth.storage";
import { signOut } from "@/features/auth/auth.api";
import { useTheme } from "@/theme";
import {
  clearProfile,
  defaultProfileFromSession,
  getProfile,
  upsertProfile,
  type AgentProfile,
} from "@/features/profile/profile.storage";
import { MyEmployeeCard } from "@/features/profile/MyEmployeeCard";

export default function ProfileScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [session, setSessionState] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [siteName, setSiteName] = useState("");
  const [badgeId, setBadgeId] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const currentSession = await getSession();
      if (currentSession) {
        setSessionState(currentSession);
        const stored = await getProfile();
        const base = stored ?? {
          ...(defaultProfileFromSession(currentSession) as any),
          updatedAtIso: "",
        };
        setProfile(stored);
        setFullName(base.fullName ?? currentSession.fullName);
        setEmail(base.email ?? "");
        setPhone(base.phone ?? "");
        setSiteName(base.siteName ?? "");
        setBadgeId(base.badgeId ?? "");
        setEmergencyContactName(base.emergencyContactName ?? "");
        setEmergencyContactPhone(base.emergencyContactPhone ?? "");
      } else {
        router.replace("/(auth)/login");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      Alert.alert("Erreur", "Impossible de charger le profil");
    } finally {
      setLoading(false);
    }
  }

  function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async function handleSave() {
    if (!session) {
      Alert.alert("Erreur", "Session introuvable");
      return;
    }

    // Validate email if provided
    if (email.trim() && !validateEmail(email.trim())) {
      Alert.alert("Erreur", "Veuillez entrer une adresse email valide");
      return;
    }

    setSaving(true);
    try {
      // Only save email and phone, other fields are read-only
      await upsertProfile({
        fullName: fullName.trim(), // Keep existing fullName (read-only but needed for storage)
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        siteName: siteName.trim() || undefined, // Keep existing (read-only)
        badgeId: badgeId.trim() || undefined, // Keep existing (read-only)
        emergencyContactName: emergencyContactName.trim() || undefined, // Keep existing (read-only)
        emergencyContactPhone: emergencyContactPhone.trim() || undefined, // Keep existing (read-only)
      });

      Alert.alert("Succès", "Profil mis à jour avec succès", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Erreur", "Impossible de sauvegarder le profil");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword.trim()) {
      Alert.alert("Erreur", "Veuillez entrer votre mot de passe actuel");
      return;
    }

    if (!newPassword.trim() || newPassword.length < 6) {
      Alert.alert(
        "Erreur",
        "Le nouveau mot de passe doit contenir au moins 6 caractères",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }

    setChangingPassword(true);
    try {
      // In production, you would verify current password and update via API
      // await changePassword({ currentPassword, newPassword });

      // For MVP, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 700));

      Alert.alert("Succès", "Mot de passe modifié avec succès", [
        {
          text: "OK",
          onPress: () => {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
          },
        },
      ]);
    } catch (error) {
      console.error("Error changing password:", error);
      Alert.alert(
        "Erreur",
        "Impossible de modifier le mot de passe. Vérifiez votre mot de passe actuel.",
      );
    } finally {
      setChangingPassword(false);
    }
  }

  async function onReset() {
    Alert.alert(
      "Réinitialiser",
      "Supprimer le profil local et repartir du profil par défaut ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          style: "destructive",
          onPress: async () => {
            await clearProfile();
            Alert.alert(
              "OK",
              "Profil local supprimé. Rouvrez l'écran pour recharger le défaut.",
            );
            router.back();
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <Screen>
        <Header title="Profil" subtitle="Chargement..." left={<MenuButton />} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        title="Mon profil"
        subtitle={profile ? "Synchronisé (local)" : "Par défaut (démo)"}
        left={<MenuButton />}
        right={
          <Button variant="ghost" size="sm" onPress={() => router.back()}>
            <ArrowLeft size={18} color={colors.foreground} />
            <Text className="ml-1" style={{ color: colors.foreground }}>
              Retour
            </Text>
          </Button>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1 px-4"
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <View className="gap-4">
            <MyEmployeeCard />

            <Card className="gap-4">
              <Text
                className="text-base font-semibold"
                style={{ color: colors.foreground }}
              >
                Informations personnelles
              </Text>

              <View className="gap-3">
                <View>
                  <Text
                    className="mb-2 text-sm font-medium"
                    style={{ color: colors.foreground }}
                  >
                    Nom complet
                  </Text>
                  <Input
                    value={fullName}
                    editable={false}
                    placeholder="Prénom Nom"
                    autoCapitalize="words"
                    className="opacity-60"
                  />
                  <Text
                    className="mt-1 text-xs"
                    style={{ color: colors.foreground }}
                  >
                    Le nom complet ne peut pas être modifié depuis
                    l&apos;application mobile
                  </Text>
                </View>

                <View>
                  <Text
                    className="mb-2 text-sm font-medium"
                    style={{ color: colors.foreground }}
                  >
                    Email *
                  </Text>
                  <Input
                    value={email}
                    onChangeText={setEmail}
                    placeholder="email@exemple.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <Text
                    className="mt-1 text-xs"
                    style={{ color: colors.foreground }}
                  >
                    Modifiez votre adresse email
                  </Text>
                </View>

                <View>
                  <Text
                    className="mb-2 text-sm font-medium"
                    style={{ color: colors.foreground }}
                  >
                    Téléphone
                  </Text>
                  <Input
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+33 6 12 34 56 78"
                    keyboardType="phone-pad"
                  />
                  <Text
                    className="mt-1 text-xs"
                    style={{ color: colors.foreground }}
                  >
                    Modifiez votre numéro de téléphone
                  </Text>
                </View>

                <View>
                  <Text
                    className="mb-2 text-sm font-medium"
                    style={{ color: colors.foreground }}
                  >
                    Site
                  </Text>
                  <Input
                    value={siteName}
                    editable={false}
                    placeholder="Ex: Siège • Paris"
                    className="opacity-60"
                  />
                  <Text
                    className="mt-1 text-xs"
                    style={{ color: colors.foreground }}
                  >
                    Le site ne peut pas être modifié depuis l&apos;application
                    mobile
                  </Text>
                </View>

                <View>
                  <Text
                    className="mb-2 text-sm font-medium"
                    style={{ color: colors.foreground }}
                  >
                    Badge / matricule
                  </Text>
                  <Input
                    value={badgeId}
                    editable={false}
                    placeholder="agent_001"
                    className="opacity-60"
                  />
                  <Text
                    className="mt-1 text-xs"
                    style={{ color: colors.foreground }}
                  >
                    Le badge ne peut pas être modifié depuis l&apos;application
                    mobile
                  </Text>
                </View>
              </View>
            </Card>

            <Card className="gap-4">
              <Text
                className="text-base font-semibold"
                style={{ color: colors.foreground }}
              >
                Contact d&apos;urgence
              </Text>
              <View>
                <Text
                  className="mb-2 text-sm font-medium"
                  style={{ color: colors.foreground }}
                >
                  Nom
                </Text>
                <Input
                  value={emergencyContactName}
                  editable={false}
                  placeholder="Nom du contact"
                  className="opacity-60"
                />
                <Text
                  className="mt-1 text-xs"
                  style={{ color: colors.foreground }}
                >
                  Le contact d&apos;urgence ne peut pas être modifié depuis
                  l&apos;application mobile
                </Text>
              </View>
              <View>
                <Text
                  className="mb-2 text-sm font-medium"
                  style={{ color: colors.foreground }}
                >
                  Téléphone
                </Text>
                <Input
                  value={emergencyContactPhone}
                  editable={false}
                  keyboardType="phone-pad"
                  placeholder="+33 ..."
                  className="opacity-60"
                />
                <Text
                  className="mt-1 text-xs"
                  style={{ color: colors.foreground }}
                >
                  Le téléphone du contact d&apos;urgence ne peut pas être
                  modifié depuis l&apos;application mobile
                </Text>
              </View>
            </Card>

            <Card className="gap-4">
              <Text
                className="text-base font-semibold"
                style={{ color: colors.foreground }}
              >
                Changer le mot de passe
              </Text>
              <View className="gap-3">
                <View>
                  <Text
                    className="mb-2 text-sm font-medium"
                    style={{ color: colors.foreground }}
                  >
                    Mot de passe actuel *
                  </Text>
                  <Input
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="••••••••"
                    secureTextEntry
                  />
                </View>

                <View>
                  <Text
                    className="mb-2 text-sm font-medium"
                    style={{ color: colors.foreground }}
                  >
                    Nouveau mot de passe *
                  </Text>
                  <Input
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Au moins 6 caractères"
                    secureTextEntry
                  />
                  <Text
                    className="mt-1 text-xs"
                    style={{ color: colors.foreground }}
                  >
                    Le mot de passe doit contenir au moins 6 caractères
                  </Text>
                </View>

                <View>
                  <Text
                    className="mb-2 text-sm font-medium"
                    style={{ color: colors.foreground }}
                  >
                    Confirmer le mot de passe *
                  </Text>
                  <Input
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Répétez le nouveau mot de passe"
                    secureTextEntry
                  />
                </View>

                <Button
                  onPress={handleChangePassword}
                  disabled={
                    changingPassword ||
                    !currentPassword.trim() ||
                    !newPassword.trim() ||
                    !confirmPassword.trim()
                  }
                  variant="outline"
                >
                  {changingPassword ? (
                    <>
                      <Loader size={18} color={colors.foreground} />
                      <Text
                        className="ml-2"
                        style={{ color: colors.foreground }}
                      >
                        Modification...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Lock size={18} color={colors.foreground} />
                      <Text
                        className="ml-2"
                        style={{ color: colors.foreground }}
                      >
                        Modifier le mot de passe
                      </Text>
                    </>
                  )}
                </Button>
              </View>
            </Card>

            <Card className="gap-2">
              <Text
                className="text-base font-semibold"
                style={{ color: colors.foreground }}
              >
                Informations de compte
              </Text>
              <View className="gap-2">
                <View className="flex-row justify-between">
                  <Text
                    className="text-sm"
                    style={{ color: colors.foreground }}
                  >
                    Identifiant
                  </Text>
                  <Text
                    className="text-sm font-medium"
                    style={{ color: colors.foreground }}
                  >
                    {session?.userId}
                  </Text>
                </View>
              </View>
            </Card>

            <View className="gap-3 pt-2">
              <Button onPress={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader size={18} color={colors.primaryForeground} />
                    <Text
                      className="ml-2"
                      style={{ color: colors.primaryForeground }}
                    >
                      Enregistrement...
                    </Text>
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} color={colors.primaryForeground} />
                    <Text
                      className="ml-2"
                      style={{ color: colors.primaryForeground }}
                    >
                      Enregistrer les modifications
                    </Text>
                  </>
                )}
              </Button>
              <Button variant="outline" onPress={onReset}>
                <RefreshCw size={18} color={colors.foreground} />
                <Text className="ml-2" style={{ color: colors.foreground }}>
                  Réinitialiser le profil local
                </Text>
              </Button>
              <Button variant="outline" onPress={() => router.back()}>
                <X size={18} color={colors.foreground} />
                <Text className="ml-2" style={{ color: colors.foreground }}>
                  Annuler
                </Text>
              </Button>
              <Button
                variant="outline"
                onPress={async () => {
                  await signOut();
                  router.replace("/(auth)/login");
                }}
              >
                <LogOut size={18} color={colors.destructive} />
                <Text className="ml-2" style={{ color: colors.destructive }}>
                  Se déconnecter
                </Text>
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
