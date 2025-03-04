import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { LoadingDots } from './LoadingDots';

export default function LoadingSpinner() {
  const [spinAnim] = useState(new Animated.Value(0));
  
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  if (Platform.OS === 'android') {
    return (
      <View style={styles.loadingOverlay}>
        <LoadingDots color="#000000" size={6} />
      </View>
    );
  }

  return (
    <View style={styles.loadingOverlay}>
      <View style={styles.spinnerContainer}>
        <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  spinnerContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#f3f3f3',
    borderTopColor: '#000000',
  },
}); 