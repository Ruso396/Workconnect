import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { JobRequest, JobRequestStatus } from '../types';
import { groupItemsByNotificationDate } from '../utils/groupNotificationsByDate';

interface WorkerNotificationsScreenProps {
  jobs: JobRequest[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onJobAction: (requestId: number, action: 'accepted' | 'rejected') => Promise<void>;
}

function formatTimestamp(value: string | undefined): string {
  if (!value) {
    return '';
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return value;
  }
  return d.toLocaleString();
}

function statusBadgeStyle(status: JobRequestStatus) {
  switch (status) {
    case 'accepted':
      return styles.badgeAccepted;
    case 'rejected':
      return styles.badgeRejected;
    default:
      return styles.badgePending;
  }
}

export default function WorkerNotificationsScreen({
  jobs,
  loading,
  refreshing,
  onRefresh,
  onJobAction,
}: WorkerNotificationsScreenProps): React.JSX.Element {
  const [actingId, setActingId] = React.useState<number | null>(null);

  const sections = React.useMemo(
    () => groupItemsByNotificationDate(jobs, (j) => j.created_at),
    [jobs],
  );

  const handleAction = async (requestId: number, action: 'accepted' | 'rejected') => {
    try {
      setActingId(requestId);
      await onJobAction(requestId, action);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setActingId(null);
    }
  };

  const listHeader = (
    <View style={styles.headerBlock}>
      <Text style={styles.title}>Job notifications</Text>
      <Text style={styles.subtitle}>New job requests from your contractor appear here.</Text>
    </View>
  );

  if (loading && jobs.length === 0) {
    return (
      <View style={styles.container}>
        {listHeader}
        <ActivityIndicator size="large" color="#2563EB" style={styles.loader} />
      </View>
    );
  }

  return (
    <SectionList
      style={styles.container}
      sections={sections}
      keyExtractor={(item) => String(item.request_id)}
      stickySectionHeadersEnabled
      ListHeaderComponent={listHeader}
      renderSectionHeader={({ section: { title } }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
      )}
      renderItem={({ item: job }) => {
        const pending = job.status === 'pending';
        const busy = actingId === job.request_id;

        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.jobTitle} numberOfLines={2}>
                {job.title}
              </Text>
              <View style={[styles.statusBadge, statusBadgeStyle(job.status)]}>
                <Text style={styles.statusBadgeText}>{job.status}</Text>
              </View>
            </View>

            <Text style={styles.meta}>
              <Text style={styles.metaLabel}>Location: </Text>
              {job.location}
            </Text>
            <Text style={styles.meta}>
              <Text style={styles.metaLabel}>Salary: </Text>
              {job.salary}
            </Text>
            <Text style={styles.description}>{job.description}</Text>

            {job.created_at ? (
              <Text style={styles.time}>{formatTimestamp(job.created_at)}</Text>
            ) : null}

            {pending ? (
              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.actionButton, styles.acceptButton, busy && styles.actionDisabled]}
                  onPress={() => void handleAction(job.request_id, 'accepted')}
                  disabled={busy}
                >
                  <Text style={styles.actionText}>{busy ? 'Please wait…' : 'Accept'}</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.rejectButton, busy && styles.actionDisabled]}
                  onPress={() => void handleAction(job.request_id, 'rejected')}
                  disabled={busy}
                >
                  <Text style={styles.actionText}>Reject</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={styles.closedHint}>No further action — this request is {job.status}.</Text>
            )}
          </View>
        );
      }}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No job notifications yet.</Text>
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  headerBlock: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  loader: {
    marginTop: 24,
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
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 28,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 15,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  jobTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  badgePending: {
    backgroundColor: '#CA8A04',
  },
  badgeAccepted: {
    backgroundColor: '#16A34A',
  },
  badgeRejected: {
    backgroundColor: '#DC2626',
  },
  meta: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  metaLabel: {
    fontWeight: '700',
    color: '#6B7280',
  },
  description: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
  },
  time: {
    marginTop: 10,
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionDisabled: {
    opacity: 0.6,
  },
  acceptButton: {
    backgroundColor: '#16A34A',
  },
  rejectButton: {
    backgroundColor: '#DC2626',
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  closedHint: {
    marginTop: 12,
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
  },
});
