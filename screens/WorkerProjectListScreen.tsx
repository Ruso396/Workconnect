import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { api } from '../services/api';
import { WorkerProjectListItem } from '../types';

const FolderIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth={2}>
    <Path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
  </Svg>
);

function statusMeta(status: WorkerProjectListItem['status']) {
  switch (status) {
    case 'active':
      return { label: 'Running', badgeStyle: styles.badgeActive };
    case 'pending':
      return { label: 'Paused', badgeStyle: styles.badgePending };
    case 'closed':
      return { label: 'Closed', badgeStyle: styles.badgeClosed };
    default:
      return null;
  }
}

interface WorkerProjectListScreenProps {
  workerId: number;
  onOpenProject: (projectId: number) => void;
}

export default function WorkerProjectListScreen({
  workerId,
  onOpenProject,
}: WorkerProjectListScreenProps): React.JSX.Element {
  const [projects, setProjects] = useState<WorkerProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const rows = await api.getWorkerProjects(workerId);
      setProjects(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load projects');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workerId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.toolbar}>
        <Text style={styles.toolbarTitle}>Projects</Text>
        <Text style={styles.toolbarSub}>Assigned projects</Text>
      </View>
      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.sheet}>
          {projects.length === 0 ? (
            <Text style={styles.empty}>No assigned projects yet.</Text>
          ) : (
            projects.map((p, idx) => (
              <Pressable
                key={p.id}
                style={[styles.row, idx === projects.length - 1 && styles.rowLast]}
                onPress={() => onOpenProject(p.id)}
              >
                <View style={styles.nameCell}>
                  <FolderIcon />
                  <View style={styles.nameWrap}>
                    <Text style={styles.cellName} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={styles.cellSub} numberOfLines={1}>
                      {p.location}
                    </Text>
                    {statusMeta(p.status)?.label ? (
                      <View style={[styles.statusBadge, statusMeta(p.status)?.badgeStyle]}>
                        <Text style={styles.statusBadgeText}>{statusMeta(p.status)?.label}</Text>
                      </View>
                    ) : null}
                    {typeof p.running_days === 'number' ? (
                      <Text style={styles.runningHint}>Running for {p.running_days} days</Text>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F3F4F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  toolbar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  toolbarTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  toolbarSub: { marginTop: 2, fontSize: 13, color: '#6B7280', fontWeight: '600' },
  errorBanner: { marginHorizontal: 20, marginTop: 12, color: '#B91C1C', fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 32 },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  rowLast: { borderBottomWidth: 0 },
  nameCell: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameWrap: { flex: 1, minWidth: 0 },
  cellName: { fontWeight: '600', color: '#111827', fontSize: 15 },
  cellSub: { marginTop: 2, color: '#6B7280', fontSize: 13 },
  statusBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  badgeActive: { backgroundColor: '#16A34A' },
  badgePending: { backgroundColor: '#F59E0B' },
  badgeClosed: { backgroundColor: '#9CA3AF' },
  runningHint: { marginTop: 4, fontSize: 12, color: '#6B7280', fontWeight: '600' },
  empty: { padding: 24, textAlign: 'center', color: '#6B7280', fontSize: 14 },
});
