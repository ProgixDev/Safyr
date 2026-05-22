import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Button, Card, Input, Screen } from "@/components/ui";
import {
  requestEmailOtp,
  verifyEmailOtp,
  MobileApiError,
} from "@/features/auth/auth.api";
import { getBodyFont, getHeadingFont } from "@/utils/fonts";

type Step = "email" | "otp";

export default function LoginScreen() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const emailValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
    [email],
  );

  async function handleRequestOtp() {
    if (!emailValid) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      await requestEmailOtp(email);
      setStep("otp");
    } catch (error) {
      const message =
        error instanceof MobileApiError
          ? error.message
          : "Impossible d'envoyer le code";
      setErrorMessage(message);
      Alert.alert("Code non envoyé", message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (otp.trim().length < 4) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      await verifyEmailOtp(email, otp);
      router.replace("/(app)/(tabs)");
    } catch (error) {
      const message =
        error instanceof MobileApiError ? error.message : "Code invalide";
      setErrorMessage(message);
      Alert.alert("Connexion impossible", message);
    } finally {
      setLoading(false);
    }
  }

  function handleChangeEmail() {
    setStep("email");
    setOtp("");
    setErrorMessage(null);
  }

  return (
    <Screen contentClassName="flex-1 px-4">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-1 justify-center">
          <View className="mb-8">
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
              {step === "email"
                ? "Recevez un code à 6 chiffres par e-mail"
                : `Code envoyé à ${email}`}
            </Text>
          </View>

          <Card className="gap-4">
            {step === "email" ? (
              <>
                <View>
                  <Text
                    className="mb-2 text-sm font-medium text-foreground"
                    style={{ fontFamily: getBodyFont("500") }}
                  >
                    Email
                  </Text>
                  <Input
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="prenom.nom@entreprise.com"
                    returnKeyType="send"
                    onSubmitEditing={handleRequestOtp}
                  />
                </View>

                <Button
                  onPress={handleRequestOtp}
                  disabled={!emailValid || loading}
                  className="mt-2"
                >
                  {loading ? "Envoi..." : "Recevoir un code"}
                </Button>
              </>
            ) : (
              <>
                <View>
                  <Text
                    className="mb-2 text-sm font-medium text-foreground"
                    style={{ fontFamily: getBodyFont("500") }}
                  >
                    Code OTP
                  </Text>
                  <Input
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    placeholder="123456"
                    maxLength={6}
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyOtp}
                  />
                </View>

                <Button
                  onPress={handleVerifyOtp}
                  disabled={otp.trim().length < 4 || loading}
                  className="mt-2"
                >
                  {loading ? "Vérification..." : "Valider le code"}
                </Button>

                <View className="flex-row justify-between">
                  <Text
                    onPress={handleChangeEmail}
                    className="text-xs text-primary"
                    style={{ fontFamily: getBodyFont("500") }}
                  >
                    Changer d&apos;email
                  </Text>
                  <Text
                    onPress={handleRequestOtp}
                    className="text-xs text-primary"
                    style={{ fontFamily: getBodyFont("500") }}
                  >
                    Renvoyer le code
                  </Text>
                </View>
              </>
            )}

            {errorMessage && (
              <Text
                className="text-xs text-destructive"
                style={{ fontFamily: getBodyFont("400") }}
              >
                {errorMessage}
              </Text>
            )}
          </Card>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
