import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./index";

interface AnalysisState {
  pendingMeals: {
    [mealId: string]: {
      status: 'pending' | 'completed' | 'failed';
      error?: string;
    }
  }
}

const initialState: AnalysisState = {
  pendingMeals: {}
};

const analysisSlice = createSlice({
  name: "analysis",
  initialState,
  reducers: {
    setMealAnalysisStatus: (state, action: PayloadAction<{ 
      mealId: string; 
      status: 'pending' | 'completed' | 'failed';
      error?: string;
    }>) => {
      const { mealId, status, error } = action.payload;
      state.pendingMeals[mealId] = { status, error };
    },
    removeMealAnalysis: (state, action: PayloadAction<string>) => {
      delete state.pendingMeals[action.payload];
    }
  }
});

export const { setMealAnalysisStatus, removeMealAnalysis } = analysisSlice.actions;
export const selectPendingMeals = (state: RootState) => state.analysis.pendingMeals;
export default analysisSlice.reducer; 