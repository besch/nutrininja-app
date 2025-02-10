import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text } from '@rneui/themed';

export const Header: React.FC = () => {
  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.headImage}
        />
        <Text style={styles.logo}>Nutri Ninja</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 0,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    fontSize: 35,
    fontWeight: "600",
    fontFamily: "Oswald",
  },
  headImage: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
}); 