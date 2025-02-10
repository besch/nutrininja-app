import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Switch } from "react-native";
import { Text } from "@rneui/themed";
import { Button } from "@/components/ui/Button";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import NumericInputOverlay from "@/components/overlays/NumericInputOverlay";
import GenderSelectOverlay from "@/components/overlays/GenderSelectOverlay";
import DatePickerOverlay from "@/components/overlays/DatePickerOverlay";
import { setUserData, selectUser, selectIsMetric, selectIsLoading, setUnitPreference, fetchUserData } from "@/store/userSlice";
import { api } from "@/utils/api";
import { AppDispatch } from "@/store";
import { useMutation } from '@tanstack/react-query';
import { trackPersonalGoalSet } from '@/utils/appsFlyerEvents';

type EditField =
  | "goal_weight"
  | "current_weight"
  | "height"
  | "birth_date"
  | "gender"
  | null;

export default function PersonalDetailsScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [editField, setEditField] = useState<EditField>(null);
  const isMetric = useSelector(selectIsMetric);
  const user = useSelector(selectUser);
  const isLoading = useSelector(selectIsLoading);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    dispatch(fetchUserData());
  }, [dispatch]);

  // State for all editable fields
  const [goalWeight, setGoalWeight] = useState<number | null>(user?.target_weight ?? null);
  const [currentWeight, setCurrentWeight] = useState<number | null>(user?.weight ?? null);
  const [height, setHeight] = useState<number | null>(user?.height ?? null);
  const [birthDate, setBirthDate] = useState(user?.birth_date || new Date().toISOString());
  const [gender, setGender] = useState<"male" | "female" | "other">(
    (user?.gender as "male" | "female" | "other") || "other"
  );

  // Update local state when user data changes
  React.useEffect(() => {
    if (user) {
      setGoalWeight(user.target_weight ?? null);
      setCurrentWeight(user.weight ?? null);
      setHeight(user.height ?? null);
      setBirthDate(user.birth_date || new Date().toISOString());
      setGender((user.gender as "male" | "female" | "other") || "other");
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (updates: any) => api.user.updateProfile({
      user_id: user?.id,
      ...updates
    }),
    onSuccess: (updatedData) => {
      dispatch(setUserData(updatedData));
      // Track goal updates
      trackPersonalGoalSet(updatedData);
    },
  });

  const handleUnitChange = async (value: boolean) => {
    try {
      await dispatch(setUnitPreference(value)).unwrap();
    } catch (error) {
      console.error('Error updating unit preference:', error);
    }
  };

  const displayWeight = (kg: number | null) => {
    if (!kg) return '-';
    return isMetric ? `${kg} kg` : `${Math.round(kg * 2.20462)} lbs`;
  };

  const displayHeight = (cm: number | null) => {
    if (!cm) return '-';
    if (isMetric) return `${cm} cm`;
    const inches = cm / 2.54;
    const feet = Math.floor(inches / 12);
    const remainingInches = Math.round(inches % 12);
    return `${feet}'${remainingInches}"`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const formatValue = (value: number | null, unit: string) => {
    return value !== null ? `${Math.round(value)} ${unit}` : '-';
  };

  const handleGoalWeightChange = async (value: number) => {
    setIsUpdating(true);
    try {
      setGoalWeight(value);
      await updateProfileMutation.mutateAsync({ target_weight: value });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCurrentWeightChange = async (value: number) => {
    setIsUpdating(true);
    try {
      setCurrentWeight(value);
      await updateProfileMutation.mutateAsync({ weight: value });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleHeightChange = async (value: number) => {
    setIsUpdating(true);
    try {
      setHeight(value);
      await updateProfileMutation.mutateAsync({ height: value });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBirthDateChange = async (value: string) => {
    setIsUpdating(true);
    try {
      setBirthDate(value);
      await updateProfileMutation.mutateAsync({ birth_date: value });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGenderChange = async (value: "male" | "female" | "other") => {
    setIsUpdating(true);
    try {
      setGender(value);
      await updateProfileMutation.mutateAsync({ gender: value });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading || isUpdating) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Goal Weight Card */}
        <View style={styles.goalCard}>
          <View>
            <Text style={styles.label}>Goal Weight</Text>
            <Text style={styles.weightValue}>{displayWeight(goalWeight)}</Text>
          </View>
          <Button
            onPress={() => setEditField("goal_weight")}
            title="Change Goal"
            variant="primary"
            style={styles.changeGoalButton}
            textStyle={styles.changeGoalButtonText}
          />
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <TouchableOpacity
            style={styles.detailRow}
            onPress={() => setEditField("current_weight")}
          >
            <Text style={styles.detailLabel}>Current weight</Text>
            <View style={styles.detailValueContainer}>
              <Text style={styles.detailValue}>{displayWeight(currentWeight)}</Text>
              <Ionicons
                name="pencil"
                size={20}
                color="#8E8E93"
                style={styles.editIcon}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.detailRow}
            onPress={() => setEditField("height")}
          >
            <Text style={styles.detailLabel}>Height</Text>
            <View style={styles.detailValueContainer}>
              <Text style={styles.detailValue}>{displayHeight(height)}</Text>
              <Ionicons
                name="pencil"
                size={20}
                color="#8E8E93"
                style={styles.editIcon}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.detailRow}
            onPress={() => setEditField("birth_date")}
          >
            <Text style={styles.detailLabel}>Date of birth</Text>
            <View style={styles.detailValueContainer}>
              <Text style={styles.detailValue}>{formatDate(birthDate)}</Text>
              <Ionicons
                name="pencil"
                size={20}
                color="#8E8E93"
                style={styles.editIcon}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.detailRow}
            onPress={() => setEditField("gender")}
          >
            <Text style={styles.detailLabel}>Gender</Text>
            <View style={styles.detailValueContainer}>
              <Text style={styles.detailValue}>
                {gender.charAt(0).toUpperCase() + gender.slice(1)}
              </Text>
              <Ionicons
                name="pencil"
                size={20}
                color="#8E8E93"
                style={styles.editIcon}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.separator} />

          {/* Unit System Switch */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Unit System</Text>
          </View>
          <View style={styles.unitToggleContainer}>
            <View style={styles.unitToggle}>
              <Text style={[styles.unitText, !isMetric && styles.unitTextActive]}>Imperial (lb)</Text>
              <Switch
                value={isMetric}
                onValueChange={handleUnitChange}
                style={{ marginHorizontal: 10 }}
                trackColor={{ false: "#D3D3D3", true: "#000000" }}
                thumbColor="#FFFFFF"
              />
              <Text style={[styles.unitText, isMetric && styles.unitTextActive]}>Metric (kg)</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Overlays */}
      <NumericInputOverlay
        isVisible={editField === "goal_weight"}
        onClose={() => setEditField(null)}
        onSave={handleGoalWeightChange}
        title="Change Goal Weight"
        initialValue={goalWeight ? (isMetric ? goalWeight : Math.round(goalWeight * 2.20462)) : 0}
        unit={isMetric ? "kg" : "lb"}
      />

      <NumericInputOverlay
        isVisible={editField === "current_weight"}
        onClose={() => setEditField(null)}
        onSave={(value) => handleCurrentWeightChange(isMetric ? value : value / 2.20462)}
        title="Update Current Weight"
        initialValue={currentWeight ? (isMetric ? currentWeight : Math.round(currentWeight * 2.20462)) : 0}
        unit={isMetric ? "kg" : "lb"}
      />

      <NumericInputOverlay
        isVisible={editField === "height"}
        onClose={() => setEditField(null)}
        onSave={(value) => handleHeightChange(isMetric ? value : value * 2.54)}
        title="Update Height"
        initialValue={height ? (isMetric ? height : Math.round(height / 2.54)) : 0}
        unit={isMetric ? "cm" : "in"}
      />

      <DatePickerOverlay
        isVisible={editField === "birth_date"}
        onClose={() => setEditField(null)}
        onSave={handleBirthDateChange}
        initialValue={birthDate}
      />

      <GenderSelectOverlay
        isVisible={editField === "gender"}
        onClose={() => setEditField(null)}
        onSave={handleGenderChange}
        initialValue={gender}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  goalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    color: "#000",
    marginBottom: 4,
  },
  weightValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  changeGoalButton: {
    backgroundColor: "#000",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  changeGoalButtonText: {
    fontSize: 14,
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  detailLabel: {
    fontSize: 16,
    color: "#000",
  },
  detailValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailValue: {
    fontSize: 16,
    color: "#000",
    marginRight: 8,
  },
  editIcon: {
    marginLeft: 4,
  },
  separator: {
    height: 1,
    backgroundColor: "#E5E5E5",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailSubtext: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 4,
  },
  unitToggleContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: "center",
  },
  unitToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  unitText: {
    fontSize: 14,
    color: "#666",
    minWidth: 85,
    textAlign: "center",
  },
  unitTextActive: {
    color: "#000",
    fontWeight: "500",
  },
});
