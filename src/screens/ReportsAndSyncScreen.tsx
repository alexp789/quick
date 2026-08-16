import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useRaceContext } from '../context/RaceContext';
import { useRaceResults } from '../hooks/useRaceResults';
import { printOrSharePDF, exportAndShareCSV } from '../utils/exportUtils';
import { db } from '../storage/database';
import { MutationRecord } from '../types';
import { triggerHaptic } from '../utils/hapticsUtils';

export const ReportsAndSyncScreen: React.FC = () => {
  const {
    activeRace,
    categories,
    runners,
    timingEvents,
    activeDeviceId,
    exportRaceBackup,
  } = useRaceContext();

  const { results, statistics } = useRaceResults(
    activeRace,
    categories,
    runners,
    timingEvents
  );

  const [pendingMutations, setPendingMutations] = useState<MutationRecord[]>([]);
  const [showArchSpec, setShowArchSpec] = useState<boolean>(false);
  const [serverUrl, setServerUrl] = useState<string>('https://api.runningrace.local/v1');
  const [exportJsonPreview, setExportJsonPreview] = useState<string | null>(null);

  useEffect(() => {
    db.getPendingMutations().then(setPendingMutations);
  }, [timingEvents.length, runners.length]);

  const handlePrintPDF = async () => {
    if (!activeRace) return;
    triggerHaptic('medium');
    await printOrSharePDF(activeRace, results, categories, statistics);
  };

  const handleExportCSV = async () => {
    if (!activeRace) return;
    triggerHaptic('medium');
    await exportAndShareCSV(activeRace, results);
  };

  const handleExportBackup = async () => {
    const backup = await exportRaceBackup();
    if (!backup) return;
    const jsonStr = JSON.stringify(backup, null, 2);
    setExportJsonPreview(jsonStr);
    triggerHaptic('success');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* SECTION 1: EXPORTS & REPORTS */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>📄 Official Reports & Exports</Text>
        <Text style={styles.sectionSub}>
          Generate verified results, printable certificates, and spreadsheet exports
        </Text>

        <View style={styles.buttonGrid}>
          <TouchableOpacity style={styles.actionCardBtn} onPress={handlePrintPDF}>
            <View style={[styles.iconCircle, { backgroundColor: '#3B82F622' }]}>
              <Text style={styles.iconEmoji}>🖨️</Text>
            </View>
            <View style={styles.actionCardTexts}>
              <Text style={styles.actionCardTitle}>Print / Share PDF Report</Text>
              <Text style={styles.actionCardDesc}>
                Official branded results sheet with podium winners and category divisions
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCardBtn} onPress={handleExportCSV}>
            <View style={[styles.iconCircle, { backgroundColor: '#10B98122' }]}>
              <Text style={styles.iconEmoji}>📊</Text>
            </View>
            <View style={styles.actionCardTexts}>
              <Text style={styles.actionCardTitle}>Export Results CSV</Text>
              <Text style={styles.actionCardDesc}>
                Full breakdown with gun time, net time, pace, and ranks for Excel/athletic databases
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCardBtn} onPress={handleExportBackup}>
            <View style={[styles.iconCircle, { backgroundColor: '#F59E0B22' }]}>
              <Text style={styles.iconEmoji}>💾</Text>
            </View>
            <View style={styles.actionCardTexts}>
              <Text style={styles.actionCardTitle}>Export Full Race Backup (.json)</Text>
              <Text style={styles.actionCardDesc}>
                Complete offline race package to transfer to other devices
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {exportJsonPreview && (
          <View style={styles.jsonPreviewBox}>
            <View style={styles.jsonPreviewHeader}>
              <Text style={styles.jsonPreviewTitle}>📋 Race JSON Package</Text>
              <TouchableOpacity onPress={() => setExportJsonPreview(null)}>
                <Text style={styles.jsonCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.jsonInput}
              value={exportJsonPreview}
              multiline
              editable={false}
            />
          </View>
        )}
      </View>

      {/* SECTION 2: MULTI-MARSHAL SERVER & DEVICE SYNC ARCHITECTURE */}
      <View style={styles.sectionCard}>
        <View style={styles.syncHeaderRow}>
          <View>
            <Text style={styles.sectionHeading}>🌐 Multi-Marshal Sync Architecture</Text>
            <Text style={styles.sectionSub}>
              Designed for simultaneous multi-device race coordination
            </Text>
          </View>
          <View style={styles.deviceBadge}>
            <Text style={styles.deviceBadgeText}>ID: {activeDeviceId}</Text>
          </View>
        </View>

        {/* Sync Status Banner */}
        <View style={styles.syncStatusCard}>
          <View style={styles.syncStatusLeft}>
            <View style={styles.greenPulseDot} />
            <View>
              <Text style={styles.syncStatusTitle}>Local-First Offline Engine Active</Text>
              <Text style={styles.syncStatusSub}>
                100% of data is stored securely on device with event-sourcing & versioning
              </Text>
            </View>
          </View>
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>
              {pendingMutations.length} Pending Mutations
            </Text>
          </View>
        </View>

        {/* Station Roles Grid */}
        <Text style={styles.subSectionTitle}>👥 Multi-Device Station Roles</Text>
        <View style={styles.rolesGrid}>
          <View style={styles.roleCard}>
            <Text style={styles.roleIcon}>🚀</Text>
            <Text style={styles.roleName}>Starter Station</Text>
            <Text style={styles.roleDesc}>
              Fires gun start timestamp & broadcasts wave offsets to timers
            </Text>
          </View>

          <View style={styles.roleCard}>
            <Text style={styles.roleIcon}>🏁</Text>
            <Text style={styles.roleName}>Finish Marshal</Text>
            <Text style={styles.roleDesc}>
              Captures bib numbers and fast-tap split times as runners cross line
            </Text>
          </View>

          <View style={styles.roleCard}>
            <Text style={styles.roleIcon}>📋</Text>
            <Text style={styles.roleName}>Registration Desk</Text>
            <Text style={styles.roleDesc}>
              Enrolls late runners and assigns bib numbers in real-time
            </Text>
          </View>

          <View style={styles.roleCard}>
            <Text style={styles.roleIcon}>📺</Text>
            <Text style={styles.roleName}>Live Kiosk Display</Text>
            <Text style={styles.roleDesc}>
              Streams live leaderboard updates to spectators and participants
            </Text>
          </View>
        </View>

        {/* Sync Protocol & API Contract Drawer */}
        <TouchableOpacity
          style={styles.specToggleBtn}
          onPress={() => setShowArchSpec(!showArchSpec)}
        >
          <Text style={styles.specToggleText}>
            {showArchSpec ? '▼ Hide Server Sync Contract & API Blueprint' : '▶ View Server Sync Contract & API Blueprint'}
          </Text>
        </TouchableOpacity>

        {showArchSpec && (
          <View style={styles.specContentBox}>
            <Text style={styles.specHeading}>📡 Conflict-Free REST & WebSocket Protocol</Text>
            <Text style={styles.specParagraph}>
              The application uses an append-only <Text style={styles.specBold}>Mutation Log</Text> model.
              Every race action (runner enrollment, gun fire, bib finish crossing, category change) creates an immutable mutation record with monotonic timestamp, UUID, and device identifier.
            </Text>

            <Text style={styles.specCodeTitle}>REST Push/Pull Endpoints:</Text>
            <View style={styles.codeSnippet}>
              <Text style={styles.codeSnippetText}>
                {`POST /api/v1/races/{raceId}/sync/push
Payload: {
  deviceId: "${activeDeviceId}",
  mutations: [
    { id: "uuid", entityType: "timing_event", action: "INSERT", payload: {...}, timestampMs: 1771278900000 }
  ]
}

GET /api/v1/races/{raceId}/sync/pull?sinceTimestamp=1771278800000
Response: {
  serverTimestamp: 1771278950000,
  mutations: [ ... ]
}`}
              </Text>
            </View>

            <Text style={styles.specCodeTitle}>WebSocket Real-Time Event Stream:</Text>
            <View style={styles.codeSnippet}>
              <Text style={styles.codeSnippetText}>
                {`ws://api.runningrace.local/v1/races/{raceId}/stream
Event: "RACE_EVENT_FINISH"
Payload: { bibNumber: "104", elapsedTimeMs: 1192000, station: "FINISH" }`}
              </Text>
            </View>

            <Text style={styles.specCodeTitle}>Server URL Configuration:</Text>
            <TextInput
              style={styles.serverInput}
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="https://api.runningrace.local/v1"
              placeholderTextColor="#64748B"
            />
          </View>
        )}
      </View>
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
    gap: 14,
  },
  sectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  sectionSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    marginBottom: 14,
  },
  buttonGrid: {
    gap: 10,
  },
  actionCardBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 20,
  },
  actionCardTexts: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  actionCardDesc: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 15,
  },
  jsonPreviewBox: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  jsonPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  jsonPreviewTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F59E0B',
  },
  jsonCloseText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
  jsonInput: {
    height: 120,
    color: '#A7F3D0',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
  },
  syncHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  deviceBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  deviceBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  syncStatusCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  syncStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  greenPulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  syncStatusTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ECFDF5',
  },
  syncStatusSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  pendingBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#60A5FA',
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#CBD5E1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  roleCard: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 10,
    width: '48%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  roleIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  roleName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  roleDesc: {
    fontSize: 10,
    color: '#94A3B8',
    lineHeight: 14,
  },
  specToggleBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  specToggleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38BDF8',
  },
  specContentBox: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  specHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F59E0B',
    marginBottom: 4,
  },
  specParagraph: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    marginBottom: 8,
  },
  specBold: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  specCodeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#CBD5E1',
    marginTop: 6,
    marginBottom: 2,
  },
  codeSnippet: {
    backgroundColor: '#020617',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  codeSnippetText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 10,
    color: '#38BDF8',
    lineHeight: 14,
  },
  serverInput: {
    backgroundColor: '#020617',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
