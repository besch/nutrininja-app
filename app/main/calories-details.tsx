import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button } from '@rneui/themed';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '@/utils/api';
import ActivityIcon from '@/components/ActivityIcon';
import { ACTIVITY_CATEGORIES, ActivityType, ActivityCategory, IconNames } from '@/types';
import { useSelectedDate } from '@/store/userSlice';
import BaseOverlay from '@/components/overlays/BaseOverlay';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

interface Activity {
  id: string;
  activity_type: string;
  duration_minutes: number;
  calories_burned: number;
}

interface DailyProgressResponse {
  streak: number;
  goals: {
    dailyCalorieGoal: number;
    proteinGoal: number;
    carbsGoal: number;
    fatsGoal: number;
  };
  progress: {
    remainingCalories: number;
    remainingProteins: number;
    remainingCarbs: number;
    remainingFats: number;
    totalCalories: number;
    totalProteins: number;
    totalCarbs: number;
    totalFats: number;
    burnedCalories: number;
    burnedProteins: number;
    burnedCarbs: number;
    burnedFats: number;
  };
}

export default function CaloriesDetailsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const selectedDate = useSelectedDate();
  const dateStr = selectedDate.format('YYYY-MM-DD');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: progressData, isLoading } = useQuery<DailyProgressResponse>({
    queryKey: ['progress', dateStr],
    queryFn: () => api.user.getDailyProgress(dateStr)
  });

  const { data: activitiesData } = useQuery<Activity[]>({
    queryKey: ['activities', dateStr],
    queryFn: async () => {
      const response = await api.activities.getActivities(dateStr);
      return response || [];
    }
  });

  const handleEditActivity = (activity: Activity) => {
    router.push({
      pathname: '/main/activity-details',
      params: { 
        activityId: activity.activity_type,
        selectedDate: dateStr,
        activityToEditId: activity.id
      }
    });
  };

  const handleAddActivity = () => {
    router.push('/main/activity-selection');
  };

  const handleDeleteActivity = async () => {
    if (!selectedActivity) return;
    
    setIsDeleting(true);
    try {
      await api.activities.deleteActivity(selectedActivity.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['activities', dateStr] }),
        queryClient.invalidateQueries({ queryKey: ['progress', dateStr] })
      ]);
      setIsDeleteModalVisible(false);
      setSelectedActivity(null);
    } catch (error) {
      console.error('Failed to delete activity:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLongPressActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsDeleteModalVisible(true);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Calories Details</Text>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryCard}>
            <ShimmerPlaceholder style={[styles.shimmerTitle, { width: 120, height: 24 }]} />
            <View style={styles.summaryRow}>
              {[1, 2, 3].map((_, index) => (
                <View key={index} style={styles.summaryItem}>
                  <ShimmerPlaceholder style={{ width: 80, height: 16, marginBottom: 8 }} />
                  <ShimmerPlaceholder style={{ width: 60, height: 24 }} />
                </View>
              ))}
            </View>
            <View style={styles.remainingContainer}>
              <ShimmerPlaceholder style={{ width: 100, height: 16, marginBottom: 8 }} />
              <ShimmerPlaceholder style={{ width: 120, height: 32 }} />
            </View>
          </View>

          <View style={styles.activitiesSection}>
            <View style={styles.sectionHeader}>
              <ShimmerPlaceholder style={{ width: 150, height: 24 }} />
              <ShimmerPlaceholder style={{ width: 100, height: 36, borderRadius: 18 }} />
            </View>

            {[1, 2, 3].map((_, index) => (
              <View key={index} style={styles.activityItem}>
                <ShimmerPlaceholder style={{ width: 40, height: 40, borderRadius: 20 }} />
                <View style={styles.activityInfo}>
                  <ShimmerPlaceholder style={{ width: 120, height: 20, marginBottom: 4 }} />
                  <ShimmerPlaceholder style={{ width: 80, height: 16 }} />
                </View>
                <View style={styles.activityCalories}>
                  <ShimmerPlaceholder style={{ width: 60, height: 20, marginBottom: 4 }} />
                  <ShimmerPlaceholder style={{ width: 40, height: 14 }} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  const { goals, progress } = progressData || { 
    goals: { dailyCalorieGoal: 0, proteinGoal: 0, carbsGoal: 0, fatsGoal: 0 },
    progress: {
      remainingCalories: 0,
      totalCalories: 0,
      burnedCalories: 0,
      remainingProteins: 0,
      remainingCarbs: 0,
      remainingFats: 0,
      totalProteins: 0,
      totalCarbs: 0,
      totalFats: 0,
      burnedProteins: 0,
      burnedCarbs: 0,
      burnedFats: 0
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Feather name="arrow-left" size={24} color="black" />
      </TouchableOpacity>
      <Text style={styles.title}>Calories Details</Text>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Daily Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Daily Goal</Text>
              <Text style={styles.summaryValue}>{goals.dailyCalorieGoal}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Consumed</Text>
              <Text style={styles.summaryValue}>{progress.totalCalories}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Burned</Text>
              <Text style={[styles.summaryValue, styles.burnedValue]}>{progress.burnedCalories}</Text>
            </View>
          </View>
          <View style={styles.remainingContainer}>
            <Text style={styles.remainingLabel}>
              {progress.remainingCalories >= 0 ? 'Remaining' : 'Over by'}
            </Text>
            <Text style={[
              styles.remainingValue,
              progress.remainingCalories < 0 && styles.negativeValue
            ]}>
              {Math.abs(progress.remainingCalories)}
            </Text>
          </View>
        </View>

        <View style={styles.activitiesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Activities</Text>
            <Button
              title="Add Activity"
              onPress={handleAddActivity}
              buttonStyle={styles.addButton}
              titleStyle={styles.addButtonTitle}
              icon={<Feather name="plus" size={20} color="white" style={styles.addIcon} />}
              raised={false}
            />
          </View>

          {(!activitiesData || activitiesData.length === 0) ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No activities logged today</Text>
            </View>
          ) : (
            activitiesData.map((activity: Activity) => {
              const activityType = ACTIVITY_CATEGORIES.reduce<ActivityType | null>((found, category: ActivityCategory) => {
                if (found) return found;
                return category.activities.find(a => a.id === activity.activity_type) || null;
              }, null);

              return (
                <TouchableOpacity
                  key={activity.id}
                  style={styles.activityItem}
                  onPress={() => handleEditActivity(activity)}
                >
                  <View style={styles.activityIcon}>
                    <ActivityIcon
                      name={activityType?.icon || IconNames.fitness}
                      size={24}
                      color="#333"
                    />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityName}>{activityType?.name || 'Activity'}</Text>
                    <Text style={styles.activityDuration}>{activity.duration_minutes} minutes</Text>
                  </View>
                  <View style={styles.activityCalories}>
                    <Text style={styles.caloriesBurned}>-{activity.calories_burned}</Text>
                    <Text style={styles.caloriesUnit}>kcal</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleLongPressActivity(activity)}
                  >
                    <Feather name="trash-2" size={20} color="#FF6B6B" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <BaseOverlay
        isVisible={isDeleteModalVisible}
        onClose={() => {
          setIsDeleteModalVisible(false);
          setSelectedActivity(null);
        }}
        title="Delete Activity"
        onSave={handleDeleteActivity}
        isLoading={isDeleting}
      >
        <Text style={styles.deleteModalText}>
          Are you sure you want to delete this activity? This action cannot be undone.
        </Text>
      </BaseOverlay>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 1,
  },
  content: {
    flex: 1,
    marginTop: 120,
  },
  summaryCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  burnedValue: {
    color: '#4CAF50',
  },
  remainingContainer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  remainingLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  remainingValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  negativeValue: {
    color: '#FF6B6B',
  },
  activitiesSection: {
    margin: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addIcon: {
    marginRight: 4,
  },
  addButton: {
    backgroundColor: '#000',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 0,
    height: 36,
    elevation: 0,
  },
  addButtonTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityDuration: {
    fontSize: 14,
    color: '#666',
  },
  activityCalories: {
    alignItems: 'flex-end',
  },
  caloriesBurned: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
  },
  caloriesUnit: {
    fontSize: 12,
    color: '#666',
  },
  deleteModalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  deleteButton: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  shimmerTitle: {
    marginBottom: 16,
    borderRadius: 4,
  },
}); 