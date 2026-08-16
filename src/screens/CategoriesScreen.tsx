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
import { Category } from '../types';
import { generateUUID } from '../utils/timeUtils';
import { triggerHaptic } from '../utils/hapticsUtils';

const COLOR_PALETTE = [
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#6366F1', // Indigo
];

export const CategoriesScreen: React.FC = () => {
  const {
    activeRace,
    categories,
    runners,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useRaceContext();

  const [showCatModal, setShowCatModal] = useState<boolean>(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // Form State
  const [catName, setCatName] = useState<string>('');
  const [catCode, setCatCode] = useState<string>('');
  const [catGender, setCatGender] = useState<'M' | 'F' | 'X' | 'ALL'>('ALL');
  const [minAge, setMinAge] = useState<string>('');
  const [maxAge, setMaxAge] = useState<string>('');
  const [offsetSecs, setOffsetSecs] = useState<string>('0');
  const [catColor, setCatColor] = useState<string>(COLOR_PALETTE[0]);

  const openAddCategory = () => {
    setEditingCatId(null);
    setCatName('');
    setCatCode('');
    setCatGender('ALL');
    setMinAge('');
    setMaxAge('');
    setOffsetSecs('0');
    setCatColor(COLOR_PALETTE[categories.length % COLOR_PALETTE.length]);
    setShowCatModal(true);
    triggerHaptic('light');
  };

  const openEditCategory = (cat: Category) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatCode(cat.code);
    setCatGender(cat.gender);
    setMinAge(cat.minAge !== null ? cat.minAge.toString() : '');
    setMaxAge(cat.maxAge !== null ? cat.maxAge.toString() : '');
    setOffsetSecs((Math.round(cat.startOffsetMs / 1000)).toString());
    setCatColor(cat.color);
    setShowCatModal(true);
    triggerHaptic('light');
  };

  const handleSaveCategory = async () => {
    if (!catName.trim()) {
      if (Platform.OS === 'web') window.alert('Category name is required.');
      else Alert.alert('Required', 'Category name is required.');
      return;
    }

    const minA = parseInt(minAge, 10);
    const maxA = parseInt(maxAge, 10);
    const offsetMs = (parseInt(offsetSecs, 10) || 0) * 1000;
    const code = catCode.trim().toUpperCase() || catName.trim().substring(0, 4).toUpperCase();

    if (editingCatId) {
      const existing = categories.find((c) => c.id === editingCatId);
      if (existing) {
        await updateCategory({
          ...existing,
          name: catName.trim(),
          code,
          gender: catGender,
          minAge: !isNaN(minA) ? minA : null,
          maxAge: !isNaN(maxA) ? maxA : null,
          startOffsetMs: offsetMs,
          color: catColor,
        });
      }
    } else {
      await addCategory({
        name: catName.trim(),
        code,
        gender: catGender,
        minAge: !isNaN(minA) ? minA : null,
        maxAge: !isNaN(maxA) ? maxA : null,
        startOffsetMs: offsetMs,
        color: catColor,
      });
    }

    setShowCatModal(false);
    triggerHaptic('success');
  };

  const handleDeleteCategory = (cat: Category) => {
    const assignedRunners = runners.filter((r) => r.categoryId === cat.id);
    const confirm = async () => {
      await deleteCategory(cat.id);
      triggerHaptic('warning');
    };

    const message =
      assignedRunners.length > 0
        ? `Warning: ${assignedRunners.length} runners are assigned to this category. Delete anyway?`
        : `Delete "${cat.name}"?`;

    if (Platform.OS === 'web') {
      if (window.confirm(message)) confirm();
    } else {
      Alert.alert('Delete Category', message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirm },
      ]);
    }
  };

  // Preset Template Appliers
  const applyStandardAgeGroupsPreset = async () => {
    if (!activeRace) return;
    const presets: Partial<Category>[] = [
      { name: 'Male Open (19-39)', code: 'M_OPEN', gender: 'M', minAge: 19, maxAge: 39, color: '#3B82F6' },
      { name: 'Female Open (19-39)', code: 'F_OPEN', gender: 'F', minAge: 19, maxAge: 39, color: '#EC4899' },
      { name: 'Male Masters (40-49)', code: 'M40', gender: 'M', minAge: 40, maxAge: 49, color: '#10B981' },
      { name: 'Female Masters (40-49)', code: 'F40', gender: 'F', minAge: 40, maxAge: 49, color: '#8B5CF6' },
      { name: 'Male Veterans (50+)', code: 'M50+', gender: 'M', minAge: 50, maxAge: 99, color: '#06B6D4' },
      { name: 'Female Veterans (50+)', code: 'F50+', gender: 'F', minAge: 50, maxAge: 99, color: '#F59E0B' },
      { name: 'Junior Boys (U18)', code: 'JB_U18', gender: 'M', minAge: 0, maxAge: 18, color: '#F97316' },
      { name: 'Junior Girls (U18)', code: 'JG_U18', gender: 'F', minAge: 0, maxAge: 18, color: '#14B8A6' },
    ];

    for (const p of presets) {
      await addCategory(p);
    }
    triggerHaptic('success');
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topTitle}>Race Categories</Text>
          <Text style={styles.topSub}>
            Define runner divisions, age groups & wave offsets
          </Text>
        </View>

        <TouchableOpacity style={styles.addCatBtn} onPress={openAddCategory}>
          <Text style={styles.addCatBtnText}>+ Add Category</Text>
        </TouchableOpacity>
      </View>

      {/* Preset Banner */}
      <View style={styles.presetBanner}>
        <Text style={styles.presetBannerTitle}>⚡ 1-Tap Category Presets:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetScroll}>
          <TouchableOpacity style={styles.presetBtn} onPress={applyStandardAgeGroupsPreset}>
            <Text style={styles.presetBtnText}>+ Standard 10-Yr Age Groups (Open, 40+, 50+, Junior)</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Categories List */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🏷️</Text>
            <Text style={styles.emptyTitle}>No categories defined</Text>
            <Text style={styles.emptySub}>
              Tap "+ Add Category" or choose a preset above to organize your runners into divisions.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const runnerCount = runners.filter((r) => r.categoryId === item.id).length;
          return (
            <View style={styles.categoryCard}>
              <View style={styles.categoryLeft}>
                <View style={[styles.colorBar, { backgroundColor: item.color }]} />

                <View style={styles.catDetails}>
                  <View style={styles.catNameRow}>
                    <Text style={styles.catName}>{item.name}</Text>
                    <View style={styles.codeTag}>
                      <Text style={styles.codeTagText}>{item.code}</Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>
                      Gender: {item.gender === 'ALL' ? 'All Genders' : item.gender}
                    </Text>
                    {(item.minAge !== null || item.maxAge !== null) && (
                      <Text style={styles.metaText}>
                        • Age: {item.minAge ?? 0} - {item.maxAge ?? '∞'}
                      </Text>
                    )}
                    {item.startOffsetMs > 0 && (
                      <Text style={styles.waveOffsetTag}>
                        • Wave Offset: +{Math.round(item.startOffsetMs / 1000)}s
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.categoryRight}>
                <View style={styles.runnerCountBadge}>
                  <Text style={styles.runnerCountNumber}>{runnerCount}</Text>
                  <Text style={styles.runnerCountLabel}>Runners</Text>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity onPress={() => openEditCategory(item)} style={styles.actionBtn}>
                    <Text style={styles.actionBtnText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteCategory(item)} style={styles.actionBtn}>
                    <Text style={styles.actionBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* ADD / EDIT CATEGORY MODAL */}
      <Modal
        visible={showCatModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCatModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>
                {editingCatId ? 'Edit Category' : 'Create Category'}
              </Text>
              <TouchableOpacity onPress={() => setShowCatModal(false)}>
                <Text style={styles.modalCloseX}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Category Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Female Masters (40+)"
                placeholderTextColor="#64748B"
                value={catName}
                onChangeText={setCatName}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Category Code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. F40"
                    placeholderTextColor="#64748B"
                    value={catCode}
                    onChangeText={setCatCode}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Wave Offset (Secs)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    value={offsetSecs}
                    onChangeText={setOffsetSecs}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Eligible Gender</Text>
              <View style={styles.genderRow}>
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'M', label: 'Male Only' },
                  { id: 'F', label: 'Female Only' },
                  { id: 'X', label: 'Non-Binary' },
                ].map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    style={[
                      styles.genderBtn,
                      catGender === g.id && styles.genderBtnActive,
                    ]}
                    onPress={() => setCatGender(g.id as any)}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        catGender === g.id && styles.genderTextActive,
                      ]}
                    >
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Min Age</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 40"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    value={minAge}
                    onChangeText={setMinAge}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Max Age</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 49"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    value={maxAge}
                    onChangeText={setMaxAge}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Color Badge</Text>
              <View style={styles.colorPaletteRow}>
                {COLOR_PALETTE.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: c },
                      catColor === c && styles.colorCircleActive,
                    ]}
                    onPress={() => setCatColor(c)}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveCategory}
              >
                <Text style={styles.modalSubmitBtnText}>
                  {editingCatId ? 'Update Category' : 'Save Category'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  topSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  addCatBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addCatBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  presetBanner: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  presetBannerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F59E0B',
    marginBottom: 6,
  },
  presetScroll: {
    gap: 8,
  },
  presetBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#60A5FA',
  },
  listContainer: {
    padding: 14,
    paddingBottom: 40,
    gap: 10,
  },
  categoryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  colorBar: {
    width: 6,
    height: 44,
    borderRadius: 3,
  },
  catDetails: {
    flex: 1,
  },
  catNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  catName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  codeTag: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  codeTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  waveOffsetTag: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '700',
  },
  categoryRight: {
    alignItems: 'flex-end',
    gap: 6,
    marginLeft: 8,
  },
  runnerCountBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  runnerCountNumber: {
    fontSize: 14,
    fontWeight: '900',
    color: '#38BDF8',
  },
  runnerCountLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    padding: 3,
  },
  actionBtnText: {
    fontSize: 13,
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 44,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 280,
    marginTop: 4,
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
    maxWidth: 400,
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
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  modalCloseX: {
    fontSize: 16,
    color: '#94A3B8',
    padding: 4,
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
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 6,
  },
  genderBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  genderBtnActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  genderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  genderTextActive: {
    color: '#FFFFFF',
  },
  colorPaletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 8,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorCircleActive: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  modalSubmitBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 18,
  },
  modalSubmitBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
