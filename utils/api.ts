import { supabase } from './supabase';
import type { DailyProgressResponse } from '@/types';
import { Platform } from 'react-native';

type ApiOptions = RequestInit & {
  requireAuth?: boolean;
  isOnboarding?: boolean;
};

async function fetchApi(path: string, options: ApiOptions = {}) {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Don't set Content-Type for multipart/form-data as the browser/RN will set it with the boundary
  const isMultipartFormData = options.body instanceof FormData;
  
  if (!isMultipartFormData) {
    headers['Content-Type'] = 'application/json';
  } else {
    // For multipart/form-data, we need to remove the Content-Type header
    // as React Native will set it with the correct boundary
    delete headers['Content-Type'];
  }

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
      
      // Handle file URI for both iOS and Android
      const filename = imageUri.split('/').pop() || 'meal.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
      
      // For Android content:// URIs, we need to ensure they're handled properly
      let fileUri = imageUri;
      
      // On Android, ensure we're using the right URI format
      if (Platform.OS === 'android') {
        // If it's a content URI, we keep it as is
        // If it's a file URI without the file:// prefix, add it
        if (!imageUri.startsWith('content://') && !imageUri.startsWith('file://')) {
          fileUri = `file://${imageUri}`;
        }
      }
      
      const fileToUpload = {
        uri: fileUri,
        type,
        name: filename,
      };
      
      formData.append('image', fileToUpload as any);
      
      if (selectedDate) {
        formData.append('date', selectedDate);
      }
      
      if (timestamp) formData.append('timestamp', timestamp);

      try {
        return await fetchApi("/api/meals/save", {
          method: "POST",
          body: formData,
        });
      } catch (error) {
        console.error('Error uploading meal image:', error);
        throw error;
      }
    },

    triggerAnalysis: async (mealId: string) => {
      return fetchApi(`/api/meals/${mealId}/analyze`, {
        method: "POST"
      });
    },

    toggleBookmark: async (mealId: string) => {
      return fetchApi(`/api/meals/${mealId}/bookmark`, {
        method: "POST"
      });
    },

    isBookmarked: async (mealId: string) => {
      return fetchApi(`/api/meals/${mealId}/bookmark`);
    },

    getBookmarkedMeals: async () => {
      return fetchApi('/api/meals/bookmarks');
    },

    cloneMeal: async (mealId: string, date: string) => {
      return fetchApi(`/api/meals/${mealId}/clone`, {
        method: "POST",
        body: JSON.stringify({ date })
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

    analyzeActivityDescription: async (description: string) => {
      return fetchApi('/api/activities/analyze', {
        method: 'POST',
        body: JSON.stringify({ description }),
      });
    },

    logActivity: async (data: {
      activity_type: string;
      calories_burned: number;
      duration_minutes: number;
      activity_date: string;
      intensity?: string;
      description?: string;
    }) => {
      return fetchApi('/api/activities', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    updateActivity: async (id: string, data: {
      activity_type: string;
      calories_burned: number;
      duration_minutes: number;
      activity_date: string;
      intensity?: string;
      description?: string;
    }) => {
      return fetchApi(`/api/activities/${id}`, {
        method: 'PUT',
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
