import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Text } from '@rneui/themed';
import { useRouter } from 'expo-router';
import { ACTIVITY_CATEGORIES, ActivityType, IconNames } from '@/types';
import { Feather } from '@expo/vector-icons';
import { useSelectedDate } from '@/store/userSlice';
import ActivityIcon from '@/components/ActivityIcon';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function ActivitySelectionScreen() {
  const router = useRouter();
  const selectedDate = useSelectedDate();

  // Define the three main exercise types to display
  const exerciseTypes = [
    {
      id: 'running',
      name: 'Run',
      icon: IconNames.run,
      description: 'Running, jogging, sprinting, etc.',
      category: 'cardio',
      useCustomIcon: false
    },
    {
      id: 'weight_training',
      name: 'Weight lifting',
      icon: IconNames.weightlifting,
      description: 'Machines, free weights, etc.',
      category: 'gym',
      useCustomIcon: false
    },
    {
      id: 'custom',
      name: 'Describe',
      icon: IconNames.run, // Providing a fallback icon even though we won't use it
      useCustomIcon: true,
      description: 'Write your workout in text',
      category: 'custom'
    }
  ];

  const handleActivitySelect = (exerciseType: any) => {
    // Find the actual activity from ACTIVITY_CATEGORIES
    let activity: ActivityType | null = null;
    
    if (exerciseType.id === 'custom') {
      // Handle custom workout description
      router.push({
        pathname: '/main/activity-details',
        params: {
          activityId: 'custom',
          selectedDate: selectedDate.format('YYYY-MM-DD'),
        },
      });
      return;
    }
    
    // Find the activity in the categories
    for (const category of ACTIVITY_CATEGORIES) {
      const found = category.activities.find(a => a.id === exerciseType.id);
      if (found) {
        activity = found;
        break;
      }
    }
    
    if (activity) {
      router.push({
        pathname: '/main/activity-details',
        params: {
          activityId: activity.id,
          selectedDate: selectedDate.format('YYYY-MM-DD'),
        },
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Log Exercise</Text>

        <View style={styles.content}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {exerciseTypes.map((exerciseType) => (
              <TouchableOpacity
                key={exerciseType.id}
                style={styles.activityCard}
                onPress={() => handleActivitySelect(exerciseType)}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  {exerciseType.useCustomIcon ? (
                    <MaterialIcons name="question-mark" size={24} color="black" />
                  ) : (
                    <ActivityIcon 
                      name={exerciseType.icon} 
                      size={28} 
                      color="#333"
                    />
                  )}
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityName}>{exerciseType.name}</Text>
                  <Text style={styles.activityDescription}>
                    {exerciseType.description}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="#999" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 20,
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
    top: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 1,
  },
  content: {
    flex: 1,
    marginTop: 80,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
  },
}); 