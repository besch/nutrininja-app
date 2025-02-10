import { configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import userReducer from './userSlice'
import mealsReducer from './mealsSlice'
import analysisReducer from './analysisSlice'

export const store = configureStore({
  reducer: {
    user: userReducer,
    meals: mealsReducer,
    analysis: analysisReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
