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
