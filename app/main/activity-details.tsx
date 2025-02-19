import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Button } from '@rneui/themed';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ACTIVITY_CATEGORIES, ActivityType, calculateCaloriesBurned } from '@/types';
import { api } from '@/utils/api';
import { useUser } from '@/store/userSlice';
import { Slider as AwesomeSlider } from 'react-native-awesome-slider';
import { useSharedValue } from 'react-native-reanimated';
import ActivityIcon from '@/components/ActivityIcon';

export default function ActivityDetailsScreen() {
  const router = useRouter();
  const { activityId, selectedDate } = useLocalSearchParams<{ activityId: string; selectedDate: string }>();
  const [duration, setDuration] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const user = useUser();

  // Reanimated shared values
  const progress = useSharedValue(30);
  const min = useSharedValue(5);
  const max = useSharedValue(180);

  const activity = ACTIVITY_CATEGORIES.reduce((found: ActivityType | null, category) => {
    if (found) return found;
    return category.activities.find(a => a.id === activityId) || null;
  }, null);

  const caloriesBurned = activity ? calculateCaloriesBurned(user?.weight || 70, duration, activity.met) : 0;

  const handleSave = async () => {
    if (!activity || !user) return;

    setIsLoading(true);
    try {
      await api.activities.logActivity({
        activity_type: activity.id,
        calories_burned: caloriesBurned,
        duration_minutes: duration,
        activity_date: selectedDate,
      });
      router.back();
    } catch (error) {
      console.error('Failed to log activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!activity) {
    return (
      <View style={styles.container}>
        <Text>Activity not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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

        <View style={styles.durationContainer}>
          <Text style={styles.sectionTitle}>Duration</Text>
          <Text style={styles.durationValue}>{duration} minutes</Text>
          <View style={styles.sliderContainer}>
            <AwesomeSlider
              progress={progress}
              minimumValue={min}
              maximumValue={max}
              onValueChange={(value: number) => {
                setDuration(Math.round(value));
              }}
              theme={{
                minimumTrackTintColor: '#000',
                maximumTrackTintColor: '#eee',
                bubbleBackgroundColor: '#000',
                bubbleTextColor: '#fff',
                cacheTrackTintColor: '#000'
              }}
              renderBubble={() => null}
            />
          </View>
        </View>

        <View style={styles.caloriesContainer}>
          <Text style={styles.sectionTitle}>Estimated Calories</Text>
          <Text style={styles.caloriesValue}>{caloriesBurned} kcal</Text>
        </View>

        <Button
          title="Save Activity"
          onPress={handleSave}
          loading={isLoading}
          buttonStyle={styles.saveButton}
        />
      </View>
    </View>
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
  durationContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  durationValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sliderContainer: {
    height: 40,
    marginHorizontal: -8,
  },
  caloriesContainer: {
    marginBottom: 32,
  },
  caloriesValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    height: 48,
  },
}); 