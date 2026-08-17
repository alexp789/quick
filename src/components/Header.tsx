import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Race } from '../types';
import { useRaceTimer } from '../hooks/useRaceTimer';

interface HeaderProps {
  race: Race | null;
  onOpenRaceList: () => void;
  onQuickCreate?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ race, onOpenRaceList }) => {
  const { formattedTime, isRunning } = useRaceTimer(race);

  const getStatusBadge = () => {
    if (!race) return { text: 'NOT SELECTED', bg: '#B45309', color: '#FEF3C7' };
    if (race.status === 'in_progress') return { text: '● LIVE', bg: '#DC2626', color: '#FFFFFF' };
    if (race.status === 'completed') return { text: 'COMPLETED', bg: '#10B981', color: '#FFFFFF' };
    if (race.status === 'ready') return { text: 'READY', bg: '#3B82F6', color: '#FFFFFF' };
    return { text: 'DRAFT', bg: '#64748B', color: '#FFFFFF' };
  };

  const status = getStatusBadge();

  return (
    <View style={styles.container}>
      <View style={styles.leftCol}>
        <TouchableOpacity style={styles.titleRow} onPress={onOpenRaceList} activeOpacity={0.7}>
          <View style={[styles.iconCircle, !race && styles.iconCircleNoRace]}>
            <Text style={styles.iconEmoji}>{race ? '⏱️' : '🏁'}</Text>
          </View>
          <View style={styles.titleTexts}>
            <Text style={[styles.raceTitle, !race && styles.raceTitleNoRace]} numberOfLines={1}>
              {race ? race.name : 'No Race Selected'}
            </Text>
            <View style={styles.metaRow}>
              <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
              </View>
              <Text style={styles.distText}>
                {race ? `${race.distanceLabel} • ${race.date}` : 'Tap to select or create a race'}
              </Text>
            </View>
          </View>
          <Text style={styles.chevron}>▼</Text>
        </TouchableOpacity>
      </View>

      {race && race.status === 'in_progress' && (
        <View style={styles.liveClockContainer}>
          <Text style={styles.liveClockLabel}>GUN CLOCK</Text>
          <Text style={styles.liveClockText}>{formattedTime}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A', // Dark Slate
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 12,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  leftCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleNoRace: {
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#D97706',
  },
  iconEmoji: {
    fontSize: 18,
  },
  titleTexts: {
    flex: 1,
  },
  raceTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  raceTitleNoRace: {
    color: '#FDE68A',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  distText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  chevron: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 6,
  },
  liveClockContainer: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  liveClockLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.8,
  },
  liveClockText: {
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
