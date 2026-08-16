import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { RaceResult } from '../types';

interface PodiumCardProps {
  title?: string;
  results: RaceResult[];
}

export const PodiumCard: React.FC<PodiumCardProps> = ({
  title = '🏆 Podium Winners',
  results,
}) => {
  const first = results[0];
  const second = results[1];
  const third = results[2];

  if (!first) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.podiumRow}>
        {/* 2nd Place (Silver) */}
        {second ? (
          <View style={[styles.podiumCol, styles.silverCol]}>
            <View style={styles.placeBadgeSilver}>
              <Text style={styles.medalEmoji}>🥈</Text>
              <Text style={styles.placeText}>2nd</Text>
            </View>
            <Text style={styles.runnerName} numberOfLines={1}>
              {second.fullName}
            </Text>
            <Text style={styles.bibTag}>#{second.bibNumber}</Text>
            <Text style={styles.finishTime}>{second.formattedGunTime}</Text>
            <Text style={styles.gapText}>{second.formattedGap}</Text>
          </View>
        ) : (
          <View style={[styles.podiumCol, styles.emptyCol]} />
        )}

        {/* 1st Place (Gold) */}
        <View style={[styles.podiumCol, styles.goldCol]}>
          <View style={styles.placeBadgeGold}>
            <Text style={styles.medalEmoji}>🥇</Text>
            <Text style={styles.placeText}>1st</Text>
          </View>
          <Text style={[styles.runnerName, styles.goldRunnerName]} numberOfLines={1}>
            {first.fullName}
          </Text>
          <Text style={styles.bibTag}>#{first.bibNumber}</Text>
          <Text style={[styles.finishTime, styles.goldTime]}>{first.formattedGunTime}</Text>
          <Text style={styles.paceText}>{first.formattedPaceMinKm}</Text>
        </View>

        {/* 3rd Place (Bronze) */}
        {third ? (
          <View style={[styles.podiumCol, styles.bronzeCol]}>
            <View style={styles.placeBadgeBronze}>
              <Text style={styles.medalEmoji}>🥉</Text>
              <Text style={styles.placeText}>3rd</Text>
            </View>
            <Text style={styles.runnerName} numberOfLines={1}>
              {third.fullName}
            </Text>
            <Text style={styles.bibTag}>#{third.bibNumber}</Text>
            <Text style={styles.finishTime}>{third.formattedGunTime}</Text>
            <Text style={styles.gapText}>{third.formattedGap}</Text>
          </View>
        ) : (
          <View style={[styles.podiumCol, styles.emptyCol]} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  podiumCol: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyCol: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  goldCol: {
    borderColor: '#F59E0B',
    backgroundColor: '#1A2138',
    paddingVertical: 14,
    transform: [{ scale: 1.03 }],
  },
  silverCol: {
    borderColor: '#94A3B8',
  },
  bronzeCol: {
    borderColor: '#D97706',
  },
  placeBadgeGold: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 6,
  },
  placeBadgeSilver: {
    backgroundColor: '#94A3B8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 6,
  },
  placeBadgeBronze: {
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 6,
  },
  medalEmoji: {
    fontSize: 12,
  },
  placeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F172A',
  },
  runnerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 2,
  },
  goldRunnerName: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  bibTag: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 4,
  },
  finishTime: {
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '900',
    color: '#10B981',
  },
  goldTime: {
    fontSize: 17,
  },
  gapText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  paceText: {
    fontSize: 10,
    color: '#60A5FA',
    marginTop: 2,
    fontWeight: '600',
  },
});
