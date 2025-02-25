import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Button } from '@rneui/themed';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '@/utils/api';
import ActivityIcon from '@/components/ActivityIcon';
import { ACTIVITY_CATEGORIES, ActivityType, ActivityCategory, IconNames, Meal } from '@/types';
import { useSelectedDate } from '@/store/userSlice';
import BaseOverlay from '@/components/overlays/BaseOverlay';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

interface Activity {
  id: string;
  activity_type: string;
  duration_minutes: number;
  calories_burned: number;
}

export default function CaloriesDetailsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const selectedDate = useSelectedDate();
  const dateStr = selectedDate.format('YYYY-MM-DD');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: meals = [], isLoading: mealsLoading } = useQuery({
    queryKey: ['meals', dateStr],
    queryFn: () => api.meals.getMealsByDate(dateStr),
  });

  const { data: activitiesData = [], isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ['activities', dateStr],
    queryFn: async () => {
      const response = await api.activities.getActivities(dateStr);
      return response || [];
    }
  });

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['user-goals'],
    queryFn: () => api.user.getProfile(),
  });

  const isLoading = mealsLoading || activitiesLoading || userLoading;

  const { totalCalories, burnedCalories, remainingCalories } = useMemo(() => {
    const total = meals
      .filter((meal: Meal) => meal.analysis_status === 'completed')
      .reduce((acc: number, meal: Meal) => acc + meal.calories, 0);
    
    const burned = activitiesData.reduce((acc: number, activity: Activity) => 
      acc + activity.calories_burned, 0);
    
    const dailyGoal = userData?.daily_calorie_goal || 2000;
    
    return {
      totalCalories: total,
      burnedCalories: burned,
      remainingCalories: dailyGoal - total + burned
    };
  }, [meals, activitiesData, userData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['meals', dateStr] }),
        queryClient.invalidateQueries({ queryKey: ['activities', dateStr] }),
        queryClient.invalidateQueries({ queryKey: ['user-goals'] }),
        queryClient.invalidateQueries({ queryKey: ['meals-summary'] })
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, dateStr]);

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
        queryClient.invalidateQueries({ queryKey: ['meals-summary'] })
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

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#000"
            />
          }
        >
          <View style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>Daily Summary</Text>
            <View style={styles.summaryRow}>
              {[
                { label: 'Daily Goal', width: 60 },
                { label: 'Consumed', width: 60 },
                { label: 'Burned', width: 60 }
              ].map((item, index) => (
                <View key={index} style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>{item.label}</Text>
                  <ShimmerPlaceholder style={[styles.summaryValue, { width: item.width, borderRadius: 8 }]} />
                </View>
              ))}
            </View>
            <View style={styles.remainingContainer}>
              <Text style={styles.remainingLabel}>Remaining</Text>
              <ShimmerPlaceholder style={[styles.remainingValue, { width: 120, borderRadius: 8 }]} />
            </View>
          </View>

          <View style={styles.activitiesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Activities</Text>
              <Button
                title="Add Activity"
                onPress={handleAddActivity}
                buttonStyle={[styles.addButton, { opacity: 0.5 }]}
                titleStyle={styles.addButtonTitle}
                icon={<Feather name="plus" size={20} color="white" style={styles.addIcon} />}
                raised={false}
                disabled
              />
            </View>

            {[1, 2, 3].map((_, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <ShimmerPlaceholder style={{ width: 40, height: 40, borderRadius: 20 }} />
                </View>
                <View style={styles.activityInfo}>
                  <ShimmerPlaceholder style={[styles.activityName, { width: 120, borderRadius: 4 }]} />
                  <ShimmerPlaceholder style={[styles.activityDuration, { width: 80, borderRadius: 4 }]} />
                </View>
                <View style={styles.activityCalories}>
                  <ShimmerPlaceholder style={[styles.caloriesBurned, { width: 60, borderRadius: 4 }]} />
                  <ShimmerPlaceholder style={[styles.caloriesUnit, { width: 40, borderRadius: 4 }]} />
                </View>
                <View style={[styles.deleteButton, { opacity: 0.5 }]} />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  const dailyCalorieGoal = userData?.daily_calorie_goal || 2000;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Feather name="arrow-left" size={24} color="black" />
      </TouchableOpacity>
      <Text style={styles.title}>Calories Details</Text>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#000"
          />
        }
      >
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Daily Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Daily Goal</Text>
              <Text style={styles.summaryValue}>{dailyCalorieGoal}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Consumed</Text>
              <Text style={styles.summaryValue}>{totalCalories}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Burned</Text>
              <Text style={[styles.summaryValue, styles.burnedValue]}>{burnedCalories}</Text>
            </View>
          </View>
          <View style={styles.remainingContainer}>
            <Text style={styles.remainingLabel}>
              {remainingCalories >= 0 ? 'Remaining' : 'Over by'}
            </Text>
            <Text style={[
              styles.remainingValue,
              remainingCalories < 0 && styles.negativeValue
            ]}>
              {Math.abs(remainingCalories)}
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
                    {activityType?.icon === IconNames.fitness ? (
                      <MaterialCommunityIcons name="pencil-outline" size={24} color="#333" />
                    ) : (
                      <ActivityIcon
                        name={activityType?.icon || IconNames.pencilOutline}
                        size={24}
                        color="#333"
                      />
                    )}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    height: 36,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    height: 24,
    marginBottom: 0,
    lineHeight: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 16,
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    height: 16,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '600',
    height: 24,
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
    height: 16,
  },
  remainingValue: {
    fontSize: 28,
    fontWeight: 'bold',
    height: 32,
  },
  negativeValue: {
    color: '#FF6B6B',
  },
  activitiesSection: {
    margin: 16,
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
    alignSelf: 'center',
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
    height: 20,
  },
  activityDuration: {
    fontSize: 14,
    color: '#666',
    height: 16,
  },
  activityCalories: {
    alignItems: 'flex-end',
  },
  caloriesBurned: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 4,
    height: 20,
  },
  caloriesUnit: {
    fontSize: 12,
    color: '#666',
    height: 14,
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