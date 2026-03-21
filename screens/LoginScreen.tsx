import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { User, UserRole } from '../types';
import workerIllustration from '../assets/images/worker.png';
import contractorIllustration from '../assets/images/contractor.png';

interface LoginScreenProps {
  onLogin: (phone: string, password: string, role: UserRole) => Promise<User>;
}

export default function LoginScreen({ onLogin }: LoginScreenProps): React.JSX.Element {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('worker');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isFormValid = useMemo(
    () => phone.trim().length > 0 && password.length >= 4,
    [phone, password],
  );

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      await onLogin(phone.trim(), password, role);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const illustration = role === 'worker' ? workerIllustration : contractorIllustration;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Dynamic Image Section */}
        <View style={styles.imageContainer}>
          <Image source={illustration} style={styles.headerImage} resizeMode="contain" />
        </View>

        <View style={styles.headerTextContainer}>
          <Text style={styles.subtitle}>Welcome back! Choose your role and login.</Text>
        </View>

        {/* Premium Role Segmented Control */}
        <View style={styles.segmentedControlWrapper}>
          <View style={styles.segmentedControl}>
            <Pressable
              onPress={() => setRole('worker')}
              style={[styles.segment, role === 'worker' && styles.activeSegment]}
            >
              <Ionicons 
                name="hammer" 
                size={18} 
                color={role === 'worker' ? '#FFF' : '#6B7280'} 
                style={{marginRight: 6}}
              />
              <Text style={[styles.segmentText, role === 'worker' && styles.activeSegmentText]}>
                Worker
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setRole('contractor')}
              style={[styles.segment, role === 'contractor' && styles.activeSegment]}
            >
              <Ionicons 
                name="business" 
                size={18} 
                color={role === 'contractor' ? '#FFF' : '#6B7280'} 
                style={{marginRight: 6}}
              />
              <Text style={[styles.segmentText, role === 'contractor' && styles.activeSegmentText]}>
                Contractor
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Input Fields */}
        <View style={styles.inputGroup}>
          <View style={styles.inputWrapper}>
            <Ionicons name="phone-portrait-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              style={styles.input}
              placeholder="Phone number"
              keyboardType="phone-pad"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              style={[styles.input, { flex: 1 }]}
              placeholder="Password"
              secureTextEntry={!showPassword}
              placeholderTextColor="#9CA3AF"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons 
                name={showPassword ? "eye-off" : "eye"} 
                size={22} 
                color="#6B7280" 
              />
            </Pressable>
          </View>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={18} color="#EF4444" />
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={submit}
          style={({ pressed }) => [
            styles.submitButton,
            (!isFormValid || loading) && styles.submitButtonDisabled,
            pressed && { transform: [{ scale: 0.98 }] }
          ]}
          disabled={!isFormValid || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.buttonInner}>
               <Text style={styles.submitButtonText}>Continue</Text>
               <Ionicons name="arrow-forward" size={20} color="#FFF" style={{marginLeft: 8}} />
            </View>
          )}
        </Pressable>

        <Text style={styles.footerText}>
          Need a new account? <Text style={styles.linkText}>Register here</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 28,
    flexGrow: 1,
    justifyContent: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 10,
    height: 200,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerTextContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  segmentedControlWrapper: {
    marginBottom: 30,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 6,
    height: 60,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  activeSegment: {
    backgroundColor: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeSegmentText: {
    color: '#FFFFFF',
  },
  inputGroup: {
    gap: 16,
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  error: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#111827',
    borderRadius: 16,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  footerText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#9CA3AF',
    fontSize: 14,
  },
  linkText: {
    color: '#111827',
    fontWeight: '700',
  },
});
