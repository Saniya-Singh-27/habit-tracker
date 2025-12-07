import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GlobalStyles } from '../styles';

interface Activity {
  type: 'Completed' | 'Skipped';
  date: string;
}

interface HabitCompletionTrackerProps {
  habitTitle?: string;
  currentStreak?: number;
  progress?: number;
  activities?: Activity[];
  onComplete?: () => void;
  onSkip?: () => void;
  completedToday?: boolean;
}

const HabitCompletionTracker: React.FC<HabitCompletionTrackerProps> = ({ 
  habitTitle = "Morning Run", 
  currentStreak = 5, 
  progress = 75,
  activities = [],
  onComplete,
  onSkip,
  completedToday = false,
}) => {
  const handleComplete = () => {
    if (typeof onComplete === 'function') {
      onComplete();
    } else {
      alert(`Habit '${habitTitle}' Completed!`);
    }
  };
  const handleSkip = () => {
    if (typeof onSkip === 'function') {
      onSkip();
    } else {
      alert(`Habit '${habitTitle}' Skipped.`);
    }
  };

  return (
    <View style={GlobalStyles.card}>
      <Text style={GlobalStyles.title}>Habit Completion Tracker</Text>
      
      <Text style={styles.infoText}>Habit Title: <Text style={styles.boldText}>{habitTitle}</Text></Text>
      <Text style={styles.infoText}>Current Streak: <Text style={styles.successText}>{currentStreak} days</Text></Text>
      <Text style={styles.infoText}>Progress: <Text style={styles.progressText}>{progress}%</Text></Text>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          onPress={handleComplete}
          style={[styles.successButton, completedToday && styles.disabledButton]}
          disabled={completedToday}
        >
          <Text style={styles.buttonText}>{completedToday ? 'Completed Today' : 'Complete Habit'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.buttonText}>Skip Habit</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.recentActivities}>
        <Text style={styles.recentTitle}>Recent Activities</Text>
        {activities.map((activity, index) => (
          <Text 
            key={index} 
            style={[styles.activityText, activity.type === 'Skipped' ? styles.skipActivity : styles.completeActivity]}
          >
            {activity.type} on: {activity.date}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  infoText: {
    fontSize: 16,
    marginBottom: 5,
  },
  boldText: {
    fontWeight: 'bold',
  },
  successText: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  progressText: {
    color: '#fbc02d',
    fontWeight: 'bold',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 20,
    gap: 15,
  },
  successButton: {
    backgroundColor: '#4caf50',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginRight: 5,
  },
  skipButton: {
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginLeft: 5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  recentActivities: {
    width: '100%',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'flex-start',
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  activityText: {
    fontSize: 14,
    marginBottom: 3,
  },
  completeActivity: {
    color: '#4caf50',
  },
  skipActivity: {
    color: '#f44336',
  },
});

export default HabitCompletionTracker;
