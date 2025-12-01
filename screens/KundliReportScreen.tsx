/**
 * KundliReportScreen
 * Displays generated Kundli report with 5 tabs
 * Tabs: General | Remedies | Dosha | Charts | Dasha
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
  StatusBar as RNStatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  FadeIn,
  FadeInDown,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { BottomNavBar } from '../components/BottomNavBar';
import { ShimmerEffect } from '../components/skeleton/ShimmerEffect';
import { useResponsiveLayout } from '../src/utils/responsive';
import { SavedKundli, KundliReportData } from '../src/types/kundli';

// Tab configuration
type KundliTab = 'general' | 'remedies' | 'dosha' | 'charts' | 'dasha';

const TABS: { key: KundliTab; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'remedies', label: 'Remedies' },
  { key: 'dosha', label: 'Dosha' },
  { key: 'charts', label: 'Charts' },
  { key: 'dasha', label: 'Dasha' },
];

// Mock report data (will be replaced with API)
const getMockReportData = (): KundliReportData => ({
  nakshatra: { name: 'Ashwini', lord: 'Ketu', pada: 2 },
  rasi: { name: 'Aries', lord: 'Mars' },
  lagna: { name: 'Leo', lord: 'Sun' },
  planets: [
    { name: 'Sun', sign: 'Aries', degree: 15.5, isRetrograde: false, house: 9 },
    { name: 'Moon', sign: 'Taurus', degree: 22.3, isRetrograde: false, house: 10 },
    { name: 'Mars', sign: 'Capricorn', degree: 8.7, isRetrograde: false, house: 6 },
    { name: 'Mercury', sign: 'Pisces', degree: 28.1, isRetrograde: true, house: 8 },
    { name: 'Jupiter', sign: 'Sagittarius', degree: 12.4, isRetrograde: false, house: 5 },
    { name: 'Venus', sign: 'Aquarius', degree: 5.9, isRetrograde: false, house: 7 },
    { name: 'Saturn', sign: 'Capricorn', degree: 20.2, isRetrograde: false, house: 6 },
    { name: 'Rahu', sign: 'Gemini', degree: 18.8, isRetrograde: true, house: 11 },
    { name: 'Ketu', sign: 'Sagittarius', degree: 18.8, isRetrograde: true, house: 5 },
  ],
  mangalDosha: {
    hasDosha: false,
    severity: 'none',
    description: 'Mars is well-placed in your chart, indicating no Mangal Dosha.',
    remedies: [],
  },
  kaalSarpDosha: {
    hasDosha: false,
    severity: 'none',
    type: 'None',
    description: 'No Kaal Sarp Dosha is present in your birth chart.',
    remedies: [],
  },
  sadeSati: {
    isActive: false,
    phase: 'None',
    startDate: '',
    endDate: '',
  },
  currentDasha: {
    mahadasha: { planet: 'Jupiter', startDate: '2020-03-15', endDate: '2036-03-15' },
    antardasha: { planet: 'Saturn', startDate: '2024-01-20', endDate: '2026-08-15' },
  },
  dashaPeriods: [
    { planet: 'Jupiter', startDate: '2020-03-15', endDate: '2036-03-15' },
    { planet: 'Saturn', startDate: '2036-03-15', endDate: '2055-03-15' },
    { planet: 'Mercury', startDate: '2055-03-15', endDate: '2072-03-15' },
  ],
  remedies: {
    gemstone: { name: 'Yellow Sapphire', finger: 'Index', metal: 'Gold' },
    luckyColors: ['Yellow', 'Orange', 'Gold'],
    luckyNumbers: [3, 9, 12],
    luckyDays: ['Thursday', 'Sunday'],
    mantras: ['Om Guru Devaya Namaha', 'Om Brim Brihaspataye Namaha'],
  },
  generalPrediction: 'The sun in your chart brings intense focus, while passionate energy drives determination. Jupiter\'s placement indicates wisdom and spiritual growth. Your chart shows strong potential for success in education, teaching, and advisory roles.',
});

// Tab content components
const GeneralTab = ({ data, scale }: { data: KundliReportData; scale: number }) => (
  <Animated.View entering={FadeInDown.duration(400)} style={styles.tabContent}>
    {/* Basic Info */}
    <View style={[styles.section, { marginBottom: 20 * scale }]}>
      <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Birth Details</Text>
      <View style={[styles.infoGrid, { marginTop: 12 * scale }]}>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { fontSize: 12 * scale }]}>Nakshatra</Text>
          <Text style={[styles.infoValue, { fontSize: 14 * scale }]}>{data.nakshatra.name} (Pada {data.nakshatra.pada})</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { fontSize: 12 * scale }]}>Rasi</Text>
          <Text style={[styles.infoValue, { fontSize: 14 * scale }]}>{data.rasi.name}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { fontSize: 12 * scale }]}>Lagna</Text>
          <Text style={[styles.infoValue, { fontSize: 14 * scale }]}>{data.lagna.name}</Text>
        </View>
      </View>
    </View>

    {/* General Prediction */}
    <View style={[styles.section, { marginBottom: 20 * scale }]}>
      <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>GENERAL</Text>
      <Text style={[styles.predictionText, { fontSize: 13 * scale, marginTop: 12 * scale }]}>
        {data.generalPrediction}
      </Text>
    </View>

    {/* Planetary Positions */}
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Planetary Positions</Text>
      <View style={[styles.planetsGrid, { marginTop: 12 * scale }]}>
        {data.planets.map((planet, index) => (
          <View key={index} style={[styles.planetRow, { paddingVertical: 10 * scale }]}>
            <Text style={[styles.planetName, { fontSize: 14 * scale }]}>
              {planet.name} {planet.isRetrograde && '(R)'}
            </Text>
            <Text style={[styles.planetInfo, { fontSize: 13 * scale }]}>
              {planet.sign} - {planet.degree.toFixed(1)}°
            </Text>
          </View>
        ))}
      </View>
    </View>
  </Animated.View>
);

