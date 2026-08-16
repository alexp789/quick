import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Runner, Category } from '../types';
import { triggerHaptic } from '../utils/hapticsUtils';

interface NumpadProps {
  runners: Runner[];
  categories: Category[];
  alreadyFinishedBibs: Set<string>;
  onSubmitBib: (bib: string) => void;
  disabled?: boolean;
}

export const Numpad: React.FC<NumpadProps> = ({
  runners,
  categories,
  alreadyFinishedBibs,
  onSubmitBib,
  disabled = false,
}) => {
  const [bibInput, setBibInput] = useState<string>('');

  const handleKeyPress = (char: string) => {
    if (disabled) return;
    triggerHaptic('light');
    if (bibInput.length < 6) {
      setBibInput((prev) => prev + char);
    }
  };

  const handleBackspace = () => {
    if (disabled) return;
    triggerHaptic('light');
    setBibInput((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled) return;
    triggerHaptic('medium');
    setBibInput('');
  };

  const handleSubmit = () => {
    if (disabled || !bibInput.trim()) return;
    const clean = bibInput.trim();
    onSubmitBib(clean);
    setBibInput('');
  };

  // Find matching runner preview
  const matchedRunner = runners.find((r) => r.bibNumber.toLowerCase() === bibInput.trim().toLowerCase());
  const matchedCategory = matchedRunner
    ? categories.find((c) => c.id === matchedRunner.categoryId)
    : null;
  const isDuplicate = bibInput ? alreadyFinishedBibs.has(bibInput.trim()) : false;

  return (
    <View style={styles.container}>
      {/* Bib Display & Runner Preview */}
      <View style={[styles.displayCard, isDuplicate && styles.displayCardWarning]}>
        <View style={styles.displayHeader}>
          <Text style={styles.displayLabel}>ENTER FINISHING BIB #</Text>
          {isDuplicate && (
            <View style={styles.warningTag}>
              <Text style={styles.warningTagText}>ALREADY FINISHED</Text>
            </View>
          )}
        </View>

        <View style={styles.inputRow}>
          <Text style={[styles.bibInputText, !bibInput && styles.placeholderText]}>
            {bibInput ? `#${bibInput}` : 'Type Bib #'}
          </Text>
          {bibInput.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearMiniBtn}>
              <Text style={styles.clearMiniText}>CLEAR</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Live Runner Preview */}
        <View style={styles.previewRow}>
          {bibInput.length > 0 ? (
            matchedRunner ? (
              <View style={styles.matchedContainer}>
                <View
                  style={[
                    styles.catDot,
                    { backgroundColor: matchedCategory?.color || '#3B82F6' },
                  ]}
                />
                <Text style={styles.matchedName} numberOfLines={1}>
                  {matchedRunner.firstName} {matchedRunner.lastName}
                </Text>
                <Text style={styles.matchedMeta}>
                  ({matchedCategory?.name || 'Category'} {matchedRunner.team ? `• ${matchedRunner.team}` : ''})
                </Text>
              </View>
            ) : (
              <Text style={styles.unregisteredText}>
                ⚠️ Bib #{bibInput} not in registration (will record as Guest)
              </Text>
            )
          ) : (
            <Text style={styles.idleHintText}>Tap number pad or use hardware scanner</Text>
          )}
        </View>
      </View>

      {/* Tactile Keypad Grid */}
      <View style={styles.keypadGrid}>
        <View style={styles.keypadRow}>
          {['1', '2', '3'].map((n) => (
            <TouchableOpacity
              key={n}
              style={styles.keyBtn}
              onPress={() => handleKeyPress(n)}
              activeOpacity={0.6}
            >
              <Text style={styles.keyText}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.keypadRow}>
          {['4', '5', '6'].map((n) => (
            <TouchableOpacity
              key={n}
              style={styles.keyBtn}
              onPress={() => handleKeyPress(n)}
              activeOpacity={0.6}
            >
              <Text style={styles.keyText}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.keypadRow}>
          {['7', '8', '9'].map((n) => (
            <TouchableOpacity
              key={n}
              style={styles.keyBtn}
              onPress={() => handleKeyPress(n)}
              activeOpacity={0.6}
            >
              <Text style={styles.keyText}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.keypadRow}>
          <TouchableOpacity
            style={[styles.keyBtn, styles.actionKeyBtn]}
            onPress={handleClear}
            activeOpacity={0.6}
          >
            <Text style={styles.actionKeyText}>CLR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.keyBtn}
            onPress={() => handleKeyPress('0')}
            activeOpacity={0.6}
          >
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.keyBtn, styles.actionKeyBtn]}
            onPress={handleBackspace}
            activeOpacity={0.6}
          >
            <Text style={styles.actionKeyText}>⌫</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Record Finish Action Button */}
      <TouchableOpacity
        style={[
          styles.submitBtn,
          (!bibInput.trim() || disabled) && styles.submitBtnDisabled,
          isDuplicate && styles.submitBtnWarning,
        ]}
        onPress={handleSubmit}
        disabled={disabled || !bibInput.trim()}
        activeOpacity={0.7}
      >
        <Text style={styles.submitBtnEmoji}>🏁</Text>
        <Text style={styles.submitBtnText}>
          {isDuplicate
            ? `RECORD SPLIT / FINISH #${bibInput}`
            : bibInput
            ? `RECORD FINISH BIB #${bibInput}`
            : 'ENTER BIB NUMBER'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  displayCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  displayCardWarning: {
    borderColor: '#F59E0B',
    backgroundColor: '#1E2238',
  },
  displayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  warningTag: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  warningTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000000',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  bibInputText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1,
  },
  placeholderText: {
    color: '#475569',
    fontSize: 22,
    fontWeight: '600',
  },
  clearMiniBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  clearMiniText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  previewRow: {
    marginTop: 4,
    minHeight: 20,
    justifyContent: 'center',
  },
  matchedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  matchedName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  matchedMeta: {
    fontSize: 12,
    color: '#94A3B8',
  },
  unregisteredText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  idleHintText: {
    fontSize: 12,
    color: '#64748B',
  },
  keypadGrid: {
    gap: 8,
    marginBottom: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 8,
  },
  keyBtn: {
    flex: 1,
    height: 54,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  keyText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  actionKeyBtn: {
    backgroundColor: '#334155',
  },
  actionKeyText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  submitBtn: {
    backgroundColor: '#10B981', // Emerald
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#334155',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnWarning: {
    backgroundColor: '#D97706',
  },
  submitBtnEmoji: {
    fontSize: 20,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
