import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

import { api } from '../services/api';
import { WorkerProjectListItem } from '../types';
import { displayDate } from '../utils/dateFormat';

interface WorkerProjectDetailScreenProps {
  workerId: number;
  projectId: number;
}

// --- Custom SVG Components ---
const LocationIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

const CalendarIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
    <Path d="M16 2v4M8 2v4M3 10h18" />
  </Svg>
);

const ClockIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 6v6l4 2" />
  </Svg>
);

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
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (error && !project) {
    return (
      <View style={styles.centered}>
        <View style={styles.errorCard}>
          <Text style={styles.error}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => void load()}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </Pressable>
        </View>
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

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'active': return { bg: '#ecfdf5', text: '#059669', label: 'Running' };
      case 'pending': return { bg: '#fffbeb', text: '#d97706', label: 'Paused' };
      default: return { bg: '#f3f4f6', text: '#6b7280', label: 'Closed' };
    }
  };

  const statusTheme = getStatusStyles(project.status || '');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: statusTheme.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusTheme.text }]} />
          <Text style={[styles.statusText, { color: statusTheme.text }]}>{statusTheme.label}</Text>
        </View>
        <Text style={styles.projectName}>{project.name}</Text>
        {typeof project.running_days === 'number' && (
          <View style={styles.daysRow}>
            <ClockIcon />
            <Text style={styles.runningDaysText}>Active for {project.running_days} days</Text>
          </View>
        )}
      </View>

      {/* Details Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <LocationIcon />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>{project.location}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <CalendarIcon />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.label}>Start Date</Text>
            <Text style={styles.value}>{displayDate(project.start_date)}</Text>
          </View>
        </View>
      </View>

      {/* Description Section */}
      {project.description ? (
        <View style={styles.descSection}>
          <Text style={styles.sectionTitle}>Project Overview</Text>
          <View style={styles.descCard}>
            <Text style={styles.descriptionText}>{project.description}</Text>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 20, paddingBottom: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  
  // Header
  header: { marginBottom: 24, alignItems: 'flex-start' },
  projectName: { fontSize: 28, fontWeight: '900', color: '#0F172A', marginTop: 12, letterSpacing: -0.5 },
  daysRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  runningDaysText: { marginLeft: 6, fontSize: 14, color: '#64748B', fontWeight: '500' },
  
  // Status Badge (dynamic colors applied inline)
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  // Info Card
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: { flex: 1 },
  label: { fontSize: 12, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  value: { fontSize: 16, color: '#1E293B', fontWeight: '600', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 0, marginVertical: 4 },

  // Description
  descSection: { marginTop: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 12 },
  descCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  descriptionText: { fontSize: 15, color: '#475569', lineHeight: 24, fontWeight: '400' },

  // Error & Muted
  errorCard: { padding: 20, backgroundColor: '#FEF2F2', borderRadius: 16, alignItems: 'center', width: '100%' },
  error: { color: '#991B1B', fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: '#FFFFFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA' },
  retryBtnText: { color: '#991B1B', fontWeight: '700' },
  muted: { color: '#94A3B8', fontWeight: '500' },
});
