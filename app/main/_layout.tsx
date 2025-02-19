import { Stack } from "expo-router";

export default function MainLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="personal-details"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="adjust-goals"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="camera"
        options={{
          title: "Take Photo",
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="food-details"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="best-practices"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="activity-selection"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="activity-details"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
