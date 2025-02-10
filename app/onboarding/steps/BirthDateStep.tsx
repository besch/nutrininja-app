import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, FlatList, Text, StyleSheet } from "react-native";
import WheelPicker, { ValueChangedEvent, RenderItemProps } from "@quidone/react-native-wheel-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import commonStyles from "../styles";
import wheelPickerStyles from "../wheelPickerStyles";
import buttonStyles from "../buttonStyles";

interface PickerItem {
  label: string;
  value: number;
}

interface BirthDateStepProps {
  value: string;
  onChange: (value: string) => void;
  onBack?: () => void;
  onNext?: () => void;
}

export function BirthDateStep({
  value,
  onChange,
  onBack,
  onNext,
}: BirthDateStepProps) {
  const date = value ? new Date(value) : new Date();
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedYear, setSelectedYear] = useState(2000);
  const [isReady, setIsReady] = useState(false);

  // Set initial date value when component mounts and defer WheelPicker rendering
  useEffect(() => {
    handleDateChange(selectedMonth, selectedDay, selectedYear);
    // Defer WheelPicker rendering until after animation
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 300); // Match this with your animation duration

    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (onNext) onNext();
  };

  const handleBack = () => {
    if (onBack) onBack();
  };

  const days = Array.from({ length: 31 }, (_, i) => ({
    label: (i + 1).toString(),
    value: i + 1,
  }));

  const monthItems = [
    { label: "Jan", value: 1 },
    { label: "Feb", value: 2 },
    { label: "Mar", value: 3 },
    { label: "Apr", value: 4 },
    { label: "May", value: 5 },
    { label: "Jun", value: 6 },
    { label: "Jul", value: 7 },
    { label: "Aug", value: 8 },
    { label: "Sep", value: 9 },
    { label: "Oct", value: 10 },
    { label: "Nov", value: 11 },
    { label: "Dec", value: 12 },
  ];

  const currentYear = new Date().getFullYear();
  const maxYear = currentYear - 3; // Don't allow selections less than 3 years ago
  const years = Array.from({ length: 92 }, (_, i) => {
    const year = currentYear - 94 + i; // Start from 94 years ago
    if (year > maxYear) return undefined;
    return { label: year.toString(), value: year };
  }).filter((item): item is { label: string; value: number } => item !== undefined);

  const handleDateChange = (month: number, day: number, year: number) => {
    const newDate = new Date(year, month - 1, day);
    onChange(newDate.toISOString());
  };

  const renderHeader = () => (
    <View style={commonStyles.header}>
      <TouchableOpacity onPress={handleBack} style={commonStyles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
      <View style={commonStyles.progressBar}>
        <View style={[commonStyles.progressFill, { width: "32%" }]} />
      </View>
    </View>
  );

  const renderContent = () => (
    <View style={commonStyles.content}>
      <Text style={commonStyles.title}>When were you born?</Text>
      <Text style={commonStyles.subtitle}>
        This will be used to calibrate your custom plan.
      </Text>
      {renderPickers()}
    </View>
  );

  const renderPickers = () => {
    if (!isReady) {
      // Show placeholder loading state during animation
      return (
        <View style={wheelPickerStyles.pickerWrapper}>
          <View style={[wheelPickerStyles.picker, wheelPickerStyles.placeholderPicker]}>
            <Text style={wheelPickerStyles.label}>Month</Text>
            <View style={wheelPickerStyles.placeholder} />
          </View>
          <View style={[wheelPickerStyles.picker, wheelPickerStyles.placeholderPicker]}>
            <Text style={wheelPickerStyles.label}>Day</Text>
            <View style={wheelPickerStyles.placeholder} />
          </View>
          <View style={[wheelPickerStyles.picker, wheelPickerStyles.placeholderPicker]}>
            <Text style={wheelPickerStyles.label}>Year</Text>
            <View style={wheelPickerStyles.placeholder} />
          </View>
        </View>
      );
    }

    return (
      <View style={wheelPickerStyles.pickerWrapper}>
        <View style={wheelPickerStyles.picker}>
          <Text style={wheelPickerStyles.label}>Month</Text>
          <View style={wheelPickerStyles.pickerContainer}>
            <WheelPicker<PickerItem>
              data={monthItems}
              value={selectedMonth}
              itemHeight={52}
              visibleItemCount={5}
              width="100%"
              keyExtractor={(item) => item.value.toString()}
              renderItem={(props: RenderItemProps<PickerItem>) => (
                <View style={wheelPickerStyles.itemContainer}>
                  <Text style={wheelPickerStyles.itemText}>{props.item.label}</Text>
                </View>
              )}
              onValueChanged={(event: ValueChangedEvent<PickerItem>) => {
                setSelectedMonth(event.item.value);
                handleDateChange(event.item.value, selectedDay, selectedYear);
              }}
            />
          </View>
        </View>

        <View style={wheelPickerStyles.picker}>
          <Text style={wheelPickerStyles.label}>Day</Text>
          <View style={wheelPickerStyles.pickerContainer}>
            <WheelPicker<PickerItem>
              data={days}
              value={selectedDay}
              itemHeight={52}
              visibleItemCount={5}
              width="100%"
              keyExtractor={(item) => item.value.toString()}
              renderItem={(props: RenderItemProps<PickerItem>) => (
                <View style={wheelPickerStyles.itemContainer}>
                  <Text style={wheelPickerStyles.itemText}>{props.item.label}</Text>
                </View>
              )}
              onValueChanged={(event: ValueChangedEvent<PickerItem>) => {
                setSelectedDay(event.item.value);
                handleDateChange(selectedMonth, event.item.value, selectedYear);
              }}
            />
          </View>
        </View>

        <View style={wheelPickerStyles.picker}>
          <Text style={wheelPickerStyles.label}>Year</Text>
          <View style={wheelPickerStyles.pickerContainer}>
            <WheelPicker<PickerItem>
              data={years}
              value={selectedYear}
              itemHeight={52}
              visibleItemCount={5}
              width="100%"
              keyExtractor={(item) => item.value.toString()}
              renderItem={(props: RenderItemProps<PickerItem>) => (
                <View style={wheelPickerStyles.itemContainer}>
                  <Text style={wheelPickerStyles.itemText}>{props.item.label}</Text>
                </View>
              )}
              onValueChanged={(event: ValueChangedEvent<PickerItem>) => {
                setSelectedYear(event.item.value);
                handleDateChange(selectedMonth, selectedDay, event.item.value);
              }}
            />
          </View>
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    disabledButton: {
      backgroundColor: '#ccc',
    },
    disabledButtonText: {
      color: '#999',
    }
  });

  return (
    <SafeAreaView style={wheelPickerStyles.safeArea}>
      <View style={{ flex: 1 }}>
        <FlatList
          data={[{ key: "content" }]}
          renderItem={() => renderContent()}
          ListHeaderComponent={renderHeader}
          scrollEnabled={false}
          style={wheelPickerStyles.container}
        />
        <View style={buttonStyles.nextButtonContainer}>
          <TouchableOpacity 
            style={[
              buttonStyles.nextButton,
              !isReady && styles.disabledButton
            ]} 
            onPress={handleNext}
            disabled={!isReady}
          >
            <Text style={[
              buttonStyles.nextButtonText,
              !isReady && styles.disabledButtonText
            ]}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default BirthDateStep;
