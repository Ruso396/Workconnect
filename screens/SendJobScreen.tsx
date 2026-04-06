import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { api } from '../services/api';
import { ContractorRole, Project, ProjectListItem, WorkerTradeRole } from '../types';

const FolderIcon = ({ color = '#6B7280' }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
  </Svg>
);

const MapPinIcon = ({ size = 20, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><Circle cx="12" cy="10" r="3" />
  </Svg>
);

const DropdownChevronIcon = () => (
  <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 9l6 6 6-6" />
  </Svg>
);

const RoleChevronIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 9l6 6 6-6" />
  </Svg>
);

const CashIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="6" width="20" height="12" rx="2" /><Circle cx="12" cy="12" r="2" /><Path d="M6 12h.01M18 12h.01" />
  </Svg>
);

const EditIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
);

const SendIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 2L11 13" /><Path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </Svg>
);

const IconCheck = ({ color = '#FFF', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);

interface SendJobScreenProps {
  contractorId: number;
  roles: ContractorRole[];
  onSendJob: (
    projectId: number,
    targetRole: WorkerTradeRole,
    location: string,
    salary: string,
    description: string,
  ) => Promise<{ job_id: number; assigned_count: number }>;
}

export default function SendJobScreen({
  contractorId,
  roles,
  onSendJob,
}: SendJobScreenProps): React.JSX.Element {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState('');
  const [projectId, setProjectId] = useState<number | null>(null);
  const [targetRole, setTargetRole] = useState<WorkerTradeRole>('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [projectWorkersLoading, setProjectWorkersLoading] = useState(false);
  const [activeProjectRoleKeys, setActiveProjectRoleKeys] = useState<string[]>([]);
  const [projectWorkersError, setProjectWorkersError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setProjectsError('');
      setProjectsLoading(true);
      try {
        const list = await api.getProjects(contractorId, 'active');
        if (!cancelled) {
          setProjects(list);
          if (list.length > 0) {
            const first = list[0];
            setProjectId(first.id);
            setLocation(first.location);
          } else {
            setProjectId(null);
            setLocation('');
          }
        }
      } catch (e) {
        if (!cancelled) {
          setProjectsError(e instanceof Error ? e.message : 'Failed to load projects');
        }
      } finally {
        if (!cancelled) {
          setProjectsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contractorId]);

  useEffect(() => {
    let cancelled = false;

    if (projectId == null) {
      setActiveProjectRoleKeys([]);
      setTargetRole('');
      return;
    }

    (async () => {
      // Avoid showing stale roles from the previous project while we fetch.
      setActiveProjectRoleKeys([]);
      setTargetRole('');
      setProjectWorkersError('');
      setProjectWorkersLoading(true);
      try {
        const p = (await api.getProject(contractorId, projectId)) as Project;
        if (cancelled) {
          return;
        }

        const roleKeys = Array.from(
          new Set(
            p.workers
              .filter((w) => w.status === 'active')
              .map((w) => (w.role ?? '').trim())
              .filter((rk) => rk.length > 0),
          ),
        );

        setActiveProjectRoleKeys(roleKeys);
      } catch (e) {
        if (!cancelled) {
          setProjectWorkersError(e instanceof Error ? e.message : 'Failed to load project workers');
          setActiveProjectRoleKeys([]);
        }
      } finally {
        if (!cancelled) {
          setProjectWorkersLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [contractorId, projectId]);

  const filteredRoles = useMemo(() => {
    if (activeProjectRoleKeys.length === 0) {
      return [];
    }
    const set = new Set(activeProjectRoleKeys);
    return roles.filter((r) => set.has(r.role_key));
  }, [roles, activeProjectRoleKeys]);

  // Keep the selected role valid for the selected project.
  useEffect(() => {
    if (!projectId) {
      return;
    }
    if (filteredRoles.length === 0) {
      setTargetRole('');
      return;
    }
    if (!filteredRoles.some((r) => r.role_key === targetRole)) {
      setTargetRole(filteredRoles[0].role_key);
    }
  }, [filteredRoles, projectId, targetRole]);

  const selectedProject = projects.find((p) => p.id === projectId);

  const selectProject = (p: ProjectListItem) => {
    setProjectId(p.id);
    setLocation(p.location);
    setShowProjectDropdown(false);
    setShowRoleDropdown(false);
  };

  const submitWrapper = async () => {
    if (!projectId || !selectedProject) {
      setError('Select an active project.');
      return;
    }
    if (!targetRole || !location.trim() || !salary.trim() || !description.trim()) {
      setError('Please fill all fields.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const result = await onSendJob(projectId, targetRole, location.trim(), salary.trim(), description.trim());
      setSuccess(`Success! Sent to ${result.assigned_count} workers.`);
      setSalary('');
      setDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send job alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Post New Job</Text>
          <Text style={styles.subtitle}>
            Notify active workers on this project who match the role you select
          </Text>
        </View>

        {projectsLoading ? (
          <View style={styles.loadRow}>
            <ActivityIndicator color="#111827" />
            <Text style={styles.loadText}>Loading projects…</Text>
          </View>
        ) : projectsError ? (
          <Text style={styles.bannerError}>{projectsError}</Text>
        ) : projects.length === 0 ? (
          <Text style={styles.bannerWarn}>
            Create an active project and add workers before sending a job.
          </Text>
        ) : null}

        <View style={styles.card}>
          {projectWorkersError ? <Text style={styles.bannerError}>{projectWorkersError}</Text> : null}
          <View style={styles.dropdownContainer}>
            <Text style={styles.label}>Project</Text>
            <Pressable
              style={[
                styles.dropdownTrigger,
                showProjectDropdown && styles.dropdownActive,
                (!selectedProject || projectsLoading) && { opacity: 0.6 },
              ]}
              onPress={() => {
                if (!projectsLoading && projects.length > 0) {
                  setShowProjectDropdown((v) => !v);
                  setShowRoleDropdown(false);
                }
              }}
              disabled={projectsLoading || projects.length === 0}
            >
              <View style={styles.iconCircle}>
                <FolderIcon color="#1E293B" />
              </View>
              <View style={styles.dropdownMain}>
                <Text style={styles.dropdownText} numberOfLines={1}>
                  {selectedProject?.name ?? 'Select project'}
                </Text>
                {selectedProject && (
                  <View style={styles.locRow}>
                    <MapPinIcon size={12} color="#94A3B8" />
                    <Text style={styles.dropdownSubtext}>
                      {selectedProject.location}
                    </Text>
                  </View>
                )}
              </View>
              <View style={[styles.chev, showProjectDropdown && { transform: [{ rotate: '180deg' }] }]}>
                <DropdownChevronIcon />
              </View>
            </Pressable>
            {showProjectDropdown && projects.length > 0 && (
              <View style={styles.menuContainer}>
                <ScrollView
                  style={styles.menuScroll}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={true}
                >
                  {projects.map((p) => (
                    <Pressable
                      key={p.id}
                      style={[
                        styles.menuItem,
                        p.id === projectId && styles.menuItemActive,
                      ]}
                      onPress={() => selectProject(p)}
                    >
                      <Text style={styles.menuTitle}>{p.name}</Text>

                      {p.id === projectId && (
                        <IconCheck color="#0F172A" size={16} />
                      )}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.dropdownContainerRole}>
            <Text style={styles.label}>Target Role</Text>
            <Pressable
              style={styles.roleDropdownTrigger}
              onPress={() => {
                setShowRoleDropdown(!showRoleDropdown);
                setShowProjectDropdown(false);
              }}
            >
              <Text style={styles.roleDropdownValue}>
                {filteredRoles.find((r) => r.role_key === targetRole)?.role_name || 'Select Worker Role'}
              </Text>
              <RoleChevronIcon />
            </Pressable>
            {showRoleDropdown ? (
              <View style={styles.roleDropdownMenu}>
                {filteredRoles.map((r) => (
                  <Pressable
                    key={r.id}
                    style={styles.roleDropdownOption}
                    onPress={() => {
                      setTargetRole(r.role_key);
                      setShowRoleDropdown(false);
                    }}
                  >
                    <Text style={[styles.roleOptionText, targetRole === r.role_key && styles.roleActiveOptionText]}>
                      {r.role_name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.inputBox}>
            <MapPinIcon />
            <TextInput
              value={location}
              onChangeText={setLocation}
              style={styles.input}
              placeholder="Work location (from project)"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputBox}>
            <CashIcon />
            <TextInput
              value={salary}
              onChangeText={setSalary}
              style={styles.input}
              placeholder="Salary / Daily Wage"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.inputBox, styles.textAreaBox]}>
            <View style={{ marginTop: 12 }}><EditIcon /></View>
            <TextInput
              value={description}
              onChangeText={setDescription}
              style={[styles.input, styles.textArea]}
              placeholder="Job Description & Requirements"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
            />
          </View>

          {error ? <Text style={styles.errorMsg}>{error}</Text> : null}
          {success ? <Text style={styles.successMsg}>{success}</Text> : null}

          <Pressable
            style={[styles.mainButton, (loading || projects.length === 0 || projectWorkersLoading) && { opacity: 0.8 }]}
            onPress={submitWrapper}
            disabled={loading || projects.length === 0 || !projectId || projectWorkersLoading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.buttonContent}>
                <SendIcon />
                <Text style={styles.buttonText}>Send Notification</Text>
              </View>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    flexGrow: 1,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  loadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  loadText: { color: '#6B7280', fontWeight: '600' },
  bannerError: { color: '#DC2626', fontWeight: '600', marginBottom: 12 },
  bannerWarn: { color: '#B45309', fontWeight: '600', marginBottom: 12, lineHeight: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  textAreaBox: {
    alignItems: 'flex-start',
    minHeight: 120,
  },
  textArea: {
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 6,
    marginLeft: 4,
  },
  /** Keep project menu above role menu visually */
  dropdownContainer: {
    marginBottom: 16,
    zIndex: 3000,
  },
  dropdownContainerRole: {
    marginBottom: 16,
    zIndex: 2000,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dropdownActive: {
    borderColor: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    elevation: 1,
  },
  dropdownMain: {
    flex: 1,
  },
  dropdownText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 16,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dropdownSubtext: {
    color: '#64748B',
    fontSize: 12,
    marginLeft: 4,
  },
  chev: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContainer: {
    marginTop: 10,
    backgroundColor: '#FFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  menuScroll: {
    maxHeight: 200,
  },
  menuItem: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemActive: {
    backgroundColor: '#F8FAFC',
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  roleDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  roleDropdownValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
    textTransform: 'capitalize',
    flex: 1,
  },
  roleDropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    elevation: 4,
  },
  roleDropdownOption: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  roleOptionText: {
    fontSize: 14,
    color: '#4B5563',
    textTransform: 'capitalize',
  },
  roleActiveOptionText: {
    color: '#000000',
    fontWeight: '700',
  },
  mainButton: {
    backgroundColor: '#4ea017',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  errorMsg: {
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
  successMsg: {
    color: '#059669',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
});
