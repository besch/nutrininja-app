import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text } from "@rneui/themed";
import { Button } from "@/components/ui/Button";
import { overlayStyles, textStyles, inputStyles } from "./styles";
import OverlayHeader from "./OverlayHeader";

interface Props {
  isVisible: boolean;
  onClose: () => void;
  onSave: (value: number) => Promise<void>;
  title: string;
  subtitle?: string;
  initialValue: number;
  unit: string;
}

export default function NumericInputOverlay({
  isVisible,
  onClose,
  onSave,
  title,
  subtitle,
  initialValue,
  unit,
}: Props) {
  const [value, setValue] = useState(initialValue.toString());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      setError(null);
      setValue(initialValue.toString());
    }
  }, [isVisible, initialValue]);

  const getMaxValue = (unit: string) => {
    switch (unit) {
      case 'kcal':
        return 9999;
      case 'g':
        return 999;
      case 'kg':
        return 300;
      default:
        return 999;
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const normalizedValue = value.replace(',', '.');
      const numericValue = Math.min(
        Math.max(0, parseFloat(normalizedValue) || 0),
        getMaxValue(unit)
      );
      await onSave(numericValue);
      onClose();
    } catch (error: any) {
      let errorMessage = "An error occurred while saving";
      if (error?.message) {
        try {
          const parsedError = JSON.parse(error.message);
          errorMessage = parsedError.error;
        } catch {
          errorMessage = error.message;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeText = (text: string) => {
    const normalizedText = text.replace(',', '.');
    
    if (unit === 'kg') {
      const regex = /^\d*\.?\d{0,1}$/;
      if (regex.test(normalizedText) || normalizedText === '') {
        setValue(text);
      }
    } else {
      const regex = /^\d*$/;
      if (regex.test(normalizedText)) {
        setValue(text);
      }
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={overlayStyles.overlay}
      >
        <View style={overlayStyles.container}>
          <OverlayHeader 
            title={title}
            subtitle={subtitle}
            onClose={onClose}
            isDisabled={isLoading}
          />

          <View style={inputStyles.container}>
            <TextInput
              style={[inputStyles.input, isLoading && inputStyles.inputDisabled]}
              value={value}
              onChangeText={handleChangeText}
              keyboardType="decimal-pad"
              maxLength={unit === 'kg' ? 5 : unit === 'kcal' ? 4 : 3}
              autoFocus
              editable={!isLoading}
            />
            <Text style={inputStyles.unit}>{unit}</Text>
          </View>

          {error && (
            <Text style={textStyles.error}>{error}</Text>
          )}

          <Button
            title="Save"
            onPress={handleSave}
            loading={isLoading}
            disabled={isLoading}
            style={overlayStyles.saveButton}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
