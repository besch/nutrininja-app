import React from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { Text } from "@rneui/themed";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCameraPermissions } from "expo-camera";
import { bottomSheetOverlayStyles } from "./overlays/styles";
import { useSelectedDate } from '@/store/userSlice';

interface AddFoodOverlayProps {
  visible: boolean;
  onClose: () => void;
}

const menuOptions = [
  {
    id: "exercise",
    title: "Log Exercise",
    icon: <Feather name="activity" size={24} color="#000" />,
  },
  {
    id: "saved",
    title: "Saved foods",
    icon: <Feather name="bookmark" size={24} color="#000" />,
  },
  {
    id: "barcode",
    title: "Scan barcode",
    icon: <Feather name="maximize" size={24} color="#000" />,
  },
  {
    id: "scan",
    title: "Scan food",
    icon: <Feather name="camera" size={24} color="#000" />,
  },
];

export function AddFoodOverlay({ visible, onClose }: AddFoodOverlayProps) {
  const router = useRouter();
  const selectedDate = useSelectedDate();
  const [permission, requestPermission] = useCameraPermissions();

  const handleOptionPress = async (optionId: string) => {
    onClose();
    if (optionId === "scan") {
      await requestPermission();
      router.push({
        pathname: "/main/camera",
        params: { selectedDate: selectedDate.format('YYYY-MM-DD') }
      });
    } else if (optionId === "barcode") {
      await requestPermission();
      router.push({
        pathname: "/main/camera",
        params: { 
          selectedDate: selectedDate.format('YYYY-MM-DD'),
          mode: 'barcode'
        }
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={bottomSheetOverlayStyles.overlay} onPress={onClose}>
        <View style={bottomSheetOverlayStyles.container}>
          <View style={styles.menuGrid}>
            {menuOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.menuItem}
                onPress={() => handleOptionPress(option.id)}
              >
                <View style={styles.menuIconContainer}>{option.icon}</View>
                <Text style={styles.menuTitle}>{option.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
    padding: 16,
  },
  menuItem: {
    width: "47%",
    aspectRatio: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
  },
});