const RemediesTab = ({ data, scale }: { data: KundliReportData; scale: number }) => (
  <Animated.View entering={FadeInDown.duration(400)} style={styles.tabContent}>
    {/* Gemstone */}
    <View style={[styles.section, { marginBottom: 20 * scale }]}>
      <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Recommended Gemstone</Text>
      <View style={[styles.gemstoneCard, { padding: 16 * scale, marginTop: 12 * scale, borderRadius: 12 * scale }]}>
        <Text style={[styles.gemstoneName, { fontSize: 18 * scale }]}>{data.remedies.gemstone.name}</Text>
        <Text style={[styles.gemstoneDetails, { fontSize: 13 * scale, marginTop: 8 * scale }]}>
          Wear on {data.remedies.gemstone.finger} finger in {data.remedies.gemstone.metal}
        </Text>
      </View>
    </View>

    {/* Lucky Elements */}
    <View style={[styles.section, { marginBottom: 20 * scale }]}>
      <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Lucky Colors</Text>
      <View style={[styles.tagsRow, { marginTop: 12 * scale }]}>
        {data.remedies.luckyColors.map((color, index) => (
          <View key={index} style={[styles.tag, { paddingHorizontal: 16 * scale, paddingVertical: 8 * scale, borderRadius: 20 * scale }]}>
            <Text style={[styles.tagText, { fontSize: 13 * scale }]}>{color}</Text>
          </View>
        ))}
      </View>
    </View>

    <View style={[styles.section, { marginBottom: 20 * scale }]}>
      <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Lucky Numbers</Text>
      <View style={[styles.tagsRow, { marginTop: 12 * scale }]}>
        {data.remedies.luckyNumbers.map((num, index) => (
          <View key={index} style={[styles.tag, { paddingHorizontal: 16 * scale, paddingVertical: 8 * scale, borderRadius: 20 * scale }]}>
            <Text style={[styles.tagText, { fontSize: 13 * scale }]}>{num}</Text>
          </View>
        ))}
      </View>
    </View>

    <View style={[styles.section, { marginBottom: 20 * scale }]}>
      <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Lucky Days</Text>
      <View style={[styles.tagsRow, { marginTop: 12 * scale }]}>
        {data.remedies.luckyDays.map((day, index) => (
          <View key={index} style={[styles.tag, { paddingHorizontal: 16 * scale, paddingVertical: 8 * scale, borderRadius: 20 * scale }]}>
            <Text style={[styles.tagText, { fontSize: 13 * scale }]}>{day}</Text>
          </View>
        ))}
      </View>
    </View>

    {/* Mantras */}
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Recommended Mantras</Text>
      {data.remedies.mantras.map((mantra, index) => (
        <View key={index} style={[styles.mantraItem, { paddingVertical: 12 * scale, marginTop: index === 0 ? 12 * scale : 0 }]}>
          <Text style={[styles.mantraText, { fontSize: 14 * scale }]}>{mantra}</Text>
        </View>
      ))}
    </View>
  </Animated.View>
);

