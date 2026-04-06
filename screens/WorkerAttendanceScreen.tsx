import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { api } from '../services/api';
import { toISODateString } from '../utils/dateFormat';

interface WorkerAttendanceScreenProps {
  workerId: number;
}

type CalendarCell = {
  key: string;
  label: string;
  iso: string;
  inMonth: boolean;
  date: Date;
};

const PICKER_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const PICKER_YEARS: number[] = [];
for (let y = 2020; y <= 2035; y++) {
  PICKER_YEARS.push(y);
}

export default function WorkerAttendanceScreen({ workerId }: WorkerAttendanceScreenProps): React.JSX.Element {
  const [date, setDate] = useState(toISODateString(new Date()));
  const [monthDate, setMonthDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<'present' | 'absent' | null>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingAttendance(true);
      try {
        const data = await api.getWorkerAttendanceByDate(workerId, date);
        if (!cancelled) {
          setAttendanceStatus(data.status);
        }
      } catch {
        if (!cancelled) {
          setAttendanceStatus(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingAttendance(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workerId, date]);

  const dateGrid = useMemo(() => buildMonthGrid(monthDate), [monthDate]);

  const applyMonthYear = (month: number, year: number) => {
    setMonthDate(new Date(year, month, 1));
    setShowMonthPicker(false);
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.calendarHero}>
            <Svg
              style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
              viewBox="0 0 360 580"
              preserveAspectRatio="none"
            >
              <Defs>
                <LinearGradient id="workerHeroGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#7F00FF" />
                  <Stop offset="100%" stopColor="#E100FF" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="360" height="580" fill="url(#workerHeroGrad)" />
              <Path
                d="M0,460 C60,440 120,500 180,460 C240,440 300,500 360,460 L360,580 L0,580 Z"
                fill="#F3F4F6"
              />
              <Path
                d="M0,480 C60,460 120,520 180,480 C240,460 300,520 360,480 L360,580 L0,580 Z"
                fill="#FFFFFF"
              />
            </Svg>

            <View style={styles.monthNav}>
              <Pressable
                style={styles.navArrowHit}
                onPress={() => {
                  const d = new Date(monthDate);
                  d.setMonth(d.getMonth() - 1);
                  setMonthDate(d);
                }}
              >
                <Text style={styles.navArrow}>{'<'}</Text>
              </Pressable>
              <View style={styles.monthTitleCenter}>
                <Pressable onPress={() => setShowMonthPicker(true)} style={styles.monthTitlePressable}>
                  <Text style={styles.monthTitle}>{formatMonthYear(monthDate)}</Text>
                </Pressable>
              </View>
              <Pressable
                style={styles.navArrowHit}
                onPress={() => {
                  const d = new Date(monthDate);
                  d.setMonth(d.getMonth() + 1);
                  setMonthDate(d);
                }}
              >
                <Text style={styles.navArrow}>{'>'}</Text>
              </Pressable>
            </View>

            <View style={styles.todayRow}>
              <Pressable
                style={styles.todayBtn}
                onPress={() => {
                  const today = new Date();
                  const iso = toISODateString(today);
                  setDate(iso);
                  setMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
                }}
              >
                <Text style={styles.todayText}>Today</Text>
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
                <Text key={`${d}-${idx}`} style={styles.weekText}>
                  {d}
                </Text>
              ))}
            </View>

            {dateGrid.map((week, weekIndex) => (
              <View key={`w-${weekIndex}`} style={styles.daysRow}>
                {week.map((day) => {
                  const isCurrent = day.iso === date;
                  return (
                    <Pressable
                      key={day.key}
                      style={styles.dayCell}
                      disabled={!day.inMonth}
                      onPress={() => {
                        if (!day.inMonth) {
                          return;
                        }
                        setDate(day.iso);
                        setMonthDate(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
                      }}
                    >
                      <View style={[styles.dateWrap, isCurrent && styles.selectedDateWrap]}>
                        <Text
                          style={
                            isCurrent
                              ? styles.selectedDateText
                              : [styles.dayText, !day.inMonth && styles.dayTextOff]
                          }
                        >
                          {day.label}
                        </Text>
                      </View>
                      {day.inMonth ? <View style={styles.dayDot} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.presentTitle}>My Attendance</Text>
            {loadingAttendance ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator color="#111827" />
              </View>
            ) : (
              <>
                {attendanceStatus === 'present' && (
                  <Text style={{ color: '#22C55E', fontWeight: '700' }}>Present </Text>
                )}
                {attendanceStatus === 'absent' && (
                  <Text style={{ color: '#EF4444', fontWeight: '700' }}>Absent </Text>
                )}
                {attendanceStatus === null && (
                  <Text style={{ color: '#64748B' }}>No Data </Text>
                )}
              </>
            )}
          </View>
        </ScrollView>

        <Modal
          visible={showMonthPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMonthPicker(false)}
        >
          <View style={styles.pickerOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowMonthPicker(false)} />
            <View style={styles.monthPickerCard}>
              <View style={styles.pickerColumns}>
                <ScrollView
                  style={styles.pickerScroll}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {PICKER_MONTHS.map((m, index) => {
                    const active = monthDate.getMonth() === index;
                    return (
                      <Pressable
                        key={m}
                        style={[styles.pickerItem, active && styles.pickerItemActive]}
                        onPress={() => applyMonthYear(index, monthDate.getFullYear())}
                      >
                        <Text style={[styles.pickerItemText, active && styles.pickerItemTextActive]}>{m}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <ScrollView
                  style={styles.pickerScroll}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {PICKER_YEARS.map((y) => {
                    const active = monthDate.getFullYear() === y;
                    return (
                      <Pressable
                        key={y}
                        style={[styles.pickerItem, active && styles.pickerItemActive]}
                        onPress={() => applyMonthYear(monthDate.getMonth(), y)}
                      >
                        <Text style={[styles.pickerItemText, active && styles.pickerItemTextActive]}>{y}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

function formatMonthYear(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function buildMonthGrid(monthDate: Date): CalendarCell[][] {
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startOffset = start.getDay();
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - startOffset);
  const weeks: CalendarCell[][] = [];

  for (let w = 0; w < 6; w++) {
    const row: CalendarCell[] = [];
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(gridStart);
      cellDate.setDate(gridStart.getDate() + w * 7 + d);
      const inMonth = cellDate.getMonth() === monthDate.getMonth();
      row.push({
        key: `${cellDate.getFullYear()}-${cellDate.getMonth()}-${cellDate.getDate()}`,
        label: String(cellDate.getDate()),
        iso: toISODateString(cellDate),
        inMonth,
        date: cellDate,
      });
    }
    weeks.push(row);
  }
  return weeks;
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', alignSelf: 'stretch', backgroundColor: '#FFFFFF' },
  scroll: { paddingBottom: 40, width: '100%' },
  calendarHero: {
    height: 590,
    paddingHorizontal: 0,
    paddingTop: 10,
    paddingBottom: 15,
    marginBottom: 12,
    width: '100%',
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  monthTitleCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitlePressable: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  navArrowHit: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrow: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  monthTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '300',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  todayRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  todayBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  todayText: {
    color: '#7F00FF',
    fontWeight: '700',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  monthPickerCard: {
    width: '100%',
    maxWidth: 340,
    height: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  pickerColumns: {
    flexDirection: 'row',
    flex: 1,
    height: '100%',
  },
  pickerScroll: {
    flex: 1,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  pickerItemActive: {
    backgroundColor: '#F3E8FF',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  pickerItemTextActive: {
    color: '#7F00FF',
    fontWeight: '700',
  },
  weekRow: { flexDirection: 'row', marginBottom: 10 },
  weekText: { flex: 1, textAlign: 'center', color: '#E9D5FF', fontWeight: '700', fontSize: 14 },
  daysRow: { flexDirection: 'row', marginBottom: 8 },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  dateWrap: {
    minWidth: 36,
    minHeight: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: { color: '#FFFFFF', fontSize: 22, fontWeight: '300' },
  dayTextOff: { color: 'rgba(255,255,255,0.28)' },
  selectedDateWrap: {
    backgroundColor: '#FFFFFF',
  },
  selectedDateText: { color: '#EF4444', fontWeight: '700', fontSize: 20 },
  dayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#F97316', marginTop: 3, opacity: 0.9 },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  presentTitle: {
    color: '#1E293B',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  loaderWrap: { paddingVertical: 18, alignItems: 'center' },
});
