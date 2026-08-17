import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Modal,
} from 'react-native';
import { useRaceContext } from '../context/RaceContext';
import { Header } from '../components/Header';
import { UpdateBanner } from '../components/UpdateBanner';
import { NoRaceSelectedView } from '../components/NoRaceSelectedView';
import { TimingScreen } from './TimingScreen';
import { RunnersScreen } from './RunnersScreen';
import { CategoriesScreen } from './CategoriesScreen';
import { ResultsScreen } from './ResultsScreen';
import { ReportsAndSyncScreen } from './ReportsAndSyncScreen';
import { RacesListScreen } from './RacesListScreen';
import { triggerHaptic } from '../utils/hapticsUtils';

type DashboardTab = 'timing' | 'runners' | 'categories' | 'results' | 'reports';

export const RaceDashboardScreen: React.FC = () => {
  const { activeRace, loadSampleRace } = useRaceContext();
  const [currentTab, setCurrentTab] = useState<DashboardTab>('timing');
  const [showRacesModal, setShowRacesModal] = useState<boolean>(false);
  const [modalInitialCreate, setModalInitialCreate] = useState<boolean>(false);
  const [modalInitialImport, setModalInitialImport] = useState<boolean>(false);

  const handleTabChange = (tab: DashboardTab) => {
    triggerHaptic('light');
    if (!activeRace) {
      // If no race is selected, guide the user to select or create a race
      setModalInitialCreate(false);
      setModalInitialImport(false);
      setShowRacesModal(true);
      return;
    }
    setCurrentTab(tab);
  };

  const handleOpenRaceList = () => {
    setModalInitialCreate(false);
    setModalInitialImport(false);
    setShowRacesModal(true);
  };

  const handleOpenCreateRace = () => {
    setModalInitialCreate(true);
    setModalInitialImport(false);
    setShowRacesModal(true);
  };

  const handleOpenImportRace = () => {
    setModalInitialCreate(false);
    setModalInitialImport(true);
    setShowRacesModal(true);
  };

  const tabs: { id: DashboardTab; label: string; icon: string }[] = [
    { id: 'timing', label: 'Finish Line', icon: '⏱️' },
    { id: 'runners', label: 'Runners', icon: '👥' },
    { id: 'categories', label: 'Divisions', icon: '🏷️' },
    { id: 'results', label: 'Results', icon: '🏆' },
    { id: 'reports', label: 'Export / Sync', icon: '📊' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <Header
          race={activeRace}
          onOpenRaceList={handleOpenRaceList}
        />

        {/* Live App Update Notification */}
        <UpdateBanner />

        {/* Screen Body */}
        <View style={styles.body}>
          {!activeRace ? (
            <NoRaceSelectedView
              onCreateRace={handleOpenCreateRace}
              onOpenRaceList={handleOpenRaceList}
              onLoadSample={loadSampleRace}
              onImportBackup={handleOpenImportRace}
            />
          ) : (
            <>
              {currentTab === 'timing' && <TimingScreen />}
              {currentTab === 'runners' && <RunnersScreen />}
              {currentTab === 'categories' && <CategoriesScreen />}
              {currentTab === 'results' && <ResultsScreen />}
              {currentTab === 'reports' && <ReportsAndSyncScreen />}
            </>
          )}
        </View>

        {/* Bottom Navigation Bar */}
        <View style={[styles.bottomNav, !activeRace && styles.bottomNavDisabled]}>
          {tabs.map((t) => {
            const isActive = activeRace ? currentTab === t.id : false;
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.navItem, isActive && styles.navItemActive]}
                onPress={() => handleTabChange(t.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.navIcon, isActive && styles.navIconActive]}>
                  {t.icon}
                </Text>
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                  {t.label}
                </Text>
                {isActive && <View style={styles.activePill} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Races List Modal */}
        <Modal
          visible={showRacesModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowRacesModal(false)}
        >
          <RacesListScreen
            onClose={() => {
              setShowRacesModal(false);
              setModalInitialCreate(false);
              setModalInitialImport(false);
            }}
            initialCreate={modalInitialCreate}
            initialImport={modalInitialImport}
          />
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0F1D',
  },
  container: {
    flex: 1,
    backgroundColor: '#0A0F1D',
  },
  body: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingVertical: 6,
    paddingBottom: Platform.OS === 'ios' ? 14 : 8,
  },
  bottomNavDisabled: {
    opacity: 0.5,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  navItemActive: {
    transform: [{ scale: 1.02 }],
  },
  navIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 3,
  },
  navLabelActive: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  activePill: {
    position: 'absolute',
    bottom: -4,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#38BDF8',
  },
});
