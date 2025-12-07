import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NavigationBar } from '../components/NavigationBar';
import { API_URL } from '../constants/Config';
import { useAuth } from '../context/AuthContext';
import { GlobalStyles } from '../styles';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [habits, setHabits] = useState<{ id: string; title: string }[]>([]);
  const [stats, setStats] = useState({ totalHabits: 0, completedToday: 0, currentStreak: 0, weeklyProgress: 0 });

  const loadHabits = async () => {
    try {
      const res = await fetch(`${API_URL}/api/habits`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setHabits(data.map((h: any) => ({ id: h.id, title: h.title })));
        setStats((prev) => ({ ...prev, totalHabits: data.length }));
      }
    } catch {}
  };

  const loadWeeklyStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/stats/weekly`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const todayCompleted = Array.isArray(data?.chart?.datasets?.[0]?.data)
          ? (data.chart.datasets[0].data[data.chart.datasets[0].data.length - 1] || 0)
          : 0;
        setStats((prev) => ({
          ...prev,
          completedToday: todayCompleted,
          currentStreak: data.currentStreak || 0,
          weeklyProgress: data.progress || 0,
        }));
      }
    } catch {}
  };

  useEffect(() => {
    loadHabits();
    loadWeeklyStats();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadHabits();
      loadWeeklyStats();
      return () => {};
    }, [])
  );

  const { navWidth } = useAuth();
  return (
    <View style={[styles.container, { paddingLeft: navWidth }] }>
      <NavigationBar />
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Welcome Header */}
        <View style={[GlobalStyles.card, styles.welcomeCard]}>
          <Text style={styles.greeting}>Welcome back, {user?.name}!</Text>
          <Text style={styles.subtitle}>Here&apos;s your habit tracking overview</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[GlobalStyles.card, styles.statCard]}>
            <Text style={styles.statNumber}>{stats.totalHabits}</Text>
            <Text style={styles.statLabel}>Total Habits</Text>
          </View>
          <View style={[GlobalStyles.card, styles.statCard]}>
            <Text style={styles.statNumber}>{stats.completedToday}</Text>
            <Text style={styles.statLabel}>Completed Today</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[GlobalStyles.card, styles.statCard]}>
            <Text style={styles.statNumber}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={[GlobalStyles.card, styles.statCard]}>
            <Text style={styles.statNumber}>{stats.weeklyProgress}%</Text>
            <Text style={styles.statLabel}>Weekly Progress</Text>
          </View>
        </View>

        

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.addButton]}
            onPress={() => router.push('/')}
          >
            <Text style={styles.actionButtonText}>+ Add Habit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => router.push('/tracker')}
          >
            <Text style={styles.actionButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
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
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  welcomeCard: {
    marginBottom: 24,
    backgroundColor: '#e3f2fd',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    margin: 0,
    width: 'auto',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#5c6bc0',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  habitsCard: {
    marginBottom: 24,
  },
  habitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  habitTime: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  completedBadge: {
    backgroundColor: '#e8f5e9',
  },
  pendingBadge: {
    backgroundColor: '#fff3e0',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  completedText: {
    color: '#4caf50',
  },
  pendingText: {
    color: '#ff9800',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: '#5c6bc0',
  },
  viewButton: {
    backgroundColor: '#4caf50',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
