import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { api, profileImageUri } from '../services/api';
import { AttendanceAbsentWorker, AttendancePresentWorker, ProjectListItem } from '../types';
import { isISODateToday, toISODateString } from '../utils/dateFormat';

interface AttendanceMarkScreenProps {
  contractorId: number;
  initialDate?: string;
  refreshKey?: number;
  onOpenForm: (date: string, projectId: number | null) => void;
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

const IconProject = ({ color = '#64748B' }) => (
  <Svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Path d="M9 22V12h6v10" />
  </Svg>
);

const IconCheck = ({ color = '#FFF', size = 14 }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);

const FabAttendanceIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 33.375 33.375" fill="#FFFFFF">
    <G>
      <Path
        fill="#FFFFFF"
        d="M27.96,31.375H5.414c-1.945,0-3.664-0.979-4.7-2.464c0.14,2.481,2.184,4.464,4.7,4.464H27.96 c2.518,0,4.562-1.98,4.701-4.464C31.625,30.396,29.906,31.375,27.96,31.375z"
      />
      <Path
        fill="#FFFFFF"
        d="M27.96,1.375h-0.682V1c0-0.552-0.447-1-1-1c-0.552,0-1,0.448-1,1v0.375h-1.837V1c0-0.552-0.448-1-1-1s-1,0.448-1,1v0.375 h-1.837V1c0-0.552-0.447-1-1-1c-0.552,0-1,0.448-1,1v0.375h-1.837V1c0-0.552-0.448-1-1-1c-0.552,0-1,0.448-1,1v0.375h-1.837V1 c0-0.552-0.448-1-1-1c-0.552,0-1,0.448-1,1v0.375H8.094V1c0-0.552-0.448-1-1-1c-0.552,0-1,0.448-1,1v0.375H5.412 c-2.605,0-4.725,2.12-4.725,4.726v19.547c0,2.605,2.12,4.727,4.727,4.727H27.96c2.606,0,4.728-2.12,4.728-4.727V6.101 C32.687,3.495,30.567,1.375,27.96,1.375z M25.78,1c0-0.276,0.224-0.5,0.5-0.5s0.5,0.224,0.5,0.5v6.482c0,0.276-0.224,0.5-0.5,0.5 s-0.5-0.224-0.5-0.5V1z M21.943,1c0-0.276,0.225-0.5,0.5-0.5c0.276,0,0.5,0.224,0.5,0.5v6.482c0,0.276-0.224,0.5-0.5,0.5 c-0.275,0-0.5-0.224-0.5-0.5V1z M18.106,1c0-0.276,0.224-0.5,0.5-0.5s0.5,0.224,0.5,0.5v6.482c0,0.276-0.224,0.5-0.5,0.5 s-0.5-0.224-0.5-0.5V1z M14.269,1c0-0.276,0.224-0.5,0.5-0.5s0.5,0.224,0.5,0.5v6.482c0,0.276-0.224,0.5-0.5,0.5 s-0.5-0.224-0.5-0.5V1z M10.432,1c0-0.276,0.224-0.5,0.5-0.5s0.5,0.224,0.5,0.5v6.482c0,0.276-0.224,0.5-0.5,0.5 s-0.5-0.224-0.5-0.5V1z M6.595,1c0-0.276,0.224-0.5,0.5-0.5c0.276,0,0.5,0.224,0.5,0.5v6.482c0,0.276-0.224,0.5-0.5,0.5 c-0.276,0-0.5-0.224-0.5-0.5V1z M30.279,25.648c0,1.277-1.04,2.317-2.318,2.317H5.414c-1.278,0-2.318-1.04-2.318-2.317V6.101 c0-1.278,1.04-2.318,2.318-2.318h0.682v2.513c-0.339,0.286-0.56,0.709-0.56,1.187c0,0.86,0.699,1.56,1.56,1.56 c0.861,0,1.56-0.699,1.56-1.56c0-0.478-0.221-0.9-0.56-1.187V3.783h1.837v2.513c-0.339,0.286-0.56,0.709-0.56,1.187 c0,0.86,0.699,1.56,1.56,1.56c0.861,0,1.56-0.699,1.56-1.56c0-0.478-0.221-0.9-0.56-1.187V3.783h1.837v2.513 c-0.339,0.286-0.56,0.709-0.56,1.187c0,0.86,0.699,1.56,1.56,1.56s1.56-0.699,1.56-1.56c0-0.478-0.221-0.9-0.56-1.187V3.783h1.837 v2.513c-0.339,0.286-0.56,0.709-0.56,1.187c0,0.86,0.699,1.56,1.56,1.56s1.561-0.699,1.561-1.56c0-0.478-0.222-0.9-0.561-1.187 V3.783h1.837v2.513c-0.339,0.286-0.56,0.709-0.56,1.187c0,0.86,0.699,1.56,1.56,1.56c0.861,0,1.56-0.699,1.56-1.56 c0-0.478-0.221-0.9-0.56-1.187V3.783h1.837v2.513c-0.339,0.286-0.56,0.709-0.56,1.187c0,0.86,0.698,1.56,1.56,1.56 s1.561-0.699,1.561-1.56c0-0.478-0.221-0.9-0.561-1.187V3.783h0.682c1.277,0,2.317,1.04,2.317,2.318L30.279,25.648L30.279,25.648z"
      />
      <Path
        fill="#FFFFFF"
        d="M22.71,13.307l-7.214,7.854l-5.045-3.735c-0.666-0.494-1.604-0.354-2.098,0.312c-0.493,0.666-0.354,1.605,0.313,2.099 l6.129,4.539c0.268,0.198,0.58,0.295,0.892,0.295c0.407,0,0.812-0.165,1.105-0.485l8.127-8.849c0.562-0.61,0.521-1.559-0.09-2.119 C24.221,12.658,23.272,12.696,22.71,13.307z"
      />
    </G>
  </Svg>
);

