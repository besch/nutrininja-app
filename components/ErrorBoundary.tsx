import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@rneui/themed';
import { Feather } from '@expo/vector-icons';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import * as Updates from 'expo-updates';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  isOffline: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state = {
    hasError: false,
    isOffline: false,
  };

  unsubscribe: (() => void) | null = null;

  componentDidMount() {
    // Subscribe to network state updates
    this.unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      this.setState({ isOffline: !state.isConnected });
    });
  }

  componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = async () => {
    this.setState({ hasError: false });
    try {
      await Updates.reloadAsync();
    } catch (err) {
      // If expo-updates fails, try to force a re-render
      this.setState({ hasError: false });
    }
  };

  render() {
    if (this.state.isOffline) {
      return (
        <View style={styles.container}>
          <Feather name="wifi-off" size={64} color="#666" />
          <Text style={styles.title}>No Internet Connection</Text>
          <Text style={styles.message}>
            Please check your internet connection and try again
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={this.handleRetry}
          >
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Feather name="alert-circle" size={64} color="#666" />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            We're sorry, but something went wrong. Please try again.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={this.handleRetry}
          >
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#000',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 