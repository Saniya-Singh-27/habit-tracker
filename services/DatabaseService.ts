/**
 * Database Service
 * Provides database operations for storing and retrieving user accounts
 * Uses IndexedDB for web (browser storage)
 */

import { Platform } from 'react-native';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface StoredUserAccount extends User {
  password: string;
}

export interface Notification {
  id: string;
  userId: string;
  habitTitle: string;
  message: string;
  scheduledTime: string;
  createdAt: string;
  read: boolean;
  notificationId?: string; // ID from expo-notifications
}

// Uses IndexedDB for storage (works on web and as fallback for native)

const DB_NAME = 'HabitTrackerDB';
const STORE_NAME = 'users';
const NOTIFICATIONS_STORE_NAME = 'notifications';
const DB_VERSION = 2;

class DatabaseService {
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  /**
   * Initialize the database
   */
  async initialize(): Promise<void> {
    if (this.isInitialized && this.db) {
      return;
    }

    if (Platform.OS === 'web') {
      await this.initializeWeb();
    } else {
      // For native platforms, use IndexedDB (if available) or fallback
      // Note: IndexedDB may not be available on all native platforms
      await this.initializeWeb();
    }

    this.isInitialized = true;
  }

  /**
   * Initialize IndexedDB for web
   */
  private initializeWeb(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if IndexedDB is available
      if (typeof window === 'undefined' || !window.indexedDB) {
        console.warn('IndexedDB not available - using fallback');
        // For native platforms or when IndexedDB is not available, we'll use a simple in-memory fallback
        // In a real app, you'd use AsyncStorage or another storage solution
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Database failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create users store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          objectStore.createIndex('email', 'email', { unique: true });
          console.log('Users object store created');
        }

        // Create notifications store if it doesn't exist
        if (!db.objectStoreNames.contains(NOTIFICATIONS_STORE_NAME)) {
          const notificationsStore = db.createObjectStore(NOTIFICATIONS_STORE_NAME, { keyPath: 'id' });
          notificationsStore.createIndex('userId', 'userId', { unique: false });
          notificationsStore.createIndex('scheduledTime', 'scheduledTime', { unique: false });
          console.log('Notifications object store created');
        }
      };
    });
  }


  /**
   * Get all users from database
   */
  async getAllUsers(): Promise<StoredUserAccount[]> {
    await this.initialize();
    return this.getAllUsersWeb();
  }

  private getAllUsersWeb(): Promise<StoredUserAccount[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.getAll();

      request.onerror = () => {
        console.error('Failed to get all users:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result as StoredUserAccount[]);
      };
    });
  }


  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<StoredUserAccount | null> {
    await this.initialize();
    return this.getUserByEmailWeb(email);
  }

  private getUserByEmailWeb(email: string): Promise<StoredUserAccount | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index('email');
      const request = index.get(email.toLowerCase());

      request.onerror = () => {
        console.error('Failed to get user by email:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result || null);
      };
    });
  }


  /**
   * Add new user to database
   */
  async addUser(user: StoredUserAccount): Promise<void> {
    await this.initialize();
    return this.addUserWeb(user);
  }

  private addUserWeb(user: StoredUserAccount): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.add({
        ...user,
        email: user.email.toLowerCase(),
      });

      request.onerror = () => {
        if ((request.error as any)?.name === 'ConstraintError') {
          reject(new Error('Email already exists'));
        } else {
          console.error('Failed to add user:', request.error);
          reject(request.error);
        }
      };

      request.onsuccess = () => {
        console.log('User added successfully');
        resolve();
      };
    });
  }


  /**
   * Update user in database
   */
  async updateUser(user: StoredUserAccount): Promise<void> {
    await this.initialize();
    return this.updateUserWeb(user);
  }

  private updateUserWeb(user: StoredUserAccount): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.put({
        ...user,
        email: user.email.toLowerCase(),
      });

      request.onerror = () => {
        console.error('Failed to update user:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log('User updated successfully');
        resolve();
      };
    });
  }


  /**
   * Delete all users (for testing/reset)
   */
  async deleteAllUsers(): Promise<void> {
    await this.initialize();
    return this.deleteAllUsersWeb();
  }

  private deleteAllUsersWeb(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.clear();

      request.onerror = () => {
        console.error('Failed to delete all users:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log('All users deleted successfully');
        resolve();
      };
    });
  }


  /**
   * Get database status
   */
  async getStatus(): Promise<{ initialized: boolean; userCount: number }> {
    try {
      const users = await this.getAllUsers();
      return {
        initialized: this.isInitialized,
        userCount: users.length,
      };
    } catch (error) {
      return {
        initialized: false,
        userCount: 0,
      };
    }
  }

  /**
   * Add notification to database
   */
  async addNotification(notification: Notification): Promise<void> {
    await this.initialize();
    return this.addNotificationWeb(notification);
  }

  private addNotificationWeb(notification: Notification): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        console.error('Database not initialized when adding notification');
        reject(new Error('Database not initialized'));
        return;
      }

      try {
        const transaction = this.db.transaction([NOTIFICATIONS_STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(NOTIFICATIONS_STORE_NAME);
        const request = objectStore.add(notification);

        request.onerror = () => {
          console.error('Failed to add notification:', request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          console.log('Notification added successfully:', notification.id);
          resolve();
        };
      } catch (error) {
        console.error('Error in addNotificationWeb:', error);
        reject(error);
      }
    });
  }


  /**
   * Get all notifications for a user
   */
  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    await this.initialize();
    return this.getNotificationsByUserIdWeb(userId);
  }

  private getNotificationsByUserIdWeb(userId: string): Promise<Notification[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([NOTIFICATIONS_STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(NOTIFICATIONS_STORE_NAME);
      const index = objectStore.index('userId');
      const request = index.getAll(userId);

      request.onerror = () => {
        console.error('Failed to get notifications:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        const notifications = (request.result as Notification[]).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        resolve(notifications);
      };
    });
  }


  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    await this.initialize();
    return this.markNotificationAsReadWeb(notificationId);
  }

  private markNotificationAsReadWeb(notificationId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([NOTIFICATIONS_STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(NOTIFICATIONS_STORE_NAME);
      const getRequest = objectStore.get(notificationId);

      getRequest.onerror = () => {
        console.error('Failed to get notification:', getRequest.error);
        reject(getRequest.error);
      };

      getRequest.onsuccess = () => {
        const notification = getRequest.result;
        if (notification) {
          notification.read = true;
          const putRequest = objectStore.put(notification);
          putRequest.onerror = () => {
            console.error('Failed to update notification:', putRequest.error);
            reject(putRequest.error);
          };
          putRequest.onsuccess = () => {
            console.log('Notification marked as read');
            resolve();
          };
        } else {
          reject(new Error('Notification not found'));
        }
      };
    });
  }


  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await this.initialize();
    return this.deleteNotificationWeb(notificationId);
  }

  private deleteNotificationWeb(notificationId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([NOTIFICATIONS_STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(NOTIFICATIONS_STORE_NAME);
      const request = objectStore.delete(notificationId);

      request.onerror = () => {
        console.error('Failed to delete notification:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log('Notification deleted successfully');
        resolve();
      };
    });
  }

}

// Export singleton instance
export const db = new DatabaseService();
