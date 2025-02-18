import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import { Platform } from 'react-native';

let model: mobilenet.MobileNet | null = null;

export async function isDeviceCapable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  
  try {
    await tf.ready();
    // Check if the device supports WebGL
    return tf.getBackend() === 'webgl';
  } catch (error) {
    console.error('Error checking device capability:', error);
    return false;
  }
}

export async function initializeModel(): Promise<boolean> {
  try {
    if (!model) {
      await tf.ready();
      // Set the backend to webgl
      await tf.setBackend('webgl');
      // Load model with version 1
      model = await mobilenet.load();
    }
    return true;
  } catch (error) {
    console.error('Error initializing model:', error);
    return false;
  }
}

interface NutritionData {
  name: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  noFoodDetected?: boolean;
}

interface Prediction {
  className: string;
  probability: number;
}

function estimateNutritionFromPrediction(prediction: Prediction): NutritionData | null {
  const { className, probability } = prediction;
  const lowerClassName = className.toLowerCase();

  // Minimum confidence threshold for food detection
  const MIN_CONFIDENCE = 0.4; // 40% confidence
  
  if (probability < MIN_CONFIDENCE) {
    return null;
  }

  // Check if the prediction suggests it's not food
  const nonFoodKeywords = [
    'person', 'table', 'chair', 'room', 'wall', 'floor', 'furniture', 'device', 
    'container', 'plate', 'bowl', 'utensil', 'cup', 'glass', 'bottle', 'package',
    'wrapper', 'box', 'bag', 'camera', 'phone', 'screen', 'display'
  ];
  
  if (nonFoodKeywords.some(keyword => lowerClassName.includes(keyword))) {
    return null;
  }

  // Extract food type indicators from the prediction
  const isMeat = /meat|beef|chicken|pork|steak|fish|turkey|lamb|bacon/i.test(className);
  const isVegetable = /vegetable|salad|lettuce|spinach|broccoli|carrot|tomato|cucumber/i.test(className);
  const isFruit = /fruit|apple|banana|orange|berry|grape|melon|pear|peach/i.test(className);
  const isGrain = /bread|rice|pasta|cereal|grain|noodle|toast|bagel|bun/i.test(className);
  const isDairy = /milk|cheese|yogurt|dairy|cream|butter/i.test(className);
  const isProcessed = /pizza|burger|sandwich|fries|cake|cookie|dessert|snack|chips/i.test(className);
  const isLegume = /bean|lentil|pea|chickpea|tofu|soy/i.test(className);
  const isNut = /nut|almond|cashew|peanut|walnut/i.test(className);

  // Base estimation on food type and prediction confidence
  let baseCalories = 0;
  let baseProteins = 0;
  let baseCarbs = 0;
  let baseFats = 0;

  if (isMeat) {
    baseCalories = 250;
    baseProteins = 25;
    baseCarbs = 0;
    baseFats = 15;
  } else if (isVegetable) {
    baseCalories = 50;
    baseProteins = 3;
    baseCarbs = 10;
    baseFats = 0;
  } else if (isFruit) {
    baseCalories = 70;
    baseProteins = 1;
    baseCarbs = 15;
    baseFats = 0;
  } else if (isGrain) {
    baseCalories = 150;
    baseProteins = 4;
    baseCarbs = 30;
    baseFats = 1;
  } else if (isDairy) {
    baseCalories = 120;
    baseProteins = 8;
    baseCarbs = 12;
    baseFats = 5;
  } else if (isProcessed) {
    baseCalories = 300;
    baseProteins = 12;
    baseCarbs = 35;
    baseFats = 15;
  } else if (isLegume) {
    baseCalories = 120;
    baseProteins = 9;
    baseCarbs = 20;
    baseFats = 1;
  } else if (isNut) {
    baseCalories = 160;
    baseProteins = 6;
    baseCarbs = 6;
    baseFats = 14;
  } else {
    // If we can't categorize the food but confidence is high enough,
    // use generic estimation
    if (probability < 0.6) { // Require higher confidence for unknown foods
      return null;
    }
    baseCalories = 200;
    baseProteins = 8;
    baseCarbs = 25;
    baseFats = 8;
  }

  // Adjust values based on prediction confidence
  const confidenceMultiplier = 0.7 + (probability * 0.3); // Range: 0.7 - 1.0
  
  return {
    name: className,
    // Round all values to integers
    calories: Math.round(baseCalories * confidenceMultiplier),
    proteins: Math.round(baseProteins * confidenceMultiplier),
    carbs: Math.round(baseCarbs * confidenceMultiplier),
    fats: Math.round(baseFats * confidenceMultiplier)
  };
}

export async function analyzeImageLocally(base64Image: string): Promise<NutritionData> {
  if (!model) {
    throw new Error('Model not initialized');
  }

  try {
    // Create a tensor directly from the base64 image
    const imageTensor = tf.tidy(() => {
      try {
        // Convert base64 to raw bytes
        const imageData = tf.util.encodeString(base64Image, 'base64').buffer;
        const raw = new Uint8Array(imageData);
        
        // Decode and preprocess in one step
        const decoded = decodeJpeg(raw, 3);
        const resized = tf.image.resizeBilinear(decoded, [224, 224]);
        const expanded = tf.expandDims(resized);
        return tf.div(tf.cast(expanded, 'float32'), 255.0);
      } catch (error) {
        console.error('Error creating tensor:', error);
        throw error;
      }
    });

    try {
      // Get predictions
      const predictions = await model.classify(imageTensor as tf.Tensor3D);

      // Clean up tensor
      tf.dispose(imageTensor);

      if (!predictions || predictions.length === 0) {
        throw new Error('NO_FOOD_DETECTED');
      }

      // Get the top predictions
      const topPredictions = predictions.slice(0, 3); // Get top 3 predictions
      console.log('Local analysis predictions:', topPredictions);

      // Try to find food among top predictions
      for (const prediction of topPredictions) {
        const nutritionData = estimateNutritionFromPrediction(prediction);
        if (nutritionData) {
          return nutritionData;
        }
      }

      // If no food detected in any of the top predictions
      throw new Error('NO_FOOD_DETECTED');
    } catch (error) {
      // Clean up tensor in case of error
      tf.dispose(imageTensor);
      throw error;
    }
  } catch (error) {
    console.error('Error analyzing image locally:', error);
    throw error;
  }
} 