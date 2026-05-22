import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  Platform,
  Alert,
  ScrollView,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import {
  Home,
  ClipboardList,
  Footprints,
  MapPin,
  FileText,
  User,
  AlertTriangle,
  X,
  ChevronRight,
  LogOut,
} from "lucide-react-native";
import { Image } from "expo-image";
import {
  getSession,
  clearSession,
  type Session,
} from "@/features/auth/auth.storage";
import { useTheme } from "@/theme";
import { getHeadingFont, getBodyFont } from "@/utils/fonts";

interface MenuDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export function MenuDrawer({ visible, onClose }: MenuDrawerProps) {
  const [session, setSession] = useState<Session | null>(null);
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;
  const theme = useTheme();

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(-300);
      overlayOpacity.setValue(0);
      contentFadeAnim.setValue(0);

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.timing(contentFadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -300,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(contentFadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, contentFadeAnim, overlayOpacity, slideAnim]);

  async function loadSession() {
    const currentSession = await getSession();
    setSession(currentSession);
  }

  async function handleLogout() {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnexion",
        style: "destructive",
        onPress: async () => {
          await clearSession();
          router.replace("/");
        },
      },
    ]);
  }

  function handleNavigate(route: string) {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 300);
  }

  const menuItems = [
    {
      Icon: Home,
      label: "Accueil",
      route: "/(app)/(tabs)/",
      onPress: () => handleNavigate("/(app)/(tabs)/"),
    },
    {
      Icon: ClipboardList,
      label: "Main courante",
      route: "/(app)/(tabs)/main-courante",
      onPress: () => handleNavigate("/(app)/(tabs)/main-courante"),
    },
    {
      Icon: Footprints,
      label: "Ronde",
      route: "/(app)/(tabs)/geolocation",
      onPress: () => handleNavigate("/(app)/(tabs)/geolocation"),
    },
    {
      Icon: MapPin,
      label: "Géolocalisation",
      route: "/(app)/(tabs)/geolocation",
      onPress: () => handleNavigate("/(app)/(tabs)/geolocation"),
    },
    {
      Icon: FileText,
      label: "Documents",
      route: "/(app)/documents",
      onPress: () => handleNavigate("/(app)/documents"),
    },
    {
      Icon: User,
      label: "Mon profil",
      route: "/(app)/profile",
      onPress: () => handleNavigate("/(app)/profile"),
    },
    {
      Icon: AlertTriangle,
      label: "SOS",
      route: "/(app)/sos",
      onPress: () => handleNavigate("/(app)/sos"),
      isDestructive: true,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={{ flex: 1 }} onPress={onClose}>
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            opacity: overlayOpacity,
          }}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={{
                width: Math.min(300, Dimensions.get("window").width * 0.8),
                height: "100%",
                overflow: "hidden",
                transform: [{ translateX: slideAnim }],
                shadowColor: "#000",
                shadowOffset: { width: 4, height: 0 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 10,
              }}
            >
              {/* Glass-morphism background */}
              <BlurView intensity={20} tint="dark" style={{ flex: 1 }}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: `${theme.colors.background}E6`,
                  }}
                >
                  <Animated.View style={{ flex: 1, opacity: contentFadeAnim }}>
                    {/* Header */}
                    <View
                      style={{
                        paddingTop: Platform.OS === "ios" ? 60 : 40,
                        paddingBottom: 20,
                        paddingHorizontal: 20,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.borderSubtle,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 16,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <View
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              backgroundColor: "#22d3ee",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text
                              style={{
                                color: "#0f172a",
                                fontSize: 18,
                                fontWeight: "700",
                              }}
                            >
                              S
                            </Text>
                          </View>
                          <Text
                            style={{
                              fontSize: 24,
                              color: "#fff",
                              fontFamily: getHeadingFont(),
                            }}
                          >
                            Safyr
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={onClose}
                          accessibilityLabel="Fermer le menu"
                          style={{
                            backgroundColor: `${theme.colors.border}40`,
                            borderRadius: 20,
                            padding: 8,
                          }}
                        >
                          <X size={18} color={theme.colors.mutedForeground} />
                        </TouchableOpacity>
                      </View>
                      {session && (
                        <View
                          style={{
                            backgroundColor: `${theme.colors.card}80`,
                            borderRadius: 10,
                            padding: 12,
                            borderWidth: 1,
                            borderColor: theme.colors.borderSubtle,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              color: theme.colors.mutedForeground,
                              marginBottom: 2,
                              fontFamily: getBodyFont("400"),
                            }}
                          >
                            Connecté en tant que
                          </Text>
                          <Text
                            numberOfLines={1}
                            style={{
                              fontSize: 14,
                              fontWeight: "600",
                              color: theme.colors.foreground,
                              fontFamily: getBodyFont("600"),
                            }}
                          >
                            {session.fullName}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Menu Items */}
                    <ScrollView
                      style={{ flex: 1 }}
                      contentContainerStyle={{ paddingVertical: 8 }}
                      showsVerticalScrollIndicator={false}
                    >
                      {menuItems.map((item) => (
                        <TouchableOpacity
                          key={item.route}
                          onPress={item.onPress}
                          activeOpacity={0.6}
                          accessibilityRole="menuitem"
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingHorizontal: 20,
                            paddingVertical: 14,
                            marginHorizontal: 8,
                            marginVertical: 2,
                            borderRadius: 10,
                          }}
                        >
                          <View
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 10,
                              backgroundColor: item.isDestructive
                                ? `${theme.colors.destructive}15`
                                : `${theme.colors.primary}15`,
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: 14,
                            }}
                          >
                            <item.Icon
                              size={20}
                              color={
                                item.isDestructive
                                  ? theme.colors.destructive
                                  : theme.colors.primary
                              }
                            />
                          </View>
                          <Text
                            numberOfLines={1}
                            style={{
                              fontSize: 15,
                              color: theme.colors.foreground,
                              flex: 1,
                              fontFamily: getBodyFont("500"),
                            }}
                          >
                            {item.label}
                          </Text>
                          <ChevronRight
                            size={16}
                            color={theme.colors.mutedForeground}
                          />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Footer */}
                    <View
                      style={{
                        padding: 16,
                        paddingBottom: Platform.OS === "ios" ? 32 : 16,
                        borderTopWidth: 1,
                        borderTopColor: theme.colors.borderSubtle,
                      }}
                    >
                      <TouchableOpacity
                        onPress={handleLogout}
                        activeOpacity={0.8}
                        accessibilityLabel="Déconnexion"
                        accessibilityRole="button"
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 10,
                          paddingVertical: 12,
                          backgroundColor: theme.colors.destructive,
                          shadowColor: theme.colors.destructive,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.2,
                          shadowRadius: 6,
                          elevation: 4,
                        }}
                      >
                        <LogOut size={18} color="#fff" />
                        <Text
                          style={{
                            marginLeft: 8,
                            fontSize: 15,
                            color: "#fff",
                            fontFamily: getBodyFont("600"),
                          }}
                        >
                          Déconnexion
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                </View>
              </BlurView>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
