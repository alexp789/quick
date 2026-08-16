import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RaceProvider } from './src/context/RaceContext';
import { RaceDashboardScreen } from './src/screens/RaceDashboardScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <RaceProvider>
        <StatusBar style="light" />
        <RaceDashboardScreen />
      </RaceProvider>
    </SafeAreaProvider>
  );
}
