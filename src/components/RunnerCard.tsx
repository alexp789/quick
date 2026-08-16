import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Runner, Category } from '../types';

interface RunnerCardProps {
  runner: Runner;
  category: Category | null;
  onEdit: (runner: Runner) => void;
  onToggleStatus: (runner: Runner) => void;
  onDelete: (runnerId: string) => void;
}

export const RunnerCard: React.FC<RunnerCardProps> = ({
  runner,
  category,
  onEdit,
  onToggleStatus,
  onDelete,
}) => {
  const getStatusBadge = () => {
    switch (runner.status) {
      case 'finished':
        return { label: 'FINISHED', bg: '#065F46', text: '#34D399' };
      case 'active':
        return { label: 'ON COURSE', bg: '#1E3A8A', text: '#60A5FA' };
      case 'dnf':
        return { label: 'DNF', bg: '#7F1D1D', text: '#F87171' };
      case 'dns':
        return { label: 'DNS', bg: '#374151', text: '#9CA3AF' };
      default:
        return { label: 'REGISTERED', bg: '#1E293B', text: '#94A3B8' };
    }
  };

  const statusStyle = getStatusBadge();

  return (
    <View style={styles.card}>
      <View style={styles.leftRow}>
        <View style={styles.bibBox}>
          <Text style={styles.bibLabel}>BIB</Text>
          <Text style={styles.bibNumber}>{runner.bibNumber}</Text>
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.nameText} numberOfLines={1}>
            {runner.firstName} {runner.lastName}
          </Text>

          <View style={styles.tagsRow}>
            <View
              style={[
                styles.categoryTag,
                { backgroundColor: category?.color ? `${category.color}33` : '#3B82F633' },
              ]}
            >
              <Text
                style={[
                  styles.categoryTagText,
                  { color: category?.color || '#60A5FA' },
                ]}
              >
                {category?.name || 'Open'}
              </Text>
            </View>

            <Text style={styles.metaText}>
              {runner.gender}
              {runner.age ? ` • Age ${runner.age}` : ''}
            </Text>

            {runner.team ? (
              <Text style={styles.teamText} numberOfLines={1}>
                • {runner.team}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.actionsCol}>
        <TouchableOpacity
          style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
          onPress={() => onToggleStatus(runner)}
          activeOpacity={0.7}
        >
          <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
            {statusStyle.label}
          </Text>
        </TouchableOpacity>

        <View style={styles.iconButtonsRow}>
          <TouchableOpacity onPress={() => onEdit(runner)} style={styles.miniBtn}>
            <Text style={styles.miniBtnText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(runner.id)} style={styles.miniBtn}>
            <Text style={styles.miniBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  bibBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 48,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bibLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
  },
  bibNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  infoCol: {
    flex: 1,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  metaText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  teamText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '500',
    maxWidth: 120,
  },
  actionsCol: {
    alignItems: 'flex-end',
    gap: 6,
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  iconButtonsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  miniBtn: {
    padding: 4,
  },
  miniBtnText: {
    fontSize: 13,
  },
});
