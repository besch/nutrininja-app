import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, StyleSheet, Image, TouchableOpacity, ScrollView, RefreshControl } from "react-native";
import { Text } from "@rneui/themed";
import { useRouter, useLocalSearchParams, useNavigation } from "expo-router";
import { Feather, FontAwesome6 } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import NumericInputOverlay from "@/components/overlays/NumericInputOverlay";
import BaseOverlay from "@/components/overlays/BaseOverlay";
import AnalysisResultsOverlay from "@/components/overlays/AnalysisResultsOverlay";
import { api } from "@/utils/api";
import moment from "moment";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { LoadingDots } from "@/components/ui/LoadingDots";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { updateMealInStore } from "@/store/mealsSlice";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Meal } from "@/types";
import { trackMealAnalysis } from '@/utils/appsFlyerEvents';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from "@expo/vector-icons";

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

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

  // Ensure numeric values are properly converted to numbers
  const mealData = meal ? {
    ...meal,
    calories: typeof meal.calories === 'string' ? parseInt(meal.calories) : meal.calories,
    proteins: typeof meal.proteins === 'string' ? parseInt(meal.proteins) : meal.proteins,
    carbs: typeof meal.carbs === 'string' ? parseInt(meal.carbs) : meal.carbs,
    fats: typeof meal.fats === 'string' ? parseInt(meal.fats) : meal.fats,
  } : null;

  const updateMealMutation = useMutation({
    mutationFn: (updates: Partial<Meal>) => {
      if (!mealData) throw new Error('No meal found');
      return api.meals.updateMeal(mealData.id, updates);
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
      if (!mealData) throw new Error('No meal found');
      return api.meals.analyzeMeal(mealData.image_url, mealData.id);
    },
    onSuccess: (analysis: Partial<Meal>) => {
      setAnalysisResults(analysis);
      setShowAnalysisResults(true);
      if (mealData) {
        trackMealAnalysis(true, mealData.id);
        const analysisMealDate = moment(mealData.date).format('YYYY-MM-DD');
        queryClient.invalidateQueries({ queryKey: ['meals', analysisMealDate] });
      }
    },
    onError: (error) => {
      if (mealData) {
        trackMealAnalysis(false, mealData.id);
      }
    }
  });

  const deleteMealMutation = useMutation({
    mutationFn: () => {
      if (!mealData) throw new Error('No meal found');
      return api.meals.deleteMeal(mealData.id);
    },
    onSuccess: () => {
      const mealDate = moment(mealData.date).format('YYYY-MM-DD');
      queryClient.invalidateQueries({ queryKey: ['meals', mealDate] });
      queryClient.invalidateQueries({ queryKey: ['meals-summary'] });
      queryClient.invalidateQueries({ queryKey: ['progress', mealDate] });
      router.back();
    },
  });

  const { data: isBookmarked = false } = useQuery({
    queryKey: ['meal-bookmarked', id],
    queryFn: () => api.meals.isBookmarked(id),
    enabled: !!id,
  });

  const toggleBookmarkMutation = useMutation({
    mutationFn: () => api.meals.toggleBookmark(id),
    onSuccess: (isBookmarked) => {
      queryClient.setQueryData(['meal-bookmarked', id], isBookmarked);
      // Also invalidate the bookmarked meals list if it exists
      queryClient.invalidateQueries({ queryKey: ['bookmarked-meals'] });
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
    if (!mealData) return;
    setEditingMacro({ type, value: mealData[type] });
  };

  const handleSaveMacro = async (value: number) => {
    if (!editingMacro || !mealData) return;

    const updates = {
      ...mealData,
      [editingMacro.type]: value
    };

    updateMealMutation.mutate(updates);
    setEditingMacro(null);
  };

  const handleFixResults = () => {
    if (!mealData) return;
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
    if (!mealData || !analysisResults) return;
    try {
      await updateMealMutation.mutateAsync(analysisResults);
      const confirmMealDate = moment(mealData.date).format('YYYY-MM-DD');
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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          <View style={styles.headerContainer}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.headerButton}
              >
                <Feather name="arrow-left" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                disabled={true}
              >
                <Feather name="trash-2" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.imageContainer}>
              <ShimmerPlaceholder
                style={[styles.foodImage, { borderRadius: 0 }]}
                width={'100%'}
                height={'100%'}
              />
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.topRow}>
              <View style={styles.titleContainer}>
                <ShimmerPlaceholder
                  style={styles.shimmerName}
                  width={200}
                  height={28}
                />
              </View>
              <View style={styles.topRowRight}>
                <View style={styles.bookmarkButton}>
                  <FontAwesome
                    name="bookmark-o"
                    size={20}
                    color="#666"
                  />
                </View>
                <View style={[styles.timeContainer, { backgroundColor: 'transparent' }]}>
                  <ShimmerPlaceholder
                    style={{
                      width: 80,
                      height: 20,
                      borderRadius: 12,
                    }}
                  />
                </View>
              </View>
            </View>

            <View style={styles.macroGrid}>
              {/* Calories */}
              <View style={styles.macroCard}>
                <View style={styles.macroIconContainer}>
                  <Feather name="activity" size={20} color="black" />
                </View>
                <View style={styles.macroContent}>
                  <Text style={styles.macroLabel}>Calories</Text>
                  <ShimmerPlaceholder
                    style={styles.shimmerMacro}
                    width={60}
                    height={24}
                  />
                </View>
                <View style={[styles.editButton, styles.disabledButton]}>
                  <Feather name="edit-2" size={16} color="white" />
                </View>
              </View>

              {/* Carbs */}
              <View style={styles.macroCard}>
                <View style={styles.macroIconContainer}>
                  <Ionicons name="leaf-outline" size={20} color="#FF9500" />
                </View>
                <View style={styles.macroContent}>
                  <Text style={styles.macroLabel}>Carbs</Text>
                  <ShimmerPlaceholder
                    style={styles.shimmerMacro}
                    width={60}
                    height={24}
                  />
                </View>
                <View style={[styles.editButton, styles.disabledButton]}>
                  <Feather name="edit-2" size={16} color="white" />
                </View>
              </View>

              {/* Protein */}
              <View style={styles.macroCard}>
                <View style={styles.macroIconContainer}>
                  <Ionicons name="flash-outline" size={20} color="#FF3B30" />
                </View>
                <View style={styles.macroContent}>
                  <Text style={styles.macroLabel}>Protein</Text>
                  <ShimmerPlaceholder
                    style={styles.shimmerMacro}
                    width={60}
                    height={24}
                  />
                </View>
                <View style={[styles.editButton, styles.disabledButton]}>
                  <Feather name="edit-2" size={16} color="white" />
                </View>
              </View>

              {/* Fats */}
              <View style={styles.macroCard}>
                <View style={styles.macroIconContainer}>
                  <Ionicons name="water-outline" size={20} color="#007AFF" />
                </View>
                <View style={styles.macroContent}>
                  <Text style={styles.macroLabel}>Fats</Text>
                  <ShimmerPlaceholder
                    style={styles.shimmerMacro}
                    width={60}
                    height={24}
                  />
                </View>
                <View style={[styles.editButton, styles.disabledButton]}>
                  <Feather name="edit-2" size={16} color="white" />
                </View>
              </View>
            </View>

            <View style={styles.bottomButtons}>
              <View style={[styles.fixButton, styles.disabledButton]}>
                <View style={styles.fixButtonContent}>
                  <Feather name="cpu" size={20} color="#999" />
                  <FontAwesome6 name="robot" size={20} color="#999" />
                  <Text style={[styles.fixButtonText, styles.disabledText]}>
                    Fix Results
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.doneButton}
                onPress={() => router.back()}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <Feather name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
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
                uri: mealData.image_url,
                cache: 'force-cache'
              }}
              style={styles.foodImage}
              onLoadStart={() => {
                if (!hasLoadedImageRef.current[mealData.image_url]) {
                  setIsImageLoading(true);
                }
              }}
              onLoadEnd={() => {
                setIsImageLoading(false);
                hasLoadedImageRef.current[mealData.image_url] = true;
              }}
            />
            {isImageLoading && !hasLoadedImageRef.current[mealData.image_url] && (
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
                <ShimmerPlaceholder
                  style={styles.shimmerName}
                  width={200}
                  height={28}
                />
              ) : analysisFailed ? (
                <View style={styles.errorContainer}>
                  <Feather name="alert-circle" size={16} color="#FF6B6B" />
                  <Text style={styles.errorText}>
                    {mealData.error_message === 'NO_FOOD_DETECTED' 
                      ? "No food detected in image"
                      : mealData.error_message || "Analysis failed"}
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
                    {mealData.name}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.topRowRight}>
              <TouchableOpacity
                style={styles.bookmarkButton}
                onPress={() => toggleBookmarkMutation.mutate()}
                disabled={toggleBookmarkMutation.isPending}
              >
                <FontAwesome
                  name={isBookmarked ? "bookmark" : "bookmark-o"}
                  size={20}
                  color={isBookmarked ? "#000" : "#666"}
                />
              </TouchableOpacity>
              <Text style={styles.timestamp}>
                {moment(mealData.created_at).format("hh:mm A")}
              </Text>
            </View>
          </View>

          <View style={[styles.macroGrid, (isAnalyzing || analysisFailed) && styles.disabledContent]}>
            {/* Calories */}
            <View style={styles.macroCard}>
              <View style={styles.macroIconContainer}>
                <Ionicons name="flame-outline" size={20} color="black" />
              </View>
              <View style={styles.macroContent}>
                <Text style={styles.macroLabel}>Calories</Text>
                {isAnalyzing ? (
                  <ShimmerPlaceholder
                    style={styles.shimmerMacro}
                    width={60}
                    height={24}
                  />
                ) : (
                  <Text style={styles.macroValue}>{mealData.calories}</Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.editButton, isAnalyzing && styles.disabledButton]}
                onPress={() => handleEditMacro("calories")}
                disabled={isAnalyzing}
              >
                <Feather name="edit-2" size={16} color="white" />
              </TouchableOpacity>
            </View>

            {/* Carbs */}
            <View style={styles.macroCard}>
              <View style={styles.macroIconContainer}>
                <Ionicons name="leaf-outline" size={20} color="#FF9500" />
              </View>
              <View style={styles.macroContent}>
                <Text style={styles.macroLabel}>Carbs</Text>
                {isAnalyzing ? (
                  <ShimmerPlaceholder
                    style={styles.shimmerMacro}
                    width={60}
                    height={24}
                  />
                ) : (
                  <Text style={styles.macroValue}>{mealData.carbs}g</Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.editButton, isAnalyzing && styles.disabledButton]}
                onPress={() => handleEditMacro("carbs")}
                disabled={isAnalyzing}
              >
                <Feather name="edit-2" size={16} color="white" />
              </TouchableOpacity>
            </View>

            {/* Protein */}
            <View style={styles.macroCard}>
              <View style={styles.macroIconContainer}>
                <Ionicons name="flash-outline" size={20} color="#FF3B30" />
              </View>
              <View style={styles.macroContent}>
                <Text style={styles.macroLabel}>Protein</Text>
                {isAnalyzing ? (
                  <ShimmerPlaceholder
                    style={styles.shimmerMacro}
                    width={60}
                    height={24}
                  />
                ) : (
                  <Text style={styles.macroValue}>{mealData.proteins}g</Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.editButton, isAnalyzing && styles.disabledButton]}
                onPress={() => handleEditMacro("proteins")}
                disabled={isAnalyzing}
              >
                <Feather name="edit-2" size={16} color="white" />
              </TouchableOpacity>
            </View>

            {/* Fats */}
            <View style={styles.macroCard}>
              <View style={styles.macroIconContainer}>
                <Ionicons name="water-outline" size={20} color="#007AFF" />
              </View>
              <View style={styles.macroContent}>
                <Text style={styles.macroLabel}>Fats</Text>
                {isAnalyzing ? (
                  <ShimmerPlaceholder
                    style={styles.shimmerMacro}
                    width={60}
                    height={24}
                  />
                ) : (
                  <Text style={styles.macroValue}>{mealData.fats}g</Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.editButton, isAnalyzing && styles.disabledButton]}
                onPress={() => handleEditMacro("fats")}
                disabled={isAnalyzing}
              >
                <Feather name="edit-2" size={16} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {!isAnalyzing && !analysisFailed && mealData && (
            <View style={styles.detailsSection}>
              {/* Check both direct properties and nested ai_response properties */}
              {(mealData.health_score !== undefined || (mealData.ai_response && mealData.ai_response.health_score !== undefined)) && (
                <View style={styles.healthScoreContainer}>
                  <View style={styles.healthScoreHeader}>
                    <Text style={styles.sectionTitle}>Health Score</Text>
                    <View style={[
                      styles.scoreIndicator, 
                      {backgroundColor: 
                        (mealData.health_score || (mealData.ai_response && mealData.ai_response.health_score) || 0) >= 7 
                        ? '#4CD964' 
                        : (mealData.health_score || (mealData.ai_response && mealData.ai_response.health_score) || 0) >= 4 
                          ? '#FF9500' 
                          : '#FF3B30'
                      }
                    ]}>
                      <Text style={styles.scoreText}>
                        {mealData.health_score || (mealData.ai_response && mealData.ai_response.health_score) || 0}/10
                      </Text>
                    </View>
                  </View>
                  
                  {(mealData.health_score_details || (mealData.ai_response && mealData.ai_response.health_score_details)) && (
                    <Text style={styles.healthDetails}>
                      {mealData.health_score_details || (mealData.ai_response && mealData.ai_response.health_score_details)}
                    </Text>
                  )}
                </View>
              )}

              {(mealData.meal_details || (mealData.ai_response && mealData.ai_response.meal_details)) && (
                <View style={styles.mealDetailsContainer}>
                  <Text style={styles.sectionTitle}>Meal Breakdown</Text>
                  <Text style={styles.mealDetailsText}>
                    {mealData.meal_details || (mealData.ai_response && mealData.ai_response.meal_details)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Bottom Buttons */}
          <View style={styles.bottomButtons}>
            <TouchableOpacity 
              style={[styles.fixButton, isAnalyzing && styles.disabledButton]}
              onPress={handleFixResults}
              disabled={isAnalyzing || analyzeMealMutation.isPending}
            >
              {analyzeMealMutation.isPending ? (
                <View style={styles.fixButtonContent}>
                  <LoadingDots color="#000" size={5} />
                </View>
              ) : (
                <View style={styles.fixButtonContent}>
                  <Feather 
                    name="cpu" 
                    size={20} 
                    color={isAnalyzing ? "#999" : "#000"} 
                  />
                  <Text style={[
                    styles.fixButtonText, 
                    isAnalyzing && styles.disabledText
                  ]}>
                    Fix Results
                  </Text>
                </View>
              )}
            </TouchableOpacity>
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
        currentMeal={mealData}
        newAnalysis={analysisResults || undefined}
      />

      <BaseOverlay
        isVisible={showFullName}
        onClose={() => setShowFullName(false)}
        title="Meal Name"
        onSave={() => setShowFullName(false)}
      >
        <Text style={styles.fullNameText}>{mealData.name}</Text>
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
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
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
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: -16,
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
  topRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    backgroundColor: '#E0E0E0',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
    alignSelf: 'flex-start',
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '500',
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
  shimmerName: {
    borderRadius: 8,
    marginVertical: 4,
  },
  shimmerMacro: {
    borderRadius: 6,
    marginTop: 2,
  },
  bookmarkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fixButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeContainer: {
    padding: 4,
    borderRadius: 12,
  },
  detailsSection: {
    marginBottom: 24,
  },
  healthScoreContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  healthScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  scoreIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  scoreText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  healthDetails: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  mealDetailsContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
  },
  mealDetailsText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
});
