import React, { useState, useEffect } from "react";
import { View, StyleSheet, Modal, Text } from "react-native";
import WheelPicker, { ValueChangedEvent, RenderItemProps } from "@quidone/react-native-wheel-picker";
import { Button } from "@/components/ui/Button";
import { overlayStyles, textStyles } from "./styles";
import OverlayHeader from "./OverlayHeader";

interface DatePickerOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (date: string) => Promise<void>;
  initialValue: string;
}

interface PickerItem {
  label: string;
  value: number;
}

export default function DatePickerOverlay({
  isVisible,
  onClose,
  onSave,
  initialValue,
}: DatePickerOverlayProps) {
  const date = initialValue ? new Date(initialValue) : new Date();
  const [selectedMonth, setSelectedMonth] = useState(date.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(date.getDate());
  const [selectedYear, setSelectedYear] = useState(date.getFullYear());
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Defer WheelPicker rendering until after animation
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [isVisible]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const newDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
      await onSave(newDate.toISOString());
      onClose();
    } catch (error) {
      console.error('Error saving date:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const days = Array.from({ length: 31 }, (_, i) => ({
    label: (i + 1).toString(),
    value: i + 1,
  }));

  const monthItems = Array.from({ length: 12 }, (_, i) => ({
    label: (i + 1).toString(),
    value: i + 1,
  }));

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => ({
    label: (currentYear - 99 + i).toString(),
    value: currentYear - 99 + i,
  }));

  const renderPickers = () => {
    if (!isReady) {
      return (
        <View style={styles.pickerWrapper}>
          <View style={styles.picker}>
            <Text style={textStyles.label}>Month</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.picker}>
            <Text style={textStyles.label}>Day</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.picker}>
            <Text style={textStyles.label}>Year</Text>
            <View style={styles.placeholder} />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.pickerWrapper}>
        <View style={styles.picker}>
          <Text style={textStyles.label}>Month</Text>
          <View style={styles.pickerContainer}>
            <WheelPicker<PickerItem>
              data={monthItems}
              value={selectedMonth}
              itemHeight={52}
              visibleItemCount={5}
              width="100%"
              keyExtractor={(item) => item.value.toString()}
              renderItem={(props: RenderItemProps<PickerItem>) => (
                <View style={[
                  styles.itemContainer,
                  props.item.value === selectedMonth && styles.selectedItemContainer
                ]}>
                  <Text style={styles.itemText}>{props.item.label}</Text>
                </View>
              )}
              onValueChanged={(event: ValueChangedEvent<PickerItem>) => {
                setSelectedMonth(event.item.value);
              }}
            />
          </View>
        </View>

        <View style={styles.picker}>
          <Text style={textStyles.label}>Day</Text>
          <View style={styles.pickerContainer}>
            <WheelPicker<PickerItem>
              data={days}
              value={selectedDay}
              itemHeight={52}
              visibleItemCount={5}
              width="100%"
              keyExtractor={(item) => item.value.toString()}
              renderItem={(props: RenderItemProps<PickerItem>) => (
                <View style={[
                  styles.itemContainer,
                  props.item.value === selectedDay && styles.selectedItemContainer
                ]}>
                  <Text style={styles.itemText}>{props.item.label}</Text>
                </View>
              )}
              onValueChanged={(event: ValueChangedEvent<PickerItem>) => {
                setSelectedDay(event.item.value);
              }}
            />
          </View>
        </View>

        <View style={styles.picker}>
          <Text style={textStyles.label}>Year</Text>
          <View style={styles.pickerContainer}>
            <WheelPicker<PickerItem>
              data={years}
              value={selectedYear}
              itemHeight={52}
              visibleItemCount={5}
              width="100%"
              keyExtractor={(item) => item.value.toString()}
              renderItem={(props: RenderItemProps<PickerItem>) => (
                <View style={[
                  styles.itemContainer,
                  props.item.value === selectedYear && styles.selectedItemContainer
                ]}>
                  <Text style={styles.itemText}>{props.item.label}</Text>
                </View>
              )}
              onValueChanged={(event: ValueChangedEvent<PickerItem>) => {
                setSelectedYear(event.item.value);
              }}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={overlayStyles.overlay}>
        <View style={overlayStyles.container}>
          <OverlayHeader 
            title="Select Date"
            onClose={onClose}
            isDisabled={isLoading}
          />

          {renderPickers()}

          <Button
            title="Save"
            onPress={handleSave}
            loading={isLoading}
            disabled={isLoading || !isReady}
            style={[
              overlayStyles.saveButton,
              (!isReady || isLoading) && overlayStyles.disabledButton
            ]}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pickerWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 20,
    marginBottom: 20,
  },
  picker: {
    flex: 1,
    alignItems: "center",
  },
  pickerContainer: {
    height: 200,
    overflow: "hidden",
  },
  itemContainer: {
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20, // Add horizontal padding to all items
  },
  itemText: {
    color: "#000",
    fontSize: 16,
  },
  selectedItemContainer: {
    backgroundColor: "#f5f5f5",
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  placeholder: {
    height: 200,
    width: "100%",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
});
