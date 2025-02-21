import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Alert,
  Platform,
  Image,
  Linking,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from 'expo-image-manipulator';
import { api } from "@/utils/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import moment from "moment";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { setMealAnalysisStatus } from '@/store/analysisSlice';
import { trackMealAdded } from '@/utils/appsFlyerEvents';

const processImage = async (imageUri: string, selectedDate?: string) => {
  // Normalize image orientation
  const manipulatedPhoto = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ rotate: 0 }], // This will automatically fix orientation based on EXIF
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );

  const now = new Date();
  const timestamp = selectedDate ? moment(selectedDate, 'YYYY-MM-DD').toDate() : now;
  
  return { ...manipulatedPhoto, timestamp };
};

export const CameraScreen = () => {
  const [permission] = useCameraPermissions();
  const [processingPhoto, setProcessingPhoto] = useState<{ uri: string, timestamp?: Date } | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const { selectedDate } = useLocalSearchParams<{ selectedDate?: string }>();
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  const createMealMutation = useMutation({
    mutationFn: async (photo: { uri: string, timestamp?: Date }) => {
      try {
        // First save the meal without analysis
        const { mealId } = await api.meals.createMealWithoutAnalysis(
          photo.uri,
          selectedDate
        );

        // Set the meal as pending analysis in Redux
        dispatch(setMealAnalysisStatus({ 
          mealId, 
          status: 'pending' 
        }));

        return mealId;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (mealId) => {
      const dateToRefresh = selectedDate || moment().format('YYYY-MM-DD');
      
      // Invalidate all related queries immediately
      queryClient.invalidateQueries({ queryKey: ['meals', dateToRefresh] });
      queryClient.invalidateQueries({ queryKey: ['meals-summary'] });
      queryClient.invalidateQueries({ queryKey: ['progress', dateToRefresh] });
      
      setProcessingPhoto(null);
      router.back();

      // Track successful meal addition
      trackMealAdded(true, 'camera');

      // Start analysis in background
      api.meals.triggerAnalysis(mealId).then(() => {
        // Invalidate all related queries after analysis is complete
        queryClient.invalidateQueries({ queryKey: ['meals', dateToRefresh] });
        queryClient.invalidateQueries({ queryKey: ['meals-summary'] });
        queryClient.invalidateQueries({ queryKey: ['progress', dateToRefresh] });
      }).catch(error => {
        dispatch(setMealAnalysisStatus({ 
          mealId, 
          status: 'failed',
          error: error.message 
        }));
      });
    },
    onError: (error) => {
      setProcessingPhoto(null);
      Alert.alert(
        "Error",
        "Failed to save your meal. Please try again.",
        [{ text: "OK" }]
      );
      // Track failed meal addition
      trackMealAdded(false, 'camera');
    }
  });

  const handleScanFood = async () => {
    if (!cameraRef.current || createMealMutation.isPending) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        exif: true,
      });
      
      if (photo) {
        const photoWithTimestamp = await processImage(photo.uri, selectedDate);
        setProcessingPhoto(photoWithTimestamp);
        createMealMutation.mutate(photoWithTimestamp);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take picture");
    }
  };

  const handleGallery = async () => {
    if (createMealMutation.isPending) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        base64: true,
        exif: true,
      });

      if (!result.canceled) {
        // Show loading state immediately
        setProcessingPhoto({ uri: result.assets[0].uri });
        
        const photoWithTimestamp = await processImage(result.assets[0].uri, selectedDate);
        createMealMutation.mutate(photoWithTimestamp);
      }
    } catch (error) {
      setProcessingPhoto(null);
      Alert.alert("Error", "Failed to pick image from gallery");
      trackMealAdded(false, 'gallery');
    }
  };

  const handleInfoPress = () => {
    router.push('/main/best-practices');
  };

  const isLoading = createMealMutation.isPending;

  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, { padding: 20 }]}>
        <Text style={{ textAlign: "center" }}>
          Camera is not available in web version.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!permission?.granted) {
    return (
      <View style={styles.deniedContainer}>
        <Text style={styles.deniedTitle}>Oh no!</Text>
        <Text style={styles.deniedSubtitle}>We can't see your camera</Text>
        <Text style={styles.deniedDescription}>
          In order to scan your food
        </Text>
        <Text style={styles.deniedDescription}>
          you must enable camera permissions
        </Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => Linking.openSettings()}
        >
          <Text style={styles.settingsButtonText}>Open settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading && <LoadingSpinner />}
      
      <CameraView 
        ref={cameraRef} 
        style={styles.camera} 
        facing="back"
      >
        <TouchableOpacity 
          style={[styles.closeButton, isLoading && styles.disabledButton]} 
          onPress={() => router.back()}
          disabled={isLoading}
        >
          <MaterialIcons name="close" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.infoButton, isLoading && styles.disabledButton]}
          disabled={isLoading}
          onPress={handleInfoPress}
        >
          <MaterialIcons name="info" size={24} color="white" />
        </TouchableOpacity>

        {processingPhoto ? (
          <View style={styles.processingContainer}>
            <Image 
              source={{ uri: processingPhoto.uri }} 
              style={styles.processingImage}
            />
            <View style={styles.spinnerOverlay}>
              <LoadingSpinner />
            </View>
          </View>
        ) : (
          <>
            <View style={styles.overlay}>
              <View style={[
                styles.scanFrame, 
                isLoading && styles.disabledFrame
              ]} />
            </View>

            <View style={styles.bottomContainer}>
              <View style={styles.optionsContainer}>
                <TouchableOpacity 
                  style={[styles.option, isLoading && styles.disabledOption]} 
                  onPress={handleScanFood}
                  disabled={isLoading}
                >
                  <MaterialIcons name="camera-alt" size={24} color={isLoading ? "#999" : "black"} style={styles.optionIcon} />
                  <Text style={[styles.optionText, isLoading && styles.disabledText]}>Scan Food</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.option, isLoading && styles.disabledOption]} 
                  onPress={handleGallery}
                  disabled={isLoading}
                >
                  <MaterialIcons name="photo-library" size={24} color={isLoading ? "#999" : "black"} style={styles.optionIcon} />
                  <Text style={[styles.optionText, isLoading && styles.disabledText]}>Gallery</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  camera: {
    flex: 1,
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
  infoButton: {
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: "80%",
    height: "50%",
    borderWidth: 2,
    borderColor: "white",
    borderRadius: 20,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 10,
  },
  option: {
    alignItems: "center",
    width: "45%",
  },
  optionIcon: {
    width: 24,
    height: 24,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 12,
    color: "black",
    textAlign: "center",
  },
  permissionButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    marginHorizontal: 40,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
  },
  processingContainer: {
    flex: 1,
    position: 'relative',
  },
  processingImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  spinnerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledOption: {
    opacity: 0.5,
  },
  disabledText: {
    color: "#999",
  },
  disabledFrame: {
    borderColor: "rgba(255,255,255,0.3)",
  },
  deniedContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  deniedTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  deniedSubtitle: {
    color: "white",
    fontSize: 22,
    marginBottom: 20,
  },
  deniedDescription: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
  settingsButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  settingsButtonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
  },
});

export default CameraScreen;
