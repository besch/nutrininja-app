import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, StyleSheet, Image, TouchableOpacity, ScrollView, RefreshControl } from "react-native";
import { Text } from "@rneui/themed";
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import NumericInputOverlay from "@/components/overlays/NumericInputOverlay";
import BaseOverlay from "@/components/overlays/BaseOverlay";
import AnalysisResultsOverlay from "@/components/overlays/AnalysisResultsOverlay";
import { api } from "@/utils/api";
import moment from "moment";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { updateMealInStore } from "@/store/mealsSlice";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Meal } from "@/types";
import * as Progress from "react-native-progress";
import { Button } from "@/components/ui/Button";
import { trackMealAnalysis } from '@/utils/appsFlyerEvents';

export default function FoodDetailsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [editingMacro, setEditingMacro] = useState<{
    type: "calories" | "proteins" | "carbs" | "fats";
    value: number;
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAnalysisResults, setShowAnalysisResults] = useState(false);
  const [showFullName, setShowFullName] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<Partial<Meal> | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const hasLoadedImageRef = useRef<{[key: string]: boolean}>({});

  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();

  const { data: meal, isLoading } = useQuery({
    queryKey: ['meal', id],
    queryFn: () => api.meals.getMealById(id),
    refetchInterval: (query) => {
      const data = query.state.data as Meal | undefined;
      return data?.analysis_status === "pending" ? 2000 : false;
    },
  });

  const isAnalyzing = meal?.analysis_status === "pending";
  const analysisFailed = meal?.analysis_status === "failed";

  const updateMealMutation = useMutation({
    mutationFn: (updates: Partial<Meal>) => {
      if (!meal) throw new Error('No meal found');
      return api.meals.updateMeal(meal.id, updates);
    },
    onSuccess: (updatedMeal) => {
      dispatch(updateMealInStore(updatedMeal));
      const updatedMealDate = moment(updatedMeal.date).format('YYYY-MM-DD');
      
      // Invalidate all queries
      queryClient.invalidateQueries({ 
        queryKey: ['meal', id],
        exact: true,
        type: 'all'
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['meals', updatedMealDate],
        exact: true,
        type: 'all'
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['meals-summary'],
        exact: true,
        type: 'all'
      });
      
      // Invalidate all progress queries for this date
      queryClient.invalidateQueries({ 
        queryKey: ['progress', updatedMealDate],
        type: 'all'
      });

      // Force immediate refetch of meals
      queryClient.refetchQueries({ 
        queryKey: ['meals', updatedMealDate],
        exact: true,
        type: 'active'
      });
    },
  });

  const analyzeMealMutation = useMutation({
    mutationFn: () => {
      if (!meal) throw new Error('No meal found');
      return api.meals.analyzeMeal(meal.image_url, meal.id);
    },
    onSuccess: (analysis: Partial<Meal>) => {
      setAnalysisResults(analysis);
      setShowAnalysisResults(true);
      if (meal) {
        trackMealAnalysis(true, meal.id);
        const analysisMealDate = moment(meal.date).format('YYYY-MM-DD');
        queryClient.invalidateQueries({ queryKey: ['meals', analysisMealDate] });
      }
    },
    onError: (error) => {
      if (meal) {
        trackMealAnalysis(false, meal.id);
      }
    }
  });

  const deleteMealMutation = useMutation({
    mutationFn: () => {
      if (!meal) throw new Error('No meal found');
      return api.meals.deleteMeal(meal.id);
    },
    onSuccess: () => {
      const mealDate = moment(meal.date).format('YYYY-MM-DD');
      queryClient.invalidateQueries({ queryKey: ['meals', mealDate] });
      queryClient.invalidateQueries({ queryKey: ['meals-summary'] });
      queryClient.invalidateQueries({ queryKey: ['progress', mealDate] });
      router.back();
    },
  });

  // Handle navigation events to cancel analysis if user leaves
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (analyzeMealMutation.isPending) {
        analyzeMealMutation.reset();
      }
    });

    return unsubscribe;
  }, [navigation, analyzeMealMutation.isPending]);

  const handleEditMacro = (
    type: "calories" | "proteins" | "carbs" | "fats"
  ) => {
    if (!meal) return;
    setEditingMacro({ type, value: meal[type] });
  };

  const handleSaveMacro = async (value: number) => {
    if (!editingMacro || !meal) return;

    const updates = {
      ...meal,
      [editingMacro.type]: value
    };

    updateMealMutation.mutate(updates);
    setEditingMacro(null);
  };

  const handleFixResults = () => {
    if (!meal) return;
    analyzeMealMutation.mutate(undefined, {
      onSuccess: (analysis) => {
        if (analysis) {
          setAnalysisResults(analysis);
          setShowAnalysisResults(true);
        }
      },
      onError: (error) => {
        queryClient.invalidateQueries({ queryKey: ['meal', id] });
      }
    });
  };

  const handleConfirmAnalysis = async () => {
    if (!meal || !analysisResults) return;
    try {
      await updateMealMutation.mutateAsync(analysisResults);
      const confirmMealDate = moment(meal.date).format('YYYY-MM-DD');
      queryClient.invalidateQueries({ queryKey: ['meal', id] });
      queryClient.invalidateQueries({ queryKey: ['meals', confirmMealDate] });
      queryClient.invalidateQueries({ queryKey: ['meals-summary'] });
      queryClient.invalidateQueries({ queryKey: ['progress', confirmMealDate] });
      setShowAnalysisResults(false);
      setAnalysisResults(null);
    } catch (error) {
      console.error('Error updating meal:', error);
    }
  };

  const getMacroUnit = (type: string) => {
    return type === "calories" ? "" : "g";
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['meal', id] });
    setRefreshing(false);
  }, [queryClient, id]);

  if (isLoading || !meal) {
    return (
      <View style={styles.container}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {(updateMealMutation.isPending || deleteMealMutation.isPending) && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner />
        </View>
      )}

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#000"
          />
        }
      >
        <View style={styles.headerContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft} />
            <TouchableOpacity
              onPress={() => setShowDeleteConfirm(true)}
              style={styles.headerButton}
            >
              <Feather name="trash-2" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ 
                uri: meal.image_url,
                cache: 'force-cache'
              }}
              style={styles.foodImage}
              onLoadStart={() => {
                // Only show loading state if image hasn't been loaded before
                if (!hasLoadedImageRef.current[meal.image_url]) {
                  setIsImageLoading(true);
                }
              }}
              onLoadEnd={() => {
                setIsImageLoading(false);
                hasLoadedImageRef.current[meal.image_url] = true;
              }}
            />
            {isImageLoading && !hasLoadedImageRef.current[meal.image_url] && (
              <View style={styles.imageLoadingContainer}>
                <LoadingSpinner />
              </View>
            )}
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.titleContainer}>
              {isAnalyzing ? (
                <View style={styles.analyzingContainer}>
                  <Text style={styles.analyzingText}>Analyzing your meal...</Text>
                  <View style={styles.progressContainer}>
                    <Progress.Bar
                      indeterminate
                      width={200}
                      color="#000"
                      unfilledColor="#E0E0E0"
                      borderColor="#000"
                      style={styles.analyzingProgress}
                    />
                  </View>
                </View>
              ) : analysisFailed ? (
                <View style={styles.errorContainer}>
                  <View style={styles.errorHeader}>
                    <View style={styles.errorBadge}>
                      <Feather name="alert-circle" size={14} color="#FF6B6B" />
                      <Text style={styles.errorBadgeText}>Analysis Failed</Text>
                    </View>
                  </View>
                  <Text style={styles.errorDescription}>
                    {meal.error_message === 'NO_FOOD_DETECTED' 
                      ? "No food was detected in the image"
                      : meal.error_message || "We couldn't analyze this meal"}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity 
                  onPress={() => setShowFullName(true)}
                  activeOpacity={0.7}
                >
                  <Text 
                    style={styles.foodName} 
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {meal.name}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.timestamp}>{moment(meal.created_at).format("hh:mm A")}</Text>
          </View>

          <View style={[styles.macroGrid, (isAnalyzing || analysisFailed) && styles.disabledContent]}>
            {/* Calories */}
            <View style={styles.macroCard}>
              <View style={styles.macroIconContainer}>
                <Feather name="activity" size={20} color="black" />
              </View>
              <View style={styles.macroContent}>
                <Text style={styles.macroLabel}>Calories</Text>
                <Text style={styles.macroValue}>{meal.calories}</Text>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditMacro("calories")}
              >
                <Feather name="edit-2" size={16} color="white" />
              </TouchableOpacity>
            </View>

            {/* Carbs */}
            <View style={styles.macroCard}>
              <View style={styles.macroIconContainer}>
                <Feather name="box" size={20} color="#FFB84D" />
              </View>
              <View style={styles.macroContent}>
                <Text style={styles.macroLabel}>Carbs</Text>
                <Text style={styles.macroValue}>{meal.carbs}g</Text>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditMacro("carbs")}
              >
                <Feather name="edit-2" size={16} color="white" />
              </TouchableOpacity>
            </View>

            {/* Protein */}
            <View style={styles.macroCard}>
              <View style={styles.macroIconContainer}>
                <Feather name="zap" size={20} color="#FF6B6B" />
              </View>
              <View style={styles.macroContent}>
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={styles.macroValue}>{meal.proteins}g</Text>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditMacro("proteins")}
              >
                <Feather name="edit-2" size={16} color="white" />
              </TouchableOpacity>
            </View>

            {/* Fats */}
            <View style={styles.macroCard}>
              <View style={styles.macroIconContainer}>
                <Feather name="droplet" size={20} color="#4DABF7" />
              </View>
              <View style={styles.macroContent}>
                <Text style={styles.macroLabel}>Fats</Text>
                <Text style={styles.macroValue}>{meal.fats}g</Text>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditMacro("fats")}
              >
                <Feather name="edit-2" size={16} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Buttons */}
          <View style={styles.bottomButtons}>
            <Button 
              title="Fix Results"
              onPress={handleFixResults}
              loading={analyzeMealMutation.isPending}
              disabled={isAnalyzing || analyzeMealMutation.isPending}
              style={[styles.fixButton, isAnalyzing && styles.disabledButton]}
              textStyle={[styles.fixButtonText, isAnalyzing && styles.disabledText]}
            />
            <TouchableOpacity 
              style={styles.doneButton}
              onPress={() => router.back()}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <NumericInputOverlay
        isVisible={!!editingMacro}
        onClose={() => setEditingMacro(null)}
        onSave={handleSaveMacro}
        title={editingMacro ? `Edit ${editingMacro.type}` : ""}
        initialValue={editingMacro?.value || 0}
        unit={editingMacro ? getMacroUnit(editingMacro.type) : ""}
      />

      <BaseOverlay
        isVisible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Meal"
        onSave={async () => {
          await deleteMealMutation.mutateAsync();
        }}
        isLoading={deleteMealMutation.isPending}
      >
        <Text>Are you sure you want to delete this meal?</Text>
      </BaseOverlay>

      <AnalysisResultsOverlay
        isVisible={showAnalysisResults}
        onClose={() => {
          setShowAnalysisResults(false);
          setAnalysisResults(null);
        }}
        onConfirm={handleConfirmAnalysis}
        isLoading={updateMealMutation.isPending}
        currentMeal={meal}
        newAnalysis={analysisResults || undefined}
      />

      <BaseOverlay
        isVisible={showFullName}
        onClose={() => setShowFullName(false)}
        title="Meal Name"
        onSave={() => setShowFullName(false)}
      >
        <Text style={styles.fullNameText}>{meal.name}</Text>
      </BaseOverlay>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  headerContainer: {
    position: 'relative',
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingTop: 34,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerLeft: {
    width: 40,
    height: 40,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f8f8f8',
    position: 'relative',
  },
  foodImage: {
    width: '100%',
    height: '100%',
    resizeMode: "cover",
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  contentContainer: {
    flexGrow: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  timestamp: {
    fontSize: 13,
    color: "#666",
    backgroundColor: "#F8F8F8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexShrink: 0,
  },
  foodName: {
    fontSize: 24,
    fontWeight: "600",
  },
  macroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  macroCard: {
    width: "48%",
    backgroundColor: "#F8F8F8",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  macroIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  macroContent: {
    flex: 1,
    marginRight: 8,
  },
  macroLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
    fontWeight: "500",
  },
  macroValue: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 24,
  },
  editButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  bottomButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
    paddingBottom: 16,
    gap: 12,
    marginBottom: 16,
  },
  fixButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F8F8",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "black",
  },
  fixButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  doneButton: {
    flex: 1,
    backgroundColor: "black",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: "center",
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "white",
  },
  analyzingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  analyzingText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  progressContainer: {
    alignItems: 'center',
    width: '100%',
  },
  analyzingProgress: {
    marginTop: 8,
  },
  disabledContent: {
    opacity: 0.5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: "#999",
  },
  spinnerText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 12,
    width: '100%',
  },
  errorHeader: {
    marginBottom: 8,
  },
  errorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorBadgeText: {
    fontSize: 15,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  errorDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 4,
  },
  retryButtonText: {
    fontSize: 13,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  closeButton: {
    position: "absolute",
    top: 40,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  deleteButton: {
    position: "absolute",
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  fullNameText: {
    fontSize: 18,
    lineHeight: 24,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});
