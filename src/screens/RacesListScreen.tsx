import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useRaceContext } from '../context/RaceContext';
import { Race, StartType } from '../types';
import { triggerHaptic } from '../utils/hapticsUtils';

interface RacesListScreenProps {
  onClose: () => void;
  initialCreate?: boolean;
  initialImport?: boolean;
}

const DISTANCE_PRESETS = [
  { label: '1K Fun Run', meters: 1000 },
  { label: '3K', meters: 3000 },
  { label: '5K', meters: 5000 },
  { label: '10K', meters: 10000 },
  { label: '15K', meters: 15000 },
  { label: 'Half Marathon (21.1K)', meters: 21097 },
  { label: 'Marathon (42.2K)', meters: 42195 },
  { label: 'Custom', meters: 5000 },
];

export const RacesListScreen: React.FC<RacesListScreenProps> = ({
  onClose,
  initialCreate = false,
  initialImport = false,
}) => {
  const {
    races,
    activeRace,
    selectRace,
    deselectRace,
    createRace,
    deleteRace,
    loadSampleRace,
    exportRaceBackup,
    importRaceBackup,
  } = useRaceContext();

  const [showCreateModal, setShowCreateModal] = useState<boolean>(initialCreate);
  const [showImportModal, setShowImportModal] = useState<boolean>(initialImport);
  const [importJsonText, setImportJsonText] = useState<string>('');

  // Form State
  const [raceName, setRaceName] = useState<string>('');
  const [raceDate, setRaceDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedDistance, setSelectedDistance] = useState(DISTANCE_PRESETS[2]); // 5K default
  const [customDistanceMeters, setCustomDistanceMeters] = useState<string>('5000');
  const [raceLocation, setRaceLocation] = useState<string>('');
  const [raceNotes, setRaceNotes] = useState<string>('');
  const [startType, setStartType] = useState<StartType>('mass');

  const handleSelectRace = async (raceId: string) => {
    triggerHaptic('light');
    await selectRace(raceId);
    onClose();
  };

  const handleCreateRace = async () => {
    if (!raceName.trim()) {
      if (Platform.OS === 'web') window.alert('Please enter a race name.');
      else Alert.alert('Required', 'Please enter a race name.');
      return;
    }

    const distMeters =
      selectedDistance.label === 'Custom'
        ? parseInt(customDistanceMeters, 10) || 5000
        : selectedDistance.meters;

    const newRace = await createRace({
      name: raceName.trim(),
      date: raceDate,
      distanceMeters: distMeters,
      distanceLabel:
        selectedDistance.label === 'Custom'
          ? `${(distMeters / 1000).toFixed(1)}K Custom`
          : selectedDistance.label,
      location: raceLocation.trim(),
      notes: raceNotes.trim(),
      startType,
    });

    triggerHaptic('success');
    setShowCreateModal(false);
    // Reset fields
    setRaceName('');
    setRaceLocation('');
    setRaceNotes('');
    onClose();
  };

  const handleDeleteRace = (race: Race) => {
    const confirmDelete = async () => {
      triggerHaptic('warning');
      await deleteRace(race.id);
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete "${race.name}"? All runners and times will be removed.`)) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Delete Race',
        `Are you sure you want to delete "${race.name}"? All runners and times will be removed.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  const handleLoadSample = async () => {
    await loadSampleRace();
    onClose();
  };

  const handleImportJson = async () => {
    try {
      const parsed = JSON.parse(importJsonText);
      await importRaceBackup(parsed);
      setShowImportModal(false);
      setImportJsonText('');
      onClose();
    } catch {
      if (Platform.OS === 'web') window.alert('Invalid race JSON format.');
      else Alert.alert('Error', 'Invalid race JSON format.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Races & Events</Text>
          <Text style={styles.headerSub}>Manage your community running races</Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>✕ Done</Text>
        </TouchableOpacity>
      </View>

      {/* Top Action Buttons */}
      <View style={styles.topActionsRow}>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => {
            setShowCreateModal(true);
            triggerHaptic('light');
          }}
        >
          <Text style={styles.createBtnText}>+ New Race</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sampleBtn}
          onPress={handleLoadSample}
        >
          <Text style={styles.sampleBtnText}>⚡ Load Demo 5K</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.importBtn}
          onPress={() => setShowImportModal(true)}
        >
          <Text style={styles.importBtnText}>📥 Restore</Text>
        </TouchableOpacity>
      </View>

      {/* Active Race Bar & Deselect Option */}
      {activeRace && (
        <View style={styles.activeRaceBar}>
          <View style={styles.activeRaceBarLeft}>
            <Text style={styles.activeRaceBarLabel}>CURRENTLY ACTIVE RACE</Text>
            <Text style={styles.activeRaceBarName} numberOfLines={1}>
              {activeRace.name}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deselectBtn}
            onPress={() => {
              triggerHaptic('light');
              deselectRace();
              onClose();
            }}
          >
            <Text style={styles.deselectBtnText}>Deselect</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Races List */}
      <FlatList
        data={races}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🏃‍♂️</Text>
            <Text style={styles.emptyTitle}>No races created yet</Text>
            <Text style={styles.emptySub}>
              Create your first race or tap "Load Demo 5K" to explore with sample data.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isSelected = activeRace?.id === item.id;
          return (
            <TouchableOpacity
              style={[styles.raceCard, isSelected && styles.raceCardActive]}
              onPress={() => handleSelectRace(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.raceCardHeader}>
                <View style={styles.raceTitleContainer}>
                  <Text style={styles.raceName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.raceDate}>
                    📅 {item.date} • {item.distanceLabel}
                  </Text>
                </View>
                {isSelected && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>ACTIVE</Text>
                  </View>
                )}
              </View>

              {item.location ? (
                <Text style={styles.raceLocation} numberOfLines={1}>
                  📍 {item.location}
                </Text>
              ) : null}

              <View style={styles.raceCardFooter}>
                <View
                  style={[
                    styles.statusTag,
                    item.status === 'in_progress'
                      ? styles.statusTagLive
                      : item.status === 'completed'
                      ? styles.statusTagDone
                      : styles.statusTagDraft,
                  ]}
                >
                  <Text style={styles.statusTagText}>
                    {item.status === 'in_progress'
                      ? '● LIVE RUNNING'
                      : item.status.toUpperCase()}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleDeleteRace(item)}
                  style={styles.deleteRaceBtn}
                >
                  <Text style={styles.deleteRaceText}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* CREATE RACE MODAL */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>Create New Race</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text style={styles.modalCloseX}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Race Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Parkview Community 5K"
                placeholderTextColor="#64748B"
                value={raceName}
                onChangeText={setRaceName}
              />

              <Text style={styles.fieldLabel}>Race Date (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.input}
                placeholder="2026-08-16"
                placeholderTextColor="#64748B"
                value={raceDate}
                onChangeText={setRaceDate}
              />

              <Text style={styles.fieldLabel}>Distance</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presetScroll}
              >
                {DISTANCE_PRESETS.map((p) => (
                  <TouchableOpacity
                    key={p.label}
                    style={[
                      styles.presetChip,
                      selectedDistance.label === p.label && styles.presetChipActive,
                    ]}
                    onPress={() => setSelectedDistance(p)}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        selectedDistance.label === p.label && styles.presetChipTextActive,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {selectedDistance.label === 'Custom' && (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.fieldLabel}>Custom Distance in Meters</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 8000"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    value={customDistanceMeters}
                    onChangeText={setCustomDistanceMeters}
                  />
                </View>
              )}

              <Text style={styles.fieldLabel}>Start Type</Text>
              <View style={styles.startTypeRow}>
                <TouchableOpacity
                  style={[
                    styles.startTypeBtn,
                    startType === 'mass' && styles.startTypeBtnActive,
                  ]}
                  onPress={() => setStartType('mass')}
                >
                  <Text
                    style={[
                      styles.startTypeText,
                      startType === 'mass' && styles.startTypeTextActive,
                    ]}
                  >
                    Mass Gun Start (All together)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.startTypeBtn,
                    startType === 'wave' && styles.startTypeBtnActive,
                  ]}
                  onPress={() => setStartType('wave')}
                >
                  <Text
                    style={[
                      styles.startTypeText,
                      startType === 'wave' && styles.startTypeTextActive,
                    ]}
                  >
                    Wave / Category Staggered Starts
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Location / Course Notes</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Riverside Park, Main Pavilion"
                placeholderTextColor="#64748B"
                value={raceLocation}
                onChangeText={setRaceLocation}
              />

              <Text style={styles.fieldLabel}>Additional Notes / Rules</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                placeholder="Optional notes for volunteers & marshals"
                placeholderTextColor="#64748B"
                multiline
                value={raceNotes}
                onChangeText={setRaceNotes}
              />

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleCreateRace}
              >
                <Text style={styles.modalSubmitBtnText}>Create Race & Setup</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* IMPORT BACKUP MODAL */}
      <Modal
        visible={showImportModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>Restore Race JSON Bundle</Text>
              <TouchableOpacity onPress={() => setShowImportModal(false)}>
                <Text style={styles.modalCloseX}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Paste a previously exported Quick Race JSON bundle to restore on this device:
            </Text>

            <TextInput
              style={[styles.input, { height: 160, fontFamily: 'monospace', fontSize: 11 }]}
              placeholder='{"exportVersion": "1.0.0", "race": { ... }}'
              placeholderTextColor="#64748B"
              multiline
              value={importJsonText}
              onChangeText={setImportJsonText}
            />

            <TouchableOpacity
              style={[styles.modalSubmitBtn, !importJsonText.trim() && { opacity: 0.5 }]}
              onPress={handleImportJson}
              disabled={!importJsonText.trim()}
            >
              <Text style={styles.modalSubmitBtnText}>Restore Race</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1D',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
  },
  topActionsRow: {
    flexDirection: 'row',
    padding: 14,
    gap: 8,
  },
  createBtn: {
    flex: 2,
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sampleBtn: {
    flex: 2,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sampleBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  importBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  importBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  activeRaceBar: {
    marginHorizontal: 14,
    marginBottom: 4,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  activeRaceBarLeft: {
    flex: 1,
    marginRight: 10,
  },
  activeRaceBarLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  activeRaceBarName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 2,
  },
  deselectBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deselectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FCA5A5',
  },
  listContainer: {
    padding: 14,
    gap: 10,
  },
  raceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  raceCardActive: {
    borderColor: '#10B981',
    backgroundColor: '#152438',
  },
  raceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  raceTitleContainer: {
    flex: 1,
  },
  raceName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  raceDate: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '600',
  },
  activeBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  raceLocation: {
    fontSize: 13,
    color: '#CBD5E1',
    marginBottom: 10,
  },
  raceCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 10,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusTagDraft: { backgroundColor: '#334155' },
  statusTagLive: { backgroundColor: '#DC2626' },
  statusTagDone: { backgroundColor: '#065F46' },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  deleteRaceBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteRaceText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeading: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  modalCloseX: {
    fontSize: 18,
    color: '#94A3B8',
    padding: 4,
  },
  modalSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },
  presetScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  presetChip: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  presetChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  startTypeRow: {
    gap: 8,
    marginBottom: 4,
  },
  startTypeBtn: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 12,
  },
  startTypeBtnActive: {
    borderColor: '#10B981',
    backgroundColor: '#064E3B33',
  },
  startTypeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  startTypeTextActive: {
    color: '#10B981',
  },
  modalSubmitBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  modalSubmitBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
