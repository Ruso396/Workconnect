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
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { api } from '../services/api';
import { ProjectStatus, WorkerProjectListItem } from '../types';
import { displayDate } from '../utils/dateFormat';

const FolderIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="workerFolderFillGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#7F00FF" stopOpacity={0.12} />
        <Stop offset="100%" stopColor="#E100FF" stopOpacity={0.18} />
      </LinearGradient>
      <LinearGradient id="workerFolderStrokeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#7F00FF" />
        <Stop offset="100%" stopColor="#E100FF" />
      </LinearGradient>
    </Defs>
    <Path
      d="M20 7H12L10.553 4.106A2 2 0 008.764 3H4a2 2 0 00-2 2v14a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"
      fill="url(#workerFolderFillGrad)"
      stroke="url(#workerFolderStrokeGrad)"
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
  </Svg>
);

const CalendarIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={2}>
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <Path d="M16 2v4M8 2v4M3 10h18" />
  </Svg>
);

const LocationIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={2}>
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

function statusMeta(status: ProjectStatus) {
  switch (status) {
    case 'active':
      return { label: 'Active', badgeBg: '#DCFCE7', text: '#166534' };
    case 'pending':
      return { label: 'Paused', badgeBg: '#FEF3C7', text: '#92400E' };
    default:
      return { label: 'Closed', badgeBg: '#F3F4F6', text: '#374151' };
  }
}

function projectStatus(p: WorkerProjectListItem): ProjectStatus {
  return p.status ?? 'active';
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

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Manage your</Text>
          <Text style={styles.headerTitle}>Projects</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorBanner}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
        >
          {projects.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FolderIcon />
              <Text style={styles.emptyTitle}>No Projects Yet</Text>
              <Text style={styles.emptyDesc}>Create your first project to start tracking your work and team.</Text>
            </View>
          ) : (
            projects.map((p) => {
              const meta = statusMeta(projectStatus(p));
              return (
                <View key={p.id} style={styles.projectCard}>
                  <Pressable style={styles.cardMain} onPress={() => onOpenProject(p.id)}>
                    <View style={styles.cardHeader}>
                      <View style={styles.folderContainer}>
                        <FolderIcon />
                      </View>
                      <View style={styles.titleArea}>
                        <Text style={styles.projectName} numberOfLines={1}>
                          {p.name}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: meta.badgeBg }]}>
                          <Text style={[styles.statusBadgeText, { color: meta.text }]}>{meta.label}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.cardFooter}>
                      <View style={styles.infoRow}>
                        <LocationIcon />
                        <Text style={styles.infoText} numberOfLines={1}>
                          {p.location}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <CalendarIcon />
                        <Text style={styles.infoText}>{displayDate(p.start_date)}</Text>
                      </View>
                    </View>

                    {typeof p.running_days === 'number' && projectStatus(p) === 'active' && (
                      <View style={styles.statsTag}>
                        <Text style={styles.statsTagText}>{p.running_days} days running</Text>
                      </View>
                    )}
                  </Pressable>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  headerSubtitle: { fontSize: 14, color: '#64748B', fontWeight: '500', letterSpacing: 0.5 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A' },

  scroll: { padding: 20, paddingBottom: 40 },

  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  cardMain: { padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  folderContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleArea: { flex: 1, marginLeft: 12 },
  projectName: { fontSize: 17, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  infoText: { fontSize: 13, color: '#64748B', fontWeight: '500' },

  statsTag: {
    position: 'absolute',
    top: 0,
    right: 40,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  statsTagText: { fontSize: 10, color: '#4F46E5', fontWeight: '700' },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { marginHorizontal: 20, marginTop: 12, backgroundColor: '#FEF2F2', padding: 12, borderRadius: 10 },
  errorBanner: { color: '#B91C1C', fontWeight: '600', textAlign: 'center' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginTop: 16 },
  emptyDesc: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
