import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import Svg, { Circle, Path, Rect, G, Defs, LinearGradient, Stop } from 'react-native-svg';

import { api } from '../services/api';
import { ProjectListItem, ProjectStatus } from '../types';
import { displayDate } from '../utils/dateFormat';

const { width } = Dimensions.get('window');

// --- PREMIUM CUSTOM ICONS (INLINE SVG) ---

const FolderIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="folderFillGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#7F00FF" stopOpacity={0.12} />
        <Stop offset="100%" stopColor="#E100FF" stopOpacity={0.18} />
      </LinearGradient>
      <LinearGradient id="folderStrokeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#7F00FF" />
        <Stop offset="100%" stopColor="#E100FF" />
      </LinearGradient>
    </Defs>
    <Path 
      d="M20 7H12L10.553 4.106A2 2 0 008.764 3H4a2 2 0 00-2 2v14a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" 
      fill="url(#folderFillGrad)" 
      stroke="url(#folderStrokeGrad)" 
      strokeWidth={1.5} 
      strokeLinejoin="round" 
    />
  </Svg>
);

const MoreIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="1" stroke="#9CA3AF" strokeWidth={2} />
    <Circle cx="12" cy="5" r="1" stroke="#9CA3AF" strokeWidth={2} />
    <Circle cx="12" cy="19" r="1" stroke="#9CA3AF" strokeWidth={2} />
  </Svg>
);

const PlusIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5V19M5 12H19" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" />
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

// --- HELPER FOR BADGE STYLING ---

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

export interface ProjectListScreenProps {
  contractorId: number;
  onCreateProject: () => void;
  onOpenProject: (projectId: number) => void;
  onEditProject: (project: ProjectListItem) => void;
  onAfterListChange?: () => void;
}

export default function ProjectListScreen({
  contractorId,
  onCreateProject,
  onOpenProject,
  onEditProject,
  onAfterListChange,
}: ProjectListScreenProps): React.JSX.Element {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [menuProject, setMenuProject] = useState<ProjectListItem | null>(null);
  const [menuBusy, setMenuBusy] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const rows = await api.getProjects(contractorId);
      setProjects(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load projects');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [contractorId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  const closeMenu = () => setMenuProject(null);

  const handleDelete = (p: ProjectListItem) => {
    closeMenu();
    Alert.alert('Delete project', `Remove "${p.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Project',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setMenuBusy(true);
            try {
              await api.deleteProject(contractorId, p.id);
              await load();
              onAfterListChange?.();
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Delete failed');
            } finally {
              setMenuBusy(false);
            }
          })();
        },
      },
    ]);
  };

  const handleClose = (p: ProjectListItem) => {
    closeMenu();
    if (p.status === 'closed') return;
    Alert.alert('Close project', `Mark "${p.name}" as closed?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, Close It',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setMenuBusy(true);
            try {
              await api.closeProject(contractorId, p.id);
              await load();
              onAfterListChange?.();
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Could not close project');
            } finally {
              setMenuBusy(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      {/* --- PREMIUM HEADER --- */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Manage your</Text>
          <Text style={styles.headerTitle}>Projects</Text>
        </View>
        <Pressable 
          style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.8 }]} 
          onPress={onCreateProject}
        >
          <View style={styles.createBtnGradientBg}>
            <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="projectBtnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#7F00FF" />
                  <Stop offset="100%" stopColor="#E100FF" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100" height="100" fill="url(#projectBtnGrad)" />
            </Svg>
          </View>
          <View style={styles.createBtnContent}>
            <PlusIcon />
            <Text style={styles.createBtnText}>New</Text>
          </View>
        </Pressable>
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
              const meta = statusMeta(p.status);
              return (
                <View key={p.id} style={styles.projectCard}>
                  <Pressable 
                    style={styles.cardMain} 
                    onPress={() => onOpenProject(p.id)}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.folderContainer}>
                        <FolderIcon />
                      </View>
                      <View style={styles.titleArea}>
                        <Text style={styles.projectName} numberOfLines={1}>{p.name}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: meta.badgeBg }]}>
                          <Text style={[styles.statusBadgeText, { color: meta.text }]}>{meta.label}</Text>
                        </View>
                      </View>
                      <Pressable style={styles.menuTrigger} onPress={() => setMenuProject(p)}>
                        <MoreIcon />
                      </Pressable>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.cardFooter}>
                      <View style={styles.infoRow}>
                        <LocationIcon />
                        <Text style={styles.infoText} numberOfLines={1}>{p.location}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <CalendarIcon />
                        <Text style={styles.infoText}>{displayDate(p.start_date)}</Text>
                      </View>
                    </View>

                    {typeof p.running_days === 'number' && p.status === 'active' && (
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

      {/* --- PREMIUM BOTTOM SHEET MENU --- */}
      <Modal visible={menuProject !== null} transparent animationType="slide" onRequestClose={closeMenu}>
        <Pressable style={styles.modalBackdrop} onPress={closeMenu}>
          <View style={styles.menuCard}>
            <View style={styles.menuHandle} />
            {menuProject ? (
              <View style={styles.menuContent}>
                <Text style={styles.menuHeaderTitle}>{menuProject.name}</Text>
                
                <Pressable
                  style={styles.menuItem}
                  disabled={menuBusy}
                  onPress={() => {
                    const m = menuProject;
                    closeMenu();
                    onEditProject(m);
                  }}
                >
                  <View style={styles.menuIconCircle}><Text>✏️</Text></View>
                  <Text style={styles.menuItemText}>Edit Details</Text>
                </Pressable>

                <Pressable
                  style={styles.menuItem}
                  disabled={menuBusy || menuProject.status === 'closed'}
                  onPress={() => handleClose(menuProject)}
                >
                  <View style={styles.menuIconCircle}><Text>🔒</Text></View>
                  <Text style={[styles.menuItemText, menuProject.status === 'closed' && { color: '#9CA3AF' }]}>
                    Mark as Closed
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.menuItem, styles.menuItemLast]}
                  disabled={menuBusy}
                  onPress={() => handleDelete(menuProject)}
                >
                  <View style={[styles.menuIconCircle, ]}><Text>🗑️</Text></View>
                  <Text style={[styles.menuItemText, { color: '#DC2626' }]}>Delete Project</Text>
                </Pressable>

                <Pressable style={styles.menuCancelBtn} onPress={closeMenu}>
                  <Text style={styles.menuCancelBtnText}>Close</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  
  // Header
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
  
  createBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: '#7F00FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  createBtnGradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  createBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  createBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

  // Scroll & List
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
    overflow: 'hidden'
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
  menuTrigger: { padding: 8 },
  
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

  // States
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { marginHorizontal: 20, marginTop: 12, backgroundColor: '#FEF2F2', padding: 12, borderRadius: 10 },
  errorBanner: { color: '#B91C1C', fontWeight: '600', textAlign: 'center' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginTop: 16 },
  emptyDesc: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 8, lineHeight: 20 },

  // Modal / Bottom Sheet
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  menuHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 12,
  },
  menuContent: { padding: 24 },
  menuHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 20, textAlign: 'center' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemLast: { borderBottomWidth: 0, marginBottom: 10 },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemText: { fontSize: 16, fontWeight: '600', color: '#334155' },
  menuCancelBtn: {
    marginTop: 10,
    backgroundColor: '#F1F5F9',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  menuCancelBtnText: { color: '#475569', fontWeight: '700', fontSize: 16 },
});