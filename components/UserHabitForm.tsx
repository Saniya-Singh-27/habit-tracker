import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Alert, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API_URL } from '../constants/Config';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/NotificationService';
import { GlobalStyles } from '../styles';

type FrequencyOption = 'Daily' | 'Weekdays' | 'Weekends' | 'Custom';

const UserHabitForm: React.FC = () => {
  const [habitTitle, setHabitTitle] = useState('');
  const [frequency, setFrequency] = useState<FrequencyOption>('Daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const daysOfWeek = [
    { label: 'Sun', value: 0 },
    { label: 'Mon', value: 1 },
    { label: 'Tue', value: 2 },
    { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 },
    { label: 'Fri', value: 5 },
    { label: 'Sat', value: 6 },
  ];

  const formatTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const getFrequencyString = (): string => {
    if (frequency === 'Daily') return 'Daily';
    if (frequency === 'Weekdays') return 'Mon-Fri';
    if (frequency === 'Weekends') return 'Sat-Sun';
    if (frequency === 'Custom' && selectedDays.length > 0) {
      const dayLabels = selectedDays
        .sort()
        .map(day => daysOfWeek.find(d => d.value === day)?.label)
        .filter(Boolean)
        .join(', ');
      return dayLabels;
    }
    return 'Daily';
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedDate) {
      setReminderTime(selectedDate);
    }
    if (Platform.OS === 'ios') {
      // On iOS, keep picker open until user confirms
    }
  };


  const toggleDay = (dayValue: number) => {
    setSelectedDays(prev => {
      if (prev.includes(dayValue)) {
        return prev.filter(d => d !== dayValue);
      } else {
        return [...prev, dayValue];
      }
    });
  };

  const handleSubmit = async () => {
    if (!habitTitle.trim()) {
      Alert.alert('Error', 'Please enter a habit title');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create habit in backend
      try {
        const freqStr = frequency === 'Custom' && selectedDays.length > 0
          ? `Custom: ${selectedDays.sort().join(',')}`
          : getFrequencyString();
        const res = await fetch(`${API_URL}/api/habits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: habitTitle.trim(),
            description: null,
            frequency: freqStr,
            reminder_time: formatTime(reminderTime),
          }),
        });
        if (!res.ok) {
          if (res.status === 401) {
            Alert.alert('Sign in required', 'Please sign in to save habits');
          } else {
            Alert.alert('Error', 'Failed to add habit to server');
          }
          return;
        } else if (user?.id) {
          // Record event notification
          try {
            await notificationService.createEventNotification(
              user.id,
              habitTitle.trim(),
              'Habit added'
            );
          } catch {}
        }
      } catch (e) {
        console.error('Failed to create habit on server:', e);
      }

      // Schedule notification if user is logged in
      if (user?.id) {
        const timeString = formatTime(reminderTime);
        let frequencyString = getFrequencyString();
        
        // For custom days, create a specific frequency string with day values
        if (frequency === 'Custom' && selectedDays.length > 0) {
          frequencyString = `Custom: ${selectedDays.sort().join(',')}`;
        }

        // Create kudos notification for habit added
        try {
          await notificationService.createHabitAddedNotification(
            user.id,
            habitTitle.trim()
          );
          console.log('Kudos notification created for habit:', habitTitle.trim());
        } catch (error) {
          console.error('Failed to create kudos notification:', error);
          // Continue anyway - notification creation failure shouldn't block habit submission
        }

        const notificationId = await notificationService.scheduleHabitNotification(
          user.id,
          habitTitle.trim(),
          timeString,
          frequencyString
        );

        if (notificationId) {
          Alert.alert(
            'Habit Added! ✅',
            `"${habitTitle}" has been successfully added! You'll receive reminders at ${timeString}.`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Habit Added! ✅',
            `"${habitTitle}" has been successfully added! Check notifications for details.`,
            [{ text: 'OK' }]
          );
        }
      }

      // Reset form
      setHabitTitle('');
      setFrequency('Daily');
      setSelectedDays([]);
      setReminderTime(new Date());
    } catch (error) {
      console.error('Error submitting habit:', error);
      Alert.alert('Error', 'Failed to add habit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={GlobalStyles.card}>
      <Text style={GlobalStyles.title}>User Habit Form</Text>
      
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
        <Text style={styles.label}>Frequency</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowFrequencyPicker(true)}
        >
          <Text style={styles.pickerButtonText}>
            {frequency === 'Custom' && selectedDays.length > 0
              ? getFrequencyString()
              : frequency}
          </Text>
          <Text style={styles.pickerIcon}>📅</Text>
        </TouchableOpacity>
      </View>

      {frequency === 'Custom' && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>Select Days</Text>
          <View style={styles.daySelector}>
            {daysOfWeek.map((day) => (
              <TouchableOpacity
                key={day.value}
                style={[
                  styles.dayButton,
                  selectedDays.includes(day.value) && styles.dayButtonSelected,
                ]}
                onPress={() => toggleDay(day.value)}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    selectedDays.includes(day.value) && styles.dayButtonTextSelected,
                  ]}
                >
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.formGroup}>
        <Text style={styles.label}>Reminder Time</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.pickerButtonText}>{formatTime(reminderTime)}</Text>
          <Text style={styles.pickerIcon}>🕐</Text>
        </TouchableOpacity>
      </View>

      {/* Frequency Picker Modal */}
      <Modal
        visible={showFrequencyPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFrequencyPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Frequency</Text>
            {(['Daily', 'Weekdays', 'Weekends', 'Custom'] as FrequencyOption[]).map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.modalOption,
                  frequency === option && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setFrequency(option);
                  if (option !== 'Custom') {
                    setSelectedDays([]);
                  }
                  setShowFrequencyPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    frequency === option && styles.modalOptionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowFrequencyPicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={reminderTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
          onTouchCancel={() => setShowTimePicker(false)}
        />
      )}
      {Platform.OS === 'ios' && showTimePicker && (
        <View style={styles.iosPickerActions}>
          <TouchableOpacity
            style={styles.iosPickerButton}
            onPress={() => setShowTimePicker(false)}
          >
            <Text style={styles.iosPickerButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <TouchableOpacity 
        onPress={handleSubmit} 
        style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>{isSubmitting ? 'Submitting...' : 'Submit'}</Text>
      </TouchableOpacity>
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
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  pickerButton: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  pickerIcon: {
    fontSize: 20,
  },
  daySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'white',
    minWidth: 50,
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#5c6bc0',
    borderColor: '#5c6bc0',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  dayButtonTextSelected: {
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  modalOption: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
  },
  modalOptionSelected: {
    backgroundColor: '#5c6bc0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  modalOptionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  modalCloseButton: {
    marginTop: 10,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
  },
  iosPickerActions: {
    backgroundColor: 'white',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  iosPickerButton: {
    padding: 12,
    backgroundColor: '#5c6bc0',
    borderRadius: 8,
    alignItems: 'center',
  },
  iosPickerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UserHabitForm;
