import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@rneui/themed';
import { Feather } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useRouter } from 'expo-router';

interface CaloriesSummaryProps {
  isLoading: boolean;
  remainingCalories?: number;
  totalCalories?: number;
  burnedCalories?: number;
}

export const CaloriesSummary: React.FC<CaloriesSummaryProps> = ({
  isLoading,
  remainingCalories = 0,
  totalCalories = 0,
  burnedCalories = 0,
}) => {
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={styles.mainCard}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
        </View>
      </View>
    );
  }

  // Calculate the net calories (total + remaining when not over)
  const netCalories = totalCalories - remainingCalories;
  const finalCalories = netCalories - burnedCalories;
  const isOver = finalCalories > totalCalories;

  return (
    <TouchableOpacity 
      style={styles.mainCard}
      onPress={() => router.push('/main/calories-details')}
      activeOpacity={0.7}
    >
      <View style={styles.mainCardContent}>
        <View style={styles.caloriesContainer}>
          <Text style={[
            styles.caloriesText,
            isOver && styles.negativeValue
          ]}>
            {Math.abs(totalCalories - finalCalories)}
          </Text>
          <Text style={[
            styles.caloriesLabel,
            isOver && styles.negativeValue
          ]}>
            {isOver ? 'Calories over' : 'Calories left'}
          </Text>
          {burnedCalories > 0 && (
            <Text style={styles.burnedLabel}>
              {burnedCalories} kcal burned
            </Text>
          )}
        </View>
        <View style={styles.circleProgress}>
          {isOver ? (
            <Progress.Circle
              size={60}
              progress={Math.min(1, totalCalories ? Math.abs(finalCalories - totalCalories) / totalCalories : 0)}
              thickness={7}
              color="#FF6B6B"
              unfilledColor="#000"
              borderWidth={0}
              strokeCap="round"
              animated
            />
          ) : (
            <Progress.Circle
              size={60}
              progress={Math.min(1, totalCalories ? finalCalories / totalCalories : 0)}
              thickness={7}
              color="#000"
              unfilledColor="#eee"
              borderWidth={0}
              animated
              strokeCap="round"
            />
          )}
          <View style={styles.circleIcon}>
            <Feather name="activity" size={24} color={isOver ? "#FF6B6B" : "#000"} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  mainCard: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    height: 100,
  },
  mainCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    height: '100%',
  },
  caloriesContainer: {
    flex: 1,
  },
  caloriesText: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 4,
  },
  caloriesLabel: {
    color: "#666",
    fontSize: 13,
  },
  burnedLabel: {
    color: "#4CAF50",
    fontSize: 13,
    marginTop: 4,
  },
  circleProgress: {
    position: "relative",
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
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },
  negativeValue: {
    color: '#FF6B6B',
  },
}); 