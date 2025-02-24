import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { Text } from '@rneui/themed';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ACTIVITY_CATEGORIES, ActivityType, calculateCaloriesBurned } from '@/types';
import { api } from '@/utils/api';
import { useUser, selectIsMetric } from '@/store/userSlice';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserData } from '@/store/userSlice';
import { AppDispatch } from '@/store';
import ActivityIcon from '@/components/ActivityIcon';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import { Slider } from "react-native-awesome-slider";
import { useSharedValue } from "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function ActivityDetailsScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const { activityId, selectedDate } = useLocalSearchParams<{ activityId: string; selectedDate: string }>();
  const [duration, setDuration] = useState('15');
  const [calories, setCalories] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<null | { 
    activityType: string;
    durationMinutes: number;
    intensity: string;
    caloriesBurned: number;
  }>(null);
  const user = useUser();
  const isMetric = useSelector(selectIsMetric);
  
  // Intensity slider values
  const [intensity, setIntensity] = useState('medium');
  const progress = useSharedValue(1); // Default to medium (middle position)
  const min = useSharedValue(0);
  const max = useSharedValue(2);
  
  // Duration options
  const durationOptions = [
    { value: '15', label: '15 mins' },
    { value: '30', label: '30 mins' },
    { value: '60', label: '60 mins' },
    { value: '90', label: '90 mins' },
  ];

  // Fetch user data when component mounts
  useEffect(() => {
    dispatch(fetchUserData());
  }, [dispatch]);

  const activity = activityId === 'custom' 
    ? { 
        id: 'custom', 
        name: 'Describe Exercise', 
        icon: 'fitness', 
        met: 5 // Default MET value
      } as ActivityType 
    : ACTIVITY_CATEGORIES.reduce((found: ActivityType | null, category) => {
        if (found) return found;
        return category.activities.find(a => a.id === activityId) || null;
      }, null);

  const calculateAndSetCalories = (durationValue: number, intensityLevel: string) => {
    if (activity && user?.weight) {
      // Apply intensity multiplier
      const intensityMultiplier = 
        intensityLevel === 'low' ? 0.7 : 
        intensityLevel === 'high' ? 1.3 : 
        1.0; // medium
      
      const calculated = calculateCaloriesBurned(
        user.weight, 
        durationValue, 
        activity.met * intensityMultiplier
      );
      
      setCalories(Math.round(calculated).toString());
    }
  };

  const handleDurationChange = (value: string) => {
    setDuration(value);
    calculateAndSetCalories(Number(value) || 0, intensity);
  };

  const handleIntensityChange = (value: number) => {
    // Snap to exact values: 0, 1, or 2
    let snappedValue = Math.round(value);
    
    // Ensure it's one of our three values
    if (snappedValue < 0) snappedValue = 0;
    if (snappedValue > 2) snappedValue = 2;
    
    // Set the intensity based on the snapped value
    const intensityLevel = snappedValue === 0 ? 'low' : snappedValue === 1 ? 'medium' : 'high';
    
    // Update the progress value to the snapped value for visual feedback
    progress.value = snappedValue;
    
    setIntensity(intensityLevel);
    calculateAndSetCalories(Number(duration), intensityLevel);
  };

  const analyzeDescription = async () => {
    if (!description.trim() || !user?.weight) return;
    
    setIsAnalyzing(true);
    try {
      const result = await api.activities.analyzeActivityDescription(description);
      
      if (result) {
        setAiResult(result);
        
        // Update form with AI results
        if (result.durationMinutes) {
          setDuration(result.durationMinutes.toString());
        }
        
        if (result.intensity) {
          const intensityValue = 
            result.intensity === 'low' ? 0 : 
            result.intensity === 'high' ? 2 : 1;
          
          progress.value = intensityValue;
          setIntensity(result.intensity);
        }
        
        if (result.caloriesBurned) {
          setCalories(Math.round(result.caloriesBurned).toString());
        }
      }
    } catch (error) {
      console.error('Failed to analyze activity description:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!activity || !user) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsLoading(true);
    try {
      await api.activities.logActivity({
        activity_type: activityId === 'custom' && aiResult?.activityType ? aiResult.activityType : activity.id,
        calories_burned: Number(calories),
        duration_minutes: Number(duration),
        activity_date: selectedDate,
        intensity: intensity,
      });

      // Invalidate relevant queries to refresh the data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['progress'] }),
        queryClient.invalidateQueries({ queryKey: ['meals-summary'] })
      ]);

      // Navigate to home screen
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to log activity:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate initial calories whenever user data or activity changes
  useEffect(() => {
    if (user?.weight && activity) {
      calculateAndSetCalories(Number(duration), intensity);
    }
  }, [user?.weight, activity]);

  if (!activity) {
    return (
      <View style={styles.container}>
        <Text>Activity not found</Text>
      </View>
    );
  }

  const isValid = Number(duration) > 0 && Number(calories) > 0;

  // Get intensity description based on activity type and user's unit preference
  const getIntensityDescription = (intensityLevel: string) => {
    if (activity.id === 'running' || activity.id.includes('run')) {
      return intensityLevel === 'high' 
        ? `Sprinting - ${isMetric ? '22 km/h' : '14 mph'} (4 minute ${isMetric ? 'km' : 'miles'})` 
        : intensityLevel === 'medium' 
        ? `Jogging - ${isMetric ? '10 km/h' : '6 mph'} (10 minute ${isMetric ? 'km' : 'miles'})` 
        : `Chill walk - ${isMetric ? '5 km/h' : '3 mph'} (20 minute ${isMetric ? 'km' : 'miles'})`;
    } else if (activity.id.includes('weight') || activity.id.includes('gym')) {
      return intensityLevel === 'high' 
        ? 'Heavy weights, low reps' 
        : intensityLevel === 'medium' 
        ? 'Moderate weights, medium reps' 
        : 'Light weights, high reps';
    } else {
      return intensityLevel === 'high' 
        ? 'High intensity' 
        : intensityLevel === 'medium' 
        ? 'Medium intensity' 
        : 'Low intensity';
    }
  };

  // Render custom activity description input for 'custom' activity type
  if (activityId === 'custom') {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        
        <Text style={styles.title}>Describe Exercise</Text>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.descriptionContainer}>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Describe workout time, intensity, etc."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              autoFocus
            />
            
            <TouchableOpacity 
              style={[
                styles.aiButton, 
                !description.trim() && styles.aiButtonDisabled
              ]}
              onPress={analyzeDescription}
              disabled={!description.trim() || isAnalyzing}
            >
              {isAnalyzing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather name="star" size={18} color="#fff" style={styles.aiButtonIcon} />
                  <Text style={styles.aiButtonText}>Created by AI</Text>
                </>
              )}
            </TouchableOpacity>
            
            {aiResult && (
              <View style={styles.aiResultContainer}>
                <Text style={styles.aiResultTitle}>AI Analysis</Text>
                <Text style={styles.aiResultText}>
                  Activity: {aiResult.activityType}
                </Text>
                <Text style={styles.aiResultText}>
                  Duration: {aiResult.durationMinutes} minutes
                </Text>
                <Text style={styles.aiResultText}>
                  Intensity: {aiResult.intensity}
                </Text>
                <Text style={styles.aiResultText}>
                  Calories: {Math.round(aiResult.caloriesBurned)} kcal
                </Text>
              </View>
            )}
            
            <View style={styles.exampleContainer}>
              <Text style={styles.exampleTitle}>Example:</Text>
              <Text style={styles.exampleText}>
                Hiked a steep trail for 1 hour, lungs and legs burned
              </Text>
            </View>
          </View>
        </ScrollView>
        
        <TouchableOpacity
          style={[styles.addButton, (!isValid || !description.trim()) && styles.addButtonDisabled]}
          onPress={handleSave}
          disabled={!isValid || !description.trim() || isLoading}
        >
          <Text style={styles.addButtonText}>
            {isLoading ? 'Saving...' : 'Add Exercise'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Regular activity details screen
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Feather name="arrow-left" size={24} color="black" />
      </TouchableOpacity>
      
      <View style={styles.header}>
        <ActivityIcon name={activity.icon} size={24} color="#000" />
        <Text style={styles.title}>{activity.name}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="sun" size={24} color="#000" />
            <Text style={styles.sectionTitle}>Set intensity</Text>
          </View>
          
          <View style={styles.intensityContainer}>
            <View style={styles.sliderContainer}>
              <View style={styles.intensityLabelsContainer}>
                <View style={styles.intensityLabelContainer}>
                  <Text style={[styles.intensityLabel, intensity === 'high' ? styles.activeIntensity : {}]}>
                    High
                  </Text>
                  <Text style={[styles.intensityDescription, intensity === 'high' ? styles.activeDescription : {}]}>
                    {getIntensityDescription('high')}
                  </Text>
                </View>
                
                <View style={styles.intensityLabelContainer}>
                  <Text style={[styles.intensityLabel, intensity === 'medium' ? styles.activeIntensity : {}]}>
                    Medium
                  </Text>
                  <Text style={[styles.intensityDescription, intensity === 'medium' ? styles.activeDescription : {}]}>
                    {getIntensityDescription('medium')}
                  </Text>
                </View>
                
                <View style={styles.intensityLabelContainer}>
                  <Text style={[styles.intensityLabel, intensity === 'low' ? styles.activeIntensity : {}]}>
                    Low
                  </Text>
                  <Text style={[styles.intensityDescription, intensity === 'low' ? styles.activeDescription : {}]}>
                    {getIntensityDescription('low')}
                  </Text>
                </View>
              </View>
              
              <GestureHandlerRootView style={styles.sliderWrapper}>
                <Slider
                  progress={progress}
                  minimumValue={min}
                  maximumValue={max}
                  onValueChange={handleIntensityChange}
                  renderBubble={() => null}
                  renderThumb={() => (
                    <View style={styles.customThumb} />
                  )}
                  theme={{
                    minimumTrackTintColor: "#000000",
                    maximumTrackTintColor: "#EEEEEE",
                    bubbleBackgroundColor: "#FFFFFF",
                    bubbleTextColor: "#000000"
                  }}
                  style={styles.slider}
                />
              </GestureHandlerRootView>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="clock" size={24} color="#000" />
            <Text style={styles.sectionTitle}>Duration</Text>
          </View>
          
          <View style={styles.durationContainer}>
            {durationOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.durationButton,
                  duration === option.value && styles.durationButtonActive
                ]}
                onPress={() => handleDurationChange(option.value)}
              >
                <Text style={[
                  styles.durationButtonText,
                  duration === option.value && styles.durationButtonTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.customDurationContainer}>
            <Text style={styles.customDurationLabel}>Custom duration (minutes)</Text>
            <TextInput
              style={styles.customDurationInput}
              value={duration}
              onChangeText={(text) => {
                const numericValue = text.replace(/[^0-9]/g, '');
                handleDurationChange(numericValue);
              }}
              keyboardType="number-pad"
              placeholder="Enter minutes"
              maxLength={3}
            />
          </View>
          
          <View style={styles.caloriesContainer}>
            <Text style={styles.caloriesLabel}>Estimated calories burned</Text>
            <Text style={styles.caloriesValue}>{calories} kcal</Text>
          </View>
        </View>
      </ScrollView>
      
      <TouchableOpacity
        style={[styles.addButton, !isValid && styles.addButtonDisabled]}
        onPress={handleSave}
        disabled={!isValid || isLoading}
      >
        <Text style={styles.addButtonText}>
          {isLoading ? 'Saving...' : 'Add'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const { height, width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingVertical: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 60,
  },
  content: {
    flex: 1,
    padding: 20,
    marginTop: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  intensityContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 20,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderWrapper: {
    width: 60,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slider: {
    width: 180,
    height: 60,
    transform: [{ rotate: '270deg' }],
  },
  intensityLabelsContainer: {
    flex: 1,
    justifyContent: 'space-between',
    height: 180,
    paddingVertical: 10,
  },
  intensityLabelContainer: {
    marginBottom: 10,
  },
  intensityLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    color: '#666',
  },
  intensityDescription: {
    fontSize: 14,
    color: '#999',
    marginBottom: 5,
  },
  activeIntensity: {
    color: '#000',
    fontWeight: 'bold',
  },
  activeDescription: {
    color: '#666',
  },
  customThumb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: "#000000",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  durationButton: {
    backgroundColor: '#f8f8f8',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 10,
    width: '48%',
  },
  durationButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  durationButtonText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  durationButtonTextActive: {
    color: '#fff',
  },
  customDurationContainer: {
    marginBottom: 20,
  },
  customDurationLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    color: '#333',
  },
  customDurationInput: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8f8f8',
  },
  caloriesContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  caloriesLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  caloriesValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  addButton: {
    backgroundColor: '#000',
    borderRadius: 30,
    padding: 15,
    margin: 20,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Custom activity description styles
  descriptionContainer: {
    marginTop: 20,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  aiButtonDisabled: {
    backgroundColor: '#ccc',
  },
  aiButtonIcon: {
    marginRight: 8,
  },
  aiButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  exampleContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 16,
    color: '#333',
  },
  aiResultContainer: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#d0e1f9',
  },
  aiResultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  aiResultText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
}); 