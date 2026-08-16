import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { useRaceContext } from '../context/RaceContext';
import { useRaceResults } from '../hooks/useRaceResults';
import { PodiumCard } from '../components/PodiumCard';
import { StatCard } from '../components/StatCard';
import { RaceResult } from '../types';
import { formatElapsedTime } from '../utils/timeUtils';

type ResultsTab = 'overall' | 'categories' | 'gender' | 'teams' | 'stats';

export const ResultsScreen: React.FC = () => {
  const { activeRace, categories, runners, timingEvents } = useRaceContext();
  const { results, statistics, teamStandings } = useRaceResults(
    activeRace,
    categories,
    runners,
    timingEvents
  );

  const [activeTab, setActiveTab] = useState<ResultsTab>('overall');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>(
    categories[0]?.id || 'ALL'
  );

  // Filtered by Search
  const filteredResults = results.filter((r) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      r.bibNumber.toLowerCase().includes(q) ||
      r.fullName.toLowerCase().includes(q) ||
      r.categoryName.toLowerCase().includes(q) ||
      (r.team && r.team.toLowerCase().includes(q))
    );
  });

  const finishersOnly = filteredResults.filter((r) => r.status === 'finished');
  const nonFinishers = filteredResults.filter((r) => r.status !== 'finished');

  return (
    <View style={styles.container}>
      {/* Top Segmented Navigation Tabs */}
      <View style={styles.tabBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {[
            { id: 'overall', label: '🏅 Overall Standings' },
            { id: 'categories', label: '🎖 Categories' },
            { id: 'gender', label: '🚻 Gender' },
            { id: 'teams', label: '🏃 Team Scoring' },
            { id: 'stats', label: '📊 Statistics' },
          ].map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tabBtn, activeTab === t.id && styles.tabBtnActive]}
              onPress={() => setActiveTab(t.id as ResultsTab)}
            >
              <Text
                style={[styles.tabBtnText, activeTab === t.id && styles.tabBtnTextActive]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search Bar for Results */}
      {activeTab !== 'stats' && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search results by name, bib, or club..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.searchClear}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* TAB 1: OVERALL STANDINGS */}
      {activeTab === 'overall' && (
        <FlatList
          data={[...finishersOnly, ...nonFinishers]}
          keyExtractor={(item) => item.runnerId + item.bibNumber}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            finishersOnly.length > 0 && !searchQuery ? (
              <PodiumCard title="🏆 Overall Finishers Podium" results={finishersOnly} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>⏱️</Text>
              <Text style={styles.emptyTitle}>No official times yet</Text>
              <Text style={styles.emptySub}>
                Start the race timer and record bibs at the finish line to see live results!
              </Text>
            </View>
          }
          renderItem={({ item }) => <ResultRow item={item} isOverall />}
        />
      )}

      {/* TAB 2: CATEGORY STANDINGS */}
      {activeTab === 'categories' && (
        <View style={{ flex: 1 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categorySubTabs}
          >
            {categories.map((c) => {
              const catFinishers = results.filter(
                (r) => r.categoryId === c.id && r.status === 'finished'
              );
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.catSubTabBtn,
                    selectedCategoryTab === c.id && {
                      backgroundColor: c.color,
                      borderColor: c.color,
                    },
                  ]}
                  onPress={() => setSelectedCategoryTab(c.id)}
                >
                  <Text
                    style={[
                      styles.catSubTabBtnText,
                      selectedCategoryTab === c.id && { color: '#FFFFFF' },
                    ]}
                  >
                    {c.name} ({catFinishers.length})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {(() => {
            const currentCat = categories.find((c) => c.id === selectedCategoryTab);
            const catResults = results.filter(
              (r) => r.categoryId === selectedCategoryTab
            );
            const catFinishers = catResults.filter((r) => r.status === 'finished');

            return (
              <FlatList
                data={catResults}
                keyExtractor={(item) => item.runnerId + item.bibNumber}
                contentContainerStyle={styles.listContainer}
                ListHeaderComponent={
                  catFinishers.length > 0 ? (
                    <PodiumCard
                      title={`🏆 ${currentCat?.name || 'Category'} Podium`}
                      results={catFinishers}
                    />
                  ) : null
                }
                ListEmptyComponent={
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyEmoji}>🏷️</Text>
                    <Text style={styles.emptyTitle}>No runners in this category</Text>
                  </View>
                }
                renderItem={({ item }) => <ResultRow item={item} isCategory />}
              />
            );
          })()}
        </View>
      )}

      {/* TAB 3: GENDER STANDINGS */}
      {activeTab === 'gender' && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Top Males */}
          {(() => {
            const maleResults = results.filter((r) => r.gender === 'M');
            const maleFinishers = maleResults.filter((r) => r.status === 'finished');
            if (maleResults.length === 0) return null;
            return (
              <View style={styles.genderGroupCard}>
                <Text style={styles.genderGroupTitle}>🏃‍♂️ Male Division ({maleFinishers.length} Finished)</Text>
                {maleFinishers.length > 0 && (
                  <PodiumCard title="🏆 Top Males Podium" results={maleFinishers} />
                )}
                {maleResults.map((r) => (
                  <ResultRow key={r.runnerId} item={r} isGender />
                ))}
              </View>
            );
          })()}

          {/* Top Females */}
          {(() => {
            const femaleResults = results.filter((r) => r.gender === 'F');
            const femaleFinishers = femaleResults.filter((r) => r.status === 'finished');
            if (femaleResults.length === 0) return null;
            return (
              <View style={styles.genderGroupCard}>
                <Text style={styles.genderGroupTitle}>🏃‍♀️ Female Division ({femaleFinishers.length} Finished)</Text>
                {femaleFinishers.length > 0 && (
                  <PodiumCard title="🏆 Top Females Podium" results={femaleFinishers} />
                )}
                {femaleResults.map((r) => (
                  <ResultRow key={r.runnerId} item={r} isGender />
                ))}
              </View>
            );
          })()}

          {/* Non-Binary / Open */}
          {(() => {
            const nbResults = results.filter((r) => r.gender === 'X' || r.gender === 'U');
            if (nbResults.length === 0) return null;
            return (
              <View style={styles.genderGroupCard}>
                <Text style={styles.genderGroupTitle}>🏃 Non-Binary / Open Division</Text>
                {nbResults.map((r) => (
                  <ResultRow key={r.runnerId} item={r} isGender />
                ))}
              </View>
            );
          })()}
        </ScrollView>
      )}

      {/* TAB 4: TEAM / CLUB STANDINGS */}
      {activeTab === 'teams' && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.teamHeaderBox}>
            <Text style={styles.teamHeaderTitle}>🏃‍♂️ Cross Country Club Scoring</Text>
            <Text style={styles.teamHeaderSub}>
              Sum of top 3 finishers' overall ranks (lowest score wins).
            </Text>
          </View>

          {teamStandings.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={styles.emptyTitle}>No qualifying clubs yet</Text>
              <Text style={styles.emptySub}>
                Assign team/club names to runners during enrollment to compute automatic club standings.
              </Text>
            </View>
          ) : (
            teamStandings.map((team, index) => (
              <View key={team.teamName} style={styles.teamCard}>
                <View style={styles.teamCardHeader}>
                  <View style={styles.teamRankRow}>
                    <View
                      style={[
                        styles.teamPlaceCircle,
                        index === 0
                          ? styles.teamPlace1
                          : index === 1
                          ? styles.teamPlace2
                          : styles.teamPlace3,
                      ]}
                    >
                      <Text style={styles.teamPlaceText}>{index + 1}</Text>
                    </View>
                    <View>
                      <Text style={styles.teamNameText}>{team.teamName}</Text>
                      <Text style={styles.teamCountText}>
                        {team.runnerCount} runners finished • Combined Time: {team.formattedTotalTime}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.teamScoreBadge}>
                    <Text style={styles.teamScoreLabel}>SCORE</Text>
                    <Text style={styles.teamScoreValue}>{team.score} pts</Text>
                  </View>
                </View>

                {/* Team Top Finishers */}
                <View style={styles.teamRunnersList}>
                  {team.runners.slice(0, 3).map((tr, rIdx) => (
                    <View key={tr.runnerId} style={styles.teamRunnerRow}>
                      <Text style={styles.teamRunnerPlace}>
                        #{tr.rank} {tr.fullName}
                      </Text>
                      <Text style={styles.teamRunnerTime}>{tr.formattedGunTime}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* TAB 5: RACE STATISTICS */}
      {activeTab === 'stats' && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.statsSectionHeading}>📈 Race Overview & Metrics</Text>
          <View style={styles.statsGrid}>
            <StatCard
              label="Registered"
              value={statistics.totalRegistered}
              icon="📋"
              accentColor="#60A5FA"
            />
            <StatCard
              label="Starters"
              value={statistics.starters}
              icon="🏃"
              accentColor="#38BDF8"
            />
            <StatCard
              label="Finishers"
              value={statistics.finishers}
              subValue={`${statistics.finishRatePercentage}% completion`}
              icon="🏁"
              accentColor="#10B981"
            />
            <StatCard
              label="On Course"
              value={statistics.inProgressCount}
              icon="⏳"
              accentColor="#F59E0B"
            />
          </View>

          <Text style={styles.statsSectionHeading}>⏱️ Finish Times Benchmark</Text>
          <View style={styles.statsGrid}>
            <StatCard
              label="Fastest Time"
              value={
                statistics.fastestTimeMs
                  ? formatElapsedTime(statistics.fastestTimeMs)
                  : '--:--'
              }
              icon="🥇"
              accentColor="#F59E0B"
            />
            <StatCard
              label="Average Time"
              value={
                statistics.averageTimeMs
                  ? formatElapsedTime(statistics.averageTimeMs)
                  : '--:--'
              }
              icon="⏱️"
              accentColor="#A78BFA"
            />
            <StatCard
              label="Median Time"
              value={
                statistics.medianTimeMs
                  ? formatElapsedTime(statistics.medianTimeMs)
                  : '--:--'
              }
              icon="📊"
              accentColor="#34D399"
            />
            <StatCard
              label="Slowest Time"
              value={
                statistics.slowestTimeMs
                  ? formatElapsedTime(statistics.slowestTimeMs)
                  : '--:--'
              }
              icon="🐢"
              accentColor="#94A3B8"
            />
          </View>

          <Text style={styles.statsSectionHeading}>⚠️ Dropouts & No-Shows</Text>
          <View style={styles.statsGrid}>
            <StatCard
              label="DNF (Did Not Finish)"
              value={statistics.dnfCount}
              icon="❌"
              accentColor="#EF4444"
            />
            <StatCard
              label="DNS (Did Not Start)"
              value={statistics.dnsCount}
              icon="🚫"
              accentColor="#64748B"
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
};

// Result Row Component
const ResultRow: React.FC<{
  item: RaceResult;
  isOverall?: boolean;
  isCategory?: boolean;
  isGender?: boolean;
}> = ({ item, isOverall, isCategory, isGender }) => {
  const isFinished = item.status === 'finished';
  const displayRank = isCategory
    ? item.categoryRank
    : isGender
    ? item.genderRank
    : item.rank;

  return (
    <View style={[styles.resultCard, !isFinished && styles.resultCardNonFinish]}>
      <View style={styles.resultLeft}>
        <View
          style={[
            styles.rankBadge,
            displayRank === 1 && styles.rank1,
            displayRank === 2 && styles.rank2,
            displayRank === 3 && styles.rank3,
            !isFinished && styles.rankNonFinish,
          ]}
        >
          <Text style={styles.rankText}>
            {isFinished
              ? displayRank === 1
                ? '🥇'
                : displayRank === 2
                ? '🥈'
                : displayRank === 3
                ? '🥉'
                : `#${displayRank}`
              : item.status.toUpperCase()}
          </Text>
        </View>

        <View style={styles.runnerDetails}>
          <View style={styles.runnerNameRow}>
            <Text style={styles.runnerName} numberOfLines={1}>
              {item.fullName}
            </Text>
            <Text style={styles.bibNumberText}>#{item.bibNumber}</Text>
          </View>

          <View style={styles.metaRow}>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: `${item.categoryColor}33` },
              ]}
            >
              <Text style={[styles.categoryBadgeText, { color: item.categoryColor }]}>
                {item.categoryName}
              </Text>
            </View>

            <Text style={styles.metaInfo}>
              {item.gender}
              {item.age ? ` ${item.age}` : ''}
              {item.team ? ` • ${item.team}` : ''}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.resultRight}>
        <Text style={[styles.timeText, !isFinished && styles.timeTextNonFinish]}>
          {item.formattedGunTime}
        </Text>
        {isFinished && (
          <View style={styles.paceGapRow}>
            <Text style={styles.paceText}>{item.formattedPaceMinKm}</Text>
            {item.rank > 1 && <Text style={styles.gapText}>{item.formattedGap}</Text>}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1D',
  },
  tabBar: {
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  tabScroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  tabBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabBtnActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  searchContainer: {
    padding: 12,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  searchBox: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 38,
  },
  searchIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  searchClear: {
    fontSize: 12,
    color: '#94A3B8',
    padding: 4,
  },
  listContainer: {
    padding: 12,
    paddingBottom: 40,
    gap: 8,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 40,
    gap: 12,
  },
  categorySubTabs: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#0F172A',
    gap: 8,
  },
  catSubTabBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  catSubTabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  genderGroupCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  genderGroupTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  teamHeaderBox: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  teamHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  teamHeaderSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  teamCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  teamCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  teamRankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  teamPlaceCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamPlace1: { backgroundColor: '#F59E0B' },
  teamPlace2: { backgroundColor: '#94A3B8' },
  teamPlace3: { backgroundColor: '#D97706' },
  teamPlaceText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  teamNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  teamCountText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  teamScoreBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: '#334155',
  },
  teamScoreLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
  },
  teamScoreValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#10B981',
  },
  teamRunnersList: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
    gap: 4,
  },
  teamRunnerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  teamRunnerPlace: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  teamRunnerTime: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#94A3B8',
  },
  statsSectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  resultCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
  },
  resultCardNonFinish: {
    opacity: 0.65,
    backgroundColor: '#151D2A',
  },
  resultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  rankBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  rank1: { borderColor: '#F59E0B', backgroundColor: '#2C2314' },
  rank2: { borderColor: '#94A3B8', backgroundColor: '#212630' },
  rank3: { borderColor: '#D97706', backgroundColor: '#291C12' },
  rankNonFinish: { borderColor: '#475569' },
  rankText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  runnerDetails: {
    flex: 1,
  },
  runnerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  runnerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    maxWidth: 160,
  },
  bibNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  metaInfo: {
    fontSize: 11,
    color: '#94A3B8',
  },
  resultRight: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '900',
    color: '#10B981',
  },
  timeTextNonFinish: {
    fontSize: 12,
    color: '#94A3B8',
  },
  paceGapRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  paceText: {
    fontSize: 10,
    color: '#60A5FA',
    fontWeight: '600',
  },
  gapText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  emptyBox: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 280,
    marginTop: 4,
  },
});
