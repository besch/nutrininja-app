import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface LoadingDotsProps {
  color?: string;
  size?: number;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({ 
  color = '#FFFFFF',
  size = 4,
}) => {
  const animations = [
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ];

  useEffect(() => {
    const createAnimation = (index: number) => {
      return Animated.sequence([
        Animated.delay(index * 200),
        Animated.loop(
          Animated.sequence([
            Animated.timing(animations[index], {
              toValue: 1,
              duration: 400,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
            Animated.timing(animations[index], {
              toValue: 0,
              duration: 400,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
          ])
        ),
      ]);
    };

    Animated.parallel(animations.map((_, index) => createAnimation(index))).start();

    return () => {
      animations.forEach(anim => anim.stopAnimation());
    };
  }, []);

  const dotStyle = (animation: Animated.Value) => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
    marginHorizontal: size / 2,
    opacity: animation,
    transform: [
      {
        scale: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1.1],
        }),
      },
    ],
  });

  return (
    <View style={styles.container}>
      {animations.map((animation, index) => (
        <Animated.View key={index} style={dotStyle(animation)} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
}); 