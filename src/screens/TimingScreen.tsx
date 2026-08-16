import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useRaceContext } from '../context/RaceContext';
import { useRaceTimer } from '../hooks/useRaceTimer';
import { useRaceResults } from '../hooks/useRaceResults';
import { Numpad } from '../components/Numpad';
import { UnassignedQueue } from '../components/UnassignedQueue';
import { TimingEvent } from '../types';
import { formatElapsedTime } from '../utils/timeUtils';
import { triggerHaptic } from '../utils/hapticsUtils';

export const TimingScreen: React.FC = () => {
  const {
    activeRace,
    categories,
    runners,
    timingEvents,
    unassignedMarks,
    startRace,
    finishRace,
    resetRaceTimer,
    recordFinishBib,
    recordFastTapFinishMark,
    assignMarkToBib,
    deleteUnassignedMark,
    deleteTimingEvent,
    updateTimingEvent,
  } = useRaceContext();

  const { digitalClock, formattedTime, isRunning } = useRaceTimer(activeRace);
  const { results } = useRaceResults(activeRace, categories, runners, timingEvents);

  // Modal for editing an existing finish record
  const [editingEvent, setEditingEvent] = useState<TimingEvent | null>(null);
  const [editBibInput, setEditBibInput] = useState<string>('');
  const [editMinutesInput, setEditMinutesInput] = useState<string>('');
  const [editSecondsInput, setEditSecondsInput] = useState<string>('');
  const [editTenthsInput, setEditTenthsInput] = useState<string>('');

  // Toast feedback
  const [lastRecordedNotice, setLastRecordedNotice] = useState<string | null>(null);

  const alreadyFinishedBibs = new Set(
    timingEvents.filter((t) => t.station === 'FINISH').map((t) => t.bibNumber)
  );

  const handleStart = async () => {
    await startRace();
  };

  const handleFinishRace = () => {
    const confirm = async () => {
      await finishRace();
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Mark this race as COMPLETED?')) confirm();
    } else {
      Alert.alert('Finish Race', 'Mark this race as COMPLETED?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Complete Race', onPress: confirm },
      ]);
    }
  };

  const handleResetTimer = () => {
    const confirm = async () => {
      await resetRaceTimer();
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Reset the race clock? Existing finish records will remain saved.')) {
        confirm();
      }
    } else {
      Alert.alert(
        'Reset Race Clock',
        'Reset the race clock? Existing finish records will remain saved.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset Clock', style: 'destructive', onPress: confirm },
        ]
      );
    }
  };

  const handleSubmitBib = async (bib: string) => {
    const res = await recordFinishBib(bib);
    if (res.success) {
      setLastRecordedNotice(res.message);
      setTimeout(() => setLastRecordedNotice(null), 3500);
    }
  };

  const handleOpenEditEvent = (event: TimingEvent) => {
    setEditingEvent(event);
    setEditBibInput(event.bibNumber);

    const totalSecs = Math.floor(event.elapsedTimeMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const tenths = Math.floor((event.elapsedTimeMs % 1000) / 100);

    setEditMinutesInput(mins.toString());
    setEditSecondsInput(secs.toString().padStart(2, '0'));
    setEditTenthsInput(tenths.toString());
  };

  const handleSaveEditEvent = async () => {
    if (!editingEvent || !editBibInput.trim()) return;

    const mins = parseInt(editMinutesInput, 10) || 0;
    const secs = parseInt(editSecondsInput, 10) || 0;
    const tenths = parseInt(editTenthsInput, 10) || 0;
    const newElapsedMs = (mins * 60 + secs) * 1000 + tenths * 100;

    await updateTimingEvent(editingEvent.id, editBibInput.trim(), newElapsedMs);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    const confirm = async () => {
      await deleteTimingEvent(eventId);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Delete this finish record?')) confirm();
    } else {
      Alert.alert('Delete Finish Record', 'Delete this finish record?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirm },
      ]);
    }
  };

  // Recent finish events sorted latest first
  const recentFinishes = [...timingEvents]
    .filter((t) => t.station === 'FINISH')
    .sort((a, b) => b.timestampMs - a.timestampMs);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* GIANT RACE DIGITAL CLOCK */}
      <View style={[styles.clockCard, isRunning && styles.clockCardRunning]}>
        <View style={styles.clockHeader}>
          <View style={styles.clockStatusTag}>
            <Text style={styles.clockStatusText}>
              {activeRace?.status === 'in_progress'
                ? '● GUN CLOCK RUNNING'
                : activeRace?.status === 'completed'
                ? 'OFFICIAL FINAL TIME'
                : 'READY TO START'}
            </Text>
          </View>
          <Text style={styles.clockDistTag}>{activeRace?.distanceLabel || '5K'}</Text>
        </View>

        {/* Digital Time Numbers */}
        <View style={styles.digitalDigitsRow}>
          {digitalClock.hasHours && (
            <>
              <Text style={styles.digitNumber}>{digitalClock.hours}</Text>
              <Text style={styles.digitColon}>:</Text>
            </>
          )}
          <Text style={styles.digitNumber}>{digitalClock.minutes}</Text>
          <Text style={styles.digitColon}>:</Text>
          <Text style={styles.digitNumber}>{digitalClock.seconds}</Text>
          <Text style={styles.digitDot}>.</Text>
          <Text style={styles.digitTenths}>{digitalClock.tenths}</Text>
        </View>

        {/* Gun Controls */}
        <View style={styles.controlsRow}>
          {activeRace?.status !== 'in_progress' ? (
            <TouchableOpacity
              style={styles.startGunBtn}
              onPress={handleStart}
              activeOpacity={0.7}
            >
              <Text style={styles.startGunEmoji}>🚀</Text>
              <Text style={styles.startGunText}>
                {activeRace?.status === 'completed' ? 'RE-START GUN' : 'FIRE GUN START'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.finishRaceBtn}
              onPress={handleFinishRace}
              activeOpacity={0.7}
            >
              <Text style={styles.finishRaceEmoji}>⏹</Text>
              <Text style={styles.finishRaceText}>COMPLETE RACE</Text>
            </TouchableOpacity>
          )}

          {activeRace?.startTimeMs && (
            <TouchableOpacity
              style={styles.resetClockBtn}
              onPress={handleResetTimer}
              activeOpacity={0.7}
            >
              <Text style={styles.resetClockText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Confirmation Toast */}
      {lastRecordedNotice && (
        <View style={styles.toastNotice}>
          <Text style={styles.toastNoticeEmoji}>✅</Text>
          <Text style={styles.toastNoticeText}>{lastRecordedNotice}</Text>
        </View>
      )}

      {/* FAST-TAP SPLIT ARRIVAL QUEUE */}
      <UnassignedQueue
        marks={unassignedMarks}
        onTapFastFinish={recordFastTapFinishMark}
        onAssignBib={assignMarkToBib}
        onDeleteMark={deleteUnassignedMark}
      />

      {/* RAPID BIB NUMPAD */}
      <View style={styles.numpadSection}>
        <Numpad
          runners={runners}
          categories={categories}
          alreadyFinishedBibs={alreadyFinishedBibs}
          onSubmitBib={handleSubmitBib}
        />
      </View>

      {/* LIVE RECENT FINISHES LOG */}
      <View style={styles.recentSection}>
        <View style={styles.recentSectionHeader}>
          <Text style={styles.recentSectionTitle}>
            ⏱️ Recent Finishes ({recentFinishes.length})
          </Text>
          <Text style={styles.recentSectionSub}>Latest recorded crossings</Text>
        </View>

        {recentFinishes.length === 0 ? (
          <View style={styles.emptyRecentBox}>
            <Text style={styles.emptyRecentText}>
              No runners have crossed the finish line yet.
            </Text>
            <Text style={styles.emptyRecentSub}>
              Type a bib on the numpad or tap "Fast-Tap" as runners cross!
            </Text>
          </View>
        ) : (
          recentFinishes.map((item, index) => {
            const runner = runners.find((r) => r.bibNumber === item.bibNumber);
            const category = runner
              ? categories.find((c) => c.id === runner.categoryId)
              : null;
            const res = results.find((r) => r.bibNumber === item.bibNumber);

            return (
              <View key={item.id} style={styles.recentItem}>
                <View style={styles.recentLeft}>
                  <View style={styles.recentRankBadge}>
                    <Text style={styles.recentRankText}>
                      {res?.rank ? `#${res.rank}` : index + 1}
                    </Text>
                  </View>

                  <View style={styles.recentInfo}>
                    <View style={styles.recentBibRow}>
                      <Text style={styles.recentBibNumber}>Bib #{item.bibNumber}</Text>
                      {category && (
                        <View
                          style={[
                            styles.catBadge,
                            { backgroundColor: `${category.color}33` },
                          ]}
                        >
                          <Text style={[styles.catBadgeText, { color: category.color }]}>
                            {category.name}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.recentRunnerName}>
                      {runner ? `${runner.firstName} ${runner.lastName}` : 'Guest Runner'}
                      {runner?.team ? ` • ${runner.team}` : ''}
                    </Text>
                  </View>
                </View>

                <View style={styles.recentRight}>
                  <Text style={styles.recentTimeText}>
                    {formatElapsedTime(item.elapsedTimeMs)}
                  </Text>
                  <View style={styles.recentActionsRow}>
                    <TouchableOpacity
                      onPress={() => handleOpenEditEvent(item)}
                      style={styles.actionIconBtn}
                    >
                      <Text style={styles.actionIconText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteEvent(item.id)}
                      style={styles.actionIconBtn}
                    >
                      <Text style={styles.actionIconText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* EDIT FINISH RECORD MODAL */}
      <Modal
        visible={editingEvent !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingEvent(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeading}>Edit Finish Record</Text>
            <Text style={styles.modalSub}>Adjust bib number or finish time</Text>

            <Text style={styles.fieldLabel}>Bib Number</Text>
            <TextInput
              style={styles.modalInput}
              value={editBibInput}
              onChangeText={setEditBibInput}
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>Finish Elapsed Time (Min : Sec . Tenths)</Text>
            <View style={styles.timeInputsRow}>
              <TextInput
                style={[styles.modalInput, styles.timeInputBox]}
                placeholder="MM"
                placeholderTextColor="#64748B"
                value={editMinutesInput}
                onChangeText={setEditMinutesInput}
                keyboardType="numeric"
              />
              <Text style={styles.timeColon}>:</Text>
              <TextInput
                style={[styles.modalInput, styles.timeInputBox]}
                placeholder="SS"
                placeholderTextColor="#64748B"
                value={editSecondsInput}
                onChangeText={setEditSecondsInput}
                keyboardType="numeric"
              />
              <Text style={styles.timeColon}>.</Text>
              <TextInput
                style={[styles.modalInput, styles.tenthsInputBox]}
                placeholder="T"
                placeholderTextColor="#64748B"
                value={editTenthsInput}
                onChangeText={setEditTenthsInput}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditingEvent(null)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveEditEvent}
              >
                <Text style={styles.modalSaveBtnText}>Save Adjustments</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1D',
  },
  contentContainer: {
    padding: 14,
    paddingBottom: 40,
  },
  clockCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    borderWidth: 2,
    borderColor: '#334155',
    marginBottom: 10,
    alignItems: 'center',
  },
  clockCardRunning: {
    borderColor: '#10B981',
    backgroundColor: '#0F1E2E',
  },
  clockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
    alignItems: 'center',
  },
  clockStatusTag: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  clockStatusText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  clockDistTag: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
  },
  digitalDigitsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 4,
  },
  digitNumber: {
    fontSize: 48,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  digitColon: {
    fontSize: 40,
    fontWeight: '900',
    color: '#64748B',
    marginHorizontal: 2,
  },
  digitDot: {
    fontSize: 32,
    fontWeight: '900',
    color: '#64748B',
  },
  digitTenths: {
    fontSize: 32,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '900',
    color: '#10B981',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    width: '100%',
  },
  startGunBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startGunEmoji: {
    fontSize: 18,
  },
  startGunText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  finishRaceBtn: {
    flex: 1,
    backgroundColor: '#DC2626',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  finishRaceEmoji: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  finishRaceText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  resetClockBtn: {
    backgroundColor: '#334155',
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetClockText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  toastNotice: {
    backgroundColor: '#064E3B',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  toastNoticeEmoji: {
    fontSize: 16,
  },
  toastNoticeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ECFDF5',
  },
  numpadSection: {
    marginVertical: 6,
  },
  recentSection: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  recentSectionHeader: {
    marginBottom: 12,
  },
  recentSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  recentSectionSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  emptyRecentBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyRecentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  emptyRecentSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  recentItem: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  recentRankBadge: {
    backgroundColor: '#1E293B',
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentRankText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F59E0B',
  },
  recentInfo: {
    flex: 1,
  },
  recentBibRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentBibNumber: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  catBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  catBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  recentRunnerName: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 1,
  },
  recentRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  recentTimeText: {
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '900',
    color: '#10B981',
  },
  recentActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionIconBtn: {
    padding: 2,
  },
  actionIconText: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
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
  modalHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  timeInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  timeInputBox: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  tenthsInputBox: {
    width: 50,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  timeColon: {
    fontSize: 18,
    fontWeight: '900',
    color: '#64748B',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#334155',
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
