import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { WorkerStatus } from '../types';

interface WorkerHomeScreenProps {
  status: WorkerStatus;
  onToggleStatus: () => void;
}

export default function WorkerHomeScreen({ status, onToggleStatus }: WorkerHomeScreenProps): React.JSX.Element {
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

      <View style={styles.hintCard}>
        <Text style={styles.hintTitle}>Job requests</Text>
        <Text style={styles.hintBody}>
          Tap the <Text style={styles.hintEm}>bell</Text> in the header to view job details, accept, or reject.
        </Text>
      </View>
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
