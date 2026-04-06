import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

import { api, profileImageUri } from '../services/api';
import { Project } from '../types';
import { displayDate } from '../utils/dateFormat';

const { width } = Dimensions.get('window');

// --- PREMIUM ICONS (INLINE SVG) ---

const LocationIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth={2}>
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

const CalendarIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth={2}>
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <Path d="M16 2v4M8 2v4M3 10h18" />
  </Svg>
);

const EditIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth={2}>
    <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <Path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
);

const PlusIconSmall = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth={2.5}>
    <Path d="M12 5v14M5 12h14" strokeLinecap="round" />
  </Svg>
);

export interface ProjectDetailScreenProps {
  contractorId: number;
  projectId: number;
  onAddWorkers: () => void;
  onEditNavigate: (project: Project) => void;
  onProjectClosed: () => void;
}

export default function ProjectDetailScreen({
  contractorId,
  projectId,
  onAddWorkers,
  onEditNavigate,
  onProjectClosed,
}: ProjectDetailScreenProps): React.JSX.Element {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [closing, setClosing] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [resuming, setResuming] = useState(false);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const p = await api.getProject(contractorId, projectId);
      setProject(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [contractorId, projectId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const confirmClose = () => {
    if (!project || project.status === 'closed') return;
    Alert.alert(
      'Close Project',
      'This permanently closes the project. You will not be able to resume it later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Close',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setClosing(true);
              try {
                await api.closeProject(contractorId, projectId);
                await load();
                onProjectClosed();
              } catch (e) {
                Alert.alert('Error', e instanceof Error ? e.message : 'Failed to close');
              } finally {
                setClosing(false);
              }
            })();
          },
        },
      ],
    );
  };

  const confirmPause = () => {
    if (!project || project.status !== 'active') return;
    Alert.alert('Pause Project', 'Pausing will stop the running day count. You can resume later.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Pause Now',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setPausing(true);
            try {
              await api.pauseProject(contractorId, projectId);
              await load();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Failed to pause');
            } finally {
              setPausing(false);
            }
          })();
        },
      },
    ]);
  };

  const confirmResume = () => {
    if (!project || project.status !== 'pending') return;
    Alert.alert('Resume Project', 'Resume this project and continue counting running days?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Resume Now',
        onPress: () => {
          void (async () => {
            setResuming(true);
            try {
              await api.resumeProject(contractorId, projectId);
              await load();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Failed to resume');
            } finally {
              setResuming(false);
            }
          })();
        },
      },
    ]);
  };

  if (loading && !project) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Fetching Details...</Text>
      </View>
    );
  }

  if (error && !project) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={() => void load()}>
          <Text style={styles.retryBtnText}>Retry Connection</Text>
        </Pressable>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.centered}>
        <Text style={styles.mutedText}>Project not found.</Text>
      </View>
    );
  }

  const isActive = project.status === 'active';
  const isPaused = project.status === 'pending';

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* --- PROJECT HERO SECTION --- */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.titleArea}>
              <Text style={styles.projectName}>{project.name}</Text>
              <View style={[
                styles.statusPill, 
                isActive ? styles.pillActive : isPaused ? styles.pillPaused : styles.pillClosed
              ]}>
                <View style={[styles.statusDot, { backgroundColor: isActive ? '#10B981' : isPaused ? '#F59E0B' : '#94A3B8' }]} />
                <Text style={[
                  styles.statusPillText,
                  isActive ? styles.textActive : isPaused ? styles.textPaused : styles.textClosed
                ]}>
                  {isActive ? 'Running' : isPaused ? 'Paused' : 'Closed'}
                </Text>
              </View>
            </View>
            <Pressable 
              style={styles.editBtn} 
              onPress={() => onEditNavigate(project)}
            >
              <EditIcon />
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>
          </View>

          {typeof project.running_days === 'number' && isActive && (
            <View style={styles.runningDaysBadge}>
              <Text style={styles.runningDaysText}>{project.running_days} days in progress</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <View style={styles.metaIconBox}><LocationIcon /></View>
              <View>
                <Text style={styles.metaLabel}>Location</Text>
                <Text style={styles.metaValue} numberOfLines={1}>{project.location}</Text>
              </View>
            </View>
            <View style={styles.metaItem}>
              <View style={styles.metaIconBox}><CalendarIcon /></View>
              <View>
                <Text style={styles.metaLabel}>Started On</Text>
                <Text style={styles.metaValue}>{displayDate(project.start_date)}</Text>
              </View>
            </View>
          </View>

          {project.description && (
            <View style={styles.descSection}>
              <Text style={styles.metaLabel}>Project Overview</Text>
              <Text style={styles.descriptionText}>{project.description}</Text>
            </View>
          )}
        </View>

        {/* --- PRIMARY ACTIONS --- */}
        {project.status !== 'closed' && (
          <View style={styles.actionContainer}>
            {isActive ? (
              <Pressable 
                style={[styles.pauseAction, pausing && { opacity: 0.7 }]} 
                onPress={confirmPause} 
                disabled={pausing}
              >
                {pausing ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.actionBtnText}>Pause Project</Text>}
              </Pressable>
            ) : (
              <Pressable 
                style={[styles.resumeAction, resuming && { opacity: 0.7 }]} 
                onPress={confirmResume} 
                disabled={resuming}
              >
                {resuming ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.actionBtnText}>Resume Project</Text>}
              </Pressable>
            )}
            <Pressable 
              style={[styles.closeAction, closing && { opacity: 0.7 }]} 
              onPress={confirmClose} 
              disabled={closing}
            >
              {closing ? <ActivityIndicator color="#DC2626" /> : <Text style={styles.closeActionText}>Close</Text>}
            </Pressable>
          </View>
        )}

        {/* --- WORKERS SECTION --- */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Project Team</Text>
              <Text style={styles.sectionSubtitle}>{project.workers.length} members assigned</Text>
            </View>
            {project.status !== 'closed' && (
              <Pressable style={styles.addWorkersBtn} onPress={onAddWorkers}>
                <PlusIconSmall />
                <Text style={styles.addWorkersText}>Add</Text>
              </Pressable>
            )}
          </View>

          {project.workers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No workers assigned to this group yet.</Text>
            </View>
          ) : (
            project.workers.map((w, index) => {
              const uri = profileImageUri(w.profile_image ?? undefined);
              const initial = (w.name || '?').trim().charAt(0).toUpperCase();
              return (
                <View key={w.user_id} style={[styles.workerRow, index === 0 && { borderTopWidth: 0 }]}>
                  <View style={styles.avatarWrapper}>
                    {uri ? (
                      <Image source={{ uri }} style={styles.avatarImg} />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarLetter}>{initial}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.workerInfo}>
                    <Text style={styles.workerName}>{w.name}</Text>
                    <Text style={styles.workerRole}>{w.role} • {w.phone}</Text>
                  </View>
                  <View style={styles.chevronIcon}><Text style={{color: '#CBD5E1'}}>›</Text></View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: '#64748B', fontWeight: '600' },
  errorText: { color: '#EF4444', fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F1F5F9' },
  retryBtnText: { color: '#475569', fontWeight: '700' },
  mutedText: { color: '#94A3B8' },

  // Hero Card
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleArea: { flex: 1, paddingRight: 12 },
  projectName: { fontSize: 24, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  pillActive: { backgroundColor: '#DCFCE7' },
  pillPaused: { backgroundColor: '#FEF3C7' },
  pillClosed: { backgroundColor: '#F1F5F9' },
  statusPillText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  textActive: { color: '#166534' },
  textPaused: { color: '#92400E' },
  textClosed: { color: '#475569' },
  
  runningDaysBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 16,
    alignSelf: 'flex-start'
  },
  runningDaysText: { color: '#4F46E5', fontWeight: '700', fontSize: 13 },
  
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  editBtnText: { fontWeight: '700', color: '#4F46E5', fontSize: 13 },
  
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 },
  
  metaGrid: { flexDirection: 'row', gap: 20 },
  metaItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center' },
  metaLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 2 },
  metaValue: { fontSize: 14, color: '#1E293B', fontWeight: '700' },
  
  descSection: { marginTop: 20 },
  descriptionText: { fontSize: 14, color: '#64748B', lineHeight: 22, marginTop: 4 },

  // Actions
  actionContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  pauseAction: {
    flex: 2,
    backgroundColor: '#F59E0B',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  resumeAction: {
    flex: 2,
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  closeAction: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  closeActionText: { color: '#DC2626', fontWeight: '800', fontSize: 16 },

  // Worker Section
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  sectionSubtitle: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  addWorkersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  addWorkersText: { color: '#4F46E5', fontWeight: '700', fontSize: 14 },
  
  emptyState: { paddingVertical: 20, alignItems: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 14, textAlign: 'center' },
  
  workerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 14, 
    borderTopWidth: 1, 
    borderTopColor: '#F8FAFC' 
  },
  avatarWrapper: { width: 48, height: 48, borderRadius: 16, overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 18, fontWeight: '800', color: '#4F46E5' },
  workerInfo: { flex: 1, marginLeft: 12 },
  workerName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  workerRole: { fontSize: 13, color: '#64748B', marginTop: 2, fontWeight: '500' },
  chevronIcon: { paddingLeft: 8 },
});