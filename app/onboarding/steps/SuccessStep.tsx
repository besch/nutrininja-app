import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Progress from 'react-native-progress';
import commonStyles from "../styles";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { setUserData } from "@/store/userSlice";
import NumericInputOverlay from "@/components/overlays/NumericInputOverlay";

interface MacroCircleProps {
  title: string;
  value: string;
  color: string;
  unit?: string;
  onEdit?: () => void;
  icon: string;
  progress?: number;
}

const MacroCircle = ({ title, value, color, unit, onEdit, icon, progress = 0.8 }: MacroCircleProps) => (
  <View style={styles.macroCard}>
    <View style={styles.macroTitleContainer}>
      <Text style={styles.macroTitle}>{title}</Text>
      {onEdit && (
        <TouchableOpacity
          style={styles.editButton}
          onPress={onEdit}
        >
          <Ionicons name="pencil" size={16} color="#000000" />
        </TouchableOpacity>
      )}
    </View>
    <View style={styles.macroProgress}>
      <Progress.Circle
        size={60}
        progress={progress}
        thickness={7}
        color={color}
        unfilledColor="#eee"
        borderWidth={0}
        animated
        strokeCap="round"
      />
      <View style={styles.circleIcon}>
        <Ionicons 
          name={icon as any} 
          size={20} 
          color="#FFF" 
          style={[styles.iconStyle, { backgroundColor: color }]} 
        />
      </View>
      <Text style={styles.macroValue}>
        {value}
        {unit && <Text style={styles.macroUnit}>{unit}</Text>}
      </Text>
    </View>
  </View>
);

interface GoalTipProps {
  icon: React.ReactNode;
  text: string;
}

const GoalTip = ({ icon, text }: GoalTipProps) => (
  <View style={styles.tipCard}>
    {icon}
    <Text style={styles.tipText}>{text}</Text>
  </View>
);

interface SuccessStepProps {
  onBack?: () => void;
  onNext?: () => void;
}

interface Tip {
  icon: string;
  text: string;
}

