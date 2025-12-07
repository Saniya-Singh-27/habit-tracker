import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db, Notification } from '../services/DatabaseService';

interface StoredUser {
  id: string;
  email: string;
  name: string;
  password: string;
}

export default function DebugScreen() {
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [asyncStorageData, setAsyncStorageData] = useState<string>('');
  const [dbStatus, setDbStatus] = useState<string>('Initializing...');
  const [storageLocation, setStorageLocation] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    try {
      // Get all users from database
      const allUsers = await db.getAllUsers();
      setUsers(allUsers);

      // Get all notifications
      const allNotifications: Notification[] = [];
      for (const user of allUsers) {
        const userNotifications = await db.getNotificationsByUserId(user.id);
        allNotifications.push(...userNotifications);
      }
      setNotifications(allNotifications);

      // Get current user from localStorage
      let currentUserData: string | null = null;
      if (typeof window !== 'undefined') {
        currentUserData = localStorage.getItem('habit_tracker_current_user');
        setStorageLocation('Browser localStorage');
        
        // Show localStorage info
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) keys.push(key);
        }
        const items = keys.map(key => [key, localStorage.getItem(key) || '']);
        setAsyncStorageData(JSON.stringify(items, null, 2));
      } else {
        setStorageLocation('Not available (native platform)');
        setAsyncStorageData('localStorage not available on native platforms');
      }
      setCurrentUser(currentUserData ? JSON.parse(currentUserData) : null);

      // Get database status
      const status = await db.getStatus();
      const platform = Platform.OS === 'web' ? 'IndexedDB' : 'SQLite';
      setDbStatus(
        `Platform: ${Platform.OS} | Database: ${platform} | Initialized: ${status.initialized ? 'Yes' : 'No'} | Users: ${status.userCount} | Notifications: ${allNotifications.length}`
      );
    } catch (error) {
      console.error('Error refreshing data:', error);
      setDbStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete ALL data? This will clear:\n- All users\n- All notifications\n- Current session',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.deleteAllUsers();
              // Clear notifications for all users
              for (const user of users) {
                const userNotifications = await db.getNotificationsByUserId(user.id);
                for (const notification of userNotifications) {
                  await db.deleteNotification(notification.id);
                }
              }
              
              // Clear session
              if (typeof window !== 'undefined') {
                localStorage.removeItem('habit_tracker_current_user');
              }
              
              refreshData();
              Alert.alert('Success', 'All data cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Debug - Database Information</Text>

      {/* Database Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Database Status</Text>
        <View style={styles.card}>
          <Text style={styles.text}>{dbStatus}</Text>
        </View>
      </View>

      {/* Current User */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Logged In User</Text>
        {currentUser ? (
          <View style={styles.card}>
            <Text style={styles.text}>ID: {currentUser.id}</Text>
            <Text style={styles.text}>Name: {currentUser.name}</Text>
            <Text style={styles.text}>Email: {currentUser.email}</Text>
            <Text style={styles.subtext}>(stored in localStorage)</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.text}>No user logged in</Text>
          </View>
        )}
      </View>

      {/* Registered Users in Database */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Users in Database ({users.length})</Text>
        {users.length > 0 ? (
          users.map((user, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.text}>
                <Text style={styles.label}>Email:</Text> {user.email}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.label}>Name:</Text> {user.name}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.label}>Password:</Text> {user.password}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.label}>ID:</Text> {user.id}
              </Text>
              <Text style={styles.subtext}>(stored in IndexedDB)</Text>
            </View>
          ))
        ) : (
          <View style={styles.card}>
            <Text style={styles.text}>No users in database</Text>
          </View>
        )}
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications ({notifications.length})</Text>
        {notifications.length > 0 ? (
          notifications.slice(0, 5).map((notification, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.text}>
                <Text style={styles.label}>Habit:</Text> {notification.habitTitle}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.label}>Message:</Text> {notification.message}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.label}>Time:</Text> {notification.scheduledTime}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.label}>Read:</Text> {notification.read ? 'Yes' : 'No'}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.card}>
            <Text style={styles.text}>No notifications</Text>
          </View>
        )}
        {notifications.length > 5 && (
          <Text style={styles.subtext}>... and {notifications.length - 5} more</Text>
        )}
      </View>

      {/* Storage Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage Information</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Current Platform: {Platform.OS}</Text>
          <Text style={styles.text}>Storage Location: {storageLocation}</Text>
          <Text style={[styles.subtext, { marginTop: 12, marginBottom: 8 }]}>
            📱 Web (Browser):
          </Text>
          <Text style={styles.text}>• IndexedDB: Browser DevTools → Application → IndexedDB → HabitTrackerDB</Text>
          <Text style={styles.text}>• localStorage: Browser DevTools → Application → Local Storage → localhost</Text>
          <Text style={styles.text}>• Location: Browser's local storage (persists until cleared)</Text>
          
          <Text style={[styles.subtext, { marginTop: 12, marginBottom: 8 }]}>
            📱 Native (Android/iOS):
          </Text>
          <Text style={styles.text}>• Note: On native platforms, IndexedDB may not be available</Text>
          <Text style={styles.text}>• For native support, consider using AsyncStorage or a different storage solution</Text>
        </View>
      </View>

      {/* AsyncStorage Data */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AsyncStorage / localStorage Contents</Text>
        <View style={styles.card}>
          <ScrollView style={styles.codeBlock} nestedScrollEnabled>
            <Text style={styles.codeText}>
              {asyncStorageData || 'No data stored'}
            </Text>
          </ScrollView>
        </View>
      </View>

      {/* How AsyncStorage Works */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How AsyncStorage Works</Text>
        <View style={styles.card}>
          <Text style={styles.text}>
            <Text style={styles.label}>1. What is AsyncStorage?</Text>
          </Text>
          <Text style={styles.text}>
            AsyncStorage is React Native's key-value storage system. It's similar to localStorage in web browsers but works on mobile devices.
          </Text>
          
          <Text style={[styles.text, { marginTop: 12 }]}>
            <Text style={styles.label}>2. How it works:</Text>
          </Text>
          <Text style={styles.text}>• Stores data as key-value pairs (strings only)</Text>
          <Text style={styles.text}>• All operations are asynchronous (non-blocking)</Text>
          <Text style={styles.text}>• Data persists across app restarts</Text>
          <Text style={styles.text}>• Data is stored locally on the device</Text>
          
          <Text style={[styles.text, { marginTop: 12 }]}>
            <Text style={styles.label}>3. Usage in this app:</Text>
          </Text>
          <Text style={styles.text}>• Key: "habit_tracker_current_user"</Text>
          <Text style={styles.text}>• Value: JSON string of user object</Text>
          <Text style={styles.text}>• Purpose: Store current logged-in user session</Text>
          
          <Text style={[styles.text, { marginTop: 12 }]}>
            <Text style={styles.label}>4. Data location:</Text>
          </Text>
          <Text style={styles.text}>• Android: SQLite database in app's private directory</Text>
          <Text style={styles.text}>• iOS: SQLite database in app's Documents directory</Text>
          <Text style={styles.text}>• Web: Uses localStorage (browser's local storage)</Text>
        </View>
      </View>

      {/* Test Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test the System</Text>
        <View style={styles.card}>
          <Text style={styles.text}>1. Signup with new account</Text>
          <Text style={styles.text}>2. Check this page to see user in database</Text>
          <Text style={styles.text}>3. Logout and login again</Text>
          <Text style={styles.text}>4. Refresh the browser - session persists!</Text>
          <Text style={styles.text}>5. Try creating another account</Text>
          <Text style={styles.text}>6. Both users will be in the database</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.button, styles.refreshButton]} onPress={refreshData}>
          <Text style={styles.buttonText}>Refresh Data</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.goBackButton]} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearAllData}>
          <Text style={styles.buttonText}>Clear Database</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#5c6bc0',
  },
  text: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  subtext: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  label: {
    fontWeight: '600',
    color: '#333',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#2196f3',
  },
  goBackButton: {
    backgroundColor: '#4caf50',
  },
  clearButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  codeBlock: {
    maxHeight: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    padding: 8,
  },
  codeText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#333',
  },
});
