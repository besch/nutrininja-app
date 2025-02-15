import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons as MCIcon } from "@expo/vector-icons";
import * as StoreReview from 'react-native-store-review';
import commonStyles from "../styles";
import buttonStyles from "../buttonStyles";

interface RatingStepProps {
  onBack?: () => void;
  onNext?: () => void;
}

const StarRating = () => (
  <View style={styles.starContainer}>
    {[1, 2, 3, 4, 5].map((_, index) => (
      <MCIcon
        key={index}
        name="star"
        size={35}
        color="#FFD700"
        style={styles.star}
      />
    ))}
  </View>
);

const TestimonialCard = ({
  name,
  rating,
  text,
}: {
  name: string;
  rating: number;
  text: string;
}) => (
  <View style={styles.testimonialCard}>
    <View style={styles.testimonialHeader}>
      <Text style={styles.testimonialName}>{name}</Text>
      <View style={styles.testimonialStars}>
        {[1, 2, 3, 4, 5].map((_, index) => (
          <MCIcon
            key={index}
            name="star"
            size={16}
            color="#FFD700"
            style={styles.testimonialStar}
          />
        ))}
      </View>
    </View>
    <Text style={styles.testimonialText}>"{text}"</Text>
  </View>
);

export function RatingStep({ onBack, onNext }: RatingStepProps) {
  const [isNextButtonDisabled, setIsNextButtonDisabled] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      StoreReview.requestReview();
      // Enable the button after 2 seconds to ensure the rating prompt is shown
      const timer = setTimeout(() => {
        setIsNextButtonDisabled(false);
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setIsNextButtonDisabled(false);
    }
  }, []);

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={{ flex: 1 }}>
        <View style={commonStyles.header}>
          <TouchableOpacity onPress={onBack} style={commonStyles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={commonStyles.content}>
          <Text style={commonStyles.title}>Give us rating</Text>
          <StarRating />

          <View style={styles.usersSection}>
            <Text style={styles.usersTitle}>
              Nutri Ninja was made for{"\n"}people like you
            </Text>
            <View style={styles.avatarsContainer}>
              <Image
                source={require("@/assets/images/faces.png")}
                style={styles.facesImage}
              />
            </View>
            <Text style={styles.userCount}>+ 1000 Nutri Ninja Users</Text>
          </View>

          <View style={styles.testimonials}>
            <TestimonialCard
              name="Anthony Levandowski"
              rating={5}
              text="There are so many avenues of self-improvement within this app. From relaxation to confidence"
            />
            <TestimonialCard
              name="Benny Marcs"
              rating={5}
              text="The time I have saved not weighing my food has allowed me to start trading stocks during the day."
            />
          </View>
        </View>
        <View style={buttonStyles.nextButtonContainer}>
          <TouchableOpacity 
            style={[
              buttonStyles.nextButton,
              isNextButtonDisabled && { opacity: 0.5 }
            ]} 
            onPress={onNext}
            disabled={isNextButtonDisabled}
          >
            <Text style={buttonStyles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  starContainer: {
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#F8F8F8",
    padding: 8,
    borderRadius: 16,
    marginBottom: 12,
  },
  star: {
    marginHorizontal: 4,
  },
  usersSection: {
    marginBottom: 6,
  },
  usersTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
    lineHeight: 28,
  },
  avatarsContainer: {
    flexDirection: "row",
    marginBottom: 4,
  },
  facesImage: {
    width: 140,
    height: 50,
    resizeMode: 'contain',
  },
  userCount: {
    fontSize: 14,
    color: "#666666",
  },
  testimonials: {
    gap: 8,
  },
  testimonialCard: {
    backgroundColor: "#F0F0F0",
    borderRadius: 16,
    padding: 12,
  },
  testimonialHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  testimonialName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  testimonialStars: {
    flexDirection: "row",
  },
  testimonialStar: {
    marginLeft: 2,
  },
  testimonialText: {
    fontSize: 16,
    color: "#666666",
    lineHeight: 21,
  },
});

export default RatingStep;
