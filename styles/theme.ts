import { createTheme } from '@rneui/themed';

export const colors = {
  primary: '#2089dc',
  secondary: '#4CAF50',
  warning: '#FFC107',
  white: '#FFFFFF',
  text: '#000000',
  textSecondary: '#666666',
  gray: {
    200: '#EEEEEE',
  },
};

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
};

export const theme = createTheme({
  lightColors: {
    primary: colors.primary,
    secondary: colors.secondary,
  },
  darkColors: {
    primary: colors.primary,
    secondary: colors.secondary,
  },
});
