import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient, Stop } from 'react-native-svg';

import { ContractorRole, Worker, WorkerTradeRole } from '../types';
import { profileImageUri } from '../services/api';

const { width } = Dimensions.get('window');

// --- MODERN PREMIUM ICONS (INLINE SVG) ---

const SearchIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="11" cy="11" r="8" />
    <Path d="M21 21l-4.35-4.35" />
  </Svg>
);

const CallIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
);

const LocationSmallIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={2}>
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

interface WorkerListScreenProps {
  workers: Worker[];
  roles: ContractorRole[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}

export default function WorkerListScreen({
  workers,
  roles,
  loading,
  refreshing,
  onRefresh,
}: WorkerListScreenProps): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [filterRole, setFilterRole] = useState<WorkerTradeRole | 'all'>('all');

  const roleKeys = useMemo(() => {
    const fromProps = roles.map((r) => r.role_key).filter(Boolean);
    const fromWorkers = workers.map((w) => w.role).filter(Boolean);
    const uniq = new Set<string>([...fromProps, ...fromWorkers]);
    return Array.from(uniq);
  }, [roles, workers]);

  const roleFilters = useMemo(() => {
    return ['all', ...roleKeys] as Array<WorkerTradeRole | 'all'>;
  }, [roleKeys]);

  const normalizeWorkerStatus = (status: Worker['status']): Worker['status'] =>
    status === 'inactive' ? 'inactive' : 'active';

  const filteredWorkers = useMemo(() => {
    return workers.filter((worker) => {
      const matchesRole = filterRole === 'all' || worker.role === filterRole;
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 ||
        worker.name.toLowerCase().includes(normalizedQuery) ||
        worker.location.toLowerCase().includes(normalizedQuery) ||
        worker.phone.includes(normalizedQuery);

      return matchesRole && matchesQuery;
    });
  }, [workers, query, filterRole]);

  const activeWorkers = filteredWorkers.filter((w) => normalizeWorkerStatus(w.status) === 'active');
  const inactiveWorkers = filteredWorkers.filter((w) => normalizeWorkerStatus(w.status) === 'inactive');

  const callWorker = async (phone: string) => {
    await Linking.openURL(`tel:${phone}`);
  };

  const renderWorkerCard = (worker: Worker) => {
    const fallbackLetter = (worker.name ?? '').trim().charAt(0).toUpperCase();
    const avatarUri = profileImageUri(worker.profile_image);
    const status = normalizeWorkerStatus(worker.status);
    const isActive = status === 'active';

    return (
      <View key={worker.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatarContainer, !isActive && styles.inactiveAvatar]}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>{fallbackLetter}</Text>
              </View>
            )}
            <View style={[styles.statusDot, { backgroundColor: isActive ? '#10B981' : '#EF4444' }]} />
          </View>

          <View style={styles.infoContainer}>
            <Text numberOfLines={1} style={styles.workerName}>{worker.name}</Text>
            <Text numberOfLines={1} style={styles.workerRole}>{worker.role}</Text>
            <View style={styles.locationRow}>
              <LocationSmallIcon />
              <Text numberOfLines={1} style={styles.locationText}>{worker.location}</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.callButton,
              pressed && { transform: [{ scale: 0.92 }], opacity: 0.9 }
            ]}
            onPress={() => void callWorker(worker.phone)}
          >
            <CallIcon />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* SEARCH SECTION */}
      <View style={styles.headerSection}>
        <View style={styles.searchWrapper}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search workers..."
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>

      {/* FILTER TABS */}
      <View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterContainer}
        >
          {roleFilters.map((role) => {
            const isSelected = filterRole === role;
            const gradId = `filterGrad_${String(role).replace(/[^a-zA-Z0-9_]/g, '_')}`;
            return (
              <Pressable
                key={role}
                onPress={() => setFilterRole(role)}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
              >
                {isSelected ? (
                  <View style={styles.filterChipGradientBg}>
                    <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <Defs>
                        <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                          <Stop offset="0%" stopColor="#7F00FF" />
                          <Stop offset="100%" stopColor="#E100FF" />
                        </LinearGradient>
                      </Defs>
                      <Rect x="0" y="0" width="100" height="100" fill={`url(#${gradId})`} />
                    </Svg>
                  </View>
                ) : null}
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>{role}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
      >
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loaderText}>Fetching Team...</Text>
          </View>
        ) : filteredWorkers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
                <Text style={{fontSize: 32}}>🔍</Text>
            </View>
            <Text style={styles.emptyTitle}>No Workers Found</Text>
            <Text style={styles.emptyDesc}>Try adjusting your filters or search query.</Text>
          </View>
        ) : (
          <View>
            {activeWorkers.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Active Now</Text>
                  <View style={styles.countBadge}><Text style={styles.countText}>{activeWorkers.length}</Text></View>
                </View>
                {activeWorkers.map(renderWorkerCard)}
              </View>
            )}

            {inactiveWorkers.length > 0 && (
              <View style={[styles.section, { marginTop: 24 }]}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: '#64748B' }]}>Off Duty</Text>
                  <View style={[styles.countBadge, { backgroundColor: '#F1F5F9' }]}><Text style={[styles.countText, { color: '#64748B' }]}>{inactiveWorkers.length}</Text></View>
                </View>
                {inactiveWorkers.map(renderWorkerCard)}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  
  // Header & Search
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 20, // For notch devices
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },

  // Filters
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: 'rgba(127, 0, 255, 0.35)',
    position: 'relative',
    overflow: 'hidden',
  },
  filterChipActive: {
    borderColor: 'transparent',
    shadowColor: '#7F00FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  filterChipGradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F00FF',
    textTransform: 'capitalize',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  // Main List
  mainScroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  section: { marginBottom: 10 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countText: { fontSize: 12, fontWeight: '700', color: '#6366F1' },

  // Worker Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inactiveAvatar: { opacity: 0.7, grayscale: 1 } as any,
  avatarImage: { width: '100%', height: '100%', borderRadius: 18 },
  avatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0E7FF',
    borderRadius: 18,
  },
  avatarFallbackText: { fontSize: 24, fontWeight: '800', color: '#6366F1' },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  infoContainer: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  workerName: { fontSize: 17, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  workerRole: { fontSize: 13, fontWeight: '600', color: '#6366F1', textTransform: 'uppercase', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 13, color: '#64748B', fontWeight: '500' },

  callButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  // States
  loaderContainer: { alignItems: 'center', marginTop: 100 },
  loaderText: { marginTop: 12, color: '#64748B', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  emptyDesc: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 8, lineHeight: 20 },
});