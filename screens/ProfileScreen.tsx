import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import type { User } from '../types';
import { api, profileImageUri } from '../services/api';

const { width } = Dimensions.get('window');

interface ProfileScreenProps {
  user: User;
  onUserChange: (user: User) => void;
}

export default function ProfileScreen({ user, onUserChange }: ProfileScreenProps): React.JSX.Element {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [location, setLocation] = useState(user.location ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Keep local inputs synced with the latest `user` prop (including avatar URL changes).
  useEffect(() => {
    setName(user.name);
    setPhone(user.phone);
    if (user.role === 'worker') {
      setLocation(user.location ?? '');
    }
  }, [user.id, user.name, user.phone, user.role, user.location, user.profile_image]);

  // Pull fresh profile when opening this screen so header, list data, and image URLs stay aligned with the server.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fresh = await api.getProfile(user.id);
        if (cancelled) {
          return;
        }
        onUserChange(fresh);
        setName(fresh.name);
        setPhone(fresh.phone);
        if (fresh.role === 'worker') {
          setLocation(fresh.location ?? '');
        }
      } catch (e) {
        console.log('Failed to refresh profile', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user.id, user.role, onUserChange]);

  // SVGs - Pure Minimalist Black & White
  const IconWrapper = ({ children }: { children: React.ReactNode }) => (
    <View style={styles.iconContainer}>{children}</View>
  );

  const UserIcon = () => (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><Circle cx="12" cy="7" r="4" />
    </Svg>
  );

  const PhoneIcon = () => (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5">
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </Svg>
  );

  const MapIcon = () => (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><Circle cx="12" cy="10" r="3" />
    </Svg>
  );

  const LockIcon = () => (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5">
      <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Svg>
  );

  const EyeIcon = () => (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5">
      <Path d="M1.5 12s4.5-7.5 10.5-7.5S22.5 12 22.5 12s-4.5 7.5-10.5 7.5S1.5 12 1.5 12z" />
      <Path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
    </Svg>
  );

  const EyeOffIcon = () => (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5">
      <Path d="M2 2l20 20" />
      <Path d="M10.58 10.58a2.5 2.5 0 0 0 3.54 3.54" />
      <Path d="M9.53 5.5C10.31 5.2 11.13 5 12 5c6 0 10.5 7 10.5 7a19.3 19.3 0 0 1-3.2 4.1" />
      <Path d="M6.2 6.2A19.9 19.9 0 0 0 1.5 12s4.5 7.5 10.5 7.5c1.26 0 2.45-.3 3.55-.8" />
    </Svg>
  );

  const CameraIcon = () => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><Circle cx="12" cy="13" r="4" />
    </Svg>
  );

  const handleSave = async () => {
    try {
      setLoading(true);
      const fresh = await api.updateProfile(user.id, {
        name: name !== user.name ? name : undefined,
        phone: phone !== user.phone ? phone : undefined,
        password: password.trim() !== '' ? password.trim() : undefined,
        location:
          user.role === 'worker' &&
          location.trim() !== '' &&
          location.trim() !== (user.location ?? '')
            ? location.trim()
            : undefined,
      });

      onUserChange(fresh);
      setName(fresh.name);
      setPhone(fresh.phone);
      setLocation(fresh.location ?? '');
      setPassword('');
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Permission to access gallery is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    const uri = asset.uri;
    if (!uri) {
      return;
    }

    try {
      setUploading(true);
      const fresh = await api.uploadProfileImage(user.id, {
        uri,
        name: 'profile.jpg',
        type: 'image/jpeg',
      });

      onUserChange(fresh);
      setName(fresh.name);
      setPhone(fresh.phone);
      setLocation(fresh.location ?? '');
      Alert.alert('Success', 'Profile image updated');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const avatarUri = profileImageUri(user.profile_image);

  return (
    <ScrollView style={styles.container} bounces={false}>
      {/* Top Profile Header */}
      <View style={styles.topSection}>
        <Text style={styles.title}>Account</Text>
        <View style={styles.avatarFrame}>
          <View style={styles.imageShadow}>
            {avatarUri ? (
              <Image key={avatarUri} source={{ uri: avatarUri }} style={styles.mainAvatar} />
            ) : (
              <View style={styles.fallbackAvatar}>
                <Text style={styles.fallbackText}>{user.name.charAt(0)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.cameraBadge} onPress={handlePickImage} activeOpacity={0.8}>
            {uploading ? <ActivityIndicator size="small" color="#FFF" /> : <CameraIcon />}
          </TouchableOpacity>
        </View>
        <Text style={styles.userNameText}>{user.name}</Text>
        <Text style={styles.userRoleText}>{user.role.toUpperCase()}</Text>
      </View>

      {/* Form Section */}
      <View style={styles.formContainer}>
        {/* Input Card 1 */}
        <View style={styles.inputCard}>
          <IconWrapper><UserIcon /></IconWrapper>
          <View style={styles.inputContent}>
            <Text style={styles.fieldLabel}>FULL NAME</Text>
            <TextInput style={styles.textInput} value={name} onChangeText={setName} placeholder="Name" />
          </View>
        </View>

        {/* Input Card 2 */}
        <View style={styles.inputCard}>
          <IconWrapper><PhoneIcon /></IconWrapper>
          <View style={styles.inputContent}>
            <Text style={styles.fieldLabel}>PHONE</Text>
            <TextInput style={styles.textInput} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>
        </View>

        {/* Input Card 3 (Worker Only) */}
        {user.role === 'worker' && (
          <View style={styles.inputCard}>
            <IconWrapper><MapIcon /></IconWrapper>
            <View style={styles.inputContent}>
              <Text style={styles.fieldLabel}>LOCATION</Text>
              <TextInput style={styles.textInput} value={location} onChangeText={setLocation} />
            </View>
          </View>
        )}

        {/* Input Card 4 */}
        <View style={styles.inputCard}>
          <IconWrapper><LockIcon /></IconWrapper>
          <View style={styles.inputContent}>
            <Text style={styles.fieldLabel}>SECURITY</Text>
            <TextInput 
              style={styles.textInput} 
              value={password} 
              onChangeText={setPassword} 
              placeholder="Enter New Password" 
              secureTextEntry={!showPassword}
            />
          </View>
          <TouchableOpacity
            style={styles.passwordEyeToggle}
            onPress={() => setShowPassword((v) => !v)}
            activeOpacity={0.75}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </TouchableOpacity>
        </View>

        {/* Save Button - High Contrast Black */}
        <TouchableOpacity style={styles.mainButton} onPress={handleSave} activeOpacity={0.9} disabled={loading}>
          <View style={styles.mainButtonGradientBg}>
            <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="profileSaveBtnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#7F00FF" />
                  <Stop offset="100%" stopColor="#E100FF" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100" height="100" fill="url(#profileSaveBtnGrad)" />
            </Svg>
          </View>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>SAVE SETTINGS</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    backgroundColor: '#FAFAFA',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 4,
    color: '#000',
    marginBottom: 30,
    textTransform: 'uppercase',
  },
  avatarFrame: {
    position: 'relative',
    marginBottom: 20,
  },
  imageShadow: {
    padding: 6,
    backgroundColor: '#FFF',
    borderRadius: 70,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  mainAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  fallbackAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    fontSize: 45,
    color: '#FFF',
    fontWeight: '300',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#000',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  userNameText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },
  userRoleText: {
    fontSize: 12,
    color: '#888',
    letterSpacing: 2,
    marginTop: 4,
  },
  formContainer: {
    padding: 25,
    marginTop: 10,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 10,
  },
  iconContainer: {
    width: 45,
    height: 45,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  inputContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#AAA',
    letterSpacing: 1,
    marginBottom: 2,
  },
  textInput: {
    fontSize: 16,
    color: '#111',
    fontWeight: '600',
    paddingVertical: 4,
  },
  mainButton: {
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#7F00FF',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  mainButtonGradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  passwordEyeToggle: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '800',
    letterSpacing: 2,
    fontSize: 14,
  },
});
