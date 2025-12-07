import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { GlobalStyles } from '../styles';

const ReminderSettings: React.FC = () => {
  const [habitTitle, setHabitTitle] = useState('');
  const [notificationTime, setNotificationTime] = useState('');
  const [notificationFrequency, setNotificationFrequency] = useState('');

  const handleSetReminder = () => {
    alert(`Reminder set for: ${habitTitle}`);
  };

  return (
    <View style={GlobalStyles.card}>
      <Text style={GlobalStyles.title}>Reminder Settings</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Habit Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your habit title"
          value={habitTitle}
          onChangeText={setHabitTitle}
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Notification Time</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 8:30 PM"
          value={notificationTime}
          onChangeText={setNotificationTime}
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Notification Frequency</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Daily, Weekdays"
          value={notificationFrequency}
          onChangeText={setNotificationFrequency}
        />
      </View>
      
      <TouchableOpacity onPress={handleSetReminder} style={styles.primaryButton}>
        <Text style={styles.buttonText}>Set Reminder</Text>
      </TouchableOpacity>

      <View style={styles.infoBlock}>
        <Text style={styles.infoTitle}>Local Push Notifications</Text>
        <Text style={styles.infoText}>You will receive reminders for your habit at the scheduled time.</Text>
        <Text style={styles.infoText}>Ensure notifications are enabled in your device settings.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  formGroup: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    fontWeight: '600',
    marginBottom: 5,
    color: '#555',
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: '#5c6bc0',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBlock: {
    width: '100%',
    paddingTop: 15,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  infoTitle: {
    marginVertical: 5,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  }
});

export default ReminderSettings;
