import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

interface DotNavigationProps {
  currentIndex: number;
  onDotPress: (index: number) => void;
}

const DotNavigation: React.FC<DotNavigationProps> = ({ currentIndex, onDotPress }) => {
  return (
    <View style={styles.container}>
      {[0, 1, 2].map((index) => (
        <TouchableOpacity
          key={index}
          onPress={() => onDotPress(index)}
          style={styles.dotContainer}
        >
          <View style={[
            styles.dot,
            currentIndex === index && styles.activeDot
          ]} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dotContainer: {
    padding: 8, // Larger touch target
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  activeDot: {
    backgroundColor: '#000000',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default DotNavigation; 