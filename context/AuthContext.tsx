import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { API_URL } from '../constants/Config';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isInitialized: boolean;
  navWidth: number;
  setNavWidth: (w: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'habit_tracker_current_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [navWidth, setNavWidth] = useState<number>(220);

  // Initialize database and restore session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Try to get fresh user data from server
        try {
          const meRes = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
          if (meRes.ok) {
            const meData = (await meRes.json()) as User;
            setUser(meData);
            await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(meData));
          }
        } catch (e) {
          // Network error or server down, ignore and fall back to cache
        }

        // Load from cache if not already set
        const currentUserData = await AsyncStorage.getItem(CURRENT_USER_KEY);
        if (currentUserData) {
          try {
            const currentUser = JSON.parse(currentUserData) as User;
            // Only set if we didn't get it from server (or if we want to ensure we have *something*)
            // But since we set state above, we might overwrite. 
            // Actually, if server request failed, user is null, so we load from cache.
            // If server request succeeded, user is set.
            setUser((prev) => prev || currentUser);
          } catch (error) {
            console.error('Error parsing current user:', error);
            await AsyncStorage.removeItem(CURRENT_USER_KEY);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  const signup = async (
    email: string,
    password: string,
    name: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      if (!email || !email.includes('@')) {
        return { success: false, message: 'Invalid email format' };
      }
      if (!password || password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters' };
      }
      if (!name || name.trim().length === 0) {
        return { success: false, message: 'Name is required' };
      }

      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, name }),
      });
      if (!res.ok) {
        if (res.status === 409) return { success: false, message: 'Email already registered. Please login instead.' };
        return { success: false, message: 'Signup failed' };
      }
      const sessionUser = (await res.json()) as User;
      setUser(sessionUser);
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
      return { success: true, message: 'Account created successfully!' };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: 'An error occurred during signup' };
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      if (!email || !password) {
        return { success: false, message: 'Email and password are required' };
      }

      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        if (res.status === 404) return { success: false, message: 'User not found. Please sign up first.' };
        if (res.status === 401) return { success: false, message: 'Invalid password' };
        return { success: false, message: 'Login failed' };
      }
      const sessionUser = (await res.json()) as User;
      setUser(sessionUser);
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
      return { success: true, message: 'Logged in successfully!' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'An error occurred during login' };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch { }
    setUser(null);
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        isInitialized,
        navWidth,
        setNavWidth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
