import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { WorkerStatus } from '../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 3;

const FolderIcon = () => (
  <Svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
  </Svg>
);

interface WorkerHomeScreenProps {
  status: WorkerStatus;
  onToggleStatus: () => void;
  onGoProjects: () => void;
}

export default function WorkerHomeScreen({
  status,
  onToggleStatus,
  onGoProjects,
}: WorkerHomeScreenProps): React.JSX.Element {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>Availability Status</Text>
        <Text style={styles.cardValue}>{status === 'active' ? 'Active' : 'Inactive'}</Text>
        <Pressable style={styles.toggleButton} onPress={onToggleStatus}>
          <Text style={styles.toggleButtonText}>
            Set {status === 'active' ? 'Inactive' : 'Active'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.gridContainer}>
        <Pressable style={styles.card} onPress={onGoProjects}>
          <FolderIcon />
          <Text style={styles.cardLabel}>Projects</Text>
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
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: CARD_WIDTH,
    aspectRatio: 1,
    borderRadius: 12,
    marginRight: 10,
    marginBottom: 10,
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
    color: '#6B7280',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  toggleButton: {
    marginTop: 12,
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
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
