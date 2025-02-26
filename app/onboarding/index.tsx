import React, { useState } from "react";
import { View, Alert, Dimensions } from "react-native";
import { useTheme } from "@rneui/themed";
import { useDispatch, useSelector } from "react-redux";
import { Stack } from "expo-router";
import { GestureHandlerRootView, Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  runOnJS,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";
import { GenderStep } from "./steps/GenderStep";
import { WorkoutFrequencyStep } from "./steps/WorkoutFrequencyStep";
import { BirthDateStep } from "./steps/BirthDateStep";
import { HeightWeightStep } from "./steps/HeightWeightStep";
import { GoalStep } from "./steps/GoalStep";
import { TargetWeightStep } from "./steps/TargetWeightStep";
import { TimelineStep } from "./steps/TimelineStep";
import { DietStep } from "./steps/DietStep";
import { NotificationsStep } from "./steps/NotificationsStep";
import CalorieTrackingStep from "./steps/CalorieTrackingStep";
import NutritionAnalysisStep from "./steps/NutritionAnalysisStep";
import TransformationStep from "./steps/TransformationStep";
import PreviousExperienceStep from "./steps/PreviousExperienceStep";
import LongTermResultsStep from "./steps/LongTermResultsStep";
import AccomplishmentStep from "./steps/AccomplishmentStep";
import RatingStep from "./steps/RatingStep";
import CompleteStep from "./steps/CompleteStep";
import LoadingStep from "./steps/LoadingStep";
import SuccessStep from "./steps/SuccessStep";
import PaywallStep from "./steps/PaywallStep";
import SignInStep from "./steps/SignInStep";
import { setOnboardingData, selectUser } from "@/store/userSlice";

const steps = [
  "calorieTracking",
  "nutritionAnalysis",
  "transformation",
  "previousExperience",
  "longTermResults",
  "gender",
  "workoutFrequency",
  "birthDate",
  "heightWeight",
  "goal",
  "accomplishment",
  // "rating",
  "targetWeight",
  "timeline",
  "diet",
  // "notifications",
  "complete",
  "loading",
  "success",
  "signIn",
  "paywall",
];

export function OnboardingScreen() {
  const dispatch = useDispatch();
  const userData = useSelector(selectUser);
  const { theme } = useTheme();
  const { width } = Dimensions.get("window");
  const [isAnimating, setIsAnimating] = useState(false);

  // Single source of truth for current position
  const position = useSharedValue(0);
  // Derived value for the active index
  const activeIndex = useDerivedValue(() => Math.round(position.value));
  // React state for non-animation UI updates
  const [currentStep, setCurrentStep] = useState(0);
  // Slide animation for screens after the first three
  const slideAnim = useSharedValue(0);

  const pan = Gesture.Pan()
    .enabled(currentStep <= 2)
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      'worklet';
      if (currentStep > 2) return;
      
      // Calculate new position but constrain it
      const newPosition = activeIndex.value - e.translationX / width;
      position.value = Math.max(0, Math.min(2, newPosition));
    })
    .onEnd((e) => {
      'worklet';
      if (currentStep > 2) return;

      const velocity = e.velocityX / width;
      const shouldSnap = Math.abs(velocity) > 0.5 || Math.abs(e.translationX) > width / 3;
      const direction = e.velocityX > 0 ? -1 : 1;
      
      let targetPosition = activeIndex.value;
      
      if (shouldSnap) {
        targetPosition = Math.round(position.value + direction * 0.5);
      } else {
        targetPosition = Math.round(position.value);
      }

      // Constrain target position between 0 and 2
      targetPosition = Math.max(0, Math.min(2, targetPosition));

      position.value = withSpring(targetPosition, {
        velocity: -velocity,
        stiffness: 90,
        damping: 15,
        mass: 0.5,
      }, () => {
        // Update React state only after animation is complete
        runOnJS(setCurrentStep)(targetPosition);
      });
    });

  // Create animated styles for all three initial screens
  const screen0Style = useAnimatedStyle(() => ({
    position: 'absolute',
    width: '100%',
    height: '100%',
    transform: [{ translateX: (0 - position.value) * width }],
  }));

  const screen1Style = useAnimatedStyle(() => ({
    position: 'absolute',
    width: '100%',
    height: '100%',
    transform: [{ translateX: (1 - position.value) * width }],
  }));

  const screen2Style = useAnimatedStyle(() => ({
    position: 'absolute',
    width: '100%',
    height: '100%',
    transform: [{ translateX: (2 - position.value) * width }],
  }));

  // Style for screens after the first three
  const slideStyle = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ translateX: slideAnim.value }],
  }));

  const animateToNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    slideAnim.value = withTiming(-width, {
      duration: 300,
    }, () => {
      slideAnim.value = width;
      runOnJS(setCurrentStep)(currentStep + 1);
      
      slideAnim.value = withTiming(0, {
        duration: 300,
      }, () => {
        runOnJS(setIsAnimating)(false);
      });
    });
  };

  const animateToBack = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    slideAnim.value = withTiming(width, {
      duration: 300,
    }, () => {
      slideAnim.value = -width;
      runOnJS(setCurrentStep)(currentStep - 1);
      
      slideAnim.value = withTiming(0, {
        duration: 300,
      }, () => {
        runOnJS(setIsAnimating)(false);
      });
    });
  };

  const handleNext = () => {
    if (currentStep >= steps.length - 1) return;

    if (!validateStep()) {
      Alert.alert("Required", "Please select a value to continue");
      return;
    }

    // Skip to previousExperience when on CalorieTrackingStep with animation
    if (steps[currentStep] === "calorieTracking") {
      const targetIndex = steps.findIndex(step => step === "previousExperience");
      if (targetIndex !== -1) {
        if (isAnimating) return;
        setIsAnimating(true);
        
        slideAnim.value = withTiming(-width, {
          duration: 300,
        }, () => {
          slideAnim.value = width;
          runOnJS(setCurrentStep)(targetIndex);
          
          slideAnim.value = withTiming(0, {
            duration: 300,
          }, () => {
            runOnJS(setIsAnimating)(false);
          });
        });
        return;
      }
    }

    if (currentStep <= 1) {
      position.value = withSpring(currentStep + 1, {
        stiffness: 90,
        damping: 15,
        mass: 0.5,
      }, () => {
        runOnJS(setCurrentStep)(currentStep + 1);
      });
    } else {
      animateToNext();
    }
  };

  const handleBack = () => {
    if (currentStep <= 0) return;
    
    if (currentStep <= 2) {
      position.value = withSpring(currentStep - 1, {
        stiffness: 90,
        damping: 15,
        mass: 0.5,
      }, () => {
        runOnJS(setCurrentStep)(currentStep - 1);
      });
    } else {
      animateToBack();
    }
  };

  const handleUpdateForm = (key: string, value: any) => {
    if (key === "birthDate") {
      const today = new Date();
      const birthDate = new Date(value);
      const age = today.getFullYear() - birthDate.getFullYear();
      dispatch(setOnboardingData({ birth_date: value }));
      return;
    }

    if (key === "pace") {
      const roundedValue = Math.round(value * 10) / 10;
      if (roundedValue !== userData.pace) {
        dispatch(setOnboardingData({ [key]: roundedValue }));
      }
      return;
    }

    dispatch(setOnboardingData({ [key]: value }));
  };

  const renderStep = (index: number) => {
    switch (steps[index]) {
      case "calorieTracking":
        return (
          <CalorieTrackingStep 
            onNext={handleNext}
            onNavigate={handleBack}
          />
        );
      case "nutritionAnalysis":
        return (
          <NutritionAnalysisStep 
            onNext={handleNext} 
            onBack={handleBack}
            onNavigate={handleBack}
          />
        );
      case "transformation":
        return (
          <TransformationStep 
            onNext={handleNext} 
            onBack={handleBack}
            onNavigate={handleBack}
          />
        );
      case "previousExperience":
        return (
          <PreviousExperienceStep
            value={userData.has_previous_experience === undefined ? null : userData.has_previous_experience}
            onChange={(value) =>
              handleUpdateForm("has_previous_experience", value)
            }
            onBack={handleBack}
            onNext={handleNext}
          />
        );
      case "longTermResults":
        return <LongTermResultsStep onBack={handleBack} onNext={handleNext} />;
      case "gender":
        return (
          <GenderStep
            value={userData.gender || ""}
            onChange={(value) => handleUpdateForm("gender", value)}
            onBack={handleBack}
            onNext={handleNext}
          />
        );
      case "workoutFrequency":
        return (
          <WorkoutFrequencyStep
            value={userData.workout_frequency || ""}
            onChange={(value) => handleUpdateForm("workout_frequency", value)}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case "birthDate":
        return (
          <BirthDateStep
            value={userData.birth_date || new Date().toISOString()}
            onChange={(value) => handleUpdateForm("birth_date", value)}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case "heightWeight":
        return (
          <HeightWeightStep
            height={userData.height?.toString() || ""}
            weight={userData.weight?.toString() || ""}
            onHeightChange={(value) =>
              handleUpdateForm("height", parseFloat(value))
            }
            onWeightChange={(value) =>
              handleUpdateForm("weight", parseFloat(value))
            }
            onBack={handleBack}
            onNext={handleNext}
          />
        );
      case "goal":
        return (
          <GoalStep
            value={userData.goal || ""}
            onChange={(value) => handleUpdateForm("goal", value)}
            onBack={handleBack}
            onNext={handleNext}
          />
        );
      case "accomplishment":
        return (
          <AccomplishmentStep
            value={userData.accomplishment || ""}
            onChange={(value) => handleUpdateForm("accomplishment", value)}
            onBack={handleBack}
            onNext={handleNext}
          />
        );
      case "rating":
        return <RatingStep onBack={handleBack} onNext={handleNext} />;
      case "targetWeight":
        return (
          <TargetWeightStep
            value={userData.target_weight?.toString() || ""}
            onChange={(value) =>
              handleUpdateForm("target_weight", parseFloat(value))
            }
            onBack={handleBack}
            onNext={handleNext}
          />
        );
      case "timeline":
        return (
          <TimelineStep
            value={userData.pace || 0.45}
            onChange={(value) => handleUpdateForm("pace", value)}
            onBack={handleBack}
            onNext={handleNext}
          />
        );
      case "diet":
        return (
          <DietStep
            value={userData.diet || ""}
            onChange={(value) => handleUpdateForm("diet", value)}
            onBack={handleBack}
            onNext={handleNext}
          />
        );
      case "notifications":
        return (
          <NotificationsStep
            value={userData.notification_enabled}
            onChange={(value) =>
              handleUpdateForm("notification_enabled", value)
            }
            onBack={handleBack}
            onNext={handleNext}
          />
        );
      case "complete":
        return <CompleteStep onBack={handleBack} onNext={handleNext} />;
      case "loading":
        return (
          <LoadingStep 
            onComplete={() => {
                setCurrentStep(currentStep + 1);
            }}
            isActive={steps[currentStep] === "loading"}
          />
        );
      case "success":
        return <SuccessStep onBack={handleBack} onNext={handleNext} />;
      case "signIn":
        return <SignInStep onBack={handleBack} onNext={handleNext} />;
      case "paywall":
        return <PaywallStep onBack={handleBack} onNext={handleNext} />;
      default:
        return null;
    }
  };

  const validateStep = () => {
    const currentStepName = steps[currentStep];
    switch (currentStepName) {
      case "gender":
        return !!userData.gender;
      case "workoutFrequency":
        return !!userData.workout_frequency;
      case "birthDate":
        return !!userData.birth_date;
      case "heightWeight":
        return !!userData.height && !!userData.weight;
      case "goal":
        return !!userData.goal;
      case "targetWeight":
        return !!userData.target_weight;
      case "timeline":
        return !!userData.pace;
      case "diet":
        return !!userData.diet;
      case "notifications":
        return true; // Always allow proceeding from notifications
      default:
        return true;
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          animation: "none",
          gestureEnabled: false,
        }}
      />
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {currentStep <= 2 ? (
          <GestureDetector gesture={pan}>
            <View style={{ flex: 1, overflow: 'hidden' }}>
              <Animated.View style={screen0Style}>
                {renderStep(0)}
              </Animated.View>
              <Animated.View style={screen1Style}>
                {renderStep(1)}
              </Animated.View>
              <Animated.View style={screen2Style}>
                {renderStep(2)}
              </Animated.View>
            </View>
          </GestureDetector>
        ) : (
          <Animated.View style={[{ flex: 1 }, slideStyle]}>
            {renderStep(currentStep)}
          </Animated.View>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

// Add default export for the router
export default function Onboarding() {
  return <OnboardingScreen />;
}
