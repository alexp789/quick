import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRaceContext } from '../context/RaceContext';
import { triggerHaptic } from '../utils/hapticsUtils';

interface NoRaceSelectedViewProps {
  onCreateRace: () => void;
  onOpenRaceList: () => void;
  onLoadSample: () => void;
  onImportBackup: () => void;
}

export const NoRaceSelectedView: React.FC<NoRaceSelectedViewProps> = ({
  onCreateRace,
  onOpenRaceList,
  onLoadSample,
  onImportBackup,
}) => {
  const { races, selectRace } = useRaceContext();

  const handleSelect = async (raceId: string) => {
    triggerHaptic('medium');
    await selectRace(raceId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return { label: '● LIVE RUNNING', bg: '#DC2626', text: '#FFFFFF' };
      case 'completed':
        return { label: 'COMPLETED', bg: '#059669', text: '#FFFFFF' };
      case 'ready':
        return { label: 'READY TO START', bg: '#2563EB', text: '#FFFFFF' };
      default:
        return { label: 'DRAFT', bg: '#475569', text: '#FFFFFF' };
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Welcome Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>🏁 QUICK RACE MANAGER</Text>
        </View>
        <Text style={styles.heroTitle}>No Race Selected</Text>
        <Text style={styles.heroSubtitle}>
          Quick is an offline-first community race timing tool. To start capturing finish times,
          managing runners, and viewing leaderboards, choose a race below or create a new one.
        </Text>

        {/* Primary Action Buttons */}
        <View style={styles.primaryActionRow}>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => {
              triggerHaptic('medium');
              onCreateRace();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.btnPrimaryIcon}>✨</Text>
            <View style={styles.btnTextContainer}>
              <Text style={styles.btnPrimaryText}>Create New Race</Text>
              <Text style={styles.btnPrimarySub}>Set distance, date, and wave categories</Text>
            </View>
            <Text style={styles.btnArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnDemo}
            onPress={() => {
              triggerHaptic('medium');
              onLoadSample();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.btnDemoIcon}>⚡</Text>
            <View style={styles.btnTextContainer}>
              <Text style={styles.btnDemoText}>Load Demo 5K Race</Text>
              <Text style={styles.btnDemoSub}>Pre-loaded with 15 runners & finish results</Text>
            </View>
            <Text style={styles.btnDemoArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Existing Races on Device */}
      {races.length > 0 && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionIcon}>📂</Text>
              <Text style={styles.sectionTitle}>
                Saved Races on this Device ({races.length})
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                onOpenRaceList();
              }}
              style={styles.manageAllBtn}
            >
              <Text style={styles.manageAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.raceCardsList}>
            {races.slice(0, 4).map((r) => {
              const badge = getStatusBadge(r.status);
              return (
                <TouchableOpacity
                  key={r.id}
                  style={styles.raceCard}
                  onPress={() => handleSelect(r.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.raceCardTop}>
                    <View style={styles.raceTitleBox}>
                      <Text style={styles.raceCardName} numberOfLines={1}>
                        {r.name}
                      </Text>
                      <Text style={styles.raceCardMeta}>
                        📅 {r.date} • 🏷️ {r.distanceLabel}
                      </Text>
                    </View>
                    <View style={[styles.statusTag, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.statusTagText, { color: badge.text }]}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>

                  {r.location ? (
                    <Text style={styles.raceCardLocation} numberOfLines={1}>
                      📍 {r.location}
                    </Text>
                  ) : null}

                  <View style={styles.raceCardBottom}>
                    <Text style={styles.selectRaceHint}>Tap to open & time this race</Text>
                    <View style={styles.openPill}>
                      <Text style={styles.openPillText}>Open Race →</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Secondary Options: Backup & More */}
      <View style={styles.secondaryActionsContainer}>
        <TouchableOpacity
          style={styles.secondaryActionCard}
          onPress={() => {
            triggerHaptic('light');
            onImportBackup();
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryIcon}>📥</Text>
          <View style={styles.secondaryTextBox}>
            <Text style={styles.secondaryTitle}>Restore from Backup</Text>
            <Text style={styles.secondarySubtitle}>
              Import an existing race package (.json) from another device
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryActionCard}
          onPress={() => {
            triggerHaptic('light');
            onOpenRaceList();
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryIcon}>🗂️</Text>
          <View style={styles.secondaryTextBox}>
            <Text style={styles.secondaryTitle}>Manage All Races</Text>
            <Text style={styles.secondarySubtitle}>
              Browse, delete, or export race archives
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Feature Guide */}
      <View style={styles.featureGuideContainer}>
        <Text style={styles.featureGuideHeader}>💡 QUICK FEATURES & CAPABILITIES</Text>

        <View style={styles.featureGrid}>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>⏱️</Text>
            <Text style={styles.featureItemTitle}>Split-Second Timing</Text>
            <Text style={styles.featureItemDesc}>
              Fast-tap arrival queue for crowd finishes and tactile bib numpad.
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>👥</Text>
            <Text style={styles.featureItemTitle}>Runner Registration</Text>
            <Text style={styles.featureItemDesc}>
              Bulk CSV import, bib search, and automated age category sorting.
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🏆</Text>
            <Text style={styles.featureItemTitle}>Live Results & Podiums</Text>
            <Text style={styles.featureItemDesc}>
              Instant 1st/2nd/3rd division cards, gun vs net times, and club scores.
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>📴</Text>
            <Text style={styles.featureItemTitle}>100% Offline-First</Text>
            <Text style={styles.featureItemDesc}>
              Runs with zero internet dependency. All data is saved on this device.
            </Text>
          </View>
        </View>
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
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 20,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#94A3B8',
    marginBottom: 20,
  },
  primaryActionRow: {
    gap: 12,
  },
  btnPrimary: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPrimaryIcon: {
    fontSize: 22,
    marginRight: 14,
  },
  btnTextContainer: {
    flex: 1,
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnPrimarySub: {
    fontSize: 12,
    color: '#BFDBFE',
    marginTop: 2,
  },
  btnArrow: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  btnDemo: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  btnDemoIcon: {
    fontSize: 20,
    marginRight: 14,
  },
  btnDemoText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#38BDF8',
  },
  btnDemoSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  btnDemoArrow: {
    fontSize: 16,
    fontWeight: '800',
    color: '#38BDF8',
    marginLeft: 8,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F1F5F9',
  },
  manageAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  manageAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
  },
  raceCardsList: {
    gap: 10,
  },
  raceCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  raceCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  raceTitleBox: {
    flex: 1,
  },
  raceCardName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 3,
  },
  raceCardMeta: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  raceCardLocation: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
  },
  raceCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  selectRaceHint: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  openPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  openPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
  secondaryActionsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  secondaryActionCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  secondaryIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  secondaryTextBox: {
    flex: 1,
  },
  secondaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F1F5F9',
    marginBottom: 2,
  },
  secondarySubtitle: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  featureGuideContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  featureGuideHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  featureGrid: {
    gap: 12,
  },
  featureItem: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
  },
  featureEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  featureItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F1F5F9',
    marginBottom: 2,
  },
  featureItemDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
  },
});
