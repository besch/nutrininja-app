import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Text, Button } from '@rneui/themed';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ACTIVITY_CATEGORIES, ActivityType, calculateCaloriesBurned } from '@/types';
import { api } from '@/utils/api';
import { useUser } from '@/store/userSlice';
import { useDispatch } from 'react-redux';
import { fetchUserData } from '@/store/userSlice';
import { AppDispatch } from '@/store';
import ActivityIcon from '@/components/ActivityIcon';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';

export default function ActivityDetailsScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const { activityId, selectedDate } = useLocalSearchParams<{ activityId: string; selectedDate: string }>();
  const [duration, setDuration] = useState('30');
  const [calories, setCalories] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const user = useUser();

  // Fetch user data when component mounts
  useEffect(() => {
    dispatch(fetchUserData());
  }, [dispatch]);

  const activity = ACTIVITY_CATEGORIES.reduce((found: ActivityType | null, category) => {
    if (found) return found;
    return category.activities.find(a => a.id === activityId) || null;
  }, null);

  const calculateAndSetCalories = (durationValue: number) => {
    if (activity && user?.weight) {
      const calculated = calculateCaloriesBurned(user.weight, durationValue, activity.met);
      setCalories(calculated.toString());
    }
  };

  const handleDurationChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setDuration(numericValue);
    calculateAndSetCalories(Number(numericValue) || 0);
  };

  const handleCaloriesChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setCalories(numericValue);
  };

  const handleSave = async () => {
    if (!activity || !user) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsLoading(true);
    try {
      await api.activities.logActivity({
        activity_type: activity.id,
        calories_burned: Number(calories),
        duration_minutes: Number(duration),
        activity_date: selectedDate,
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
      calculateAndSetCalories(Number(duration));
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

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>{activity.name}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <ActivityIcon name={activity.icon} size={48} color="#333" />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.sectionTitle}>Duration</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={handleDurationChange}
                keyboardType="number-pad"
                maxLength={3}
                placeholder="0"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
              <Text style={styles.inputUnit}>min</Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.sectionTitle}>Calories Burned</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={calories}
                onChangeText={handleCaloriesChange}
                keyboardType="number-pad"
                maxLength={4}
                placeholder="0"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
              <Text style={styles.inputUnit}>kcal</Text>
            </View>
          </View>

          <Button
            title="Save Activity"
            onPress={handleSave}
            loading={isLoading}
            buttonStyle={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
            disabled={!isValid || isLoading}
          />
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    padding: 0,
  },
  inputUnit: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    height: 56,
    marginTop: 'auto',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
}); 