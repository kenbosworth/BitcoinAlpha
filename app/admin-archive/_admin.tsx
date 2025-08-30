// app/(tabs)/admin.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';
import { useTheme } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { Picker } from '@react-native-picker/picker';

export default function AdminPanel() {
  const { colors } = useTheme();

  const [alertTitle, setAlertTitle] = useState('');
  const [alertBody, setAlertBody] = useState('');
  const [cycleDay, setCycleDay] = useState('');
  const [cyclePhase, setCyclePhase] = useState('Accumulation');

  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

async function createAlert() {
  const day = parseInt(cycleDay, 10);
  if (isNaN(day)) {
    Alert.alert('Invalid Cycle Day', 'Please enter a valid number.');
    return;
  }

  //const { data: userData, error: userError } = await supabase.auth.getUser();
  //console.log('User ID before insert:', userData?.user?.id);
  //if (userError) console.error('User fetch error:', userError);

  const { error, data } = await supabase.from('alerts').insert({
    title: alertTitle,
    body: alertBody,
    cycle_day: day,
    cycle_phase: cyclePhase,
  });

  if (error) {
    console.error('Insert error:', error);
    Alert.alert('Error creating alert', error.message);
  } else {
    console.log('Insert success:', data);
    Alert.alert('Alert created successfully');
    setAlertTitle('');
    setAlertBody('');
    setCycleDay('');
    setCyclePhase('Accumulation');
  }
}


  async function createNote() {
    const { error } = await supabase.from('alpha_notes').insert({
      title: noteTitle,
      content: noteContent,
    });
    if (error) {
      Alert.alert('Error creating note', error.message);
    } else {
      Alert.alert('Alpha Note published');
      setNoteTitle('');
      setNoteContent('');
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.header, { color: colors.text }]}>Admin Panel</Text>

      <Text style={[styles.section, { color: colors.text }]}>Create Alert</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]} 
        placeholder="Title"
        placeholderTextColor={colors.inactive}
        value={alertTitle}
        onChangeText={setAlertTitle}
      />
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]} 
        placeholder="Body"
        placeholderTextColor={colors.inactive}
        value={alertBody}
        onChangeText={setAlertBody}
        multiline
      />
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]} 
        placeholder="Cycle Day"
        placeholderTextColor={colors.inactive}
        value={cycleDay}
        onChangeText={setCycleDay}
        keyboardType="numeric"
      />
      <View style={[styles.pickerWrapper, { borderColor: colors.border }]}>
        <Picker
          selectedValue={cyclePhase}
          onValueChange={(value) => setCyclePhase(value)}
          dropdownIconColor={colors.text}
          style={{ color: colors.text }}
        >
          <Picker.Item label="Accumulation" value="Accumulation" />
          <Picker.Item label="Advance" value="Advance" />
          <Picker.Item label="Distribution" value="Distribution" />
          <Picker.Item label="Decline" value="Decline" />
        </Picker>
      </View>
      <Pressable onPress={createAlert} style={[styles.button, { backgroundColor: colors.active }]}>
        <Text style={styles.buttonText}>Send Alert</Text>
      </Pressable>

      <Text style={[styles.section, { color: colors.text }]}>Post Alpha Note</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]} 
        placeholder="Note Title"
        placeholderTextColor={colors.inactive}
        value={noteTitle}
        onChangeText={setNoteTitle}
      />
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]} 
        placeholder="Content"
        placeholderTextColor={colors.inactive}
        value={noteContent}
        onChangeText={setNoteContent}
        multiline
      />
      <Pressable onPress={createNote} style={[styles.button, { backgroundColor: colors.active }]}>
        <Text style={styles.buttonText}>Publish Note</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
  section: { fontSize: 18, fontWeight: '600', marginTop: 20 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 12,
    minHeight: 40,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
