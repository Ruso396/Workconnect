import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { api } from '../services/api';
import { ProjectListItem } from '../types';
import { parseISODateLocal, toISODateString } from '../utils/dateFormat';

export interface CreateProjectScreenProps {
  contractorId: number;
  mode: 'create' | 'edit';
  initialProject?: ProjectListItem | null;
  onSaved: () => void;
}

export default function CreateProjectScreen({
  contractorId,
  mode,
  initialProject,
  onSaved,
}: CreateProjectScreenProps): React.JSX.Element {
  const [name, setName] = useState(initialProject?.name ?? '');
  const [location, setLocation] = useState(initialProject?.location ?? '');
  const [startDate, setStartDate] = useState(
    initialProject?.start_date ? parseISODateLocal(initialProject.start_date) : new Date(),
  );
  const [endDate, setEndDate] = useState<Date | null>(
    initialProject?.end_date ? parseISODateLocal(initialProject.end_date) : null,
  );
  const [hasEndDate, setHasEndDate] = useState(Boolean(initialProject?.end_date));
  const [description, setDescription] = useState(initialProject?.description ?? '');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const title = mode === 'create' ? 'Create project' : 'Edit project';

  // Create mode should block past dates; edit mode should allow any date.
  const minDate = useMemo(() => {
    return mode === 'create' ? new Date() : undefined;
  }, [mode]);

  const startLabel = useMemo(() => toISODateString(startDate), [startDate]);
  const endLabel = endDate ? toISODateString(endDate) : '';

  const onStartChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (date) {
      setStartDate(date);
    }
  };

  const onEndChange = (_: DateTimePickerEvent, date?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (date) {
      setEndDate(date);
    }
  };

  const submit = async () => {
    if (!name.trim() || !location.trim()) {
      setError('Project name and location are required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        location: location.trim(),
        start_date: toISODateString(startDate),
        end_date: hasEndDate && endDate ? toISODateString(endDate) : null,
        description: description.trim() ? description.trim() : null,
      };
      if (mode === 'create') {
        await api.createProject(contractorId, {
          name: payload.name,
          location: payload.location,
          start_date: payload.start_date,
          ...(payload.end_date ? { end_date: payload.end_date } : {}),
          ...(payload.description ? { description: payload.description } : {}),
        });
      } else if (initialProject) {
        await api.updateProject(contractorId, initialProject.id, {
          name: payload.name,
          location: payload.location,
          start_date: payload.start_date,
          end_date: hasEndDate && endDate ? toISODateString(endDate) : null,
          description: description.trim() ? description.trim() : null,
        });
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.hint}>Clean details help your team find the right site.</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Project name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholder="e.g. Marina Tower Phase 2"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Location</Text>
        <TextInput
          value={location}
          onChangeText={setLocation}
          style={styles.input}
          placeholder="City / site address"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Start date</Text>
        <Pressable style={styles.inputLike} onPress={() => setShowStartPicker(true)}>
          <Text style={styles.inputLikeText}>{startLabel}</Text>
        </Pressable>
        {showStartPicker ? (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            minimumDate={minDate}
            onChange={onStartChange}
          />
        ) : null}
      </View>

      <View style={styles.field}>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>End date (optional)</Text>
          <Pressable
            onPress={() => {
              setHasEndDate((h) => !h);
              if (hasEndDate) {
                setEndDate(null);
              } else if (!endDate) {
                setEndDate(new Date());
              }
            }}
          >
            <Text style={styles.toggle}>{hasEndDate ? 'Disable' : 'Enable'}</Text>
          </Pressable>
        </View>
        {hasEndDate ? (
          <>
            <Pressable style={styles.inputLike} onPress={() => setShowEndPicker(true)}>
              <Text style={styles.inputLikeText}>{endLabel || 'Pick date'}</Text>
            </Pressable>
            {showEndPicker ? (
              <DateTimePicker
                value={endDate ?? new Date()}
                mode="date"
                display="default"
                minimumDate={minDate}
                onChange={onEndChange}
              />
            ) : null}
          </>
        ) : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.textArea]}
          placeholder="Notes, scope, contacts…"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={[styles.primary, loading && { opacity: 0.85 }]} onPress={submit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryText}>{mode === 'create' ? 'Create project' : 'Save changes'}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#FFFFFF',
    flexGrow: 1,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  hint: { marginTop: 6, color: '#6B7280', marginBottom: 20 },
  field: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  inputLike: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#FAFAFA',
  },
  inputLikeText: { fontSize: 16, color: '#111827', fontWeight: '600' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  toggle: { color: '#1a73e8', fontWeight: '700', fontSize: 13 },
  error: { color: '#DC2626', fontWeight: '600', marginBottom: 12 },
  primary: {
    backgroundColor: '#1a73e8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});
