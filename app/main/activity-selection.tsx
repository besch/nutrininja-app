import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '@rneui/themed';
import { useRouter } from 'expo-router';
import { ACTIVITY_CATEGORIES, ActivityType } from '@/types';
import { Feather } from '@expo/vector-icons';
import { useSelectedDate } from '@/store/userSlice';
import ActivityIcon from '@/components/ActivityIcon';

export default function ActivitySelectionScreen() {
  const router = useRouter();
  const selectedDate = useSelectedDate();

  const handleActivitySelect = (activity: ActivityType) => {
    router.push({
      pathname: '/main/activity-details',
      params: {
        activityId: activity.id,
        selectedDate: selectedDate.format('YYYY-MM-DD'),
      },
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Feather name="arrow-left" size={24} color="black" />
      </TouchableOpacity>
      <Text style={styles.title}>Select Activity</Text>

      <ScrollView style={styles.content}>
        {ACTIVITY_CATEGORIES.map((category) => (
          <View key={category.id} style={styles.categoryContainer}>
            <View style={styles.categoryHeader}>
              <ActivityIcon name={category.icon} size={24} color="#666" />
              <Text style={styles.categoryTitle}>{category.name}</Text>
            </View>
            <View style={styles.activitiesGrid}>
              {category.activities.map((activity) => (
                <TouchableOpacity
                  key={activity.id}
                  style={styles.activityCard}
                  onPress={() => handleActivitySelect(activity)}
                >
                  <View style={styles.iconContainer}>
                    <ActivityIcon 
                      name={activity.icon} 
                      size={24} 
                      color="#333"
                    />
                  </View>
                  <Text style={styles.activityName}>{activity.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

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
  categoryContainer: {
    marginBottom: 24,
    padding: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  activityCard: {
    width: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityName: {
    fontSize: 14,
    textAlign: 'center',
  },
}); 