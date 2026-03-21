import React from 'react';
import { Alert, View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

interface HeaderProps {
  name?: string;
  role?: 'worker' | 'contractor' | null;
  profileImage?: string;
  onLogout?: () => void;
  notificationCount?: number;
  onNotificationPress?: () => void;
}

export default function Header({
  name = 'Guest',
  role,
  profileImage,
  onLogout,
  notificationCount,
  onNotificationPress,
}: HeaderProps): React.JSX.Element {
  const confirmLogout = () => {
    if (!onLogout) {
      return;
    }
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', onPress: onLogout },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* LEFT SECTION */}
        <View style={styles.left}>
          {profileImage ? (
            <Image
              key={profileImage}
              source={{
                uri: profileImage,
              }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
            </View>
          )}

          <View style={styles.textContainer}>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.name}>{name}</Text>
          </View>
        </View>

        {/* RIGHT SECTION - LOGOUT + NOTIFICATION */}
        <View style={styles.right}>
          {onLogout && (
            <TouchableOpacity onPress={confirmLogout} style={styles.iconButton}>
              <Svg width={20} height={20} viewBox="0 0 52 52">

  <Path
    d="M21 48.5V45.5C21 44.7 20.3 44 19.5 44H9.5C8.7 44 8 43.3 8 42.5V9.5C8 8.7 8.7 8 9.5 8H19.5C20.3 8 21 7.3 21 6.5V3.5C21 2.7 20.3 2 19.5 2H6C3.8 2 2 3.8 2 6V46C2 48.2 3.8 50 6 50H19.5C20.3 50 21 49.3 21 48.5Z"
    fill="#e00000"
  />

  <Path
    d="M49.6 27C50.2 26.4 50.2 25.5 49.6 24.9L36.1 11.4C35.5 10.8 34.6 10.8 34 11.4L31.9 13.5C31.3 14.1 31.3 15 31.9 15.6L37.5 21.2C38.1 21.8 37.7 22.9 36.8 22.9H15.5C14.7 22.9 14 23.5 14 24.3V27.3C14 28.1 14.7 28.9 15.5 28.9H36.7C37.6 28.9 38 30 37.4 30.6L31.8 36.2C31.2 36.8 31.2 37.7 31.8 38.3L33.9 40.4C34.5 41 35.4 41 36 40.4L49.6 27Z"
    fill="#e00000"
  />

</Svg>
            </TouchableOpacity>
          )}

          {onNotificationPress ? (
            <TouchableOpacity onPress={onNotificationPress} style={styles.iconButton}>
              <View style={styles.notificationWrapper}>
                <Svg width={24} height={24} viewBox="0 0 24 24">
                  <Path
                    d="M19.3399 14.49L18.3399 12.83C18.1299 12.46 17.9399 11.76 17.9399 11.35V8.82C17.9399 6.47 16.5599 4.44 14.5699 3.49C14.0499 2.57 13.0899 2 11.9899 2C10.8999 2 9.91994 2.59 9.39994 3.52C7.44994 4.49 6.09994 6.5 6.09994 8.82V11.35C6.09994 11.76 5.90994 12.46 5.69994 12.82L4.68994 14.49C4.28994 15.16 4.19994 15.9 4.44994 16.58C4.68994 17.25 5.25994 17.77 5.99994 18.02C7.93994 18.68 9.97994 19 12.0199 19C14.0599 19 16.0999 18.68 18.0399 18.03C18.7399 17.8 19.2799 17.27 19.5399 16.58C19.7999 15.89 19.7299 15.13 19.3399 14.49Z"
                    fill="#292D32"
                  />
                  <Path
                    d="M14.8297 20.01C14.4097 21.17 13.2997 22 11.9997 22C11.2097 22 10.4297 21.68 9.87969 21.11C9.55969 20.81 9.31969 20.41 9.17969 20C9.30969 20.02 9.43969 20.03 9.57969 20.05C9.80969 20.08 10.0497 20.11 10.2897 20.13C10.8597 20.18 11.4397 20.21 12.0197 20.21C12.5897 20.21 13.1597 20.18 13.7197 20.13C13.9297 20.11 14.1397 20.1 14.3397 20.07C14.4997 20.05 14.6597 20.03 14.8297 20.01Z"
                    fill="#292D32"
                  />
                </Svg>

                {typeof notificationCount === 'number' && notificationCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{notificationCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ) : null}
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
 container: {
  height: 80,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 16,
  backgroundColor: '#FFFFFF',
  borderBottomWidth: 1,
  borderBottomColor: '#E5E7EB',
  },

  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  textContainer: {
    marginLeft: 12,
  },

  greeting: {
    fontSize: 14,
    color: '#6B7280', // light grey
  },

  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconButton: {
    padding: 8,
    marginLeft: 4,
  },
  notificationWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
    lineHeight: 11,
  },
});