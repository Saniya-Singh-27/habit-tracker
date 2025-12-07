import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { API_URL } from '../constants/Config';
import { GlobalStyles } from '../styles';

// Card width is 340, with 20px padding on each side = 300px available width
const cardAvailableWidth = 340 - 40;

const chartConfig = {
  backgroundGradientFrom: '#f0f2f5',
  backgroundGradientTo: '#f0f2f5',
  color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  barPercentage: 0.5,
};

interface DataBoxProps {
  title: string;
  value: string | number;
  style?: any;
  textStyle?: any;
}

interface WeeklyUserDataProps {
  totalHabitsCompleted?: number;
  currentStreak?: number;
  progress?: number;
  refreshAt?: number;
}

const WeeklyUserData: React.FC<WeeklyUserDataProps> = ({ 
  totalHabitsCompleted = 0, 
  currentStreak = 0, 
  progress = 0,
  refreshAt,
}) => {
  const [stats, setStats] = useState({ totalHabitsCompleted, currentStreak, progress });
  const [chartData, setChartData] = useState({ labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [{ data: [0,0,0,0,0,0,0] }] });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/stats/weekly`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setStats({
            totalHabitsCompleted: data.totalHabitsCompleted,
            currentStreak: data.currentStreak,
            progress: data.progress,
          });
          if (data.chart && data.chart.labels && data.chart.datasets) {
            setChartData(data.chart);
          }
        }
      } catch {}
    };
    loadStats();
  }, [refreshAt]);
  const DataBox: React.FC<DataBoxProps> = ({ title, value, style, textStyle }) => (
    <View style={[styles.dataBox, style]}>
      <Text style={styles.dataTitle}>{title}</Text>
      <Text style={[styles.dataValue, textStyle]}>{value}</Text>
    </View>
  );

  const data = chartData;

  return (
    <View style={styles.dashboardContainer}>
      
      {/* Weekly User Data Card */}
      <View style={[GlobalStyles.card, styles.dataCard]}>
        <Text style={GlobalStyles.title}>Weekly User Data</Text>
        
        <DataBox 
          title="Total Habits Completed"
          value={stats.totalHabitsCompleted}
          style={styles.lightBlueBg}
          textStyle={styles.blueValue}
        />
        
        <DataBox 
          title="Current Streak"
          value={`${stats.currentStreak} Days`}
          style={styles.lightGreenBg}
          textStyle={styles.successText}
        />
        
        <DataBox 
          title="Progress"
          value={`${stats.progress}%`}
          style={styles.lightYellowBg}
          textStyle={styles.progressText}
        />
      </View>
      
      {/* Progress Chart Card */}
      <View style={[GlobalStyles.card, styles.chartCard]}>
        <Text style={GlobalStyles.title}>Progress Chart</Text>
        <View style={styles.chartContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.chartScrollContent}
            style={styles.chartScrollView}
          >
            <BarChart
              style={styles.chart}
              data={data}
              width={Math.max(cardAvailableWidth, 280)}
              height={180}
              chartConfig={chartConfig}
              verticalLabelRotation={30}
            />
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dashboardContainer: {
    marginBottom: 20,
  },
  dataCard: {
    marginBottom: 20,
    padding: 20,
  },
  dataBox: {
    marginBottom: 10,
    alignItems: 'center',
  },
  dataTitle: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
  },
  dataValue: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  chartCard: {
    marginTop: 10,
    padding: 20,
    overflow: 'hidden',
  },
  chartContainer: {
    width: '100%',
    maxWidth: 300, // Card width (340) - padding (40) = 300
    overflow: 'hidden',
  },
  chartScrollView: {
    width: '100%',
  },
  chartScrollContent: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: 8,
    marginVertical: 10,
  },

  // Background Colors
  lightBlueBg: { backgroundColor: '#e3f2fd' },
  lightGreenBg: { backgroundColor: '#e8f5e9' },
  lightYellowBg: { backgroundColor: '#fffde7' },

  // Value Colors
  blueValue: { color: '#2196f3' },
  successText: { color: '#4caf50' },
  progressText: { color: '#fbc02d' },
});

export default WeeklyUserData;
