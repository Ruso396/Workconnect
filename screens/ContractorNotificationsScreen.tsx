import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { api, profileImageUri } from '../services/api';
import type { ContractorNotification } from '../types';
import { groupItemsByNotificationDate } from '../utils/groupNotificationsByDate';

interface ContractorNotificationsScreenProps {
  contractorId: number;
  onAfterMarkRead?: () => void;
  onAfterClearAll?: () => void;
}

function formatTimestamp(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return value;
  }
  return d.toLocaleString();
}

function formatWorkerResponseAction(action: string): string {
  if (action === 'rejected') {
    return 'declined';
  }
  return action;
}

export default function ContractorNotificationsScreen({
  contractorId,
  onAfterMarkRead,
  onAfterClearAll,
}: ContractorNotificationsScreenProps): React.JSX.Element {
  const [items, setItems] = useState<ContractorNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);

  const sections = useMemo(
    () => groupItemsByNotificationDate(items, (n) => n.created_at),
    [items],
  );

  const load = async (markRead: boolean) => {
    const list = await api.getContractorNotifications(contractorId);
    setItems(list);

    if (markRead) {
      await api.markContractorNotificationsRead(contractorId);
      setItems((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      onAfterMarkRead?.();
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (cancelled) {
          return;
        }
        await load(true);
      } catch (err) {
        console.log('Failed to load notifications', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractorId]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load(false);
    } catch (err) {
      console.log('Failed to refresh notifications', err);
    } finally {
      setRefreshing(false);
    }
  };

  const confirmClearAll = () => {
    Alert.alert(
      'Clear all notifications?',
      'This will permanently delete all notifications.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setClearing(true);
              try {
                await api.deleteAllContractorNotifications(contractorId);
                setItems([]);
                onAfterClearAll?.();
              } catch (e) {
                Alert.alert('Error', e instanceof Error ? e.message : 'Failed to clear notifications');
              } finally {
                setClearing(false);
              }
            })();
          },
        },
      ],
    );
  };

  if (loading && items.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <SectionList
      style={styles.container}
      sections={sections}
      keyExtractor={(item) => String(item.id)}
      stickySectionHeadersEnabled
      renderSectionHeader={({ section: { title } }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
      )}
      renderItem={({ item: n }) => {
        const workerUri = profileImageUri(n.worker_profile_image ?? undefined);
        const workerInitial = (n.worker_name || '?').trim().charAt(0).toUpperCase();
        const statusLabel = formatWorkerResponseAction(n.action);
        return (
        <View style={styles.card}>
          <View style={styles.topRow}>
            {workerUri ? (
              <Image key={workerUri} source={{ uri: workerUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarLetter}>{workerInitial}</Text>
              </View>
            )}
            <View style={[styles.unreadDot, n.is_read === 0 && styles.unreadDotActive]} />
            <View style={styles.titleBlock}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {n.worker_name}
              </Text>
              <Text style={styles.statusLine} numberOfLines={1}>
                {statusLabel}
              </Text>
            </View>
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            Job: {n.job_title}
          </Text>
          {n.job_location ? (
            <Text style={styles.meta} numberOfLines={1}>
              Location: {n.job_location}
            </Text>
          ) : null}
          <Text style={styles.time}>{formatTimestamp(n.created_at)}</Text>
        </View>
        );
      }}
      ListHeaderComponent={
        items.length > 0 ? (
          <View style={styles.toolbar}>
            <Pressable onPress={confirmClearAll} disabled={clearing} hitSlop={8}>
              <Text style={[styles.clearAllText, clearing && styles.clearAllDisabled]}>Clear All</Text>
            </Pressable>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No notifications yet.</Text>
        </View>
      }
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centered: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 4,
  },
  clearAllText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
  clearAllDisabled: {
    opacity: 0.5,
  },
  sectionHeader: {
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  emptyState: {
    paddingVertical: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 15,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  /** Same as ProjectDetailScreen worker list avatars */
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4B5563',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  statusLine: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
    backgroundColor: '#9CA3AF',
    opacity: 0.3,
  },
  unreadDotActive: {
    backgroundColor: '#DC2626',
    opacity: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
  },
  meta: {
    marginTop: 4,
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
  time: {
    marginTop: 8,
    color: '#9CA3AF',
    fontSize: 12,
  },
});
