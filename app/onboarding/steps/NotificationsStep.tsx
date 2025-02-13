import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import commonStyles from "../styles";
import buttonStyles from "../buttonStyles";
import { registerForPushNotificationsAsync } from "@/utils/notifications";

interface NotificationsStepProps {
  value?: boolean;
  onChange: (value: boolean) => void;
  onBack?: () => void;
  onNext?: () => void;
}

export function NotificationsStep({
  value,
  onChange,
  onBack,
  onNext,
}: NotificationsStepProps) {
  const handleNotificationPermission = async (allow: boolean) => {
    if (allow) {
      const token = await registerForPushNotificationsAsync();
      onChange(token !== null);
    } else {
      onChange(false);
    }
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={{ flex: 1 }}>
        <View style={commonStyles.header}>
          <TouchableOpacity onPress={onBack} style={commonStyles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={[commonStyles.content, { alignItems: "center" }]}>
          <View style={styles.imageContainer}>
            <Image
              source={require("@/assets/images/person3.png")}
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.goalBadge}>
              <Ionicons
                name="notifications-outline"
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.goalText}>Today's goal</Text>
              <Text style={styles.goalValue}>500 Cal</Text>
            </View>
          </View>

          <Text
            style={[
              commonStyles.title,
              { textAlign: "center", lineHeight: 40 },
            ]}
          >
            Reach your goals with{"\n"}notifications
          </Text>

          <View style={styles.notificationCard}>
            <Text style={styles.notificationText}>
              Nutri Ninja would like to send you{"\n"}Notifications
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.denyButton]}
                onPress={() => handleNotificationPermission(false)}
              >
                <Text style={styles.denyButtonText}>Don't Allow</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.allowButton]}
                onPress={() => handleNotificationPermission(true)}
              >
                <Text style={styles.allowButtonText}>Allow</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[commonStyles.subtitle, { textAlign: "center" }]}>
            You can turn off any of the reminders at any time in{"\n"}the
            settings. We won't spam you.
          </Text>
        </View>
        <View style={buttonStyles.nextButtonContainer}>
          <TouchableOpacity
            style={[
              buttonStyles.nextButton,
              value === undefined && buttonStyles.nextButtonDisabled,
            ]}
            onPress={onNext}
            disabled={value === undefined}
          >
            <Text
              style={[
                buttonStyles.nextButtonText,
                value === undefined && buttonStyles.nextButtonTextDisabled,
              ]}
            >
              Next
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    width: "100%",
    height: 300,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 32,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  goalBadge: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 12,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  goalText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  goalValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  notificationCard: {
    width: "100%",
    backgroundColor: "#F8F8F8",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  notificationText: {
    fontSize: 18,
    color: "#000000",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  denyButton: {
    backgroundColor: "#F0F0F0",
  },
  allowButton: {
    backgroundColor: "#000000",
  },
  denyButtonText: {
    fontSize: 16,
    color: "#666666",
    fontWeight: "500",
  },
  allowButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
});

export default NotificationsStep;
