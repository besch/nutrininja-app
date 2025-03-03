import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  Pressable,
} from "react-native";
import { Text } from "@rneui/themed";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Meal } from "@/types";
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from "@/utils/api";

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

interface SavedFoodsProps {
  onClose: () => void;
  selectedDate: string;
}

const GRID_COLUMNS = 3;
const INITIAL_GRID_ROWS = 3;
const INITIAL_PLACEHOLDER_COUNT = GRID_COLUMNS * INITIAL_GRID_ROWS;

export function SavedFoods({ onClose, selectedDate }: SavedFoodsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const screenWidth = Dimensions.get('window').width;
  const itemSize = (screenWidth - 74 - (GRID_COLUMNS - 1) * 16) / GRID_COLUMNS;

  const { data: savedMeals, isLoading } = useQuery({
    queryKey: ['bookmarked-meals'],
    queryFn: () => api.meals.getBookmarkedMeals(),
  });

  const cloneMealMutation = useMutation({
    mutationFn: async (originalMeal: Meal) => {
      return api.meals.cloneMeal(originalMeal.id, selectedDate);
    },
    onSuccess: (newMeal) => {
      queryClient.invalidateQueries({ queryKey: ['meals', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['meals-summary'] });
      queryClient.invalidateQueries({ queryKey: ['progress', selectedDate] });
      
      onClose();
      router.replace("/");
    },
  });

  const toggleBookmarkMutation = useMutation({
    mutationFn: (mealId: string) => api.meals.toggleBookmark(mealId),
    onSuccess: (isBookmarked, mealId) => {
      queryClient.setQueryData(['meal-bookmarked', mealId], isBookmarked);
      queryClient.invalidateQueries({ queryKey: ['bookmarked-meals'] });
    },
  });

  const handleMealSelect = (meal: Meal) => {
    onClose();
    cloneMealMutation.mutate(meal);
  };

  const handleUnbookmark = (e: any, meal: Meal) => {
    e.stopPropagation();
    toggleBookmarkMutation.mutate(meal.id);
  };

  const gridData = useMemo(() => {
    if (isLoading || cloneMealMutation.isPending) {
      return Array(INITIAL_PLACEHOLDER_COUNT).fill(null);
    }

    if (!savedMeals?.length) {
      return [];
    }

    // If we have less than initial grid size, pad with nulls to maintain layout
    if (savedMeals.length <= INITIAL_PLACEHOLDER_COUNT) {
      const filledData = [...savedMeals];
      const remainingSpaces = INITIAL_PLACEHOLDER_COUNT - savedMeals.length;
      if (remainingSpaces > 0) {
        filledData.push(...Array(remainingSpaces).fill(null));
      }
      return filledData;
    }

    // If we have more items, make sure the last row is complete
    const totalItems = savedMeals.length;
    const remainder = totalItems % GRID_COLUMNS;
    if (remainder > 0) {
      const padding = GRID_COLUMNS - remainder;
      return [...savedMeals, ...Array(padding).fill(null)];
    }

    return savedMeals;
  }, [savedMeals, isLoading, cloneMealMutation.isPending]);

  if (!savedMeals?.length && !isLoading && !cloneMealMutation.isPending) {
    return (
      <Pressable style={styles.emptyContainer} onPress={(e) => e.stopPropagation()}>
        <Feather name="bookmark" size={48} color="#666" />
        <Text style={styles.emptyText}>No saved meals yet</Text>
      </Pressable>
    );
  }

  const renderItem = ({ item, index }: { item: Meal | null; index: number }) => {
    if (isLoading || cloneMealMutation.isPending) {
      return (
        <View style={[styles.gridItem, { width: itemSize, height: itemSize }]}>
          <ShimmerPlaceholder
            style={styles.gridImage}
            shimmerStyle={styles.gridImage}
          />
        </View>
      );
    }

    if (!item) {
      return <View style={[styles.gridItem, { width: itemSize, height: itemSize }]} />;
    }

    return (
      <TouchableOpacity
        style={[styles.gridItem, { width: itemSize, height: itemSize }]}
        onPress={() => handleMealSelect(item)}
      >
        <Image
          source={{ uri: item.image_url }}
          style={styles.gridImage}
          resizeMode="cover"
        />
        <TouchableOpacity 
          style={styles.unbookmarkButton}
          onPress={(e) => handleUnbookmark(e, item)}
          disabled={toggleBookmarkMutation.isPending}
        >
          <Ionicons 
            name="close" 
            size={16} 
            color={toggleBookmarkMutation.isPending ? "#999" : "#000"} 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <Pressable onPress={(e) => e.stopPropagation()}>
      <FlatList
        data={gridData}
        numColumns={GRID_COLUMNS}
        keyExtractor={(item, index) => item?.id || `empty-${index}`}
        contentContainerStyle={[
          styles.gridContainer,
          gridData.length <= INITIAL_PLACEHOLDER_COUNT && styles.gridContainerFixed
        ]}
        renderItem={renderItem}
        scrollEnabled={gridData.length > INITIAL_PLACEHOLDER_COUNT}
        showsVerticalScrollIndicator={false}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    padding: 16,
    gap: 16,
  },
  gridContainerFixed: {
    flexGrow: 0,
  },
  gridItem: {
    marginRight: 16,
    marginBottom: 16,
    borderRadius: 8,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  unbookmarkButton: {
    position: 'absolute',
    top: -12,
    right: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
  },
}); 