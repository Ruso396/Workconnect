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
import Svg, { Path, Circle } from 'react-native-svg';

import { ContractorRole, Worker, WorkerTradeRole } from '../types';

// --- Simple SVG Icons Components ---
const UserIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><Circle cx="12" cy="7" r="4" />
  </Svg>
);

const PhoneIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
);

const LockIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z" /><Path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);

const MapPinIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><Circle cx="12" cy="10" r="3" />
  </Svg>
);

const ChevronDownIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 9l6 6 6-6" />
  </Svg>
);

const SaveIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><Path d="M17 21v-8H7v8" /><Path d="M7 3v5h8" />
  </Svg>
);

interface AddWorkerScreenProps {
  roles: ContractorRole[];
  onAddWorker: (name: string, phone: string, password: string, role: WorkerTradeRole, location: string) => Promise<Worker>;
}

export default function AddWorkerScreen({ roles, onAddWorker }: AddWorkerScreenProps): React.JSX.Element {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<WorkerTradeRole>('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (roles.length > 0 && !roles.some((r) => r.role_key === role)) {
      setRole(roles[0].role_key);
    }
  }, [roles, role]);

  const submit = async () => {
    if (!name.trim() || !phone.trim() || !password.trim() || !location.trim() || !role) {
      setError('Please fill all fields.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await onAddWorker(name.trim(), phone.trim(), password.trim(), role, location.trim());
      setSuccess('Worker added successfully!');
      setName(''); setPhone(''); setPassword(''); setLocation('');
      setRole(roles[0]?.role_key ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add worker');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.headerSection}>
          <Text style={styles.title}>Add New Worker</Text>
          <Text style={styles.subtitle}>Enter details to register a worker in your team</Text>
        </View>

        <View style={styles.formCard}>
          {/* Name Field */}
          <View style={styles.inputWrapper}>
            <UserIcon />
            <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Full Name" placeholderTextColor="#9CA3AF" />
          </View>

          {/* Phone Field */}
          <View style={styles.inputWrapper}>
            <PhoneIcon />
            <TextInput value={phone} onChangeText={setPhone} style={styles.input} placeholder="Phone Number" keyboardType="phone-pad" placeholderTextColor="#9CA3AF" />
          </View>

          {/* Password Field */}
          <View style={styles.inputWrapper}>
            <LockIcon />
            <TextInput value={password} onChangeText={setPassword} style={styles.input} placeholder="Worker Password" secureTextEntry placeholderTextColor="#9CA3AF" />
          </View>

          {/* Location Field */}
          <View style={styles.inputWrapper}>
            <MapPinIcon />
            <TextInput value={location} onChangeText={setLocation} style={styles.input} placeholder="Work Location" placeholderTextColor="#9CA3AF" />
          </View>

          {/* Role Dropdown */}
          <View style={styles.dropdownContainer}>
            <Text style={styles.label}>Assign Role</Text>
            <Pressable style={styles.dropdownTrigger} onPress={() => setShowDropdown(!showDropdown)}>
              <Text style={styles.dropdownValue}>
                {roles.find((r) => r.role_key === role)?.role_name || 'Select a role'}
              </Text>
              <ChevronDownIcon />
            </Pressable>

            {showDropdown && (
              <View style={styles.dropdownList}>
                {roles.map((r) => (
                  <Pressable
                    key={r.id}
                    style={styles.dropdownItem}
                    onPress={() => { setRole(r.role_key); setShowDropdown(false); }}
                  >
                    <Text style={[styles.dropdownItemText, role === r.role_key && styles.activeItemText]}>
                      {r.role_name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}

          <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={submit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.buttonContent}>
                <SaveIcon />
                <Text style={styles.buttonText}>Save Worker Details</Text>
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
    backgroundColor: '#FFFFFF', // Light premium background
    flexGrow: 1,
  },
  headerSection: {
    marginBottom: 24,
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 4,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
  },
  dropdownContainer: {
    marginBottom: 20,
    zIndex: 1000,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dropdownValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    // Position absolute panni dropdown mela vara vakkalam
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#4B5563',
    textTransform: 'capitalize',
  },
  activeItemText: {
    color: '#000000',
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#111827', // Dark Premium Look
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  successText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
});
