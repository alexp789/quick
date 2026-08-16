import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { UnassignedFinishMark } from '../types';
import { formatElapsedTime } from '../utils/timeUtils';
import { triggerHaptic } from '../utils/hapticsUtils';

interface UnassignedQueueProps {
  marks: UnassignedFinishMark[];
  onTapFastFinish: () => void;
  onAssignBib: (markId: string, bib: string) => Promise<boolean>;
  onDeleteMark: (markId: string) => void;
  disabled?: boolean;
}

export const UnassignedQueue: React.FC<UnassignedQueueProps> = ({
  marks,
  onTapFastFinish,
  onAssignBib,
  onDeleteMark,
  disabled = false,
}) => {
  const [selectedMark, setSelectedMark] = useState<UnassignedFinishMark | null>(null);
  const [assignBibInput, setAssignBibInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleOpenAssign = (mark: UnassignedFinishMark) => {
    setSelectedMark(mark);
    setAssignBibInput('');
    triggerHaptic('light');
  };

  const handleConfirmAssign = async () => {
    if (!selectedMark || !assignBibInput.trim()) return;
    setIsSubmitting(true);
    try {
      const ok = await onAssignBib(selectedMark.id, assignBibInput.trim());
      if (ok) {
        setSelectedMark(null);
        setAssignBibInput('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Fast-Tap Trigger Button */}
      <TouchableOpacity
        style={[styles.fastTapBtn, disabled && styles.fastTapBtnDisabled]}
        onPress={() => {
          if (!disabled) onTapFastFinish();
        }}
        activeOpacity={0.6}
        disabled={disabled}
      >
        <View style={styles.fastTapLeft}>
          <Text style={styles.lightningIcon}>⚡</Text>
          <View>
            <Text style={styles.fastTapTitle}>FAST-TAP FINISH MARK</Text>
            <Text style={styles.fastTapSub}>Tap for crowd arrival • Assign bibs after</Text>
          </View>
        </View>
        <View style={styles.queueCountBadge}>
          <Text style={styles.queueCountText}>{marks.length} PENDING</Text>
        </View>
      </TouchableOpacity>

      {/* Pending Queue List */}
      {marks.length > 0 && (
        <View style={styles.queueCard}>
          <Text style={styles.queueHeader}>
            UNASSIGNED FINISH TIMESTAMPS ({marks.length})
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.queueScroll}
          >
            {marks.map((m, index) => (
              <TouchableOpacity
                key={m.id}
                style={styles.markItem}
                onPress={() => handleOpenAssign(m)}
                activeOpacity={0.7}
              >
                <View style={styles.markItemHeader}>
                  <Text style={styles.markIndex}>#{index + 1}</Text>
                  <TouchableOpacity
                    onPress={() => onDeleteMark(m.id)}
                    style={styles.deleteMiniBtn}
                  >
                    <Text style={styles.deleteMiniText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.markTime}>{formatElapsedTime(m.elapsedTimeMs)}</Text>
                <View style={styles.assignChip}>
                  <Text style={styles.assignChipText}>ASSIGN BIB →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Assign Bib Modal Dialog */}
      <Modal
        visible={selectedMark !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMark(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Assign Finish Timestamp</Text>
            <Text style={styles.modalTimeDisplay}>
              {selectedMark ? formatElapsedTime(selectedMark.elapsedTimeMs) : ''}
            </Text>
            <Text style={styles.modalSub}>
              Enter the bib number of the runner who crossed at this time:
            </Text>

            <TextInput
              style={styles.bibTextInput}
              placeholder="e.g. 104"
              placeholderTextColor="#64748B"
              keyboardType="numeric"
              autoFocus
              value={assignBibInput}
              onChangeText={setAssignBibInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSelectedMark(null)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, !assignBibInput.trim() && styles.saveBtnDisabled]}
                onPress={handleConfirmAssign}
                disabled={!assignBibInput.trim() || isSubmitting}
              >
                <Text style={styles.saveBtnText}>Confirm Bib</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  fastTapBtn: {
    backgroundColor: '#3B82F6', // Vibrant Blue
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  fastTapBtnDisabled: {
    backgroundColor: '#334155',
    shadowOpacity: 0,
    elevation: 0,
  },
  fastTapLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lightningIcon: {
    fontSize: 24,
  },
  fastTapTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  fastTapSub: {
    fontSize: 11,
    color: '#BFDBFE',
    marginTop: 1,
  },
  queueCountBadge: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  queueCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  queueCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  queueHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  queueScroll: {
    gap: 8,
  },
  markItem: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 10,
    width: 125,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  markItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  markIndex: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3B82F6',
  },
  deleteMiniBtn: {
    padding: 2,
  },
  deleteMiniText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  markTime: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  assignChip: {
    backgroundColor: '#1E293B',
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  assignChipText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#60A5FA',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  modalTimeDisplay: {
    fontSize: 28,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '900',
    color: '#10B981',
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 16,
  },
  bibTextInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    borderRadius: 10,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  saveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#475569',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
