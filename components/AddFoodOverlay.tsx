import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  Animated,
  Image,
  FlatList,
  Dimensions,
} from "react-native";
import { Text } from "@rneui/themed";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCameraPermissions } from "expo-camera";
import { useSelectedDate } from '@/store/userSlice';
import { supabase } from "@/utils/supabase";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import type { Meal } from "@/types";
import LoadingSpinner from "./ui/LoadingSpinner";
import { api } from "@/utils/api";

interface AddFoodOverlayProps {
  visible: boolean;
  onClose: () => void;
}

const menuOptions = [
  {
    id: "exercise",
    title: "Log Exercise",
    icon: <Feather name="activity" size={24} color="#000" />,
  },
  {
    id: "saved",
    title: "Saved foods",
    icon: <Feather name="bookmark" size={24} color="#000" />,
  },
  {
    id: "barcode",
    title: "Scan barcode",
    icon: <Feather name="maximize" size={24} color="#000" />,
  },
  {
    id: "scan",
    title: "Scan food",
    icon: <Feather name="camera" size={24} color="#000" />,
  },
];

interface SavedFoodsGridProps {
  onClose: () => void;
  selectedDate: string;
}

interface SavedMealResponse {
  meal_id: string;
  meals: {
    id: string;
    name: string;
    image_url: string;
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
    created_at: string;
  };
}

type DatabaseMeal = {
  id: string;
  name: string;
  image_url: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  created_at: string;
};

type DatabaseSavedMeal = {
  meal_id: string;
  meals: DatabaseMeal;
};

function SavedFoodsGrid({ onClose, selectedDate }: SavedFoodsGridProps) {
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
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['meals', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['meals-summary'] });
      queryClient.invalidateQueries({ queryKey: ['progress', selectedDate] });
      
      // Navigate to the new meal
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

export function AddFoodOverlay({ visible, onClose }: AddFoodOverlayProps) {
  const router = useRouter();
  const selectedDate = useSelectedDate();
  const [permission, requestPermission] = useCameraPermissions();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [showSavedFoods, setShowSavedFoods] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 85,
        friction: 9,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 85,
        friction: 9,
      }).start();
    }
  }, [visible]);

  const handleOptionPress = async (optionId: string) => {
    if (optionId === "saved") {
      setShowSavedFoods(true);
      return;
    }

    // Check permissions first if needed
    if (optionId === "scan" || optionId === "barcode") {
      await requestPermission();
    }

    // Quick and smooth closing animation
    onClose();
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Navigate after animation completes
      if (optionId === "scan") {
        router.push({
          pathname: "/main/camera",
          params: { selectedDate: selectedDate.format('YYYY-MM-DD') }
        });
      } else if (optionId === "barcode") {
        router.push({
          pathname: "/main/camera",
          params: { 
            selectedDate: selectedDate.format('YYYY-MM-DD'),
            mode: 'barcode'
          }
        });
      } else if (optionId === "exercise") {
        router.push({
          pathname: "/main/activity-selection",
          params: { selectedDate: selectedDate.format('YYYY-MM-DD') }
        });
      }
    });
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.menuContainer,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          {showSavedFoods ? (
            <>
              <View style={styles.savedFoodsHeader}>
                <TouchableOpacity
                  onPress={() => setShowSavedFoods(false)}
                  style={styles.backButton}
                >
                  <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.savedFoodsTitle}>Saved Foods</Text>
              </View>
              <SavedFoodsGrid
                onClose={onClose}
                selectedDate={selectedDate.format('YYYY-MM-DD')}
              />
            </>
          ) : (
            <View style={styles.menuGrid}>
              {menuOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.menuItem}
                  onPress={() => handleOptionPress(option.id)}
                >
                  <View style={styles.menuIconContainer}>{option.icon}</View>
                  <Text style={styles.menuTitle}>{option.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  menuContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 40,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
    padding: 16,
  },
  menuItem: {
    width: "47%",
    aspectRatio: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
  },
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
  savedFoodsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    marginRight: 16,
  },
  savedFoodsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
});
