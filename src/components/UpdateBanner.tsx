import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppUpdates } from '../hooks/useAppUpdates';
import { triggerHaptic } from '../utils/hapticsUtils';

export const UpdateBanner: React.FC = () => {
  const { isReadyToApply, isDownloading, applyUpdate } = useAppUpdates();

  if (!isReadyToApply && !isDownloading) {
    return null;
  }

  const handleApply = () => {
    triggerHaptic('success');
    applyUpdate();
  };

  return (
    <View style={styles.banner}>
      <View style={styles.leftCol}>
        <Text style={styles.iconEmoji}>{isDownloading ? '⏳' : '✨'}</Text>
        <View style={styles.textCol}>
          <Text style={styles.title}>
            {isDownloading ? 'Downloading update...' : 'New update ready!'}
          </Text>
          <Text style={styles.subtitle}>
            {isDownloading
              ? 'Fetching latest version in background'
              : 'App will update automatically on next load or tap to restart now'}
          </Text>
        </View>
      </View>

      {isReadyToApply && (
        <TouchableOpacity
          style={styles.reloadBtn}
          onPress={handleApply}
          activeOpacity={0.7}
        >
          <Text style={styles.reloadBtnText}>Restart Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#0F2942',
    borderBottomWidth: 1.5,
    borderBottomColor: '#38BDF8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconEmoji: {
    fontSize: 18,
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38BDF8',
  },
  subtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  reloadBtn: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reloadBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0A0F1D',
  },
});
