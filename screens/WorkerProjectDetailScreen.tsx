import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { api } from '../services/api';
import { WorkerProjectListItem } from '../types';
import { displayDate } from '../utils/dateFormat';

interface WorkerProjectDetailScreenProps {
  workerId: number;
  projectId: number;
}

export default function WorkerProjectDetailScreen({
  workerId,
  projectId,
}: WorkerProjectDetailScreenProps): React.JSX.Element {
  const [project, setProject] = useState<WorkerProjectListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const p = await api.getWorkerProject(workerId, projectId);
      setProject(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [workerId, projectId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (loading && !project) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  if (error && !project) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
        <Pressable style={styles.secondaryBtnFull} onPress={() => void load()}>
          <Text style={styles.secondaryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Project not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.hero}>
        <Text style={styles.name}>{project.name}</Text>
        {project.status ? (
          <Text style={styles.statusLine}>
            Status:{' '}
            <Text
              style={
                project.status === 'active'
                  ? styles.statusOn
                  : project.status === 'pending'
                    ? styles.statusPending
                    : styles.statusOff
              }
            >
              {project.status === 'active' ? 'Running' : project.status === 'pending' ? 'Paused' : 'Closed'}
            </Text>
          </Text>
        ) : null}
        {typeof project.running_days === 'number' ? (
          <Text style={styles.runningDays}>Running for {project.running_days} days</Text>
        ) : null}
        <Text style={styles.metaLabel}>Location</Text>
        <Text style={styles.meta}>{project.location}</Text>
        <Text style={styles.metaLabel}>Start</Text>
        <Text style={styles.meta}>{displayDate(project.start_date)}</Text>
        {project.description ? (
          <>
            <Text style={styles.metaLabel}>Description</Text>
            <Text style={styles.description}>{project.description}</Text>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40, backgroundColor: '#F3F4F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  error: { color: '#B91C1C', fontWeight: '600', textAlign: 'center', marginBottom: 12 },
  muted: { color: '#6B7280' },
  hero: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  name: { fontSize: 22, fontWeight: '800', color: '#111827' },
  statusLine: { marginTop: 6, fontSize: 14, color: '#6B7280' },
  statusOn: { color: '#059669', fontWeight: '800' },
  statusPending: { color: '#D97706', fontWeight: '800' },
  statusOff: { color: '#6B7280', fontWeight: '800' },
  runningDays: { marginTop: 6, fontSize: 13, color: '#6B7280', fontWeight: '700' },
  metaLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', marginTop: 10 },
  meta: { fontSize: 15, color: '#111827', marginTop: 4, fontWeight: '600' },
  description: { fontSize: 14, color: '#4B5563', marginTop: 4, lineHeight: 20 },
  secondaryBtnFull: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryBtnText: { fontWeight: '700', color: '#374151' },
});
