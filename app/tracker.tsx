import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import HabitTrackerItem from '../components/HabitTrackerItem';
import { NavigationBar } from '../components/NavigationBar';
import WeeklyUserData from '../components/WeeklyUserData';
import { API_URL } from '../constants/Config';
import { useAuth } from '../context/AuthContext';

interface Habit {
  id: string;
  title: string;
}

export default function TrackerScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [refreshAt, setRefreshAt] = useState<number>(Date.now());
  const { navWidth } = useAuth();

  const loadHabits = async () => {
    try {
      const res = await fetch(`${API_URL}/api/habits`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setHabits(data.map((h: any) => ({ id: h.id, title: h.title })));
      }
    } catch {}
  };

  useEffect(() => {
    loadHabits();
  }, []);

  return (
    <View style={[styles.container, { paddingLeft: navWidth }] }>
      <NavigationBar />
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <WeeklyUserData refreshAt={refreshAt} />
        {habits.map((habit) => (
          <HabitTrackerItem
            key={habit.id}
            habit={habit}
            onDelete={loadHabits}
            onUpdated={() => {
              setRefreshAt(Date.now());
            }}
          />
        ))}
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
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 40,
  },
});
