import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

export function NavigationBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user, navWidth, setNavWidth } = useAuth();

  const navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: '📊' },
    { label: 'Habits', route: '/(tabs)', icon: '✓' },
    { label: 'Tracker', route: '/tracker', icon: '📈' },
    { label: 'Notifications', route: '/notifications', icon: '🔔' },
    { label: 'Settings', route: '/(tabs)/explore', icon: '⚙️' },
  ];

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const collapsedWidth = 72;
  const minWidth = 60;
  const maxWidth = 280;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      const newWidth = Math.min(maxWidth, Math.max(minWidth, navWidth + gestureState.dx));
      setNavWidth(newWidth);
    },
  });

  const isCollapsed = navWidth <= collapsedWidth + 4;

  const handleToggle = () => {
    setNavWidth(isCollapsed ? 220 : collapsedWidth);
  };

  return (
    <View style={[styles.navContainer, { width: navWidth }]}> 
      <View style={styles.navContent}>
        <TouchableOpacity style={styles.toggleButton} onPress={handleToggle}>
          <Text style={styles.toggleText}>{isCollapsed ? '▶' : '◀'}</Text>
        </TouchableOpacity>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={[
              styles.navItem,
              pathname === item.route && styles.navItemActive,
            ]}
            onPress={() => router.push(item.route as any)}
          >
            <Text style={styles.navIcon}>{item.icon}</Text>
            {!isCollapsed && (
            <Text
              style={[
                styles.navLabel,
                pathname === item.route && styles.navLabelActive,
              ]}
            >
              {item.label}
            </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.userSection}>
        {!isCollapsed && <Text style={styles.userName}>{user?.name || 'User'}</Text>}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>{isCollapsed ? '⎋' : 'Logout'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.resizeHandle} {...panResponder.panHandlers} />
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderRightWidth: 1,
    borderRightColor: '#eee',
    paddingVertical: 16,
    paddingHorizontal: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  navContent: {
    gap: 8,
  },
  toggleButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  navItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#f5f5f5',
  },
  navItemActive: {
    backgroundColor: '#5c6bc0',
  },
  navIcon: {
    fontSize: 18,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    marginLeft: 4,
  },
  navLabelActive: {
    color: 'white',
  },
  userSection: {
    alignItems: 'center',
  },
  resizeHandle: {
    position: 'absolute',
    right: -3,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: 'transparent',
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f44336',
    borderRadius: 4,
  },
  logoutText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
});
