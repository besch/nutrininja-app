import { createSlice, createAsyncThunk, PayloadAction, createSelector } from "@reduxjs/toolkit";
import { RootState } from "./index";
import { api } from "@/utils/api";
import { Meal } from "@/types";
import moment from "moment";

interface MealsState {
  byDate: Record<string, Meal[]>;
  byId: Record<string, Meal>;
  isLoading: boolean;
  error: string | null;
}

const initialState: MealsState = {
  byDate: {},
  byId: {},
  isLoading: false,
  error: null,
};

export const fetchMealDetails = createAsyncThunk(
  'meals/fetchMealDetails',
  async (mealId: string, { getState }) => {
    const state = getState() as RootState;
    // If we already have the meal details cached, return them
    if (state.meals.byId[mealId]) {
      return state.meals.byId[mealId];
    }
    // Otherwise fetch from API
    const meal = await api.meals.getMealById(mealId);
    return meal;
  }
);

export const fetchMealsForDate = createAsyncThunk(
  'meals/fetchMealsForDate',
  async (date: string, { rejectWithValue }) => {
    try {
      const meals = await api.meals.getMealsByDate(date);
      return { date, meals: meals || [] };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch meals');
    }
  }
);

export const fetchMealsForWeek = createAsyncThunk(
  'meals/fetchMealsForWeek',
  async (date: string, { dispatch, getState }) => {
    const state = getState() as RootState;
    const startDate = moment(date).startOf('week');
    const endDate = moment(date).endOf('week');
    const dates = [];
    
    for (let m = moment(startDate); m.isSameOrBefore(endDate); m.add(1, 'days')) {
      dates.push(m.format('YYYY-MM-DD'));
    }

    // Only fetch dates that we don't have data for
    const missingDates = dates.filter(date => !state.meals.byDate[date]);
    
    if (missingDates.length === 0) {
      return; // All data is already cached
    }

    // Fetch meals for missing dates in parallel
    const promises = missingDates.map(date => dispatch(fetchMealsForDate(date)));
    await Promise.all(promises);
  }
);

const mealsSlice = createSlice({
  name: "meals",
  initialState,
  reducers: {
    clearMealsData: () => initialState,
    updateMealInStore: (state, action: PayloadAction<Meal>) => {
      const meal = action.payload;
      // Update in byId cache
      state.byId[meal.id] = meal;
      // Update in byDate lists
      const mealDate = moment(meal.created_at).format('YYYY-MM-DD');
      if (state.byDate[mealDate]) {
        state.byDate[mealDate] = state.byDate[mealDate].map(m => 
          m.id === meal.id ? meal : m
        );
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMealsForDate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMealsForDate.fulfilled, (state, action) => {
        const { date, meals } = action.payload;
        state.byDate[date] = meals;
        // Also cache individual meals
        meals.forEach((meal: Meal) => {
          state.byId[meal.id] = meal;
        });
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchMealsForDate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMealDetails.fulfilled, (state, action) => {
        const meal = action.payload;
        state.byId[meal.id] = meal;
        // Also update in the byDate list if it exists
        const mealDate = moment(meal.created_at).format('YYYY-MM-DD');
        if (state.byDate[mealDate]) {
          state.byDate[mealDate] = state.byDate[mealDate].map(m => 
            m.id === meal.id ? meal : m
          );
        }
      });
  },
});

export const { clearMealsData, updateMealInStore } = mealsSlice.actions;
export default mealsSlice.reducer;

// Memoized Selectors
const selectMealsState = (state: RootState) => state.meals;
const selectDate = (_state: RootState, date: string) => date;

export const selectMealsByDate = createSelector(
  [selectMealsState, selectDate],
  (mealsState, date) => mealsState.byDate[date] || []
);

export const selectMealsLoading = createSelector(
  [selectMealsState],
  (mealsState) => mealsState.isLoading
);

export const selectHasDataForDate = createSelector(
  [selectMealsState, selectDate],
  (mealsState, date) => !!mealsState.byDate[date]
);

export const selectMealById = createSelector(
  [selectMealsState, (_state: RootState, id: string) => id],
  (mealsState, id) => mealsState.byId[id]
); 