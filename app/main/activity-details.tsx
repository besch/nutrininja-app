import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { Text } from '@rneui/themed';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, FontAwesome6 } from '@expo/vector-icons';
import { ACTIVITY_CATEGORIES, ActivityType, calculateCaloriesBurned, IconNames } from '@/types';
import { api } from '@/utils/api';
import { useUser, selectIsMetric } from '@/store/userSlice';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserData } from '@/store/userSlice';
import { AppDispatch } from '@/store';
import ActivityIcon from '@/components/ActivityIcon';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import { useSharedValue } from "react-native-reanimated";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LoadingDots } from '@/components/ui/LoadingDots';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

export default function ActivityDetailsScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const { activityId, selectedDate, activityToEditId } = useLocalSearchParams<{ activityId: string; selectedDate: string; activityToEditId?: string }>();
  const [duration, setDuration] = useState('15');
  const [calories, setCalories] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(!!activityToEditId);
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
  
  const [intensity, setIntensity] = useState('medium');
  const progress = useSharedValue(1); // Default to medium (middle position)
  
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

  // Fetch existing activity data if editing
  useEffect(() => {
    const fetchActivityData = async () => {
      if (activityToEditId) {
        setIsDataLoading(true);
        try {
          const activities = await api.activities.getActivities(selectedDate);
          const activityToEdit = activities.find((a: any) => a.id === activityToEditId);
          
          if (activityToEdit) {
            setDuration(activityToEdit.duration_minutes.toString());
            setCalories(activityToEdit.calories_burned.toString());
            setIntensity(activityToEdit.intensity || 'medium');
            
            // Set progress value based on intensity
            if (activityToEdit.intensity === 'low') {
              progress.value = 0;
            } else if (activityToEdit.intensity === 'high') {
              progress.value = 2;
            } else {
              progress.value = 1;
            }

            // Set description if available
            if (activityToEdit.description) {
              setDescription(activityToEdit.description);
            }
          }
        } catch (error) {
          console.error('Failed to fetch activity data:', error);
        } finally {
          setIsDataLoading(false);
        }
      }
    };

    fetchActivityData();
  }, [activityToEditId, selectedDate, progress]);

  const activity = activityId === 'custom' 
    ? { 
        id: 'custom', 
        name: 'Describe Exercise', 
        icon: IconNames.pencilOutline, 
        met: 5, // Default MET value
        caloriesPerHour: 300 // Adding required property
      } as ActivityType 
    : ACTIVITY_CATEGORIES.reduce((found: ActivityType | null, category) => {
        if (found) return found;
        return category.activities.find(a => a.id === activityId) || null;
      }, null) || { 
        // Fallback for AI-generated activities not in predefined categories
        id: activityId || 'unknown',
        name: activityId ? activityId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown Activity',
        icon: IconNames.pencilOutline,
        met: 5, // Default MET value
        caloriesPerHour: 300 // Adding required property
      } as ActivityType;

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
      const activityData = {
        activity_type: activityId === 'custom' && aiResult?.activityType ? aiResult.activityType : activity.id,
        calories_burned: Number(calories),
        duration_minutes: Number(duration),
        activity_date: selectedDate,
        intensity: intensity,
        description: activityId === 'custom' ? description : undefined,
      };

      if (activityToEditId) {
        // Update existing activity
        await api.activities.updateActivity(activityToEditId, activityData);
      } else {
        // Create new activity
        await api.activities.logActivity(activityData);
      }

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
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          
          <View style={styles.header}>
            <MaterialCommunityIcons name="pencil-outline" size={24} color="black" />
            <Text style={styles.headerTitle}>Describe Exercise</Text>
          </View>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.descriptionContainer}>
            {isDataLoading ? (
              <>
                <ShimmerPlaceholder style={[styles.descriptionInput, { minHeight: 120 }]} />
                <ShimmerPlaceholder style={[styles.aiButton, { marginTop: 16, alignSelf: 'flex-start', height: 48 }]} />
              </>
            ) : (
              <>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Describe workout time, intensity, etc."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  autoFocus={!activityToEditId}
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
                    <View style={styles.aiButtonContent}>
                      <ActivityIndicator color="#fff" size="small" />
                    </View>
                  ) : (
                    <View style={styles.aiButtonContent}>
                      <FontAwesome6 name="robot" size={18} color="#fff" style={styles.aiButtonIcon} />
                      <Text style={styles.aiButtonText}>Created by AI</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </>
            )}
            
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
          style={[styles.addButton, (isDataLoading || !isValid || !description.trim()) && styles.addButtonDisabled]}
          onPress={handleSave}
          disabled={isDataLoading || !isValid || !description.trim() || isLoading}
        >
          {isLoading ? (
            <View style={styles.buttonContent}>
              <LoadingDots color="#fff" size={6} />
            </View>
          ) : (
            <Text style={styles.addButtonText}>Add Exercise</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // Regular activity details screen
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        
        <View style={styles.header}>
          {activity.icon === IconNames.fitness ? (
            <MaterialCommunityIcons name="pencil-outline" size={24} color="#000" />
          ) : (
            <ActivityIcon name={activity.icon} size={24} color="#000" />
          )}
          <Text style={styles.headerTitle}>{activity.name}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="av-timer" size={24} color="black" />
            <Text style={styles.sectionTitle}>Set intensity</Text>
          </View>
          
          <View style={styles.intensityContainer}>
            <View style={styles.intensityOptionsContainer}>
              {isDataLoading ? (
                // Shimmer placeholders for intensity options
                <>
                  {[1, 2, 3].map((i) => (
                    <View key={i} style={styles.intensityOption}>
                      <ShimmerPlaceholder style={{ width: 24, height: 24, borderRadius: 4, marginRight: 10 }} />
                      <View style={styles.intensityTextContainer}>
                        <ShimmerPlaceholder style={{ width: 60, height: 24, borderRadius: 4, marginBottom: 5 }} />
                        <ShimmerPlaceholder style={{ width: 200, height: 16, borderRadius: 4, marginBottom: 5 }} />
                      </View>
                    </View>
                  ))}
                </>
              ) : (
                <>
                  <TouchableOpacity 
                    style={styles.intensityOption}
                    onPress={() => {
                      progress.value = 2;
                      setIntensity('high');
                      calculateAndSetCalories(Number(duration), 'high');
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <View style={[styles.intensityCheckbox, intensity === 'high' ? styles.intensityCheckboxActive : {}]}>
                      {intensity === 'high' && <Feather name="check" size={16} color="#fff" />}
                    </View>
                    <View style={styles.intensityTextContainer}>
                      <Text style={[styles.intensityLabel, intensity === 'high' ? styles.activeIntensity : {}]}>
                        High
                      </Text>
                      <Text style={[styles.intensityDescription, intensity === 'high' ? styles.activeDescription : {}]}>
                        {getIntensityDescription('high')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.intensityOption}
                    onPress={() => {
                      progress.value = 1;
                      setIntensity('medium');
                      calculateAndSetCalories(Number(duration), 'medium');
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <View style={[styles.intensityCheckbox, intensity === 'medium' ? styles.intensityCheckboxActive : {}]}>
                      {intensity === 'medium' && <Feather name="check" size={16} color="#fff" />}
                    </View>
                    <View style={styles.intensityTextContainer}>
                      <Text style={[styles.intensityLabel, intensity === 'medium' ? styles.activeIntensity : {}]}>
                        Medium
                      </Text>
                      <Text style={[styles.intensityDescription, intensity === 'medium' ? styles.activeDescription : {}]}>
                        {getIntensityDescription('medium')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.intensityOption}
                    onPress={() => {
                      progress.value = 0;
                      setIntensity('low');
                      calculateAndSetCalories(Number(duration), 'low');
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <View style={[styles.intensityCheckbox, intensity === 'low' ? styles.intensityCheckboxActive : {}]}>
                      {intensity === 'low' && <Feather name="check" size={16} color="#fff" />}
                    </View>
                    <View style={styles.intensityTextContainer}>
                      <Text style={[styles.intensityLabel, intensity === 'low' ? styles.activeIntensity : {}]}>
                        Low
                      </Text>
                      <Text style={[styles.intensityDescription, intensity === 'low' ? styles.activeDescription : {}]}>
                        {getIntensityDescription('low')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="clock" size={24} color="#000" />
            <Text style={styles.sectionTitle}>Duration</Text>
          </View>
          
          <View style={styles.durationContainer}>
            {isDataLoading ? (
              // Shimmer placeholders for duration buttons
              <>
                {[1, 2, 3, 4].map((i) => (
                  <ShimmerPlaceholder 
                    key={i}
                    style={{ 
                      width: '48%', 
                      height: 44, 
                      borderRadius: 25, 
                      marginBottom: 10 
                    }} 
                  />
                ))}
              </>
            ) : (
              <>
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
              </>
            )}
          </View>
          
          <View style={styles.customDurationContainer}>
            <Text style={styles.customDurationLabel}>Custom duration (minutes)</Text>
            {isDataLoading ? (
              <ShimmerPlaceholder style={{ height: 48, borderRadius: 8 }} />
            ) : (
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
            )}
          </View>
          
          <View style={styles.caloriesContainer}>
            <Text style={styles.caloriesLabel}>Estimated calories burned</Text>
            {isDataLoading ? (
              <ShimmerPlaceholder style={{ width: 100, height: 32, borderRadius: 4 }} />
            ) : (
              <Text style={styles.caloriesValue}>{calories} kcal</Text>
            )}
          </View>
        </View>
      </ScrollView>
      
      <TouchableOpacity
        style={[styles.addButton, (isDataLoading || !isValid) && styles.addButtonDisabled]}
        onPress={handleSave}
        disabled={isDataLoading || !isValid || isLoading}
      >
        {isLoading ? (
          <View style={styles.buttonContent}>
            <LoadingDots color="#fff" size={6} />
          </View>
        ) : (
          <Text style={styles.addButtonText}>Add</Text>
        )}
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
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
  intensityOptionsContainer: {
    flexDirection: 'column',
    width: '100%',
  },
  intensityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  intensityCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  intensityCheckboxActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  intensityTextContainer: {
    flexDirection: 'column',
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
    justifyContent: 'center',
    height: 56,
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  // Custom activity description styles
  descriptionContainer: {
    marginBottom: 20,
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
    height: 48,
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
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
    minWidth: 100,
  },
  aiButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
    minWidth: 120,
  },
}); 