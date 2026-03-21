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
} from 'react-native';

// Import Svg components
import Svg, { Path } from 'react-native-svg';

import { ContractorRole, Worker, WorkerTradeRole } from '../types';
import { profileImageUri } from '../services/api';

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
    const badgeLabel = status === 'active' ? 'Active' : 'Inactive';

    return (
      <View key={worker.id} style={styles.card}>
        <View style={styles.imageWrapper}>
          {avatarUri ? (
            <Image key={avatarUri} source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>{fallbackLetter}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <Text numberOfLines={1} style={styles.name}>
            {worker.name}
          </Text>

          <Text numberOfLines={1} style={styles.subText}>
            {worker.role}
          </Text>
          <Text numberOfLines={1} style={styles.subText}>
            {worker.location}
          </Text>

          <View
            style={[
              styles.statusBadgeBelow,
              styles.statusBadge,
              status === 'active' ? styles.statusBadgeActive : styles.statusBadgeInactive,
            ]}
          >
            <Text style={styles.statusBadgeText}>{badgeLabel}</Text>
          </View>
        </View>

        {/* Updated Attractive Call Button */}
        <Pressable
          style={({ pressed }) => [
            styles.callBtn,
            pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
          ]}
          onPress={() => void callWorker(worker.phone)}
        >
          <Svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </Svg>
          <Text style={styles.callBtnText}>Call</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <TextInput
        style={styles.searchInput}
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name, location or phone"
        placeholderTextColor="#9CA3AF"
      />

      <View style={styles.filterRow}>
        {roleFilters.map((role) => (
          <Pressable
            key={role}
            onPress={() => setFilterRole(role)}
            style={[styles.filterChip, filterRole === role && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, filterRole === role && styles.filterChipTextActive]}>
              {role}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" />
      ) : filteredWorkers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No workers found.</Text>
        </View>
      ) : (
        <View>
          {activeWorkers.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>Active Workers</Text>
              {activeWorkers.map(renderWorkerCard)}
            </View>
          )}

          {inactiveWorkers.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>Inactive Workers</Text>
              {inactiveWorkers.map(renderWorkerCard)}
            </View>
          )}
        </View>
      )}
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
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#111827',
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  filterChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  filterChipText: {
    textTransform: 'capitalize',
    color: '#4B5563',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  emptyText: {
    color: '#6B7280',
  },
  sectionContainer: {
    marginTop: 6,
    marginBottom: 2,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginTop: 10,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 14,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  imageWrapper: {
    width: 92,
    height: 92,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    marginRight: 12,
    flexShrink: 0,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#DDE3EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#374151',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2B2B2B',
    marginBottom: 4,
  },
  statusBadgeBelow: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusBadgeActive: {
    backgroundColor: '#16A34A',
  },
  statusBadgeInactive: {
    backgroundColor: '#DC2626',
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  subText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  // --- Updated Call Button Styles ---
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0aa126', // Modern blue
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
    elevation: 3,
    shadowColor: '#0aae28',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
