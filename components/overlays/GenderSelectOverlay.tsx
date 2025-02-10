import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { Text } from "@rneui/themed";
import { Button } from "@/components/ui/Button";
import { overlayStyles } from "./styles";
import OverlayHeader from "./OverlayHeader";

type Gender = "male" | "female" | "other";

interface GenderSelectOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (gender: Gender) => Promise<void>;
  initialValue: Gender;
}

export default function GenderSelectOverlay({
  isVisible,
  onClose,
  onSave,
  initialValue,
}: GenderSelectOverlayProps) {
  const [selectedGender, setSelectedGender] = useState<Gender>(initialValue);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await onSave(selectedGender);
      onClose();
    } catch (error) {
      console.error('Error saving gender:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const options: { value: Gender; label: string }[] = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
  ];

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
            title="Select Gender"
            onClose={onClose}
            isDisabled={isLoading}
          />

          <View style={overlayStyles.optionsContainer}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={overlayStyles.option}
                onPress={() => setSelectedGender(option.value)}
                disabled={isLoading}
              >
                <View style={overlayStyles.radioContainer}>
                  <View
                    style={[
                      overlayStyles.radio,
                      selectedGender === option.value && overlayStyles.radioSelected,
                    ]}
                  >
                    {selectedGender === option.value && (
                      <View style={overlayStyles.radioInner} />
                    )}
                  </View>
                  <Text style={overlayStyles.optionLabel}>{option.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <Button
            title="Save"
            onPress={handleSave}
            loading={isLoading}
            disabled={isLoading}
            style={overlayStyles.saveButton}
          />
        </View>
      </View>
    </Modal>
  );
}
