import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Text } from "@rneui/themed";
import { Ionicons } from "@expo/vector-icons";
import { overlayStyles, textStyles } from "./styles";

interface OverlayHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  isDisabled?: boolean;
}

export default function OverlayHeader({ 
  title, 
  subtitle, 
  onClose, 
  isDisabled = false 
}: OverlayHeaderProps) {
  return (
    <View style={overlayStyles.header}>
      <View style={overlayStyles.titleContainer}>
        <Text style={overlayStyles.title}>{title}</Text>
        {subtitle && <Text style={textStyles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={overlayStyles.closeButtonContainer}>
        <TouchableOpacity 
          onPress={onClose} 
          style={overlayStyles.closeButton} 
          disabled={isDisabled}
        >
          <Ionicons name="close" size={24} color={isDisabled ? "#999" : "#000"} />
        </TouchableOpacity>
      </View>
    </View>
  );
} 