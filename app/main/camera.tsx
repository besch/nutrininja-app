import React, { useState, useRef, useEffect } from "react";
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
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
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
  let timestamp: Date;
  
  if (selectedDate) {
    // If date is provided, use it for the date part but keep current time
    const dateObj = moment(selectedDate, 'YYYY-MM-DD').toDate();
    timestamp = new Date(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
      now.getMilliseconds()
    );
  } else {
    timestamp = now;
  }
  
  return { ...manipulatedPhoto, timestamp };
};

export const CameraScreen = () => {
  const [permission] = useCameraPermissions();
  const [processingPhoto, setProcessingPhoto] = useState<{ uri: string, timestamp?: Date } | null>(null);
  const [processingBarcode, setProcessingBarcode] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const { selectedDate, mode } = useLocalSearchParams<{ selectedDate?: string, mode?: string }>();
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const isBarcodeMode = mode === 'barcode';

  // Reset scanned barcode when component unmounts or mode changes
  useEffect(() => {
    return () => {
      setScannedBarcode(null);
      setProcessingBarcode(false);
    };
  }, [mode]);

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

  const createBarcodeProductMutation = useMutation({
    mutationFn: async (barcode: string) => {
      try {
        setProcessingBarcode(true);
        
        // Directly analyze the barcode without creating a meal first
        const productData = await api.meals.analyzeBarcode(barcode);
        
        if (!productData || !productData.name) {
          throw new Error("Invalid product data received from barcode analysis");
        }
        
        // Create a meal with the product data
        const dateToUse = selectedDate || moment().format('YYYY-MM-DD');
        const response = await api.meals.createBarcodeProduct(barcode, productData, dateToUse);
        
        if (!response || !response.mealId) {
          throw new Error("Failed to create meal from barcode data");
        }
        
        return { mealId: response.mealId, productData };
      } catch (error) {
        console.error('Error processing barcode:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      const dateToRefresh = selectedDate || moment().format('YYYY-MM-DD');
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['meals', dateToRefresh] });
      queryClient.invalidateQueries({ queryKey: ['meals-summary'] });
      queryClient.invalidateQueries({ queryKey: ['progress', dateToRefresh] });
      
      setProcessingBarcode(false);
      setScannedBarcode(null);
      trackMealAdded(true, 'camera');
      router.back();
    },
    onError: (error) => {
      setProcessingBarcode(false);
      setScannedBarcode(null);
      
      console.error("Barcode scanning error:", error);
      
      Alert.alert(
        "Error",
        `Failed to find product information: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or use food scanning instead.`,
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
    if (createMealMutation.isPending || createBarcodeProductMutation.isPending) return;

    try {
      // Request media library permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          "Permission Required", 
          "Please grant access to your photo library to select images.",
          [{ text: "OK" }]
        );
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.8,
        base64: false,
        exif: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];

        // Show loading state immediately
        setProcessingPhoto({ uri: selectedImage.uri });
        
        if (isBarcodeMode) {
          // For barcode mode, we need to analyze the image for barcodes
          Alert.alert(
            "Barcode Detection",
            "Barcode detection from gallery images is not supported. Please use the camera to scan barcodes directly.",
            [{ text: "OK" }]
          );
          setProcessingPhoto(null);
        } else {
          // For food scanning mode, process as usual
          const photoWithTimestamp = await processImage(selectedImage.uri, selectedDate);
          createMealMutation.mutate(photoWithTimestamp);
        }
      }
    } catch (error) {
      setProcessingPhoto(null);
      Alert.alert("Error", "Failed to pick image from gallery");
      trackMealAdded(false, 'camera');
    }
  };

  const handleInfoPress = () => {
    router.push('/main/best-practices');
  };

  // Add a ref to track the last scan time
  const lastScanTimeRef = useRef<number>(0);
  
  const handleBarcodeScan = ({ data }: BarcodeScanningResult) => {
    if (scannedBarcode || processingBarcode || !isBarcodeMode) return;
    
    // Debounce mechanism - ignore scans that happen too quickly after the previous one
    const now = Date.now();
    if (now - lastScanTimeRef.current < 3000) { // 3 seconds debounce
      console.log('Ignoring barcode scan - too soon after previous scan');
      return;
    }
    
    // Update the last scan time
    lastScanTimeRef.current = now;
    
    console.log(`Barcode scanned: ${data}`);
    setScannedBarcode(data);
    setProcessingBarcode(true);
    
    // Process the barcode immediately instead of using setTimeout
    createBarcodeProductMutation.mutate(data);
  };

  const isLoading = createMealMutation.isPending || createBarcodeProductMutation.isPending;

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
      {/* Always render the camera view */}
      <CameraView 
        ref={cameraRef} 
        style={styles.camera} 
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
        }}
        onBarcodeScanned={isBarcodeMode && !scannedBarcode && !processingBarcode ? handleBarcodeScan : undefined}
      >
        <TouchableOpacity 
          style={[styles.closeButton, (isLoading || processingBarcode) && styles.disabledButton]} 
          onPress={() => router.back()}
          disabled={isLoading || processingBarcode}
        >
          <MaterialIcons name="close" size={24} color="white" />
        </TouchableOpacity>
        
        {!isBarcodeMode && (
          <TouchableOpacity 
            style={[styles.infoButton, (isLoading || processingBarcode) && styles.disabledButton]}
            disabled={isLoading || processingBarcode}
            onPress={handleInfoPress}
          >
            <MaterialIcons name="info" size={24} color="white" />
          </TouchableOpacity>
        )}

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
        ) : processingBarcode ? (
          <View style={styles.overlay}>
            <View style={[
              styles.scanFrame, 
              styles.barcodeFrame,
              styles.processingFrame
            ]} />
            <View style={styles.processingOverlay}>
              {/* <Text style={styles.barcodeInstructions}>
                Processing barcode: {scannedBarcode}
              </Text> */}
              <LoadingSpinner />
            </View>
          </View>
        ) : (
          <>
            <View style={styles.overlay}>
              <View style={[
                styles.scanFrame, 
                isLoading && styles.disabledFrame,
                isBarcodeMode && styles.barcodeFrame
              ]} />
              {isBarcodeMode && !isLoading && !processingBarcode && (
                <Text style={styles.barcodeInstructions}>
                  Position barcode within the frame
                </Text>
              )}
            </View>

            {!isBarcodeMode && (
              <View style={styles.bottomContainer}>
                <View style={styles.optionsContainer}>
                  <TouchableOpacity 
                    style={[styles.option, (isLoading || processingBarcode) && styles.disabledOption]} 
                    onPress={handleScanFood}
                    disabled={isLoading || processingBarcode}
                  >
                    <MaterialIcons name="camera-alt" size={24} color={(isLoading || processingBarcode) ? "#999" : "black"} style={styles.optionIcon} />
                    <Text style={[styles.optionText, (isLoading || processingBarcode) && styles.disabledText]}>
                      {isBarcodeMode ? "Scan Barcode" : "Scan Food"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.option, (isLoading || processingBarcode) && styles.disabledOption]} 
                    onPress={handleGallery}
                    disabled={isLoading || processingBarcode}
                  >
                    <MaterialIcons name="photo-library" size={24} color={(isLoading || processingBarcode) ? "#999" : "black"} style={styles.optionIcon} />
                    <Text style={[styles.optionText, (isLoading || processingBarcode) && styles.disabledText]}>Gallery</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
  barcodeFrame: {
    height: "20%",
    borderRadius: 10,
    borderColor: "#00FF00",
    borderWidth: 3,
  },
  barcodeInstructions: {
    color: "white",
    fontSize: 16,
    marginTop: 20,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
    borderRadius: 5,
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
  processingFrame: {
    borderColor: "#00FF00",
    borderWidth: 3,
    opacity: 0.7,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default CameraScreen;
