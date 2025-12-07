import * as Notifications from 'expo-notifications';
import { db, Notification } from './DatabaseService';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Schedule a notification for a habit reminder
   */
  async scheduleHabitNotification(
    userId: string,
    habitTitle: string,
    reminderTime: string,
    frequency: string
  ): Promise<string | null> {
    try {
      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Cannot schedule notification: permissions not granted');
        return null;
      }

      // Parse reminder time (format: "7:00 AM" or "19:00")
      const notificationTime = this.parseTime(reminderTime);
      if (!notificationTime) {
        console.warn('Invalid time format:', reminderTime);
        return null;
      }

      // Create notification content
      const notificationId = `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const notificationContent = {
        title: 'Habit Reminder',
        body: `Time to do: ${habitTitle}`,
        data: { habitTitle, userId, notificationId },
        sound: true,
      };

      // Schedule notification based on frequency
      let trigger: Notifications.NotificationTriggerInput | null = null;
      const frequencyLower = frequency.toLowerCase();

      if (frequencyLower.includes('daily') || frequencyLower === 'daily') {
        // Daily notification
        trigger = {
          hour: notificationTime.hour,
          minute: notificationTime.minute,
          repeats: true,
        };
      } else if (frequencyLower.includes('mon-fri') || frequencyLower.includes('weekday') || frequencyLower === 'weekdays') {
        // Weekday notification (Mon-Fri)
        trigger = {
          weekday: [2, 3, 4, 5, 6], // Monday to Friday (1=Sunday, 2=Monday, etc.)
          hour: notificationTime.hour,
          minute: notificationTime.minute,
          repeats: true,
        };
      } else if (frequencyLower.includes('weekend') || frequencyLower === 'weekends') {
        // Weekend notification (Sat-Sun)
        trigger = {
          weekday: [1, 7], // Sunday and Saturday
          hour: notificationTime.hour,
          minute: notificationTime.minute,
          repeats: true,
        };
      } else if (frequencyLower.includes('custom:')) {
        // Custom days - parse the days from the frequency string
        // Format: "Custom: 0,1,2" where numbers are JavaScript Date day values (0=Sun, 1=Mon, etc.)
        // Expo notifications use: 1=Sunday, 2=Monday, 3=Tuesday, 4=Wednesday, 5=Thursday, 6=Friday, 7=Saturday
        const customDaysMatch = frequency.match(/custom:\s*([\d,\s]+)/i);
        if (customDaysMatch) {
          const dayNumbers = customDaysMatch[1]
            .split(',')
            .map(d => parseInt(d.trim(), 10))
            .filter(d => !isNaN(d) && d >= 0 && d <= 6);
          
          if (dayNumbers.length > 0) {
            // Convert from JavaScript Date format (0=Sun, 1=Mon, etc.) to expo format (1=Sun, 2=Mon, etc.)
            const expoWeekdays = dayNumbers.map(day => {
              // JavaScript: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
              // Expo: 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri, 7=Sat
              return day + 1;
            });
            
            trigger = {
              weekday: expoWeekdays,
              hour: notificationTime.hour,
              minute: notificationTime.minute,
              repeats: true,
            };
          }
        }
      }

      // If no trigger was set, default to scheduling for today/tomorrow
      if (!trigger) {
        const now = new Date();
        const scheduledDate = new Date();
        scheduledDate.setHours(notificationTime.hour, notificationTime.minute, 0, 0);
        
        // If time has passed today, schedule for tomorrow
        if (scheduledDate < now) {
          scheduledDate.setDate(scheduledDate.getDate() + 1);
        }

        trigger = scheduledDate;
      }

      // Schedule the notification
      const scheduledNotificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: trigger as any,
      });

      // Save notification to database
      const notification: Notification = {
        id: notificationId,
        userId,
        habitTitle,
        message: `Time to do: ${habitTitle}`,
        scheduledTime: reminderTime,
        createdAt: new Date().toISOString(),
        read: false,
        notificationId: scheduledNotificationId,
      };

      await db.addNotification(notification);

      return scheduledNotificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Parse time string to hour and minute
   * Supports formats: "7:00 AM", "19:00", "7:00PM"
   */
  private parseTime(timeString: string): { hour: number; minute: number } | null {
    try {
      const trimmed = timeString.trim().toUpperCase();
      
      // Handle 12-hour format (e.g., "7:00 AM", "7:00PM")
      const amPmMatch = trimmed.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/);
      if (amPmMatch) {
        let hour = parseInt(amPmMatch[1], 10);
        const minute = parseInt(amPmMatch[2], 10);
        const period = amPmMatch[3];

        if (period === 'PM' && hour !== 12) {
          hour += 12;
        } else if (period === 'AM' && hour === 12) {
          hour = 0;
        }

        return { hour, minute };
      }

      // Handle 24-hour format (e.g., "19:00", "7:00")
      const timeMatch = trimmed.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const hour = parseInt(timeMatch[1], 10);
        const minute = parseInt(timeMatch[2], 10);

        if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
          return { hour, minute };
        }
      }

      return null;
    } catch (error) {
      console.error('Error parsing time:', error);
      return null;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
      }
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }


  /**
   * Get all scheduled notifications
   */
  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Create a generic event notification entry
   */
  async createEventNotification(
    userId: string,
    habitTitle: string,
    message: string
  ): Promise<void> {
    await db.initialize();
    const notificationId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const notification: Notification = {
      id: notificationId,
      userId,
      habitTitle,
      message,
      scheduledTime: new Date().toLocaleTimeString(),
      createdAt: new Date().toISOString(),
      read: false,
    };
    await db.addNotification(notification);
  }

  /**
   * Create a "kudos" notification when a habit is added
   */
  async createHabitAddedNotification(
    userId: string,
    habitTitle: string
  ): Promise<void> {
    try {
      // Make sure database is initialized
      await db.initialize();
      
      const notificationId = `kudos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const notification: Notification = {
        id: notificationId,
        userId,
        habitTitle,
        message: `Kudos! Habit "${habitTitle}" has been added! Keep up the great work!`,
        scheduledTime: new Date().toLocaleTimeString(),
        createdAt: new Date().toISOString(),
        read: false,
      };

      await db.addNotification(notification);
      console.log('Kudos notification created successfully:', notificationId);
    } catch (error) {
      console.error('Error creating kudos notification:', error);
      // Don't throw - this is a nice-to-have feature, but log it
      throw error; // Re-throw so we can see the error
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

