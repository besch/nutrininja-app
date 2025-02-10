import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface MacroData {
  remaining: number;
  total: number;
}

interface MacrosSummaryProps {
  isLoading: boolean;
  proteins?: MacroData;
  carbs?: MacroData;
  fats?: MacroData;
}

const MacroCard: React.FC<{
  value: number;
  label: string;
  icon: string;
  color: string;
  total: number;
  isNegative: boolean;
}> = ({ value, label, icon, color, total, isNegative }) => {
  // Calculate the goal value (total + remaining when not over)
  const goalValue = isNegative ? total : (total + value);

  return (
    <View style={styles.macroCard}>
      <View style={styles.macroCardContent}>
        <Text style={[styles.macroValue, isNegative && styles.negativeValue]}>
          {Math.abs(value)}g
        </Text>
        <Text 
          style={[styles.macroLabel, isNegative && styles.negativeValue]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {isNegative ? `${label} over` : `${label} left`}
        </Text>
        <View style={styles.macroProgress}>
          {isNegative ? (
            <Progress.Circle
              size={60}
              progress={Math.min(1, total ? Math.abs(value) / total : 0)}
              thickness={7}
              color="#FF6B6B"
              unfilledColor="#eee"
              borderWidth={0}
              animated
              strokeCap="round"
            />
          ) : (
            <Progress.Circle
              size={60}
              progress={Math.min(1, goalValue ? total / goalValue : 0)}
              thickness={7}
              color={color}
              unfilledColor="#eee"
              borderWidth={0}
              animated
              strokeCap="round"
            />
          )}
          <View style={styles.circleIcon}>
            <Ionicons 
              name={icon as any} 
              size={20} 
              color="#FFF" 
              style={{ backgroundColor: color, padding: 2, borderRadius: 12 }} 
            />
          </View>
        </View>
      </View>
    </View>
  );
};

export const MacrosSummary: React.FC<MacrosSummaryProps> = ({
  isLoading,
  proteins = { remaining: 0, total: 0 },
  carbs = { remaining: 0, total: 0 },
  fats = { remaining: 0, total: 0 },
}) => {
  if (isLoading) {
    return (
      <View style={styles.macrosContainer}>
        {Array(3).fill(0).map((_, index) => (
          <View key={index} style={styles.macroCard}>
            <View style={styles.macroCardContent}>
              <View style={styles.loadingContainer}>
                <LoadingSpinner />
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.macrosContainer}>
      <MacroCard
        value={proteins.remaining}
        label="Protein"
        icon="flash-outline"
        color="#FF3B30"
        total={proteins.total}
        isNegative={proteins.remaining < 0}
      />
      <MacroCard
        value={carbs.remaining}
        label="Carbs"
        icon="leaf-outline"
        color="#FF9500"
        total={carbs.total}
        isNegative={carbs.remaining < 0}
      />
      <MacroCard
        value={fats.remaining}
        label="Fats"
        icon="water-outline"
        color="#007AFF"
        total={fats.total}
        isNegative={fats.remaining < 0}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  macrosContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  macroCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: 150,
  },
  macroCardContent: {
    padding: 16,
    height: '100%',
    position: 'relative',
    justifyContent: 'space-between',
  },
  macroValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    width: '100%',
  },
  macroProgress: {
    alignItems: "center",
    marginTop: 'auto',
  },
  circleIcon: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },
  negativeValue: {
    color: '#FF6B6B',
  },
}); 