const DoshaTab = ({ data, scale }: { data: KundliReportData; scale: number }) => (
  <Animated.View entering={FadeInDown.duration(400)} style={styles.tabContent}>
    {/* Mangal Dosha */}
    <View style={[styles.section, { marginBottom: 20 * scale }]}>
      <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Mangal Dosha</Text>
      <View style={[styles.doshaCard, { padding: 16 * scale, marginTop: 12 * scale, borderRadius: 12 * scale }]}>
        <View style={styles.doshaHeader}>
          <Text style={[styles.doshaStatus, { fontSize: 16 * scale }, data.mangalDosha.hasDosha ? styles.doshaStatusActive : styles.doshaStatusInactive]}>
            {data.mangalDosha.hasDosha ? 'Present' : 'Not Present'}
          </Text>
        </View>
        <Text style={[styles.doshaDescription, { fontSize: 13 * scale, marginTop: 8 * scale }]}>
          {data.mangalDosha.description}
        </Text>
      </View>
    </View>

    {/* Kaal Sarp Dosha */}
    <View style={[styles.section, { marginBottom: 20 * scale }]}>
      <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Kaal Sarp Dosha</Text>
      <View style={[styles.doshaCard, { padding: 16 * scale, marginTop: 12 * scale, borderRadius: 12 * scale }]}>
        <View style={styles.doshaHeader}>
          <Text style={[styles.doshaStatus, { fontSize: 16 * scale }, data.kaalSarpDosha.hasDosha ? styles.doshaStatusActive : styles.doshaStatusInactive]}>
            {data.kaalSarpDosha.hasDosha ? `Present (${data.kaalSarpDosha.type})` : 'Not Present'}
          </Text>
        </View>
        <Text style={[styles.doshaDescription, { fontSize: 13 * scale, marginTop: 8 * scale }]}>
          {data.kaalSarpDosha.description}
        </Text>
      </View>
    </View>

    {/* Sade Sati */}
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Sade Sati</Text>
      <View style={[styles.doshaCard, { padding: 16 * scale, marginTop: 12 * scale, borderRadius: 12 * scale }]}>
        <View style={styles.doshaHeader}>
          <Text style={[styles.doshaStatus, { fontSize: 16 * scale }, data.sadeSati.isActive ? styles.doshaStatusActive : styles.doshaStatusInactive]}>
            {data.sadeSati.isActive ? `Active (${data.sadeSati.phase})` : 'Not Active'}
          </Text>
        </View>
        {data.sadeSati.isActive && (
          <Text style={[styles.doshaDescription, { fontSize: 13 * scale, marginTop: 8 * scale }]}>
            From {data.sadeSati.startDate} to {data.sadeSati.endDate}
          </Text>
        )}
      </View>
    </View>
  </Animated.View>
);

