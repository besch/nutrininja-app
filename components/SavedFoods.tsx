import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
} from "react-native";
import { Text } from "@rneui/themed";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Meal } from "@/types";
import LoadingSpinner from "./ui/LoadingSpinner";
import { api } from "@/utils/api";

interface SavedFoodsProps {
  onClose: () => void;
  selectedDate: string;
}

export function SavedFoods({ onClose, selectedDate }: SavedFoodsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const numColumns = 3;
  const screenWidth = Dimensions.get('window').width;
  const itemSize = (screenWidth - 48 - (numColumns - 1) * 8) / numColumns;

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
      router.push({
        pathname: "/main/food-details",
        params: { id: newMeal.id }
      });
    },
  });

  const handleMealSelect = (meal: Meal) => {
    cloneMealMutation.mutate(meal);
  };

  if (isLoading || cloneMealMutation.isPending) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner />
      </View>
    );
  }

  if (!savedMeals?.length) {
    return (
      <View style={styles.emptyContainer}>
        <Feather name="bookmark" size={48} color="#666" />
        <Text style={styles.emptyText}>No saved meals yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={savedMeals}
      numColumns={numColumns}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.gridContainer}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.gridItem, { width: itemSize, height: itemSize }]}
          onPress={() => handleMealSelect(item)}
        >
          <Image
            source={{ uri: item.image_url }}
            style={styles.gridImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    padding: 16,
    gap: 8,
  },
  gridItem: {
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
}); 