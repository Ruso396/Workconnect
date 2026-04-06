import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

// Screen width calculate panna
const { width } = Dimensions.get('window');
const CARD_MARGIN = 10;
// 3 columns calculation: (Total Width - Padding) / 3
const CARD_WIDTH = (width - 60) / 3; 

// Icons
const AddUserIcon = () => (
  <Svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <Circle cx="9" cy="7" r="4" />
    <Path d="M19 8v6M16 11h6" />
  </Svg>
);

const SendIcon = () => (
  <Svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m22 2-7 20-4-9-9-4Z" />
    <Path d="M22 2 11 13" />
  </Svg>
);

const HistoryIcon = () => (
  <Svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 6v6l4 2" />
  </Svg>
);

const SettingsIcon = () => (
  <Svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <Circle cx="12" cy="12" r="3" />
  </Svg>
);

const FolderIcon = () => (
  <Svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
  </Svg>
);

const CalendarIcon = () => (
  <Svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M8 2v4M16 2v4M3 10h18" />
    <Rect x="3" y="4" width="18" height="18" rx="2" />
    <Path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
  </Svg>
);

interface ContractorHomeScreenProps {
  onGoAddWorker: () => void;
  onGoSendJob: () => void;
  onGoManageRoles: () => void;
  onGoProjects: () => void;
  onGoAttendance: () => void;
}

export default function ContractorHomeScreen({
  onGoAddWorker,
  onGoSendJob,
  onGoManageRoles,
  onGoProjects,
  onGoAttendance,
}: ContractorHomeScreenProps): React.JSX.Element {
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manpower Management</Text>

      {/* Grid Container */}
      <View style={styles.gridContainer}>
        {/* Row 1, Item 1 */}
        <Pressable style={styles.card} onPress={onGoAddWorker}>
          <AddUserIcon />
          <Text style={styles.cardLabel}>Add Worker</Text>
        </Pressable>

        {/* Row 1, Item 2 */}
        <Pressable style={styles.card} onPress={onGoSendJob}>
          <SendIcon />
          <Text style={styles.cardLabel}>Send Job</Text>
        </Pressable>

        {/* Row 1, Item 3 */}
        <Pressable style={styles.card} onPress={() => {}}>
          <HistoryIcon />
          <Text style={styles.cardLabel}>History</Text>
        </Pressable>

        {/* Row 2 */}
        <Pressable style={styles.card} onPress={onGoProjects}>
          <FolderIcon />
          <Text style={styles.cardLabel}>Projects</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={onGoManageRoles}>
          <SettingsIcon />
          <Text style={styles.cardLabel}>Worker Roles</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={onGoAttendance}>
          <CalendarIcon />
          <Text style={styles.cardLabel}>Attendance</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    paddingHorizontal: 20,
    marginBottom: 25,
    letterSpacing: 0.5,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Ithu thaan row-ku 3 mela pona keela kondu varum
    paddingHorizontal: 15,
    justifyContent: 'flex-start',
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: CARD_WIDTH,
    aspectRatio: 1, // Square shape
    borderRadius: 12,
    margin: 5,
    alignItems: 'center',
    justifyContent: 'center',
    // Border for subtle look
    borderWidth: 1,
    borderColor: '#f0f0f0',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardLabel: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
    textAlign: 'center',
  },
});
