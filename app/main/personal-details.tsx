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
import PaceAdjustmentOverlay from "@/components/overlays/PaceAdjustmentOverlay";
import { setUserData, selectUser, selectIsMetric, selectIsLoading, setUnitPreference, fetchUserData } from "@/store/userSlice";
import { api } from "@/utils/api";
import { AppDispatch } from "@/store";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trackPersonalGoalSet } from '@/utils/appsFlyerEvents';
import moment from 'moment';

type EditField =
  | "goal_weight"
  | "current_weight"
  | "height"
  | "birth_date"
  | "gender"
  | "pace"
  | null;

export default function PersonalDetailsScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [editField, setEditField] = useState<EditField>(null);
  const isMetric = useSelector(selectIsMetric);
  const user = useSelector(selectUser);
  const isLoading = useSelector(selectIsLoading);
  const queryClient = useQueryClient();

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
  const [pace, setPace] = useState<number | null>(user?.pace ?? null);

  // Update local state when user data changes
  React.useEffect(() => {
    if (user) {
      setGoalWeight(user.target_weight ?? null);
      setCurrentWeight(user.weight ?? null);
      setHeight(user.height ?? null);
      setBirthDate(user.birth_date || new Date().toISOString());
      setGender((user.gender as "male" | "female" | "other") || "other");
      setPace(user.pace ?? null);
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      // First update the profile
      const updatedData = await api.user.updateProfile({
        user_id: user?.id,
        ...updates
      });

      // Check if we need to regenerate the workout plan
      const shouldRegeneratePlan = [
        'weight',
        'target_weight',
        'height',
        'birth_date',
        'gender',
        'pace'
      ].some(field => field in updates);

      if (shouldRegeneratePlan) {
        // Get latest user data after update
        const userData = {
          birth_date: updatedData.birth_date,
          gender: updatedData.gender,
          height: updatedData.height,
          weight: updatedData.weight,
          target_weight: updatedData.target_weight,
          goal: updatedData.goal,
          workout_frequency: updatedData.workout_frequency,
          diet: updatedData.diet,
          pace: updatedData.pace,
        };

        // Generate new workout plan
        const workoutPlan = await api.workout.generatePlan(userData);
        
        // Update user data with new workout plan and goals
        const finalData = await api.user.updateProfile({
          user_id: user?.id,
          workout_plan: workoutPlan,
          daily_calorie_goal: workoutPlan.daily_recommendation.calories,
          protein_goal: workoutPlan.daily_recommendation.macros.protein.value,
          carbs_goal: workoutPlan.daily_recommendation.macros.carbs.value,
          fats_goal: workoutPlan.daily_recommendation.macros.fats.value,
        });

        return finalData;
      }

      return updatedData;
    },
    onSuccess: (updatedData) => {
      dispatch(setUserData(updatedData));
      // Track goal updates
      trackPersonalGoalSet(updatedData);
      
      // Invalidate and refetch queries to ensure all screens are updated
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['weight-history'] });
      queryClient.invalidateQueries({ queryKey: ['daily-progress'] });
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
    try {
      const weightInKg = isMetric ? value : value / 2.20462;
      
      // Update profile with the new goal weight
      await updateProfileMutation.mutateAsync({ target_weight: weightInKg });
      
      // Invalidate and refetch queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user-profile'] }),
        queryClient.invalidateQueries({ queryKey: ['weight-history'] })
      ]);
      
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['user-profile'] }),
        queryClient.refetchQueries({ queryKey: ['weight-history'] })
      ]);

      setGoalWeight(weightInKg);
      setEditField(null);
    } catch (error) {
      console.error('Error updating goal weight:', error);
    }
  };

  const handleCurrentWeightChange = async (value: number) => {
    try {
      const weightInKg = isMetric ? value : value / 2.20462;
      
      // First create a weight check-in
      await api.weight.checkIn(Number(weightInKg.toFixed(1)), moment().format('YYYY-MM-DD'));
      
      // Then update the profile
      await updateProfileMutation.mutateAsync({ weight: weightInKg });
      
      // Invalidate and refetch relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user-profile'] }),
        queryClient.invalidateQueries({ queryKey: ['weight-history'] })
      ]);
      
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['user-profile'] }),
        queryClient.refetchQueries({ queryKey: ['weight-history'] })
      ]);

      setEditField(null);
    } catch (error) {
      console.error('Error updating current weight:', error);
    }
  };

  const handleHeightChange = async (value: number) => {
    try {
      const heightValue = isMetric ? value : value * 2.54;
      await updateProfileMutation.mutateAsync({ height: heightValue });
      setHeight(heightValue);
      setEditField(null);
    } catch (error) {
      console.error('Error updating height:', error);
    }
  };

  const handleBirthDateChange = async (value: string) => {
    try {
      await updateProfileMutation.mutateAsync({ birth_date: value });
      setBirthDate(value);
      setEditField(null);
    } catch (error) {
      console.error('Error updating birth date:', error);
    }
  };

  const handleGenderChange = async (value: "male" | "female" | "other") => {
    try {
      await updateProfileMutation.mutateAsync({ gender: value });
      setGender(value);
      setEditField(null);
    } catch (error) {
      console.error('Error updating gender:', error);
    }
  };

  const handlePaceChange = async (value: number) => {
    try {
      await updateProfileMutation.mutateAsync({ pace: value });
      setPace(value);
      setEditField(null);
    } catch (error) {
      console.error('Error updating pace:', error);
    }
  };

  if (isLoading) {
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Details</Text>
      </View>
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

          <TouchableOpacity
            style={styles.detailRow}
            onPress={() => setEditField("pace")}
          >
            <Text style={styles.detailLabel}>Weight change pace</Text>
            <View style={styles.detailValueContainer}>
              <Text style={styles.detailValue}>
                {pace ? `${isMetric ? pace.toFixed(1) : (pace * 2.20462).toFixed(1)} ${isMetric ? 'kg' : 'lbs'}/week` : '-'}
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

      <PaceAdjustmentOverlay
        isVisible={editField === "pace"}
        onClose={() => setEditField(null)}
        onSave={handlePaceChange}
        initialValue={pace || 0.09}
        goal={user?.goal || "maintain"}
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
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
