import React from 'react';
import { Tabs } from "expo-router";
import { Icon } from "@rneui/themed";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCameraPermissions } from "expo-camera";
import { useSelectedDate } from '@/store/userSlice';

export default function TabLayout() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const selectedDate = useSelectedDate();

  const handleAddMeal = async () => {
    await requestPermission();
    router.push({
      pathname: "/main/camera",
      params: { selectedDate: selectedDate.format('YYYY-MM-DD') }
    });
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#2089dc",
          headerShown: true,
          headerStyle: {
            ...Platform.select({
              ios: {
                ...StyleSheet.flatten([styles.headerIOS]),
              },
              android: {
                height: 60,
              },
            }),
          },
          headerTitleStyle: {
            fontSize: 20,
            marginTop: Platform.OS === "ios" ? 50 : 0,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Icon name="home" type="feather" color={color} size={size} />
            ),
          }}
        />

        <Tabs.Screen
          name="analytics"
          options={{
            title: "Analytics",
            tabBarIcon: ({ color, size }) => (
              <Icon name="bar-chart-2" type="feather" color={color} size={size} />
            ),
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <Icon name="settings" type="feather" color={color} size={size} />
            ),
          }}
        />

        <Tabs.Screen
          name="empty"
          options={{
            title: "",
            tabBarIcon: () => null,
            tabBarButton: () => null
          }}
        />
      </Tabs>

      <TouchableOpacity
        style={styles.addButtonContainer}
        onPress={handleAddMeal}
      >
        <View style={styles.addButton}>
          <Feather name="plus" size={24} color="#fff" />
        </View>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  headerIOS: {
    height: 60,
  },
  addButtonContainer: {
    position: "absolute",
    bottom: 60,
    right: 24,
    zIndex: 1,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
