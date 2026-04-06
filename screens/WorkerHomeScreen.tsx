import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { WorkerStatus } from '../types';

const FolderIcon = () => (
  <Svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
  </Svg>
);

const AttendanceIcon = () => (
  <Svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5">
    <Path d="M8 2v4M16 2v4M3 10h18" />
    <Rect x="3" y="4" width="18" height="18" rx="2" />
    <Path d="M8 14h.01M12 14h.01M16 14h.01" />
  </Svg>
);

interface WorkerHomeScreenProps {
  status: WorkerStatus;
  onToggleStatus: () => void;
  onGoProjects: () => void;
  onGoAttendance: () => void;
}

export default function WorkerHomeScreen({
  status,
  onToggleStatus,
  onGoProjects,
  onGoAttendance,
}: WorkerHomeScreenProps): React.JSX.Element {
  const animatedValue = useRef(new Animated.Value(status === 'active' ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: status === 'active' ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [status]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#EF4444', '#22C55E'],
  });

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 28],
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.statusCard}>
        <View>
          <Text style={styles.cardTitle}>Current Status</Text>
          <Text style={[styles.cardValue, { color: status === 'active' ? '#22C55E' : '#EF4444' }]}>
            {status === 'active' ? 'Active' : 'Inactive'}
          </Text>
        </View>

        <Pressable onPress={onToggleStatus}>
          <Animated.View style={[styles.switchTrack, { backgroundColor }]}>
            <Animated.View style={[styles.switchKnob, { transform: [{ translateX }] }]} />
          </Animated.View>
        </Pressable>
      </View>

      <View style={styles.gridContainer}>
        <Pressable style={styles.card} onPress={onGoProjects}>
          <FolderIcon />
          <Text style={styles.cardLabel}>Projects</Text>
        </Pressable>
        <Pressable style={styles.card} onPress={onGoAttendance}>
          <AttendanceIcon />
          <Text style={styles.cardLabel}>Attendance</Text>
        </Pressable>
      </View>

      {/* <View style={styles.hintCard}>
        <Text style={styles.hintTitle}>Job requests</Text>
        <Text style={styles.hintBody}>
          Tap the <Text style={styles.hintEm}>bell</Text> in the header to view job details, accept, or reject.
        </Text>
      </View> */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardLabel: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  switchTrack: {
    width: 58,
    height: 32,
    borderRadius: 16,
    padding: 2,
    justifyContent: 'center',
  },
  switchKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  hintCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  hintTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  hintBody: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  hintEm: {
    fontWeight: '800',
    color: '#111827',
  },
});