const IconLocation = ({ color = '#94A3B8' }) => (
  <Svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

export default function AttendanceMarkScreen({
  contractorId,
  initialDate,
  refreshKey = 0,
  onOpenForm,
}: AttendanceMarkScreenProps): React.JSX.Element {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [date, setDate] = useState(initialDate ?? toISODateString(new Date()));
  const [monthDate, setMonthDate] = useState(() => {
    const d = initialDate ? parseIsoDate(initialDate) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState('');
  const [checkingAttendance, setCheckingAttendance] = useState(false);
  const [presentWorkers, setPresentWorkers] = useState<AttendancePresentWorker[]>([]);
  const [absentWorkers, setAbsentWorkers] = useState<AttendanceAbsentWorker[]>([]);
  const [hasAttendance, setHasAttendance] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingProjects(true);
      setError('');
      try {
        const list = await api.getProjects(contractorId, 'active');
        if (cancelled) {
          return;
        }
        setProjects(list);
        if (list.length > 0) {
          setProjectId(list[0].id);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load projects');
        }
      } finally {
        if (!cancelled) {
          setLoadingProjects(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contractorId]);

  useEffect(() => {
    if (!initialDate) {
      return;
    }
    setDate(initialDate);
    const d = parseIsoDate(initialDate);
    setMonthDate(new Date(d.getFullYear(), d.getMonth(), 1));
  }, [initialDate]);

  useEffect(() => {
    if (projectId == null) {
      setPresentWorkers([]);
      setAbsentWorkers([]);
      setHasAttendance(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setCheckingAttendance(true);
      setError('');
      try {
        const data = await api.getAttendanceByDate(contractorId, projectId, date);
        if (cancelled) {
          return;
        }
        setPresentWorkers(data.present_workers);
        setAbsentWorkers(data.absent_workers);
        setHasAttendance(data.already_marked);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load attendance status');
        }
      } finally {
        if (!cancelled) {
          setCheckingAttendance(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contractorId, projectId, date, refreshKey]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projects, projectId],
  );
  const dateGrid = useMemo(() => buildMonthGrid(monthDate), [monthDate]);
  const isSelectedToday = useMemo(() => isISODateToday(date), [date]);

  const applyMonthYear = (month: number, year: number) => {
    setMonthDate(new Date(year, month, 1));
    setShowMonthPicker(false);
  };

  const renderWorkerCard = (
    w: AttendancePresentWorker | AttendanceAbsentWorker,
    variant: 'present' | 'absent',
  ) => {
    const uri = profileImageUri(w.profile_image ?? undefined);
    const initial = (w.name || '?').trim().charAt(0).toUpperCase();
    return (
      <View
        key={w.user_id}
        style={[
          styles.workerRow,
          variant === 'present' ? styles.workerRowPresent : styles.workerRowAbsent,
        ]}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}
        <View style={styles.workerInfo}>
          <Text style={styles.workerName}>{w.name}</Text>
          <Text style={styles.workerMeta}>{w.role || 'General Worker'}</Text>
        </View>

        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 10,
            backgroundColor: variant === 'present' ? '#22C55E' : '#FB7185',
          }}
        >
          <Text
            style={{
              color: '#FFF',
              fontSize: 10,
              fontWeight: '900',
              textTransform: 'uppercase',
            }}
          >
            {variant}
          </Text>
        </View>
      </View>
    );
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
              <LinearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#7F00FF" />
                <Stop offset="100%" stopColor="#E100FF" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="360" height="580" fill="url(#heroGrad)" />
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
                    onPress={() => {
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.label}>Active Project</Text>
            {loadingProjects && <ActivityIndicator size="small" color="#6366F1" />}
          </View>

          <Pressable
            style={[styles.dropdownTrigger, showProjectMenu && styles.dropdownActive]}
            onPress={() => setShowProjectMenu((v) => !v)}
            disabled={loadingProjects || projects.length === 0}
          >
            <View style={styles.iconCircle}>
              <IconProject color="#1E293B" />
            </View>
            <View style={styles.dropdownMain}>
              <Text style={styles.dropdownText} numberOfLines={1}>
                {selectedProject?.name ?? 'Select Project'}
              </Text>
              {selectedProject && (
                <View style={styles.locRow}>
                  <IconLocation />
                  <Text style={styles.dropdownSubtext}>{selectedProject.location}</Text>
                </View>
              )}
            </View>
            <View style={[styles.chev, showProjectMenu && { transform: [{ rotate: '180deg' }] }]}>
              <Svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94A3B8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <Path d="M6 9l6 6 6-6" />
              </Svg>
            </View>
          </Pressable>

          {showProjectMenu && (
            <View style={styles.menuContainer}>
              <ScrollView style={styles.menuScroll} nestedScrollEnabled>
                {projects.map((p) => (
                  <Pressable
                    key={p.id}
                    style={({ pressed }) => [
                      styles.menuItem,
                      p.id === projectId && styles.menuItemActive,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => {
                      setProjectId(p.id);
                      setShowProjectMenu(false);
                    }}
                  >
                    <Text style={[styles.menuTitle, p.id === projectId && { color: '#0F172A' }]}>{p.name}</Text>
                    {p.id === projectId && <IconCheck color="#0F172A" size={16} />}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {checkingAttendance ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator color="#111827" />
          </View>
        ) : hasAttendance ? (
          <>
            <View style={styles.section}>
              <Text style={styles.presentTitle}>Present Workers</Text>
              {presentWorkers.map((w) => renderWorkerCard(w, 'present'))}
            </View>

            <View style={styles.section}>
              <Text style={styles.presentTitle}>Absent Workers</Text>
              {absentWorkers.map((w) => renderWorkerCard(w, 'absent'))}
            </View>
          </>
        ) : null}
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

        <Pressable
          style={[styles.fab, !isSelectedToday && { opacity: 0.4 }]}
          onPress={() => {
            if (!isSelectedToday) {
              return;
            }
            onOpenForm(date, projectId);
          }}
          disabled={projectId == null || !isSelectedToday}
        >
          <FabAttendanceIcon />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map((v) => Number(v));
  if (!y || !m || !d) {
    return new Date();
  }
  return new Date(y, m - 1, d);
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
  scroll: { paddingBottom: 100, width: '100%' },
  calendarHero: {
    height: 590,
    paddingHorizontal: 0,
    paddingTop: 20,
    paddingBottom: 30,
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
  label: {
    color: '#64748B',
    fontWeight: '800',
    marginBottom: 12,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
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
  dropdownActive: { borderColor: '#0F172A', backgroundColor: '#FFF' },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    elevation: 1,
  },
  dropdownMain: { flex: 1 },
  dropdownText: { color: '#0F172A', fontWeight: '700', fontSize: 16 },
  locRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  dropdownSubtext: { color: '#64748B', fontSize: 12, marginLeft: 4 },
  chev: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  menuContainer: {
    marginTop: 10,
    backgroundColor: '#FFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  menuScroll: { maxHeight: 200 },
  menuItem: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemActive: { backgroundColor: '#F8FAFC' },
  menuTitle: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  presentTitle: {
    color: '#1E293B',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  workerRowPresent: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  workerRowAbsent: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FFE4E6',
  },
  avatarImage: { width: 48, height: 48, borderRadius: 16, marginRight: 14 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    marginRight: 14,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#475569', fontWeight: '800', fontSize: 18 },
  workerInfo: { flex: 1 },
  workerName: { color: '#1E293B', fontWeight: '700', fontSize: 16 },
  workerMeta: { color: '#64748B', fontSize: 13, marginTop: 2, fontWeight: '500' },
  loaderWrap: { paddingVertical: 18, alignItems: 'center' },
  error: { color: '#B91C1C', fontWeight: '700', marginHorizontal: 16, marginBottom: 10 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 84,
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#FF3B6A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
});
