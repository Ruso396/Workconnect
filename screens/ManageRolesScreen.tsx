import React, { useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

import { api } from '../services/api';
import type { ContractorRole } from '../types';

// --- Premium SVG Icons ---
const PlusIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 5v14M5 12h14" />
  </Svg>
);

const EditIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
);

const TrashIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
  </Svg>
);

const ShieldIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Svg>
);

interface ManageRolesScreenProps {
  contractorId: number;
  roles: ContractorRole[];
  onRefreshRoles: () => void;
}

export default function ManageRolesScreen({
  contractorId,
  roles,
  onRefreshRoles,
}: ManageRolesScreenProps): React.JSX.Element {
  const [roleName, setRoleName] = useState('');
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (roles.length === 0) {
      onRefreshRoles();
    }
  }, [roles.length, onRefreshRoles]);

  const submit = async () => {
    setError('');
    if (!roleName.trim()) {
      setError('Role name is required.');
      return;
    }
    setLoading(true);
    try {
      if (editingRoleId != null) {
        await api.updateContractorRole(editingRoleId, roleName.trim());
      } else {
        await api.addContractorRole(contractorId, roleName.trim());
      }
      setRoleName('');
      setEditingRoleId(null);
      onRefreshRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save role');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (role: ContractorRole) => {
    setError('');
    setEditingRoleId(role.id);
    setRoleName(role.role_name);
  };

  const cancelEdit = () => {
    setError('');
    setEditingRoleId(null);
    setRoleName('');
  };

  const deleteRole = (role: ContractorRole) => {
    Alert.alert(
      'Delete Role',
      `Are you sure you want to delete "${role.role_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setError('');
            setLoading(true);
            try {
              await api.deleteContractorRole(role.id);
              cancelEdit();
              onRefreshRoles();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to delete role');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.mainTitle}>Manage Roles</Text>
          <Text style={styles.subtitle}>Define and organize worker categories</Text>
        </View>

        {/* TOP SECTION: Add/Edit Form */}
        <View style={[styles.card, editingRoleId != null && styles.editingCard]}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>
              {editingRoleId != null ? 'Update Selected Role' : 'Create New Role'}
            </Text>
            {editingRoleId != null && (
               <Pressable onPress={cancelEdit} style={styles.cancelLink}>
                  <Text style={styles.cancelLinkText}>Cancel Edit</Text>
               </Pressable>
            )}
          </View>
          
          <View style={styles.inputContainer}>
            <ShieldIcon />
            <TextInput
              style={styles.input}
              value={roleName}
              onChangeText={setRoleName}
              placeholder="e.g. Electrician, Supervisor"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable 
            onPress={submit} 
            style={[styles.mainButton, loading && { opacity: 0.8 }]} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.buttonContent}>
                {editingRoleId == null && <PlusIcon />}
                <Text style={styles.buttonText}>
                  {editingRoleId != null ? 'Save Changes' : 'Add New Role'}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* BOTTOM SECTION: Roles List */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Available Roles ({roles.length})</Text>
        </View>

        <View style={styles.listContainer}>
          {roles.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No roles found. Add one above.</Text>
            </View>
          ) : (
            roles.map((r) => (
              <View key={r.id} style={styles.roleItem}>
                <View style={styles.roleInfo}>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleInitial}>{r.role_name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.roleName}>{r.role_name}</Text>
                    <Text style={styles.roleKey}>Key: {r.role_key}</Text>
                  </View>
                </View>

                <View style={styles.actionGroup}>
                  <Pressable onPress={() => startEdit(r)} style={styles.iconBtn}>
                    <EditIcon />
                  </Pressable>
                  <View style={styles.divider} />
                  <Pressable onPress={() => deleteRole(r)} style={styles.iconBtn}>
                    <TrashIcon />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    flexGrow: 1,
  },
  header: {
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  editingCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  cancelLink: {
    padding: 4,
  },
  cancelLinkText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },
  mainButton: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  listHeader: {
    marginBottom: 12,
    paddingLeft: 4,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  listContainer: {
    gap: 12,
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  roleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: '#475569',
  },
  roleName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    textTransform: 'capitalize',
  },
  roleKey: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 4,
  },
  iconBtn: {
    padding: 8,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 2,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
  },
});
