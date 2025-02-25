export interface User {
  id: string;
  email: string;
  name: string | null;
  age: number | null;
  gender: string | null;
  height: number | null;
  weight: number | null;
  daily_calorie_goal: number | null;
  protein_goal: number | null;
  carbs_goal: number | null;
  fats_goal: number | null;
  target_weight: number | null;
  weekly_weight_goal: number | null;
  notification_enabled: boolean;
}

export interface AIResponse {
  name: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
}

export interface Meal {
  id: string;
  user_id: string;
  created_at: string;
  name: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  image_url: string;
  ai_response: string | null;
  analysis_status: 'pending' | 'completed' | 'failed';
  error_message?: string;
}

export interface WeightCheckin {
  id: string;
  user_id: string;
  weight: number;
  check_in_date: string;
  created_at: string;
}

export interface ActivityStreak {
  id: string;
  user_id: string;
  streak_count: number;
  last_activity_date: string;
}

export interface Reward {
  id: string;
  user_id: string;
  reward_type: string;
  description: string;
  earned_at: string;
}

export type DailyProgress = {
  remainingCalories: number;
  remainingProteins: number;
  remainingCarbs: number;
  remainingFats: number;
  totalCalories: number;
  totalProteins: number;
  totalCarbs: number;
  totalFats: number;
  burnedCalories: number;
  burnedProteins: number;
  burnedCarbs: number;
  burnedFats: number;
};

export type DailyProgressResponse = {
  streak: number;
  goals: {
    dailyCalorieGoal: number;
    proteinGoal: number;
    carbsGoal: number;
    fatsGoal: number;
  };
  progress: DailyProgress;
};

export interface WeightProgress {
  totalChange: number;
  weeklyChange: number;
  startWeight: number;
  currentWeight: number;
  daysTracked: number;
}

export interface Activity {
  id: string;
  user_id: string;
  activity_type: string;
  calories_burned: number;
  duration_minutes: number;
  activity_date: string;
  created_at: string;
  intensity?: string;
}

export enum IconNames {
  run = 'run',
  bike = 'bike',
  swim = 'swim',
  stairs = 'stairs',
  dumbbell = 'dumbbell',
  weightlifting = 'weightlifting',
  stretching = 'stretching',
  fitness = 'fitness',
  timer = 'timer',
  ball = 'ball',
  basketball = 'basketball',
  tennis = 'tennis',
  soccer = 'soccer',
  volleyball = 'volleyball',
  tree = 'tree',
  hiking = 'hiking',
  climbing = 'climbing',
  kayak = 'kayak',
  ski = 'ski',
  pencilOutline = 'pencil-outline'
}

export type ActivityCategory = {
  id: string;
  name: string;
  icon: IconNames;
  activities: ActivityType[];
};

export type ActivityType = {
  id: string;
  name: string;
  icon: IconNames;
  caloriesPerHour: number;
  met: number;
};

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  {
    id: 'cardio',
    name: 'Cardio',
    icon: IconNames.run,
    activities: [
      { id: 'running', name: 'Run', icon: IconNames.run, caloriesPerHour: 800, met: 8.3 },
      { id: 'cycling', name: 'Cycling', icon: IconNames.bike, caloriesPerHour: 600, met: 7.5 },
      { id: 'swimming', name: 'Swimming', icon: IconNames.swim, caloriesPerHour: 700, met: 7.0 },
      { id: 'stairs', name: 'Stairs', icon: IconNames.stairs, caloriesPerHour: 450, met: 4.0 },
    ],
  },
  {
    id: 'gym',
    name: 'Gym',
    icon: IconNames.dumbbell,
    activities: [
      { id: 'weight_training', name: 'Weight Training', icon: IconNames.weightlifting, caloriesPerHour: 400, met: 5.0 },
      { id: 'stretching', name: 'Stretching', icon: IconNames.stretching, caloriesPerHour: 350, met: 4.0 },
      { id: 'crossfit', name: 'CrossFit', icon: IconNames.fitness, caloriesPerHour: 700, met: 8.0 },
      { id: 'hiit', name: 'HIIT', icon: IconNames.timer, caloriesPerHour: 750, met: 8.5 },
    ],
  },
  {
    id: 'sports',
    name: 'Sports',
    icon: IconNames.ball,
    activities: [
      { id: 'basketball', name: 'Basketball', icon: IconNames.basketball, caloriesPerHour: 600, met: 6.5 },
      { id: 'tennis', name: 'Tennis', icon: IconNames.tennis, caloriesPerHour: 500, met: 7.0 },
      { id: 'soccer', name: 'Soccer', icon: IconNames.soccer, caloriesPerHour: 600, met: 7.0 },
      { id: 'volleyball', name: 'Volleyball', icon: IconNames.volleyball, caloriesPerHour: 450, met: 4.0 },
    ],
  },
  {
    id: 'outdoor',
    name: 'Outdoor',
    icon: IconNames.tree,
    activities: [
      { id: 'hiking', name: 'Hiking', icon: IconNames.hiking, caloriesPerHour: 450, met: 5.3 },
      { id: 'rock_climbing', name: 'Rock Climbing', icon: IconNames.climbing, caloriesPerHour: 700, met: 7.5 },
      { id: 'kayaking', name: 'Kayaking', icon: IconNames.kayak, caloriesPerHour: 400, met: 5.0 },
      { id: 'skiing', name: 'Skiing', icon: IconNames.ski, caloriesPerHour: 500, met: 7.0 },
    ],
  },
];

// Helper function to calculate calories burned based on weight, duration, and activity
export const calculateCaloriesBurned = (
  weight: number, // in kg
  durationMinutes: number,
  met: number
): number => {
  // Calories = MET × weight (kg) × duration (hours)
  const durationHours = durationMinutes / 60;
  return Math.round(met * weight * durationHours);
};
