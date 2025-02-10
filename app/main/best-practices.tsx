import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function BestPracticesScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Best scanning practices</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.examplesContainer}>
          <View style={styles.doContainer}>
            <View style={styles.doHeader}>
              <MaterialIcons name="check-circle" size={24} color="black" />
              <Text style={styles.doHeaderText}>Do</Text>
            </View>
            <Image 
              source={require('@/assets/images/do-example.png')} 
              style={styles.exampleImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.dontContainer}>
            <View style={styles.doHeader}>
              <MaterialIcons name="cancel" size={24} color="#FF6B6B" />
              <Text style={styles.doHeaderText}>Don't</Text>
            </View>
            <Image 
              source={require('@/assets/images/dont-example.png')} 
              style={styles.exampleImage}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsHeader}>General tips:</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tipText}>• Keep the food inside the scan lines</Text>
            <Text style={styles.tipText}>• Hold your phone still so the image is not blurry</Text>
            <Text style={styles.tipText}>• Don't take the picture at obscure angles</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginRight: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  examplesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  doContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  dontContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  doHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  doHeaderText: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 12,
  },
  exampleImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  tipsContainer: {
    marginBottom: 24,
  },
  tipsHeader: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  tipsList: {
    gap: 12,
  },
  tipText: {
    fontSize: 16,
    color: '#4A4A4A',
    lineHeight: 24,
  },
  scanButton: {
    backgroundColor: '#18181B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  }
}); 