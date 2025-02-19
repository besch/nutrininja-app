import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'react-native-store-review';
import { Platform } from 'react-native';

export const RATING_KEY = '@nutrininja:has_rated';
export const SUCCESSFUL_ANALYSES_KEY = '@nutrininja:successful_analyses_count';

export const checkAndRequestRating = async () => {
  try {
    const hasRated = await AsyncStorage.getItem(RATING_KEY);
    if (hasRated === 'true') {
      return false;
    }

    // Get successful analyses count
    const analysesCount = await AsyncStorage.getItem(SUCCESSFUL_ANALYSES_KEY);
    const count = analysesCount ? parseInt(analysesCount) : 0;
    
    // Increment count
    await AsyncStorage.setItem(SUCCESSFUL_ANALYSES_KEY, (count + 1).toString());

    // Show rating dialog after 3 successful analyses
    if (count >= 1 && Platform.OS === 'ios') {
      await StoreReview.requestReview();
      await AsyncStorage.setItem(RATING_KEY, 'true');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking rating:', error);
    return false;
  }
};

export const markAsRated = async () => {
  try {
    await AsyncStorage.setItem(RATING_KEY, 'true');
  } catch (error) {
    console.error('Error marking as rated:', error);
  }
}; 