import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { api } from '../services/api';
import { Worker } from '../types';

export interface AddProjectWorkersScreenProps {
  contractorId: number;
  projectId: number;
  workers: Worker[];
  onDone: () => void;
}

function normalizeStatus(s: Worker['status']): Worker['status'] {
  return s === 'inactive' ? 'inactive' : 'active';
}

export default function AddProjectWorkersScreen({
  contractorId,
  projectId,
  workers,
  onDone,
}: AddProjectWorkersScreenProps): React.JSX.Element {
  const [existing, setExisting] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await api.getProject(contractorId, projectId);
        if (!cancelled) {
          setExisting(new Set(p.workers.map((w) => w.user_id)));
        }
      } catch {
        if (!cancelled) {
          setExisting(new Set());
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contractorId, projectId]);

  const selectable = useMemo(() => {
    return workers.filter((w) => {
      if (normalizeStatus(w.status) !== 'active') {
        return false;
      }
      if (w.user_id == null) {
        return false;
      }
      if (existing.has(w.user_id)) {
        return false;
      }
      return true;
    });
  }, [workers, existing]);

  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggle = (userId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const submit = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) {
      setError('Select at least one worker.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.addProjectWorkers(contractorId, projectId, ids);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add workers');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Add workers</Text>
      <Text style={styles.sub}>Choose workers for this project. They will receive jobs sent to this group.</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
        {selectable.length === 0 ? (
          <Text style={styles.empty}>No available workers to add (need active sign-ups not already in this project).</Text>
        ) : (
          selectable.map((w) => {
            const uid = w.user_id as number;
            const checked = selected.has(uid);
            return (
              <Pressable
                key={uid}
                style={[styles.row, checked && styles.rowOn]}
                onPress={() => toggle(uid)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
              >
                <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                  {checked ? <Text style={styles.checkmark}>✓</Text> : null}
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.name}>{w.name}</Text>
                  <Text style={styles.meta}>
                    {w.role} · {w.phone}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <Pressable
        style={[styles.primary, (loading || selected.size === 0) && { opacity: 0.75 }]}
        onPress={submit}
        disabled={loading || selected.size === 0}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryText}>Add Selected Workers</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF', padding: 20, paddingBottom: 24 },
  scroll: { flex: 1 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  sub: { marginTop: 8, color: '#6B7280', lineHeight: 20, marginBottom: 12 },
  error: { color: '#DC2626', fontWeight: '600', marginBottom: 8 },
  list: { paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
    backgroundColor: '#FAFAFA',
  },
  rowOn: { borderColor: '#BBD7FD', backgroundColor: '#F3F8FF' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxOn: { borderColor: '#1a73e8', backgroundColor: '#1a73e8' },
  checkmark: { color: '#FFFFFF', fontWeight: '900', fontSize: 14, marginTop: -1 },
  rowText: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  empty: { color: '#6B7280', lineHeight: 20 },
  primary: {
    backgroundColor: '#128C7E',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});
