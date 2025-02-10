import appsFlyer from 'react-native-appsflyer';
import { PaywallInfo } from '@superwall/react-native-superwall';

// Auth Events
export const trackSignIn = (method: string) => {
  appsFlyer.logEvent('sign_in', {
    method,
    timestamp: new Date().toISOString(),
  });
};

// Subscription Events
export const trackSubscription = (event: PaywallInfo) => {
  appsFlyer.logEvent('subscription_purchased', {
    paywall_id: event.identifier,
    paywall_name: event.name,
    paywall_products: event.productIds,
    presented_by: event.presentedBy,
    trigger_event: event.presentedByEventWithName,
    trigger_time: event.presentedByEventAt,
    load_duration: event.productsLoadDuration,
    experiment_id: event.experiment?.id,
    variant_id: event.experiment?.variant?.id,
    timestamp: new Date().toISOString(),
  });
};

// Meal Events
export const trackMealAdded = (success: boolean, method: 'camera' | 'gallery') => {
  appsFlyer.logEvent('meal_added', {
    success,
    method,
    timestamp: new Date().toISOString(),
  });
};

export const trackMealAnalysis = (success: boolean, mealId: string) => {
  appsFlyer.logEvent('meal_analysis', {
    success,
    meal_id: mealId,
    timestamp: new Date().toISOString(),
  });
};

// Goal Events
export const trackPersonalGoalSet = (updates: {
  target_weight?: number;
  weight?: number;
  height?: number;
  birth_date?: string;
  gender?: string;
}) => {
  appsFlyer.logEvent('personal_goal_set', {
    ...updates,
    timestamp: new Date().toISOString(),
  });
};

export const trackNutritionGoalSet = (updates: {
  daily_calorie_goal?: number;
  protein_goal?: number;
  carbs_goal?: number;
  fats_goal?: number;
}) => {
  appsFlyer.logEvent('nutrition_goal_set', {
    ...updates,
    timestamp: new Date().toISOString(),
  });
};

// Account Events
export const trackAccountDeleted = () => {
  appsFlyer.logEvent('account_deleted', {
    timestamp: new Date().toISOString(),
  });
}; 