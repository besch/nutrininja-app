import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text } from '@rneui/themed';
import { Feather, Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { Meal } from '@/types';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

interface RecentMealsProps {
  meals: Meal[];
  isLoading: boolean;
  pendingMeals: {
    [mealId: string]: {
      status: 'pending' | 'completed' | 'failed';
      error?: string;
    }
  };
  onMealPress: (mealId: string) => void;
}

const MealItem: React.FC<{
  meal: Meal;
  onPress: () => void;
  isPending: boolean;
}> = ({ meal, onPress, isPending }) => {
  if (meal.analysis_status === 'failed') {
    return (
      <View style={styles.foodItem}>
        <TouchableOpacity
          style={styles.foodItemContent}
          onPress={onPress}
        >
          <Image
            source={{ uri: meal.image_url }}
            style={styles.foodImage}
          />
          <View style={styles.foodDetails}>
            <View style={styles.foodHeaderRow}>
              <View style={styles.failedBadge}>
                <Feather name="alert-circle" size={14} color="#FF6B6B" />
                <Text style={styles.failedBadgeText}>Analysis Failed</Text>
              </View>
              <View style={styles.timeContainer}>
                <Text style={styles.foodTime}>
                  {moment(meal.created_at).format("hh:mm A")}
                </Text>
              </View>
            </View>
            <View style={styles.failedMessageContainer}>
              <Text style={styles.failedMessage}>
                {meal.error_message === 'NO_FOOD_DETECTED' 
                  ? "No food was detected in the image"
                  : meal.error_message || "We couldn't analyze this meal"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.foodItem}>
      <TouchableOpacity
        style={styles.foodItemContent}
        onPress={onPress}
      >
        <Image
          source={{ uri: meal.image_url }}
          style={styles.foodImage}
        />
        <View style={styles.foodDetails}>
          <View style={styles.foodHeaderRow}>
            {isPending ? (
              <ShimmerPlaceholder
                style={styles.shimmerName}
                width={150}
                height={20}
              />
            ) : (
              <Text 
                style={styles.foodName}
                numberOfLines={1}
                ellipsizeMode="tail"
              >{meal.name}</Text>
            )}
            <View style={styles.timeContainer}>
              <Text style={styles.foodTime}>
                {moment(meal.created_at).format("hh:mm A")}
              </Text>
            </View>
          </View>
          
          {isPending ? (
            <View style={styles.macroRows}>
              <ShimmerPlaceholder style={styles.shimmerMacro} width={100} height={16} />
              <View style={styles.macroRow}>
                <ShimmerPlaceholder style={styles.shimmerMacro} width={60} height={16} />
                <ShimmerPlaceholder style={styles.shimmerMacro} width={60} height={16} />
                <ShimmerPlaceholder style={styles.shimmerMacro} width={60} height={16} />
              </View>
            </View>
          ) : (
            <View style={styles.macroRows}>
              <View style={styles.calorieRow}>
                <Feather name="activity" size={16} color="#000" />
                <Text style={styles.macroText}>{meal.calories} calories</Text>
              </View>
              <View style={styles.macroRow}>
                <View style={styles.macroItem}>
                  <Ionicons name="flash-outline" size={16} color="#FF3B30" />
                  <Text style={styles.macroText}>{meal.proteins}g</Text>
                </View>
                <View style={styles.macroItem}>
                  <Ionicons name="leaf-outline" size={16} color="#FF9500" />
                  <Text style={styles.macroText}>{meal.carbs}g</Text>
                </View>
                <View style={styles.macroItem}>
                  <Ionicons name="water-outline" size={16} color="#007AFF" />
                  <Text style={styles.macroText}>{meal.fats}g</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

export const RecentMeals: React.FC<RecentMealsProps> = ({
  meals,
  isLoading,
  pendingMeals,
  onMealPress,
}) => {
  if (isLoading) {
    return (
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recently eaten</Text>
        <View style={styles.recentContent}>
          {Array(3).fill(0).map((_, index) => (
            <View key={index} style={styles.foodItem}>
              <View style={styles.foodItemContent}>
                <ShimmerPlaceholder style={styles.shimmerImage} width={100} height={100} />
                <View style={styles.foodDetails}>
                  <View style={styles.foodHeaderRow}>
                    <ShimmerPlaceholder style={styles.shimmerName} width={150} height={20} />
                    <View style={styles.timeContainer}>
                      <ShimmerPlaceholder style={styles.shimmerTime} width={70} height={20} />
                    </View>
                  </View>
                  <View style={styles.macroRows}>
                    <View style={styles.calorieRow}>
                      <ShimmerPlaceholder style={styles.shimmerMacro} width={100} height={16} />
                    </View>
                    <View style={styles.macroRow}>
                      <ShimmerPlaceholder style={styles.shimmerMacro} width={60} height={16} />
                      <ShimmerPlaceholder style={styles.shimmerMacro} width={60} height={16} />
                      <ShimmerPlaceholder style={styles.shimmerMacro} width={60} height={16} />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.recentSection}>
      <Text style={styles.sectionTitle}>Recently eaten</Text>
      <View style={styles.recentContent}>
        {meals.length > 0 ? (
          meals.map((meal) => (
            <MealItem
              key={meal.id}
              meal={meal}
              onPress={() => onMealPress(meal.id)}
              isPending={meal.analysis_status === 'pending'}
            />
          ))
        ) : (
          <>
            <Text style={styles.emptyText}>You haven't uploaded any food</Text>
            <Text style={styles.helperText}>
              Start tracking Today's meals by taking a quick picture
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  recentSection: {
    padding: 16,
    marginBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  recentContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
  },
  foodItem: {
    backgroundColor: "#F5F5F5",
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
  },
  foodItemContent: {
    flexDirection: "row",
    height: 100,
  },
  foodImage: {
    width: 100,
    height: "100%",
    resizeMode: "cover",
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  foodDetails: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingRight: 16,
    paddingLeft: 16,
  },
  foodHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
    maxWidth: '70%',
  },
  timeContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 0,
  },
  foodTime: {
    fontSize: 14,
    color: "#666",
  },
  macroRows: {
    gap: 8,
  },
  calorieRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  macroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  macroItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  macroText: {
    fontSize: 14,
    color: "#666",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "bold",
    paddingTop: 24,
  },
  helperText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingBottom: 24,
  },
  recentEmptyContent: {
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    height: 200,
    position: 'relative',
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
  shimmerImage: {
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  shimmerName: {
    borderRadius: 4,
    marginRight: 8,
  },
  shimmerTime: {
    borderRadius: 12,
  },
  shimmerMacro: {
    borderRadius: 4,
    marginRight: 8,
  },
  failedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  failedBadgeText: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: '600',
  },
  failedMessageContainer: {
    gap: 6,
  },
  failedMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  retryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  retryText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
}); 