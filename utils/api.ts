import { supabase } from './supabase';
import type { DailyProgressResponse } from '@/types';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

type ApiOptions = RequestInit & {
  requireAuth?: boolean;
  isOnboarding?: boolean;
};

async function fetchApi(path: string, options: ApiOptions = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Only add auth header if required (default is true)
  if (options.requireAuth !== false) {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    if (!token) {
      throw new Error("Unauthorized - No session token");
    }
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${path}`, {
    ...options,
    headers,
  });

  // Accept both 200 and 202 as successful responses
  if (!response.ok && response.status !== 202) {
    const error = await response.text();
    throw new Error(error);
  }

  // For 204 No Content responses, return null
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  user: {
    getProfile: async () => {
      return fetchApi('/api/user/profile');
    },
    updateProfile: async (updates: any) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('No authenticated user');
      }

      return fetchApi('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          ...updates,
          user_id: session.user.id,
        }),
      });
    },
    getDailyProgress: async (date: string): Promise<DailyProgressResponse> => {
      return fetchApi(`/api/user/progress?date=${date}`);
    },
    deleteAccount: async () => {
      return fetchApi('/api/user/profile', {
        method: 'DELETE',
      });
    },
  },

  features: {
    getFeatures: async () => {
      return fetchApi('/api/features', {
        requireAuth: false
      });
    },
  },

  meals: {
    analyzeMeal: async (image: string, mealId?: string) => {
      if (mealId) {
        return fetchApi(`/api/meals/${mealId}/analyze`, {
          method: "POST"
        });
      }

      const formData = new FormData();
      formData.append("image", {
        uri: image,
        type: "image/jpeg",
        name: "meal.jpg",
      } as any);
      
      return fetchApi("/api/meals/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
          "Accept": "application/json",
        },
        body: formData as any,
      });
    },

    analyzeBarcode: async (barcode: string, mealId?: string) => {
      return fetchApi("/api/meals/barcode", {
        method: "POST",
        body: JSON.stringify({ barcode, mealId }),
      });
    },

    getMealsByDate: async (date?: string) => {
      const url = date ? `/api/meals?date=${date}` : '/api/meals';
      return fetchApi(url);
    },

    getMealsByDateRange: async (startDate: string, endDate: string) => {
      return fetchApi(`/api/meals?startDate=${startDate}&endDate=${endDate}`);
    },

    getMealById: async (id: string) => {
      return fetchApi(`/api/meals/${id}`);
    },

    updateMeal: async (id: string, updates: any) => {
      return fetchApi(`/api/meals/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
    },

    deleteMeal: async (id: string) => {
      return fetchApi(`/api/meals/${id}`, {
        method: "DELETE",
      });
    },

    getTodaysMeals: async () => {
      const today = new Date().toISOString().split('T')[0];
      return api.meals.getMealsByDate(today);
    },

    createMealWithoutAnalysis: async (imageUri: string, selectedDate?: string, timestamp?: string) => {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'meal.jpg',
      } as any);
      if (selectedDate) formData.append('date', selectedDate);
      if (timestamp) formData.append('timestamp', timestamp);

      return fetchApi("/api/meals/save", {
        method: "POST",
        body: formData,
        headers: {
          'Accept': 'application/json'
        },
      });
    },

    triggerAnalysis: async (mealId: string) => {
      return fetchApi(`/api/meals/${mealId}/analyze`, {
        method: "POST"
      });
    }
  },

  weight: {
    checkIn: async (weight: number, date?: string) => {
      return fetchApi("/api/weight/checkin", {
        method: "POST",
        body: JSON.stringify({ weight, date }),
      });
    },

    getHistory: async (days: number = 30) => {
      return fetchApi(`/api/weight/checkin?days=${days}`);
    },

    getByDate: async (date: string) => {
      return fetchApi(`/api/weight/checkin?date=${date}`);
    },
  },

  workout: {
    generatePlan: async (userData: any) => {
      return fetchApi("/api/workout/generate", {
        method: "POST",
        body: JSON.stringify(userData),
        requireAuth: false,
      });
    },
  },

  activities: {
    getActivities: async (date?: string) => {
      const url = date ? `/api/activities?date=${date}` : '/api/activities';
      return fetchApi(url);
    },

    logActivity: async (data: {
      activity_type: string;
      calories_burned: number;
      duration_minutes: number;
      activity_date: string;
    }) => {
      return fetchApi('/api/activities', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    deleteActivity: async (id: string) => {
      return fetchApi(`/api/activities/${id}`, {
        method: 'DELETE',
      });
    },
  },

  notifications: {
    saveToken: async (token: string) => {
      return fetchApi('/api/notifications/token', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
    },
  },
};
