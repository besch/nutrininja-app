import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Text } from "@rneui/themed";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCameraPermissions } from "expo-camera";
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
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 85,
        friction: 9,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 85,
        friction: 9,
      }).start();
    }
  }, [visible]);

  const handleOptionPress = async (optionId: string) => {
    // Check permissions first if needed
    if (optionId === "scan" || optionId === "barcode") {
      await requestPermission();
    }

    // Quick and smooth closing animation
    onClose();
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Navigate after animation completes
      if (optionId === "scan") {
        router.push({
          pathname: "/main/camera",
          params: { selectedDate: selectedDate.format('YYYY-MM-DD') }
        });
      } else if (optionId === "barcode") {
        router.push({
          pathname: "/main/camera",
          params: { 
            selectedDate: selectedDate.format('YYYY-MM-DD'),
            mode: 'barcode'
          }
        });
      }
    });
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.menuContainer,
            {
              transform: [{ translateY }],
            },
          ]}
        >
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
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  menuContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 40,
  },
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
