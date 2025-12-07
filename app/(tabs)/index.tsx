import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { NavigationBar } from '../../components/NavigationBar';
import { useAuth } from '../../context/AuthContext';

// Import the components from the components/ folder
import UserHabitForm from '../../components/UserHabitForm';

export default function HomeScreen() {
  const { navWidth } = useAuth();
  return (
    <View style={[styles.container, { paddingLeft: navWidth }] }>
      <NavigationBar />
      <ScrollView contentContainerStyle={styles.content}>
        <UserHabitForm />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  content: {
    flexGrow: 1,
    backgroundColor: '#f0f2f5', 
    alignItems: 'center',
    paddingVertical: 40,
  },
});
