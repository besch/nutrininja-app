import React from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from "react-native";
import { Text } from "@rneui/themed";
import { Button } from "@/components/ui/Button";
import { Ionicons } from "@expo/vector-icons";
import { overlayStyles } from "./styles";

interface BaseOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSave?: () => void;
  isLoading?: boolean;
}

export default function BaseOverlay({
  isVisible,
  onClose,
  title,
  children,
  onSave,
  isLoading = false,
}: BaseOverlayProps) {
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{title}</Text>
            </View>
            <View style={styles.closeButtonContainer}>
              <TouchableOpacity 
                onPress={onClose} 
                style={[styles.closeButton, isLoading && styles.disabledButton]} 
                disabled={isLoading}
              >
                <Ionicons name="close" size={24} color={isLoading ? "#999" : "#000"} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.body}>{children}</View>

          <View style={styles.footer}>
            <Button
              title="OK"
              onPress={onSave || (() => {})}
              loading={isLoading}
              disabled={isLoading || !onSave}
              style={styles.button}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  ...overlayStyles,
  container: {
    ...overlayStyles.container,
    width: "90%",
    maxHeight: "80%",
  },
  closeButtonContainer: {
    marginLeft: 'auto',
  },
  closeButton: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  disabledButton: {
    opacity: 0.5,
  },
  body: {
    marginBottom: 20,
    width: '100%',
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  button: {
    minWidth: 200,
    ...overlayStyles.saveButton,
  },
});