const ChartsTab = ({ data, scale }: { data: KundliReportData; scale: number }) => (
  <Animated.View entering={FadeInDown.duration(400)} style={styles.tabContent}>
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Rasi Chart (D1)</Text>
      <View style={[styles.chartPlaceholder, { height: 280 * scale, marginTop: 16 * scale, borderRadius: 12 * scale }]}>
        {/* South Indian Style Chart Grid */}
        <View style={styles.chartGrid}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((house) => (
            <View key={house} style={styles.chartCell}>
              <Text style={[styles.chartCellNumber, { fontSize: 10 * scale }]}>{house}</Text>
              {data.planets.filter(p => p.house === house).map((planet, idx) => (
                <Text key={idx} style={[styles.chartPlanetText, { fontSize: 9 * scale }]}>
                  {planet.name.substring(0, 2)}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>

    <View style={[styles.section, { marginTop: 24 * scale }]}>
      <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Navamsa Chart (D9)</Text>
      <View style={[styles.chartPlaceholder, { height: 280 * scale, marginTop: 16 * scale, borderRadius: 12 * scale }]}>
        <Text style={[styles.chartComingSoon, { fontSize: 14 * scale }]}>
          Navamsa chart will be displayed here
        </Text>
      </View>
    </View>
  </Animated.View>
);

const DashaTab = ({ data, scale }: { data: KundliReportData; scale: number }) => (
  <Animated.View entering={FadeInDown.duration(400)} style={styles.tabContent}>
    {/* Current Dasha */}
    <View style={[styles.section, { marginBottom: 20 * scale }]}>
      <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Current Dasha Period</Text>
      <View style={[styles.dashaCard, { padding: 16 * scale, marginTop: 12 * scale, borderRadius: 12 * scale }]}>
        <View style={styles.dashaRow}>
          <Text style={[styles.dashaLabel, { fontSize: 13 * scale }]}>Mahadasha</Text>
          <Text style={[styles.dashaValue, { fontSize: 14 * scale }]}>{data.currentDasha.mahadasha.planet}</Text>
        </View>
        <View style={[styles.dashaRow, { marginTop: 8 * scale }]}>
          <Text style={[styles.dashaLabel, { fontSize: 13 * scale }]}>Antardasha</Text>
          <Text style={[styles.dashaValue, { fontSize: 14 * scale }]}>{data.currentDasha.antardasha.planet}</Text>
        </View>
      </View>
    </View>

    {/* Dasha Timeline */}
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Dasha Timeline</Text>
      <View style={{ marginTop: 12 * scale }}>
        {data.dashaPeriods.map((period, index) => (
          <View key={index} style={[styles.timelineItem, { paddingVertical: 12 * scale }]}>
            <View style={[styles.timelineDot, { width: 12 * scale, height: 12 * scale, borderRadius: 6 * scale }]} />
            <View style={styles.timelineContent}>
              <Text style={[styles.timelinePlanet, { fontSize: 15 * scale }]}>{period.planet} Mahadasha</Text>
              <Text style={[styles.timelineDates, { fontSize: 12 * scale }]}>
                {period.startDate} - {period.endDate}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  </Animated.View>
);

// Skeleton component for loading
const ReportSkeleton = ({ scale }: { scale: number }) => (
  <View style={styles.tabContent}>
    {[1, 2, 3].map((i) => (
      <View key={i} style={{ marginBottom: 20 * scale }}>
        <ShimmerEffect width={120 * scale} height={20 * scale} borderRadius={4} />
        <View style={{ marginTop: 12 * scale }}>
          <ShimmerEffect width="100%" height={80 * scale} borderRadius={12} />
        </View>
      </View>
    ))}
  </View>
);

const KundliReportScreen = ({ navigation, route }: any) => {
  const { scale } = useResponsiveLayout();
  const { kundliData } = route.params || {};
  const insets = useSafeAreaInsets();

  // Status bar height for proper spacing
  const statusBarHeight = Platform.OS === 'ios' ? insets.top : RNStatusBar.currentHeight || 24;

  // Yellow header height (hero report: larger for subtitle and tabs)
  const yellowHeaderHeight = 180 * scale + statusBarHeight;

  const [activeTab, setActiveTab] = useState<KundliTab>('general');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState<KundliReportData | null>(null);

  // Fetch report data
  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setReportData(getMockReportData());
      setLoading(false);
    };
    fetchReport();
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setReportData(getMockReportData());
    setRefreshing(false);
  }, []);

  // Handle back
  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  }, [navigation]);

  // Handle tab change
  const handleTabChange = useCallback((tab: KundliTab) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
  }, []);

  // Render tab content
  const renderTabContent = () => {
    if (loading || !reportData) {
      return <ReportSkeleton scale={scale} />;
    }

    switch (activeTab) {
      case 'general':
        return <GeneralTab data={reportData} scale={scale} />;
      case 'remedies':
        return <RemediesTab data={reportData} scale={scale} />;
      case 'dosha':
        return <DoshaTab data={reportData} scale={scale} />;
      case 'charts':
        return <ChartsTab data={reportData} scale={scale} />;
      case 'dasha':
        return <DashaTab data={reportData} scale={scale} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Yellow Background - Extends behind status bar */}
      <View style={[
        styles.headerBackground,
        {
          height: yellowHeaderHeight,
          borderBottomLeftRadius: 28 * scale,
          borderBottomRightRadius: 28 * scale,
        }
      ]} />

      {/* Content with safe area padding */}
      <View style={[styles.mainContent, { paddingTop: statusBarHeight }]}>

        {/* Header Row - On Yellow */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={24 * scale} color="#333333" />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { fontSize: 18 * scale }]}>
            Kundli Report
          </Text>

          <View style={styles.headerRight} />
        </View>

        {/* Subtitle - On Yellow */}
        <Text style={[styles.subtitle, { fontSize: 13 * scale }]}>
          See your generated birth chart here
        </Text>

        {/* Tab Switcher - On Yellow */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tabsContainer, { paddingHorizontal: 20 * scale }]}
          style={{ maxHeight: 50 * scale, marginTop: 12 * scale }}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                {
                  paddingVertical: 10 * scale,
                  paddingHorizontal: 20 * scale,
                  borderRadius: 25 * scale,
                  marginRight: 8 * scale,
                },
                activeTab === tab.key && styles.tabActive,
              ]}
              onPress={() => handleTabChange(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.tabText,
                { fontSize: 14 * scale },
                activeTab === tab.key && styles.tabTextActive,
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* White Content Area */}
        <View style={[styles.whiteContentArea, { marginTop: 16 * scale }]}>
          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#2930A6"
                colors={['#2930A6']}
              />
            }
            contentContainerStyle={{ paddingBottom: 120 * scale, paddingTop: 16 * scale }}
          >
            {renderTabContent()}
          </ScrollView>
        </View>

        {/* Bottom Navigation */}
        <BottomNavBar navigation={navigation} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  mainContent: {
    flex: 1,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFCF0D',
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 18,
    color: '#333333',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  subtitle: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 13,
    color: '#555555',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginTop: 2,
  },
  whiteContentArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    // Border instead of shadow for performance
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderBottomWidth: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2930A6',
  },
  tabActive: {
    backgroundColor: '#2930A6',
  },
  tabText: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 14,
    color: '#595959',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 16,
    color: '#1a1a1a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
  },
  infoLabel: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 12,
    color: '#888888',
  },
  infoValue: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 14,
    color: '#2930A6',
    marginTop: 2,
  },
  predictionText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 13,
    color: '#2930A6',
    lineHeight: 20,
  },
  planetsGrid: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  planetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  planetName: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 14,
    color: '#1a1a1a',
  },
  planetInfo: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 13,
    color: '#595959',
  },
  gemstoneCard: {
    backgroundColor: 'rgba(255, 207, 13, 0.15)',
    borderWidth: 1,
    borderColor: '#FFCF0D',
  },
  gemstoneName: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 18,
    color: '#1a1a1a',
  },
  gemstoneDetails: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 13,
    color: '#595959',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F0F0F0',
  },
  tagText: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 13,
    color: '#2930A6',
  },
  mantraItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  mantraText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 14,
    color: '#595959',
    fontStyle: 'italic',
  },
  doshaCard: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  doshaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doshaStatus: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 16,
  },
  doshaStatusActive: {
    color: '#EF4444',
  },
  doshaStatusInactive: {
    color: '#22C55E',
  },
  doshaDescription: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 13,
    color: '#595959',
    lineHeight: 20,
  },
  chartPlaceholder: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chartGrid: {
    width: '90%',
    aspectRatio: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: '#2930A6',
  },
  chartCell: {
    width: '25%',
    height: '25%',
    borderWidth: 0.5,
    borderColor: '#2930A6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  chartCellNumber: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 10,
    color: '#888888',
    position: 'absolute',
    top: 2,
    left: 4,
  },
  chartPlanetText: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 9,
    color: '#2930A6',
  },
  chartComingSoon: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 14,
    color: '#888888',
  },
  dashaCard: {
    backgroundColor: 'rgba(41, 48, 166, 0.08)',
    borderWidth: 1,
    borderColor: '#2930A6',
  },
  dashaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dashaLabel: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 13,
    color: '#595959',
  },
  dashaValue: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 14,
    color: '#2930A6',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineDot: {
    backgroundColor: '#2930A6',
    marginRight: 12,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 12,
  },
  timelinePlanet: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 15,
    color: '#1a1a1a',
  },
  timelineDates: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
});

export default KundliReportScreen;
