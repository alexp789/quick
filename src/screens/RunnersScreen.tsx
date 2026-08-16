import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useRaceContext } from '../context/RaceContext';
import { Runner, RunnerGender, RunnerStatus } from '../types';
import { RunnerCard } from '../components/RunnerCard';
import { parseRunnersCSV, generateRunnersTemplateCSV } from '../utils/exportUtils';
import { triggerHaptic } from '../utils/hapticsUtils';

export const RunnersScreen: React.FC = () => {
  const {
    activeRace,
    categories,
    runners,
    addRunner,
    updateRunner,
    deleteRunner,
    importRunners,
    setRunnerStatus,
  } = useRaceContext();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Add / Edit Modal State
  const [showRunnerModal, setShowRunnerModal] = useState<boolean>(false);
  const [editingRunnerId, setEditingRunnerId] = useState<string | null>(null);
  const [bibInput, setBibInput] = useState<string>('');
  const [firstNameInput, setFirstNameInput] = useState<string>('');
  const [lastNameInput, setLastNameInput] = useState<string>('');
  const [genderInput, setGenderInput] = useState<RunnerGender>('M');
  const [ageInput, setAgeInput] = useState<string>('');
  const [categoryIdInput, setCategoryIdInput] = useState<string>('');
  const [teamInput, setTeamInput] = useState<string>('');
  const [emergencyNameInput, setEmergencyNameInput] = useState<string>('');
  const [emergencyPhoneInput, setEmergencyPhoneInput] = useState<string>('');

  // Bulk Import Modal State
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [csvTextInput, setCsvTextInput] = useState<string>('');
  const [importSummary, setImportSummary] = useState<string | null>(null);

  // Filter Runners
  const filteredRunners = runners.filter((r) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      r.bibNumber.toLowerCase().includes(query) ||
      r.firstName.toLowerCase().includes(query) ||
      r.lastName.toLowerCase().includes(query) ||
      (r.team && r.team.toLowerCase().includes(query));

    const matchesCategory =
      selectedCatFilter === 'ALL' || r.categoryId === selectedCatFilter;

    const matchesStatus =
      selectedStatusFilter === 'ALL' || r.status === selectedStatusFilter;

    return matchesQuery && matchesCategory && matchesStatus;
  });

  const openAddRunnerModal = () => {
    setEditingRunnerId(null);
    // Auto-generate next bib number
    const maxBib = runners.reduce((max, r) => {
      const num = parseInt(r.bibNumber, 10);
      return !isNaN(num) && num > max ? num : max;
    }, 100);

    setBibInput((maxBib + 1).toString());
    setFirstNameInput('');
    setLastNameInput('');
    setGenderInput('M');
    setAgeInput('');
    setCategoryIdInput(categories[0]?.id || '');
    setTeamInput('');
    setEmergencyNameInput('');
    setEmergencyPhoneInput('');
    setShowRunnerModal(true);
    triggerHaptic('light');
  };

  const openEditRunnerModal = (runner: Runner) => {
    setEditingRunnerId(runner.id);
    setBibInput(runner.bibNumber);
    setFirstNameInput(runner.firstName);
    setLastNameInput(runner.lastName);
    setGenderInput(runner.gender);
    setAgeInput(runner.age ? runner.age.toString() : '');
    setCategoryIdInput(runner.categoryId);
    setTeamInput(runner.team || '');
    setEmergencyNameInput(runner.emergencyContactName || '');
    setEmergencyPhoneInput(runner.emergencyContactPhone || '');
    setShowRunnerModal(true);
    triggerHaptic('light');
  };

  // Auto category matcher based on age and gender
  const autoMatchCategory = (age: number | null, gender: RunnerGender) => {
    if (age === null) return;
    const matched = categories.find((c) => {
      const matchGender = c.gender === 'ALL' || c.gender === gender;
      const minOk = c.minAge === null || age >= c.minAge;
      const maxOk = c.maxAge === null || age <= c.maxAge;
      return matchGender && minOk && maxOk;
    });
    if (matched) {
      setCategoryIdInput(matched.id);
    }
  };

  const handleAgeChange = (text: string) => {
    setAgeInput(text);
    const ageNum = parseInt(text, 10);
    if (!isNaN(ageNum)) {
      autoMatchCategory(ageNum, genderInput);
    }
  };

  const handleGenderChange = (g: RunnerGender) => {
    setGenderInput(g);
    const ageNum = parseInt(ageInput, 10);
    if (!isNaN(ageNum)) {
      autoMatchCategory(ageNum, g);
    }
  };

  const handleSaveRunner = async () => {
    if (!bibInput.trim()) {
      if (Platform.OS === 'web') window.alert('Bib number is required.');
      else Alert.alert('Required', 'Bib number is required.');
      return;
    }

    if (!firstNameInput.trim()) {
      if (Platform.OS === 'web') window.alert('First name is required.');
      else Alert.alert('Required', 'First name is required.');
      return;
    }

    const ageNum = parseInt(ageInput, 10);

    if (editingRunnerId) {
      const existing = runners.find((r) => r.id === editingRunnerId);
      if (existing) {
        await updateRunner({
          ...existing,
          bibNumber: bibInput.trim(),
          firstName: firstNameInput.trim(),
          lastName: lastNameInput.trim(),
          gender: genderInput,
          age: !isNaN(ageNum) ? ageNum : null,
          categoryId: categoryIdInput || categories[0]?.id || 'unknown',
          team: teamInput.trim(),
          emergencyContactName: emergencyNameInput.trim(),
          emergencyContactPhone: emergencyPhoneInput.trim(),
        });
      }
    } else {
      await addRunner({
        bibNumber: bibInput.trim(),
        firstName: firstNameInput.trim(),
        lastName: lastNameInput.trim(),
        gender: genderInput,
        age: !isNaN(ageNum) ? ageNum : null,
        categoryId: categoryIdInput || categories[0]?.id || 'unknown',
        team: teamInput.trim(),
        emergencyContactName: emergencyNameInput.trim(),
        emergencyContactPhone: emergencyPhoneInput.trim(),
      });
    }

    setShowRunnerModal(false);
    triggerHaptic('success');
  };

  const handleDeleteRunner = (runnerId: string) => {
    const runner = runners.find((r) => r.id === runnerId);
    const confirm = async () => {
      await deleteRunner(runnerId);
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Delete runner #${runner?.bibNumber} (${runner?.firstName} ${runner?.lastName})?`)) {
        confirm();
      }
    } else {
      Alert.alert(
        'Delete Runner',
        `Delete runner #${runner?.bibNumber} (${runner?.firstName} ${runner?.lastName})?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: confirm },
        ]
      );
    }
  };

  const handleToggleStatus = async (runner: Runner) => {
    const statusCycle: RunnerStatus[] = ['registered', 'finished', 'dnf', 'dns'];
    const currentIdx = statusCycle.indexOf(runner.status);
    const nextStatus = statusCycle[(currentIdx + 1) % statusCycle.length];
    await setRunnerStatus(runner.id, nextStatus);
    triggerHaptic('light');
  };

  const handleBulkImportCSV = async () => {
    if (!csvTextInput.trim() || !activeRace) return;
    const { runners: parsed, errors } = parseRunnersCSV(csvTextInput, activeRace.id, categories);

    if (errors.length > 0 && parsed.length === 0) {
      setImportSummary(`Errors encountered:\n${errors.join('\n')}`);
      return;
    }

    const { addedCount, updatedCount } = await importRunners(parsed);
    setImportSummary(
      `Successfully imported: ${addedCount} added, ${updatedCount} updated.${
        errors.length > 0 ? `\n\nWarnings:\n${errors.join('\n')}` : ''
      }`
    );
    setCsvTextInput('');
    triggerHaptic('success');
  };

  const handleLoadTemplate = () => {
    setCsvTextInput(generateRunnersTemplateCSV());
  };

  return (
    <View style={styles.container}>
      {/* Search & Top Action Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Bib, Name, or Club..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.addBtn} onPress={openAddRunnerModal}>
            <Text style={styles.addBtnText}>+ Enroll Runner</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bulkBtn}
            onPress={() => {
              setShowImportModal(true);
              setImportSummary(null);
            }}
          >
            <Text style={styles.bulkBtnText}>📥 Bulk CSV</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Category Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        <TouchableOpacity
          style={[styles.filterChip, selectedCatFilter === 'ALL' && styles.filterChipActive]}
          onPress={() => setSelectedCatFilter('ALL')}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedCatFilter === 'ALL' && styles.filterChipTextActive,
            ]}
          >
            All Categories ({runners.length})
          </Text>
        </TouchableOpacity>

        {categories.map((c) => {
          const count = runners.filter((r) => r.categoryId === c.id).length;
          return (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.filterChip,
                selectedCatFilter === c.id && { backgroundColor: c.color, borderColor: c.color },
              ]}
              onPress={() => setSelectedCatFilter(c.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCatFilter === c.id && styles.filterChipTextActive,
                ]}
              >
                {c.name} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Runner Cards List */}
      <FlatList
        data={filteredRunners}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🏃‍♀️</Text>
            <Text style={styles.emptyTitle}>No runners found</Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? 'Try a different search term or category filter.'
                : 'Enroll runners using the "+ Enroll Runner" or "Bulk CSV" button.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const category = categories.find((c) => c.id === item.categoryId) || null;
          return (
            <RunnerCard
              runner={item}
              category={category}
              onEdit={openEditRunnerModal}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDeleteRunner}
            />
          );
        }}
      />

      {/* ADD / EDIT RUNNER MODAL */}
      <Modal
        visible={showRunnerModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRunnerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>
                {editingRunnerId ? 'Edit Runner' : 'Enroll Runner'}
              </Text>
              <TouchableOpacity onPress={() => setShowRunnerModal(false)}>
                <Text style={styles.modalCloseX}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Bib # *</Text>
                  <TextInput
                    style={[styles.input, styles.bibInputBig]}
                    placeholder="101"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    value={bibInput}
                    onChangeText={setBibInput}
                  />
                </View>

                <View style={{ flex: 2 }}>
                  <Text style={styles.fieldLabel}>Gender</Text>
                  <View style={styles.genderRow}>
                    {(['M', 'F', 'X'] as RunnerGender[]).map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[
                          styles.genderBtn,
                          genderInput === g && styles.genderBtnActive,
                        ]}
                        onPress={() => handleGenderChange(g)}
                      >
                        <Text
                          style={[
                            styles.genderText,
                            genderInput === g && styles.genderTextActive,
                          ]}
                        >
                          {g === 'M' ? 'Male' : g === 'F' ? 'Female' : 'Non-Binary'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>First Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Jane"
                    placeholderTextColor="#64748B"
                    value={firstNameInput}
                    onChangeText={setFirstNameInput}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Last Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Doe"
                    placeholderTextColor="#64748B"
                    value={lastNameInput}
                    onChangeText={setLastNameInput}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Age</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="28"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    value={ageInput}
                    onChangeText={handleAgeChange}
                  />
                </View>

                <View style={{ flex: 2 }}>
                  <Text style={styles.fieldLabel}>Running Club / Team</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. City Striders"
                    placeholderTextColor="#64748B"
                    value={teamInput}
                    onChangeText={setTeamInput}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryPickerRow}
              >
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.categoryChoiceChip,
                      categoryIdInput === c.id && {
                        backgroundColor: c.color,
                        borderColor: c.color,
                      },
                    ]}
                    onPress={() => setCategoryIdInput(c.id)}
                  >
                    <Text
                      style={[
                        styles.categoryChoiceText,
                        categoryIdInput === c.id && { color: '#FFFFFF' },
                      ]}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>Emergency Contact (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Contact Name"
                placeholderTextColor="#64748B"
                value={emergencyNameInput}
                onChangeText={setEmergencyNameInput}
              />
              <TextInput
                style={[styles.input, { marginTop: 6 }]}
                placeholder="Contact Phone #"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
                value={emergencyPhoneInput}
                onChangeText={setEmergencyPhoneInput}
              />

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveRunner}
              >
                <Text style={styles.modalSubmitBtnText}>
                  {editingRunnerId ? 'Update Runner' : 'Enroll Runner'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* BULK CSV IMPORT MODAL */}
      <Modal
        visible={showImportModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>Bulk Runner Import (CSV)</Text>
              <TouchableOpacity onPress={() => setShowImportModal(false)}>
                <Text style={styles.modalCloseX}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.templateRow}>
              <Text style={styles.modalSub}>
                Paste comma-separated rows (Bib, Name, Gender, Age, Team...)
              </Text>
              <TouchableOpacity onPress={handleLoadTemplate}>
                <Text style={styles.templateLink}>Load Template</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, styles.csvInputBox]}
              placeholder="101, John, Doe, M, 28, M_OPEN, City Striders&#10;102, Jane, Smith, F, 32, F_OPEN, Track Club"
              placeholderTextColor="#64748B"
              multiline
              value={csvTextInput}
              onChangeText={setCsvTextInput}
            />

            {importSummary && (
              <View style={styles.importSummaryBox}>
                <Text style={styles.importSummaryText}>{importSummary}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.modalSubmitBtn, !csvTextInput.trim() && { opacity: 0.5 }]}
              onPress={handleBulkImportCSV}
              disabled={!csvTextInput.trim()}
            >
              <Text style={styles.modalSubmitBtnText}>Import Runners</Text>
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
  topBar: {
    padding: 14,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    gap: 10,
  },
  searchBox: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  searchClear: {
    fontSize: 14,
    color: '#94A3B8',
    padding: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addBtn: {
    flex: 2,
    backgroundColor: '#10B981',
    borderRadius: 10,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bulkBtn: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 10,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulkBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  filterScroll: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 14,
    paddingBottom: 40,
  },
  emptyBox: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 280,
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
    marginBottom: 14,
  },
  modalHeading: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  modalCloseX: {
    fontSize: 18,
    color: '#94A3B8',
    padding: 4,
  },
  modalSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 10,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#FFFFFF',
    fontSize: 14,
  },
  bibInputBig: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#10B981',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 4,
  },
  genderBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  genderBtnActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  genderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  genderTextActive: {
    color: '#FFFFFF',
  },
  categoryPickerRow: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryChoiceChip: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  categoryChoiceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  templateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
  csvInputBox: {
    height: 140,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  },
  importSummaryBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  importSummaryText: {
    fontSize: 12,
    color: '#10B981',
    lineHeight: 16,
  },
  modalSubmitBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  modalSubmitBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
