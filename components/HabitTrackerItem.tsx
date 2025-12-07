import React, { useEffect, useState } from 'react';
import { Alert, Platform, Text, TouchableOpacity, View } from 'react-native';
import { API_URL } from '../constants/Config';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/NotificationService';
import HabitCompletionTracker from './HabitCompletionTracker';

interface Activity {
    type: 'Completed' | 'Skipped';
    date: string;
}

interface HabitTrackerItemProps {
    habit: {
        id: string;
        title: string;
    };
    onDelete?: () => void;
    onUpdated?: () => void;
}

const HabitTrackerItem: React.FC<HabitTrackerItemProps> = ({ habit, onDelete, onUpdated }) => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [stats, setStats] = useState({ streak: 0, progress: 0 });
    const [completedToday, setCompletedToday] = useState<boolean>(false);
    const { user } = useAuth();

    const loadHabitData = async () => {
        try {
            const res = await fetch(`${API_URL}/api/habits/${habit.id}/entries`, { credentials: 'include' });
            if (res.ok) {
                const entries = (await res.json()) as any[];

                // Map to activities
                const acts: Activity[] = entries.map((e: any) => ({
                    type: e.status === 'Completed' ? 'Completed' : 'Skipped',
                    date: e.date,
                }));
                setActivities(acts);

                // Calculate Streak
                let streak = 0;
                const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                const today = new Date().toISOString().slice(0, 10);

                const completedDates = new Set(entries.filter((e: any) => e.status === 'Completed').map((e: any) => e.date));
                let checkDate = new Date();

                // If today is completed, count it. If not, check yesterday.
                if (completedDates.has(today)) {
                    // today is good
                } else {
                    checkDate.setDate(checkDate.getDate() - 1);
                    if (!completedDates.has(checkDate.toISOString().slice(0, 10))) {
                        checkDate = null as any;
                    }
                }

                setCompletedToday(completedDates.has(today));

                if (checkDate) {
                    while (true) {
                        const dateStr = checkDate.toISOString().slice(0, 10);
                        if (completedDates.has(dateStr)) {
                            streak++;
                            checkDate.setDate(checkDate.getDate() - 1);
                        } else {
                            break;
                        }
                    }
                }

                // Calculate Progress (last 7 days)
                let completedCount = 0;
                for (let i = 0; i < 7; i++) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dStr = d.toISOString().slice(0, 10);
                    if (completedDates.has(dStr)) completedCount++;
                }
                const progress = Math.round((completedCount / 7) * 100);

                setStats({ streak, progress });
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        loadHabitData();
    }, [habit.id]);

    const handleAction = async (status: 'Completed' | 'Skipped') => {
        try {
            const today = new Date().toISOString().slice(0, 10);
            if (status === 'Completed' && completedToday) {
                Alert.alert('Already completed', 'You have already completed this habit today.');
                return;
            }
            const res = await fetch(`${API_URL}/api/habits/${habit.id}/entries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ date: today, status }),
            });
            if (res.ok) {
                Alert.alert('Success', `Habit marked as ${status}`);
                // Record notification for action
                if (user?.id) {
                    try {
                        await notificationService.createEventNotification(
                          user.id,
                          habit.title,
                          status === 'Completed' ? 'Habit completed' : 'Habit skipped'
                        );
                    } catch {}
                }
                loadHabitData();
                if (status === 'Completed') setCompletedToday(true);
                if (onUpdated) onUpdated();
            } else {
                Alert.alert('Error', 'Failed to update habit');
            }
        } catch {
            Alert.alert('Error', 'Failed to connect to server');
        }
    };

    const handleDelete = async () => {
        if (Platform.OS === 'web') {
            if (confirm(`Are you sure you want to delete "${habit.title}"?`)) {
                await deleteHabit();
            }
        } else {
            Alert.alert(
                'Delete Habit',
                `Are you sure you want to delete "${habit.title}"?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: deleteHabit,
                    },
                ]
            );
        }
    };

    const deleteHabit = async () => {
        try {
            const res = await fetch(`${API_URL}/api/habits/${habit.id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.ok) {
                if (Platform.OS !== 'web') Alert.alert('Success', 'Habit deleted');
                // Record notification for deletion
                if (user?.id) {
                    try {
                        await notificationService.createEventNotification(
                          user.id,
                          habit.title,
                          'Habit deleted'
                        );
                    } catch {}
                }
                if (onDelete) onDelete();
                if (onUpdated) onUpdated();
            } else {
                alert('Failed to delete habit');
            }
        } catch {
            alert('Failed to connect to server');
        }
    };

    return (
        <View style={{ marginBottom: 20, width: '100%', alignItems: 'center' }}>
            <HabitCompletionTracker
                habitTitle={habit.title}
                currentStreak={stats.streak}
                progress={stats.progress}
                activities={activities}
                onComplete={() => handleAction('Completed')}
                onSkip={() => handleAction('Skipped')}
                completedToday={completedToday}
            />
            <TouchableOpacity onPress={handleDelete} style={{ marginTop: -10, marginBottom: 10, padding: 10 }}>
                <Text style={{ color: '#f44336', fontSize: 14, fontWeight: '600' }}>Remove Habit</Text>
            </TouchableOpacity>
        </View>
    );
};

export default HabitTrackerItem;
