import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

import { ContractorRole, WorkerTradeRole } from '../types';

// --- Premium SVG Icons ---
const JobIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><Path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </Svg>
);

const MapPinIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><Circle cx="12" cy="10" r="3" />
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

const ChevronDownIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 9l6 6 6-6" />
  </Svg>
);

interface SendJobScreenProps {
  roles: ContractorRole[];
  onSendJob: (
    title: string,
    targetRole: WorkerTradeRole,
    location: string,
    salary: string,
    description: string,
  ) => Promise<{ job_id: number; assigned_count: number }>;
}

export default function SendJobScreen({ roles, onSendJob }: SendJobScreenProps): React.JSX.Element {
  const [title, setTitle] = useState('');
  const [targetRole, setTargetRole] = useState<WorkerTradeRole>('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (roles.length > 0 && !roles.some((r) => r.role_key === targetRole)) {
      setTargetRole(roles[0].role_key);
    }
  }, [roles, targetRole]);

  const submit = async () => {
    if (!title.trim() || !targetRole || !location.trim() || !salary.trim() || !description.trim()) {
      setError('Please fill all fields.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const result = await onSendJob(title.trim(), targetRole, location.trim(), salary.trim(), description.trim());
      setSuccess(`Success! Sent to ${result.assigned_count} workers.`);
      setTitle(''); setLocation(''); setSalary(''); setDescription('');
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
          <Text style={styles.subtitle}>Send instant notifications to eligible workers</Text>
        </View>

        <View style={styles.card}>
          {/* Job Title */}
          <View style={styles.inputBox}>
            <JobIcon />
            <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="Job Title (e.g. Site Supervisor)" placeholderTextColor="#9CA3AF" />
          </View>

          {/* Custom Dropdown for Role */}
          <View style={styles.dropdownContainer}>
            <Text style={styles.label}>Target Role</Text>
            <Pressable style={styles.dropdownTrigger} onPress={() => setShowDropdown(!showDropdown)}>
              <Text style={styles.dropdownValue}>
                {roles.find((r) => r.role_key === targetRole)?.role_name || 'Select Worker Role'}
              </Text>
              <ChevronDownIcon />
            </Pressable>
            {showDropdown && (
              <View style={styles.dropdownMenu}>
                {roles.map((r) => (
                  <Pressable 
                    key={r.id} 
                    style={styles.dropdownOption} 
                    onPress={() => { setTargetRole(r.role_key); setShowDropdown(false); }}
                  >
                    <Text style={[styles.optionText, targetRole === r.role_key && styles.activeOptionText]}>
                      {r.role_name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Location */}
          <View style={styles.inputBox}>
            <MapPinIcon />
            <TextInput value={location} onChangeText={setLocation} style={styles.input} placeholder="Work Location" placeholderTextColor="#9CA3AF" />
          </View>

          {/* Salary */}
          <View style={styles.inputBox}>
            <CashIcon />
            <TextInput value={salary} onChangeText={setSalary} style={styles.input} placeholder="Salary / Daily Wage" placeholderTextColor="#9CA3AF" keyboardType="numeric" />
          </View>

          {/* Description */}
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

          <Pressable style={[styles.mainButton, loading && { opacity: 0.8 }]} onPress={submit} disabled={loading}>
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
  dropdownContainer: {
    marginBottom: 16,
    zIndex: 2000,
  },
  dropdownTrigger: {
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
  dropdownValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    elevation: 4,
  },
  dropdownOption: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionText: {
    fontSize: 14,
    color: '#4B5563',
    textTransform: 'capitalize',
  },
  activeOptionText: {
    color: '#000000',
    fontWeight: '700',
  },
  mainButton: {
    backgroundColor: '#4ea017', // Blue Premium
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
