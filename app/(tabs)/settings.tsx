import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Linking } from "react-native";
import { Text } from "@rneui/themed";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { api } from "@/utils/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import BaseOverlay from "@/components/overlays/BaseOverlay";
import { selectUser, selectIsMetric, selectIsLoading, fetchUserData } from "@/store/userSlice";
import { signOut } from "@/utils/auth";
import { AppDispatch } from "@/store";
import { trackAccountDeleted } from '@/utils/appsFlyerEvents';

export default function SettingsScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isMetric = useSelector(selectIsMetric);
  const user = useSelector(selectUser);
  const isLoading = useSelector(selectIsLoading);

  useEffect(() => {
    dispatch(fetchUserData());
  }, [dispatch]);

  const deleteAccountMutation = async () => {
    try {
      await api.user.deleteAccount();
      trackAccountDeleted();
      await signOut();
    } catch (error) {
      await signOut();
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccountMutation();
    } catch (error) {
      // Alert.alert("Error", "Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const displayWeight = (kg: number) => {
    if (!kg) return '-';
    return isMetric ? `${Math.round(kg)} kg` : `${Math.round(kg * 2.20462)} lbs`;
  };

  const displayHeight = (cm: number) => {
    if (!cm) return '-';
    if (isMetric) return `${Math.round(cm)} cm`;
    const inches = cm / 2.54;
    const feet = Math.floor(inches / 12);
    const remainingInches = Math.round(inches % 12);
    return `${feet}'${remainingInches}"`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text h3 style={styles.title}>
        Settings
      </Text>

      {/* Account Section */}
      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.menuItem}>
        <View>
          <Text style={styles.menuItemText}>{user?.email}</Text>
          <Text style={styles.menuItemSubtext}>
            Signed in
          </Text>
        </View>
        <Ionicons name="checkmark-circle" size={24} color="#34C759" />
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <View style={styles.statRow}>
          <Text style={styles.label}>Age</Text>
          <Text style={styles.value}>{user?.birth_date ? calculateAge(user.birth_date) : '-'}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.label}>Height</Text>
          <Text style={styles.value}>{user?.height ? displayHeight(user.height) : '-'}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.label}>Current weight</Text>
          <Text style={styles.value}>{user?.weight ? displayWeight(user.weight) : '-'}</Text>
        </View>
      </View>

      {/* Customization Section */}
      <Text style={styles.sectionTitle}>Customization</Text>
      <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/main/personal-details")}>
        <Text style={styles.menuItemText}>Personal details</Text>
        <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/main/adjust-goals")}>
        <View>
          <Text style={styles.menuItemText}>Adjust goals</Text>
          <Text style={styles.menuItemSubtext}>
            Calories, carbs, fats, and protein
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
      </TouchableOpacity>

      {/* Legal Section */}
      <Text style={styles.sectionTitle}>Legal</Text>
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}
      >
        <Text style={styles.menuItemText}>Terms and Conditions</Text>
        <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => Linking.openURL('https://nutrininja.app/privacy')}
      >
        <Text style={styles.menuItemText}>Privacy Policy</Text>
        <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
      </TouchableOpacity>

      {/* Delete Account Option */}
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => setShowDeleteConfirm(true)}
      >
        <Text style={styles.menuItemText}>Delete Account</Text>
        <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
      </TouchableOpacity>

      <Text style={styles.version}>VERSION 1.0.0</Text>

      <BaseOverlay
        isVisible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Account"
        onSave={handleDeleteAccount}
        isLoading={isDeleting}
      >
        <Text style={styles.deleteConfirmText}>
          Are you sure you want to delete your account? This action cannot be undone.
        </Text>
      </BaseOverlay>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  statsSection: {
    marginBottom: 40,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 17,
    color: "#000",
  },
  value: {
    fontSize: 17,
    color: "#000",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  menuItemText: {
    fontSize: 17,
    color: "#000",
  },
  menuItemSubtext: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 4,
  },
  version: {
    fontSize: 13,
    color: "#8E8E93",
    paddingHorizontal: 16,
    marginTop: 40,
    marginBottom: 20,
  },
  authModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteAccount: {
    marginTop: 20,
  },
  deleteAccountText: {
    color: '#FF3B30',
    fontSize: 17,
  },
  deleteConfirmText: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: '#000',
  },
  unitToggle: {
    flexDirection: "row",
    alignItems: "center",
  },
  unitText: {
    fontSize: 14,
    color: "#666",
  },
  unitTextActive: {
    color: "#000",
    fontWeight: "500",
  },
});
