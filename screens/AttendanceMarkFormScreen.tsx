import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg'; // SVG usage
import { api, profileImageUri } from '../services/api';
import { Project, ProjectListItem } from '../types';
import { isISODateToday } from '../utils/dateFormat';

const { width } = Dimensions.get('window');

// --- CUSTOM SVG COMPONENTS (Direct React Native SVG) ---
const IconProject = ({ color = "#64748B" }) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Path d="M9 22V12h6v10" />
  </Svg>
);

const IconCheck = ({ color = "#FFF", size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);

const IconLocation = ({ color = "#94A3B8" }) => (
  <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

interface AttendanceMarkFormScreenProps {
  contractorId: number;
  date: string;
  initialProjectId?: number;
  onDone: (didSave: boolean) => void;
}

export default function AttendanceMarkFormScreen({
  contractorId,
  date,
  initialProjectId,
  onDone,
}: AttendanceMarkFormScreenProps): React.JSX.Element {
  // --- LOGIC (KEEPING AS IS) ---
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [presentIds, setPresentIds] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingProjects(true);
      try {
        const list = await api.getProjects(contractorId, 'active');
        if (cancelled) return;
        setProjects(list);
        if (list.length > 0) {
          if (initialProjectId != null && list.some((p) => p.id === initialProjectId)) {
            setProjectId(initialProjectId);
          } else {
            setProjectId(list[0].id);
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load projects');
      } finally {
        if (!cancelled) setLoadingProjects(false);
      }
    })();
    return () => { cancelled = true; };
  }, [contractorId, initialProjectId]);

  useEffect(() => {
    if (projectId == null) {
      setProject(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingWorkers(true);
      setError('');
      setSelected(new Set());
      setPresentIds(new Set());
      try {
        const [p, attendance] = await Promise.all([
          api.getProject(contractorId, projectId),
          api.getAttendanceByDate(contractorId, projectId, date),
        ]);
        if (cancelled) return;
        setProject(p);
        setPresentIds(new Set(attendance.present_workers.map((w) => w.user_id)));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load workers');
      } finally {
        if (!cancelled) setLoadingWorkers(false);
      }
    })();
    return () => { cancelled = true; };
  }, [contractorId, projectId, date]);

  const selectedProject = useMemo(() => projects.find((p) => p.id === projectId) ?? null, [projects, projectId]);
  const canMarkToday = isISODateToday(date);
  
  const presentWorkers = useMemo(() => {
    if (!project) return [];
    return project.workers.filter((w) => presentIds.has(w.user_id));
  }, [project, presentIds]);

  const absentWorkers = useMemo(() => {
    if (!project) return [];
    return project.workers.filter((w) => !presentIds.has(w.user_id));
  }, [project, presentIds]);

  const onToggle = (workerId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(workerId)) next.delete(workerId);
      else next.add(workerId);
      return next;
    });
  };

  const onSubmit = async () => {
    if (projectId == null || !canMarkToday) return;
    setSaving(true);
    setError('');
    try {
      const finalPresentIds = Array.from(new Set([...Array.from(presentIds), ...Array.from(selected)]));
      await api.markAttendance(contractorId, projectId, date, finalPresentIds);
      onDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to mark attendance');
    } finally {
      setSaving(false);
    }
  };

  // --- PREMIUM UI RENDER ---
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Attendance</Text>
            <View style={styles.dateRow}>
               <Text style={styles.dateLabel}>{date}</Text>
            </View>
          </View>
        </View>

        {!canMarkToday && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>Read-only: Attendance can only be marked for today.</Text>
          </View>
        )}

        {/* Project Selector Card */}
        <View style={[styles.card, { zIndex: 999 }]}>
          <Text style={styles.label}>Active Project</Text>
          <Pressable
            style={[styles.dropdownTrigger, showProjectMenu && styles.dropdownActive]}
            onPress={() => setShowProjectMenu((v) => !v)}
            disabled={loadingProjects || projects.length === 0}
          >
            <View style={styles.iconCircle}>
               <IconProject color="#1E293B" />
            </View>
            <View style={styles.dropdownMain}>
              <Text style={styles.dropdownText} numberOfLines={1}>
                {selectedProject?.name ?? 'Select Project'}
              </Text>
              {selectedProject && (
                <View style={styles.locRow}>
                  <IconLocation />
                  <Text style={styles.dropdownSubtext}>{selectedProject.location}</Text>
                </View>
              )}
            </View>
            <View style={[styles.chev, showProjectMenu && { transform: [{ rotate: '180deg' }] }]}>
               <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M6 9l6 6 6-6" />
               </Svg>
            </View>
          </Pressable>

          {showProjectMenu && (
            <View style={styles.menuContainer}>
              <ScrollView style={styles.menuScroll} nestedScrollEnabled={true}>
                {projects.map((p) => (
                  <Pressable
                    key={p.id}
                    style={({ pressed }) => [styles.menuItem, p.id === projectId && styles.menuItemActive, pressed && { opacity: 0.7 }]}
                    onPress={() => {
                      setProjectId(p.id);
                      setShowProjectMenu(false);
                    }}
                  >
                    <Text style={[styles.menuTitle, p.id === projectId && { color: '#0F172A' }]}>{p.name}</Text>
                    {p.id === projectId && <IconCheck color="#0F172A" size={16} />}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Workers List */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Workers List</Text>
            <View style={styles.countBadge}>
                <Text style={styles.countText}>{absentWorkers.length + presentWorkers.length}</Text>
            </View>
        </View>

        {/* Present Section */}
        {presentWorkers.length > 0 && (
          <View style={styles.workerSection}>
            <Text style={styles.listStatusLabel}>Confirmed Present</Text>
            {presentWorkers.map((w) => {
              const uri = profileImageUri(w.profile_image ?? undefined);
              return (
                <View key={w.user_id} style={[styles.workerRow, styles.workerRowPresent]}>
                  {uri ? <Image source={{ uri }} style={styles.avatar} /> : (
                    <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>{w.name.charAt(0)}</Text></View>
                  )}
                  <View style={styles.workerInfo}>
                    <Text style={styles.workerName}>{w.name}</Text>
                    <Text style={styles.workerMeta}>{w.role || 'Worker'}</Text>
                  </View>
                  <View style={styles.statusBadge}>
                     <IconCheck color="#15803d" size={12} />
                     <Text style={styles.statusBadgeText}>Present</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Absent/Available Section */}
        <View style={styles.workerSection}>
          <Text style={styles.listStatusLabel}>Available to Mark</Text>
          {loadingWorkers ? (
            <ActivityIndicator style={{ marginTop: 30 }} color="#0F172A" />
          ) : absentWorkers.length === 0 && presentWorkers.length === 0 ? (
            <View style={styles.emptyContainer}>
                <Text style={styles.empty}>No workers assigned.</Text>
            </View>
          ) : (
            absentWorkers.map((w) => {
              const isSelected = selected.has(w.user_id);
              const uri = profileImageUri(w.profile_image ?? undefined);
              return (
                <Pressable
                  key={w.user_id}
                  style={[styles.workerRow, isSelected && styles.workerRowSelected]}
                  onPress={() => canMarkToday && onToggle(w.user_id)}
                  disabled={!canMarkToday}
                >
                  {uri ? <Image source={{ uri }} style={styles.avatar} /> : (
                    <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>{w.name.charAt(0)}</Text></View>
                  )}
                  <View style={styles.workerInfo}>
                    <Text style={styles.workerName}>{w.name}</Text>
                    <Text style={styles.workerMeta}>{w.role || 'Worker'}</Text>
                  </View>
                  <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                    {isSelected && <IconCheck />}
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <Pressable style={styles.cancelBtn} onPress={() => onDone(false)}>
          <Text style={styles.cancelText}>Discard</Text>
        </Pressable>
        <Pressable
          style={[styles.saveBtn, (saving || !canMarkToday) && styles.disabledBtn]}
          disabled={saving || !canMarkToday}
          onPress={onSubmit}
        >
          {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>Submit Attendance</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFC' },
  scroll: { padding: 24, paddingBottom: 150 },
  header: { marginBottom: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  title: { fontSize: 32, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  dateRow: { marginTop: 4 },
  dateLabel: { fontSize: 15, color: '#64748B', fontWeight: '600' },
  
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: 28,
  },
  label: { fontSize: 11, fontWeight: '800', color: '#94A3B8', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1.2 },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  dropdownActive: { borderColor: '#0F172A', backgroundColor: '#FFF' },
  iconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginRight: 12, elevation: 1 },
  dropdownMain: { flex: 1 },
  dropdownText: { color: '#0F172A', fontWeight: '700', fontSize: 16 },
  locRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  dropdownSubtext: { color: '#64748B', fontSize: 12, marginLeft: 4 },
  chev: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  
  menuContainer: {
    marginTop: 10,
    backgroundColor: '#FFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  menuScroll: { maxHeight: 200 },
  menuItem: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  menuItemActive: { backgroundColor: '#F8FAFC' },
  menuTitle: { fontSize: 15, fontWeight: '600', color: '#64748B' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  countBadge: { marginLeft: 8, backgroundColor: '#0F172A', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  workerSection: { marginBottom: 24 },
  listStatusLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '700', marginBottom: 12, textTransform: 'uppercase' },
  
  workerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    padding: 14, 
    borderRadius: 20, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
  },
  workerRowSelected: { borderColor: '#0F172A', backgroundColor: '#F8FAFC', borderWidth: 2 },
  workerRowPresent: { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' },
  
  avatar: { width: 48, height: 48, borderRadius: 16, marginRight: 14 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  avatarText: { color: '#475569', fontWeight: 'bold', fontSize: 18 },
  
  workerInfo: { flex: 1 },
  workerName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  workerMeta: { fontSize: 13, color: '#64748B', marginTop: 1 },
  
  checkbox: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  statusBadgeText: { color: '#15803D', fontSize: 11, fontWeight: '800', marginLeft: 4 },
  
  footer: { 
    position: 'absolute', 
    bottom: 0, 
    width: width, 
    backgroundColor: '#FFF', 
    padding: 24, 
    flexDirection: 'row', 
    gap: 12, 
    borderTopWidth: 1, 
    borderTopColor: '#F1F5F9', 
    paddingBottom: Platform.OS === 'ios' ? 40 : 24 
  },
  cancelBtn: { flex: 1, paddingVertical: 18, alignItems: 'center', borderRadius: 20, backgroundColor: '#F1F5F9' },
  cancelText: { color: '#64748B', fontWeight: '700', fontSize: 16 },
  saveBtn: { flex: 2.2, paddingVertical: 18, alignItems: 'center', borderRadius: 20, backgroundColor: '#07a633' },
  saveText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  
  disabledBtn: { opacity: 0.3 },
  warningBox: { backgroundColor: '#FFF7ED', padding: 14, borderRadius: 16, borderLeftWidth: 5, borderLeftColor: '#F97316', marginBottom: 24 },
  warningText: { color: '#9A3412', fontSize: 13, fontWeight: '600' },
  errorContainer: { backgroundColor: '#FEF2F2', padding: 16, borderRadius: 16, marginBottom: 20 },
  errorText: { color: '#DC2626', fontSize: 14, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', padding: 40 },
  empty: { color: '#94A3B8', fontStyle: 'italic' },
});

