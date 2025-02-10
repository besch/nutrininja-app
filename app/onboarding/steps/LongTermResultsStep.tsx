import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-gifted-charts";
import commonStyles from "../styles";
import buttonStyles from "../buttonStyles";

interface LongTermResultsStepProps {
  onBack?: () => void;
  onNext?: () => void;
}

export function LongTermResultsStep({
  onBack,
  onNext,
}: LongTermResultsStepProps) {
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - 160;

  // More natural weight loss data
  const nutrininjaData = [
    { value: 85, label: 'Jan', dataPointText: '' },
    { value: 83.8, label: 'Feb', dataPointText: '' },
    { value: 81.2, label: 'Mar', dataPointText: '' },
    { value: 78.5, label: 'Apr', dataPointText: '' },
    { value: 76.3, label: 'May', dataPointText: '' },
    { value: 75.0, label: 'Jun', dataPointText: '' },
  ];

  const traditionalData = [
    { value: 85, label: 'Jan', dataPointText: '' },
    { value: 83.2, label: 'Feb', dataPointText: '' },
    { value: 82.8, label: 'Mar', dataPointText: '' },
    { value: 83.5, label: 'Apr', dataPointText: '' },
    { value: 84.1, label: 'May', dataPointText: '' },
    { value: 84.5, label: 'Jun', dataPointText: '' },
  ];

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={{ flex: 1 }}>
        <View style={commonStyles.header}>
          <TouchableOpacity onPress={onBack} style={commonStyles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={commonStyles.content}>
          <Text style={[commonStyles.title, { lineHeight: 40 }]}>
            Nutri Ninja creates{"\n"}long-term results
          </Text>

          <View style={styles.graphContainer}>
            <View style={styles.graphCard}>
              <View style={styles.graphHeader}>
                <Text style={styles.graphTitle}>Your weight</Text>
              </View>

              <View style={styles.chartContainer}>
                <LineChart
                  width={chartWidth}
                  height={220}
                  spacing={32}
                  hideRules
                  data={nutrininjaData}
                  data2={traditionalData}
                  color="#2089DC"
                  color2="#999"
                  thickness={2}
                  startFillColor="#2089DC"
                  endFillColor="#2089DC"
                  startOpacity={0.1}
                  endOpacity={0.1}
                  initialSpacing={20}
                  endSpacing={20}
                  maxValue={90}
                  noOfSections={5}
                  yAxisColor="#666"
                  xAxisColor="#666"
                  yAxisTextStyle={{ color: '#666', fontSize: 12 }}
                  xAxisLabelTextStyle={{ color: '#666', fontSize: 12, width: 28, textAlign: 'center' }}
                  yAxisThickness={1}
                  xAxisThickness={1}
                  dataPointsColor="#2089DC"
                  dataPointsColor2="#999"
                  dataPointsRadius={3}
                  curved
                  isAnimated
                  animationDuration={500}
                  yAxisLabelSuffix=" kg"
                  showValuesAsDataPointsText={false}
                />
              </View>

              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#2089DC' }]} />
                  <Text style={styles.legendText}>Nutri Ninja</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#999' }]} />
                  <Text style={styles.legendText}>Traditional diet</Text>
                </View>
              </View>

              <Text style={[commonStyles.subtitle, { textAlign: "center", marginTop: 16, marginBottom: 0 }]}>
                80% of Nutri Ninja users maintain their weight loss even 6 months later
              </Text>
            </View>
          </View>
        </View>

        <View style={buttonStyles.nextButtonContainer}>
          <TouchableOpacity style={buttonStyles.nextButton} onPress={onNext}>
            <Text style={buttonStyles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  graphContainer: {
    flex: 1,
    alignItems: "center",
  },
  graphCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  graphHeader: {
    marginBottom: 16,
  },
  graphTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  chartContainer: {
    alignItems: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});

export default LongTermResultsStep;