export function SuccessStep({ onBack, onNext }: SuccessStepProps) {
  const dispatch = useDispatch();
  const { workout_plan, weight, target_weight, is_metric, pace, goal } = useSelector((state: RootState) => state.user);
  const [editingMacro, setEditingMacro] = useState<{
    type: "calories" | "protein" | "carbs" | "fats";
    value: number;
  } | null>(null);

  const workoutPlan = workout_plan;
  const currentWeight = weight;
  const targetWeight = target_weight;

  if (!workoutPlan || !currentWeight || !targetWeight || !pace) {
    return null;
  }

  const handleEditMacro = (
    type: "calories" | "protein" | "carbs" | "fats",
    value: number
  ) => {
    setEditingMacro({ type, value });
  };

  const handleSaveMacro = async (value: number) => {
    if (!editingMacro || !workoutPlan) return;

    const updatedWorkoutPlan = {
      ...workoutPlan,
      daily_recommendation: {
        ...workoutPlan.daily_recommendation,
        ...(editingMacro.type === "calories" 
          ? { calories: value }
          : {
              macros: {
                ...workoutPlan.daily_recommendation.macros,
                [editingMacro.type]: {
                  ...workoutPlan.daily_recommendation.macros[editingMacro.type],
                  value: value
                }
              }
            }
        )
      }
    };

    dispatch(setUserData({
      workout_plan: updatedWorkoutPlan,
      ...(editingMacro.type === "calories" 
        ? { daily_calorie_goal: value }
        : editingMacro.type === "protein"
        ? { protein_goal: value }
        : editingMacro.type === "carbs"
        ? { carbs_goal: value }
        : { fats_goal: value }
      )
    }));

    setEditingMacro(null);
  };

  const weightDifference = Math.abs(currentWeight - targetWeight);
  const action = currentWeight > targetWeight ? 'lose' : 'gain';
  const displayWeight = is_metric ? weightDifference.toFixed(1) : (weightDifference * 2.20462).toFixed(1);
  const unitText = is_metric ? 'kg' : 'lbs';

  // Calculate number of weeks needed and target date
  const weeksNeeded = weightDifference / pace;
  const computedTargetDate = new Date();
  computedTargetDate.setDate(computedTargetDate.getDate() + Math.ceil(weeksNeeded * 7));
  const formattedDate = computedTargetDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

  const { daily_recommendation, health_score, tips } = workoutPlan;

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={onBack} style={commonStyles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={commonStyles.progressBar}>
          <View style={[commonStyles.progressFill, { width: "100%" }]} />
        </View>
      </View>

      <ScrollView
        style={commonStyles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={styles.checkmarkContainer}>
          <View style={styles.checkmarkCircle}>
            <Ionicons name="checkmark" size={24} color="#FFFFFF" />
          </View>
        </View>

        <Text
          style={[
            commonStyles.title,
            { textAlign: "center", marginBottom: 32 },
          ]}
        >
          Congratulations{"\n"}your custom plan is ready!
        </Text>

        <Text style={styles.targetWeight}>
          {goal === "maintain" ? "Maintain" : `You should ${action} ${displayWeight} ${unitText} by ${formattedDate}`}
        </Text>

        <View style={styles.recommendationCard}>
          <View style={styles.recommendationHeader}>
            <Text style={styles.recommendationTitle}>Daily Recommendation</Text>
            <Text style={styles.recommendationSubtitle}>
              You can edit this any time
            </Text>
          </View>

          <View style={styles.macrosGrid}>
            <MacroCircle 
              title="Calories" 
              value={daily_recommendation.calories.toString()} 
              color="#000000"
              onEdit={() => handleEditMacro("calories", daily_recommendation.calories)}
              icon="flash-outline"
              progress={0.75}
            />
            <MacroCircle 
              title="Carbs" 
              value={daily_recommendation.macros.carbs.value.toString()} 
              unit={daily_recommendation.macros.carbs.unit} 
              color="#FFA726"
              onEdit={() => handleEditMacro("carbs", daily_recommendation.macros.carbs.value)}
              icon="leaf-outline"
              progress={0.6}
            />
            <MacroCircle 
              title="Protein" 
              value={daily_recommendation.macros.protein.value.toString()} 
              unit={daily_recommendation.macros.protein.unit} 
              color="#EF5350"
              onEdit={() => handleEditMacro("protein", daily_recommendation.macros.protein.value)}
              icon="flash-outline"
              progress={0.8}
            />
            <MacroCircle 
              title="Fats" 
              value={daily_recommendation.macros.fats.value.toString()} 
              unit={daily_recommendation.macros.fats.unit} 
              color="#42A5F5"
              onEdit={() => handleEditMacro("fats", daily_recommendation.macros.fats.value)}
              icon="water-outline"
              progress={0.4}
            />
          </View>

          <View style={styles.healthScore}>
            <View style={styles.scoreHeader}>
              <Ionicons name="heart" size={20} color="#EF5350" />
              <Text style={styles.scoreTitle}>Health score</Text>
            </View>
            <View style={styles.scoreContainer}>
              <View 
                style={[
                  styles.scoreBar, 
                  { width: `${(health_score.score / health_score.max_score) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.scoreValue}>{health_score.score}/{health_score.max_score}</Text>
          </View>
        </View>

        <Text style={styles.goalsTitle}>How to reach your goals:</Text>

        <View style={styles.tipsContainer}>
          {tips.map((tip: Tip, index: number) => (
            <GoalTip
              key={index}
              icon={
                tip.icon === "heart" ? (
                  <Ionicons name="heart" size={24} color="#EF5350" />
                ) : tip.icon === "food-apple" ? (
                  <MaterialCommunityIcons name="food-apple" size={24} color="#4CAF50" />
                ) : tip.icon === "fire" ? (
                  <MaterialCommunityIcons name="fire" size={24} color="#FF9800" />
                ) : (
                  <View style={styles.macroIcons}>
                    <View style={[styles.macroIcon, { backgroundColor: "#FFA726" }]} />
                    <View style={[styles.macroIcon, { backgroundColor: "#EF5350" }]} />
                    <View style={[styles.macroIcon, { backgroundColor: "#42A5F5" }]} />
                  </View>
                )
              }
              text={tip.text}
            />
          ))}
        </View>

        <Text style={styles.sourcesTitle}>Plan based on the following sources, among other peer-reviewed medical studies:</Text>
        <View style={styles.sourcesContainer}>
          <TouchableOpacity onPress={() => Linking.openURL('https://www.healthline.com/health/what-is-basal-metabolic-rate')}>
            <Text style={styles.sourceLink}>• Basal metabolic rate</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://www.health.harvard.edu/staying-healthy/calorie-counting-made-easy')}>
            <Text style={styles.sourceLink}>• Calorie counting - Harvard</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://pubmed.ncbi.nlm.nih.gov/28630601/')}>
            <Text style={styles.sourceLink}>• International Society of Sports Nutrition</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://www.nhlbi.nih.gov/files/docs/guidelines/ob_gdlns.pdf')}>
            <Text style={styles.sourceLink}>• National Institutes of Health</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[commonStyles.button, { marginVertical: 16 }]}
          onPress={onNext}
        >
          <Text style={commonStyles.buttonText}>Let's get started!</Text>
        </TouchableOpacity>
      </View>

      <NumericInputOverlay
        isVisible={!!editingMacro}
        onClose={() => setEditingMacro(null)}
        onSave={handleSaveMacro}
        title={editingMacro ? `Edit ${editingMacro.type}` : ""}
        initialValue={editingMacro?.value || 0}
        unit={editingMacro?.type === "calories" ? "kcal" : "g"}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  checkmarkContainer: {
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 20,
  },
  checkmarkCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  targetWeight: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
    marginBottom: 12,
  },
  weightBadge: {
    alignSelf: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 32,
  },
  weightText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  recommendationCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  recommendationHeader: {
    marginBottom: 24,
  },
  recommendationTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  recommendationSubtitle: {
    fontSize: 14,
    color: "#666666",
  },
  macrosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 24,
  },
  macroCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    paddingBottom: 40,
  },
  macroTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  macroTitle: {
    fontSize: 16,
    color: "#666666",
  },
  macroProgress: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    position: 'relative',
  },
  circleIcon: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  iconStyle: {
    padding: 2,
    borderRadius: 12,
  },
  macroValue: {
    position: 'absolute',
    bottom: -30,
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    textAlign: 'center',
  },
  macroUnit: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 2,
  },
  editButton: {
    width: 28,
    height: 28,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#000000",
  },
  healthScore: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },
  scoreHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  scoreContainer: {
    height: 4,
    backgroundColor: "#F0F0F0",
    borderRadius: 2,
    marginBottom: 8,
  },
  scoreBar: {
    height: "100%",
    backgroundColor: "#EF5350",
    borderRadius: 2,
  },
  scoreValue: {
    fontSize: 14,
    color: "#666666",
  },
  goalsTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
  },
  tipsContainer: {
    gap: 12,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 16,
    color: "#000000",
  },
  macroIcons: {
    flexDirection: "row",
    gap: 4,
  },
  macroIcon: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sourcesTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
    marginTop: 32,
    marginBottom: 16,
  },
  sourcesContainer: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  sourceLink: {
    fontSize: 14,
    color: "#2089DC",
    textDecorationLine: "underline",
  },
  buttonContainer: {
    alignItems: "center",
    padding: 20,
  },
});

export default SuccessStep;
