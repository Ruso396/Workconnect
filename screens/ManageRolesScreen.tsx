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
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient, Stop } from 'react-native-svg';

import { api } from '../services/api';
import type { ContractorRole } from '../types';

const { width } = Dimensions.get('window');

// --- PREMIUM SVG ICONS ---
const PlusIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 5v14M5 12h14" />
  </Svg>
);

const EditIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <Path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
);

const TrashIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
  </Svg>
);

const ShieldIcon = ({ color = "#6366F1" }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
      setError('Please enter a role name');
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
      `Delete "${role.role_name}" category? Workers assigned to this role might be affected.`,
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {/* HEADER SECTION */}
        <View style={styles.header}>
          <Text style={styles.mainTitle}>Access Levels</Text>
          <Text style={styles.subtitle}>Define categories for your workforce</Text>
        </View>

        {/* INPUT CARD */}
        <View style={[styles.card, editingRoleId != null && styles.editingCard]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.formTitle, editingRoleId != null && { color: '#4F46E5' }]}>
              {editingRoleId != null ? 'Update Category' : 'Create Category'}
            </Text>
            {editingRoleId != null && (
              <Pressable onPress={cancelEdit} style={styles.cancelChip}>
                <Text style={styles.cancelChipText}>Dismiss</Text>
              </Pressable>
            )}
          </View>
          
          <View style={[styles.inputWrapper, editingRoleId != null && styles.inputWrapperActive]}>
            <ShieldIcon color={editingRoleId != null ? "#4F46E5" : "#94A3B8"} />
            <TextInput
              style={styles.input}
              value={roleName}
              onChangeText={setRoleName}
              placeholder="e.g. Site Supervisor"
              placeholderTextColor="#94A3B8"
              autoFocus={editingRoleId != null}
            />
          </View>

          {error ? <Text style={styles.errorLabel}>{error}</Text> : null}

          <Pressable 
            onPress={submit} 
            style={({ pressed }) => [
              styles.submitBtn,
              (loading || pressed) && { opacity: 0.85, transform: [{ scale: 0.98 }] }
            ]} 
            disabled={loading}
          >
            <View style={styles.submitBtnGradientBg}>
              <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <Defs>
                  <LinearGradient id="manageRoleSubmitGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor="#7F00FF" />
                    <Stop offset="100%" stopColor="#E100FF" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100" height="100" fill="url(#manageRoleSubmitGrad)" />
              </Svg>
            </View>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.btnContent}>
                {editingRoleId == null && <PlusIcon />}
                <Text style={styles.btnText}>
                  {editingRoleId != null ? 'Save Changes' : 'Add to List'}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* ROLES LIST */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listTitle}>Workforce Categories</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{roles.length}</Text>
          </View>
        </View>

        <View style={styles.listArea}>
          {roles.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyText}>No roles created yet.</Text>
            </View>
          ) : (
            roles.map((r) => {
                const isBeingEdited = editingRoleId === r.id;
                return (
                    <View key={r.id} style={[styles.roleCard, isBeingEdited && styles.roleCardActive]}>
                        <View style={styles.roleMain}>
                            <View style={[styles.roleIconBox, isBeingEdited && styles.roleIconBoxActive]}>
                                <Text style={[styles.roleInitial, isBeingEdited && { color: '#FFFFFF' }]}>
                                    {r.role_name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.roleTexts}>
                                <Text style={styles.roleNameLabel}>{r.role_name}</Text>
                                <Text style={styles.roleKeyLabel}>ID: {r.role_key}</Text>
                            </View>
                        </View>

                        <View style={styles.actionPill}>
                            <Pressable 
                                onPress={() => startEdit(r)} 
                                style={({ pressed }) => [styles.iconAction, pressed && { backgroundColor: '#EEF2FF' }]}
                            >
                                <EditIcon />
                            </Pressable>
                            <View style={styles.actionDivider} />
                            <Pressable 
                                onPress={() => deleteRole(r)} 
                                style={({ pressed }) => [styles.iconAction, pressed && { backgroundColor: '#FEF2F2' }]}
                            >
                                <TrashIcon />
                            </Pressable>
                        </View>
                    </View>
                );
            })
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { padding: 20, paddingBottom: 40 },
  
  header: { marginBottom: 24, marginTop: 10 },
  mainTitle: { fontSize: 30, fontWeight: '800', color: '#0F172A', letterSpacing: -1 },
  subtitle: { fontSize: 14, color: '#64748B', fontWeight: '500', marginTop: 2 },

  // Input Card Design
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  editingCard: {
    borderColor: '#C7D2FE',
    backgroundColor: '#FAFBFF',
    shadowColor: '#6366F1',
    shadowOpacity: 0.1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  formTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', letterSpacing: -0.3 },
  cancelChip: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  cancelChipText: { color: '#EF4444', fontSize: 12, fontWeight: '700' },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  inputWrapperActive: { borderColor: '#6366F1', backgroundColor: '#FFFFFF' },
  input: { flex: 1, paddingVertical: 14, marginLeft: 12, fontSize: 16, color: '#0F172A', fontWeight: '600' },

  submitBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#7F00FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  submitBtnGradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },

  // List Design
  listHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10, paddingLeft: 4 },
  listTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  countBadge: { backgroundColor: '#E2E8F0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  countText: { fontSize: 12, fontWeight: '800', color: '#475569' },

  listArea: { gap: 12 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
  },
  roleCardActive: { borderColor: '#6366F1', backgroundColor: '#F5F7FF' },
  roleMain: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  roleIconBox: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconBoxActive: { backgroundColor: '#6366F1' },
  roleInitial: { fontSize: 20, fontWeight: '900', color: '#6366F1' },
  roleTexts: { marginLeft: 14, flex: 1 },
  roleNameLabel: { fontSize: 16, fontWeight: '700', color: '#1E293B', textTransform: 'capitalize' },
  roleKeyLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '500', marginTop: 2 },

  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 2,
  },
  iconAction: { padding: 10, borderRadius: 12 },
  actionDivider: { width: 1, height: 20, backgroundColor: '#E2E8F0' },

  errorLabel: { color: '#EF4444', fontSize: 13, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  emptyCard: { alignItems: 'center', padding: 40, backgroundColor: '#FFFFFF', borderRadius: 24, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E2E8F0' },
  emptyEmoji: { fontSize: 32, marginBottom: 10 },
  emptyText: { color: '#94A3B8', fontSize: 15, fontWeight: '600' },
});