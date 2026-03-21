import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

/** Matches `Header` chevron / icon column width for optical centering of the title. */
const SIDE_SLOT = 48;

export interface GoBackHeaderProps {
  /** Parent implements stack pop or role-based fallback (this app has no React Navigation). */
  onPress: () => void;
}

export default function GoBackHeader({ onPress }: GoBackHeaderProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Pressable
          onPress={onPress}
          style={styles.backSlot}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 18l-6-6 6-6"
              stroke="#111111"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
        <View style={styles.titleWrap} pointerEvents="none">
          <Text style={styles.title}>Go Back</Text>
        </View>
        <View style={styles.sideSpacer} />
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
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backSlot: {
    width: SIDE_SLOT,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  titleWrap: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
  },
  sideSpacer: {
    width: SIDE_SLOT,
  },
});
