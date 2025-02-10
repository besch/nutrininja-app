import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./index";
import { api } from "@/utils/api";
import moment, { Moment } from "moment";
import { useSelector } from "react-redux";

interface Macro {
  value: number;
  unit: string;
}

interface WorkoutPlan {
  target_weight: {
    value: number;
    goal: string;
  };
  daily_recommendation: {
    calories: number;
    macros: {
      carbs: Macro;
      protein: Macro;
      fats: Macro;
    };
  };
  health_score: {
    score: number;
    max_score: number;
  };
  tips: Array<{
    icon: string;
    text: string;
  }>;
  generated_at: string;
  version: string;
}

interface UserState {
  id?: string;
  email?: string;
  created_at?: string;
  name?: string;
  gender?: string;
  height?: number;
  weight?: number;
  daily_calorie_goal?: number;
  protein_goal?: number;
  carbs_goal?: number;
  fats_goal?: number;
  target_weight?: number;
  weekly_weight_goal?: number;
  notification_enabled: boolean;
  has_previous_experience?: boolean;
  accomplishment?: string;
  birth_date?: string;
  workout_frequency?: string;
  goal?: "lose" | "maintain" | "gain";
  diet?: string;
  workout_plan: WorkoutPlan | null;
  isLoading: boolean;
  error: string | null;
  is_anonymous?: boolean;
  pace?: number;
  is_metric?: boolean;
  selectedDate: string; // ISO date string YYYY-MM-DD
}

const initialState: UserState = {
  notification_enabled: true,
  workout_plan: null,
  isLoading: false,
  error: null,
  is_metric: true,
  selectedDate: moment().format('YYYY-MM-DD'),
};

// Async thunk for fetching user data
export const fetchUserData = createAsyncThunk(
  'user/fetchUserData',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    // If we already have user data and it's not a force refresh, return current data
    if (state.user.id) {
      return state.user;
    }
    try {
      const data = await api.user.getProfile();
      if (!data) {
        return rejectWithValue('No user data received');
      }
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user data');
    }
  }
);

export const setUnitPreference = createAsyncThunk(
  'user/setUnitPreference',
  async (isMetric: boolean, { dispatch, getState, rejectWithValue }) => {
    const state = getState() as RootState;
    if (state.user.is_metric === isMetric) {
      return isMetric;
    }

    // Optimistically update the UI
    dispatch(setUserData({ is_metric: isMetric }));

    try {
      // Update the server
      const updatedUser = await api.user.updateProfile({ is_metric: isMetric });
      // Only update state if the server response is different
      if (updatedUser.is_metric !== isMetric) {
        dispatch(setUserData({ is_metric: updatedUser.is_metric }));
      }
      return updatedUser.is_metric;
    } catch (error) {
      // If server update fails, revert to previous value
      dispatch(setUserData({ is_metric: !isMetric }));
      return rejectWithValue('Failed to update unit preference');
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserData: (state, action: PayloadAction<Partial<UserState>>) => {
      return { ...state, ...action.payload, isLoading: false, error: null };
    },
    setOnboardingData: (state, action: PayloadAction<Partial<UserState>>) => {
      return { ...state, ...action.payload };
    },
    clearUserData: () => initialState,
    setWorkoutPlan: (state, action: PayloadAction<WorkoutPlan>) => {
      state.workout_plan = action.payload;
    },
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserData.pending, (state) => {
        // Only set loading true if we don't have any user data yet
        if (!state.id) {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        return { ...state, ...action.payload, isLoading: false, error: null };
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setUserData, setOnboardingData, clearUserData, setWorkoutPlan, setSelectedDate } =
  userSlice.actions;
export default userSlice.reducer;

// Selectors
export const selectUser = (state: RootState) => state.user;
export const selectIsMetric = (state: RootState) => state.user.is_metric ?? true;
export const selectIsLoading = (state: RootState) => state.user.isLoading && !state.user.id;

// Custom hook to get the selected date as a Moment object
export const useSelectedDate = (): Moment => {
  const selectedDate = useSelector((state: RootState) => state.user.selectedDate);
  return moment(selectedDate);
};
