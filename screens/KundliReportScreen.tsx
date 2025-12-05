/**
 * KundliReportScreen
 * Displays generated Kundli report with 5 tabs
 * Tabs: General | Remedies | Dosha | Charts | Dasha
 *
 * Enhanced with:
 * - Yogas display
 * - Multiple predictions (career, love, health)
 * - SVG chart support with style toggle
 * - Pratyantardasha in Dasha
 * - Charities and enhanced remedies
 * - Dosha remedies display
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
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  FadeInDown,
} from 'react-native-reanimated';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { SvgUri } from 'react-native-svg';

import { BottomNavBar } from '../components/BottomNavBar';
import { ShimmerEffect } from '../components/skeleton/ShimmerEffect';
import { useResponsiveLayout } from '../src/utils/responsive';
import {
  KundliReportData,
  ChartStyle,
  YogaInfo,
  MantraInfo,
  CharityInfo,
} from '../src/types/kundli';
import { kundliService, KundliReportParams } from '../src/services/kundli.service';

// Tab configuration
type KundliTab = 'general' | 'remedies' | 'dosha' | 'charts' | 'dasha';

const TABS: { key: KundliTab; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'remedies', label: 'Remedies' },
  { key: 'dosha', label: 'Dosha' },
  { key: 'charts', label: 'Charts' },
  { key: 'dasha', label: 'Dasha' },
];

// Helper function to format dates
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

// Helper to get mantra text
const getMantraText = (mantra: string | MantraInfo): string => {
  return typeof mantra === 'string' ? mantra : mantra.mantra;
};

// Helper to get charity text
const getCharityText = (charity: string | CharityInfo): string => {
  if (typeof charity === 'string') return charity;
  return `${charity.item} on ${charity.day}${charity.recipient ? ` to ${charity.recipient}` : ''}`;
};

// Fallback report data when API fails
const getFallbackReportData = (): KundliReportData => ({
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
    { planet: 'Jupiter', startDate: '2020-03-15', endDate: '2036-03-15', durationYears: 16 },
    { planet: 'Saturn', startDate: '2036-03-15', endDate: '2055-03-15', durationYears: 19 },
    { planet: 'Mercury', startDate: '2055-03-15', endDate: '2072-03-15', durationYears: 17 },
  ],
  remedies: {
    gemstone: { name: 'Yellow Sapphire', finger: 'Index', metal: 'Gold' },
    luckyColors: ['Yellow', 'Orange', 'Gold'],
    luckyNumbers: [3, 9, 12],
    luckyDays: ['Thursday', 'Sunday'],
    mantras: ['Om Guru Devaya Namaha', 'Om Brim Brihaspataye Namaha'],
  },
  predictions: {
    general: 'The sun in your chart brings intense focus, while passionate energy drives determination. Jupiter\'s placement indicates wisdom and spiritual growth. Your chart shows strong potential for success in education, teaching, and advisory roles.',
  },
});

// ==================== TAB COMPONENTS ====================

// General Tab Component
const GeneralTab = ({ data, scale }: { data: KundliReportData; scale: number }) => (
  <Animated.View entering={FadeInDown.duration(400)} style={styles.tabContent}>
    {/* Birth Details */}
    <View style={[styles.section, { marginBottom: 20 * scale }]}>
      <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Birth Details</Text>
      <View style={[styles.infoGrid, { marginTop: 12 * scale }]}>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { fontSize: 12 * scale }]}>Nakshatra</Text>
          <Text style={[styles.infoValue, { fontSize: 14 * scale }]}>
            {data.nakshatra.name} (Pada {data.nakshatra.pada})
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { fontSize: 12 * scale }]}>Rasi</Text>
          <Text style={[styles.infoValue, { fontSize: 14 * scale }]}>{data.rasi.name}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { fontSize: 12 * scale }]}>Lagna</Text>
          <Text style={[styles.infoValue, { fontSize: 14 * scale }]}>{data.lagna.name}</Text>
        </View>
        {data.nakshatra.deity && (
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { fontSize: 12 * scale }]}>Deity</Text>
            <Text style={[styles.infoValue, { fontSize: 14 * scale }]}>{data.nakshatra.deity}</Text>
          </View>
        )}
        {data.nakshatra.ganam && (
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { fontSize: 12 * scale }]}>Gana</Text>
            <Text style={[styles.infoValue, { fontSize: 14 * scale }]}>{data.nakshatra.ganam}</Text>
          </View>
        )}
        {data.nakshatra.nadi && (
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { fontSize: 12 * scale }]}>Nadi</Text>
            <Text style={[styles.infoValue, { fontSize: 14 * scale }]}>{data.nakshatra.nadi}</Text>
          </View>
        )}
      </View>
    </View>

    {/* Yogas Section */}
    {data.yogas && data.yogas.filter(y => y.hasYoga).length > 0 && (
      <View style={[styles.section, { marginBottom: 20 * scale }]}>
        <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>YOGAS</Text>
        {data.yogas.filter(y => y.hasYoga).map((yoga, index) => (
          <View
            key={index}
            style={[styles.yogaCard, { padding: 12 * scale, marginTop: 8 * scale, borderRadius: 8 * scale }]}
          >
            <View style={styles.yogaHeader}>
              <Text style={[styles.yogaName, { fontSize: 14 * scale }]}>{yoga.name}</Text>
              {yoga.strength && (
                <View style={[
                  styles.strengthBadge,
                  yoga.strength === 'strong' ? styles.strengthStrong :
                  yoga.strength === 'moderate' ? styles.strengthModerate : styles.strengthWeak
                ]}>
                  <Text style={[styles.strengthText, { fontSize: 10 * scale }]}>{yoga.strength}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.yogaDescription, { fontSize: 13 * scale, marginTop: 4 * scale }]}>
              {yoga.description}
            </Text>
            {yoga.effects && (
              <Text style={[styles.yogaEffects, { fontSize: 12 * scale, marginTop: 4 * scale }]}>
                Effects: {yoga.effects}
              </Text>
            )}
          </View>
        ))}
      </View>
    )}

    {/* General Prediction */}
    <View style={[styles.section, { marginBottom: 20 * scale }]}>
      <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>GENERAL</Text>
      <Text style={[styles.predictionText, { fontSize: 13 * scale, marginTop: 12 * scale }]}>
        {data.predictions.general}
      </Text>
    </View>

    {/* Career Prediction */}
    {data.predictions.career && (
      <View style={[styles.section, { marginBottom: 20 * scale }]}>
        <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>CAREER</Text>
        <Text style={[styles.predictionText, { fontSize: 13 * scale, marginTop: 12 * scale }]}>
          {data.predictions.career}
        </Text>
      </View>
    )}

    {/* Love Prediction */}
    {data.predictions.love && (
      <View style={[styles.section, { marginBottom: 20 * scale }]}>
        <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>LOVE & RELATIONSHIPS</Text>
        <Text style={[styles.predictionText, { fontSize: 13 * scale, marginTop: 12 * scale }]}>
          {data.predictions.love}
        </Text>
      </View>
    )}

    {/* Health Prediction */}
    {data.predictions.health && (
      <View style={[styles.section, { marginBottom: 20 * scale }]}>
        <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>HEALTH</Text>
        <Text style={[styles.predictionText, { fontSize: 13 * scale, marginTop: 12 * scale }]}>
          {data.predictions.health}
        </Text>
      </View>
    )}

    {/* Planetary Positions */}
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Planetary Positions</Text>
      <View style={[styles.planetsGrid, { marginTop: 12 * scale }]}>
        {data.planets.map((planet, index) => (
          <View key={index} style={[styles.planetRow, { paddingVertical: 10 * scale }]}>
            <View style={styles.planetNameContainer}>
              <Text style={[styles.planetName, { fontSize: 14 * scale }]}>
                {planet.name}
              </Text>
              <View style={styles.planetBadges}>
                {planet.isRetrograde && (
                  <View style={styles.retroBadge}>
                    <Text style={[styles.retroText, { fontSize: 9 * scale }]}>R</Text>
                  </View>
                )}
                {planet.isExalted && (
                  <View style={styles.exaltedBadge}>
                    <Text style={[styles.exaltedText, { fontSize: 9 * scale }]}>Ex</Text>
                  </View>
                )}
                {planet.isDebilitated && (
                  <View style={styles.debilitatedBadge}>
                    <Text style={[styles.debilitatedText, { fontSize: 9 * scale }]}>Db</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.planetDetails}>
              <Text style={[styles.planetInfo, { fontSize: 13 * scale }]}>
                {planet.sign} - {planet.degreeFormatted || `${planet.degree.toFixed(1)}°`}
              </Text>
              {planet.nakshatra && (
                <Text style={[styles.planetNakshatra, { fontSize: 11 * scale }]}>
                  {planet.nakshatra} {planet.nakshatraPada ? `(${planet.nakshatraPada})` : ''}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  </Animated.View>
);

// Remedies Tab Component
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
        {data.remedies.gemstone.weight && (
          <Text style={[styles.gemstoneDetails, { fontSize: 12 * scale, marginTop: 4 * scale }]}>
            Weight: {data.remedies.gemstone.weight}
          </Text>
        )}
        {data.remedies.gemstone.day && (
          <Text style={[styles.gemstoneDetails, { fontSize: 12 * scale, marginTop: 4 * scale }]}>
            Best day to wear: {data.remedies.gemstone.day}
          </Text>
        )}
        {data.remedies.gemstone.time && (
          <Text style={[styles.gemstoneDetails, { fontSize: 12 * scale, marginTop: 4 * scale }]}>
            Timing: {data.remedies.gemstone.time}
          </Text>
        )}
      </View>
    </View>

    {/* Lucky Colors */}
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

    {/* Lucky Numbers */}
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

    {/* Lucky Days */}
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

    {/* Lucky Direction */}
    {data.remedies.luckyDirection && (
      <View style={[styles.section, { marginBottom: 20 * scale }]}>
        <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Lucky Direction</Text>
        <View style={[styles.tagsRow, { marginTop: 12 * scale }]}>
          <View style={[styles.tag, { paddingHorizontal: 16 * scale, paddingVertical: 8 * scale, borderRadius: 20 * scale }]}>
            <Text style={[styles.tagText, { fontSize: 13 * scale }]}>{data.remedies.luckyDirection}</Text>
          </View>
        </View>
      </View>
    )}

    {/* Mantras */}
    <View style={[styles.section, { marginBottom: 20 * scale }]}>
      <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Recommended Mantras</Text>
      {data.remedies.mantras.map((mantra, index) => (
        <View key={index} style={[styles.mantraItem, { paddingVertical: 12 * scale, marginTop: index === 0 ? 12 * scale : 0 }]}>
          <Text style={[styles.mantraText, { fontSize: 14 * scale }]}>{getMantraText(mantra)}</Text>
          {typeof mantra !== 'string' && mantra.repetitions && (
            <Text style={[styles.mantraRepetitions, { fontSize: 11 * scale }]}>
              Repeat {mantra.repetitions} times {mantra.timing ? `- ${mantra.timing}` : ''}
            </Text>
          )}
        </View>
      ))}
    </View>

    {/* Charities */}
    {data.remedies.charities && data.remedies.charities.length > 0 && (
      <View style={[styles.section, { marginBottom: 20 * scale }]}>
        <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Recommended Charities</Text>
        {data.remedies.charities.map((charity, index) => (
          <View key={index} style={[styles.charityItem, { paddingVertical: 12 * scale, marginTop: index === 0 ? 12 * scale : 0 }]}>
            <Text style={[styles.charityText, { fontSize: 14 * scale }]}>{getCharityText(charity)}</Text>
          </View>
        ))}
      </View>
    )}

    {/* Fasting */}
    {data.remedies.fasting && (
      <View style={[styles.section, { marginBottom: 20 * scale }]}>
        <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Fasting</Text>
        <View style={[styles.fastingCard, { padding: 12 * scale, marginTop: 12 * scale, borderRadius: 8 * scale }]}>
          <Text style={[styles.fastingDay, { fontSize: 14 * scale }]}>
            Recommended day: {data.remedies.fasting.day}
          </Text>
          {data.remedies.fasting.description && (
            <Text style={[styles.fastingDesc, { fontSize: 13 * scale, marginTop: 4 * scale }]}>
              {data.remedies.fasting.description}
            </Text>
          )}
        </View>
      </View>
    )}

    {/* Rudrakshas */}
    {data.remedies.rudrakshas && data.remedies.rudrakshas.length > 0 && (
      <View style={[styles.section, { marginBottom: 20 * scale }]}>
        <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Recommended Rudrakshas</Text>
        <View style={[styles.tagsRow, { marginTop: 12 * scale }]}>
          {data.remedies.rudrakshas.map((rudraksha, index) => (
            <View key={index} style={[styles.tag, { paddingHorizontal: 16 * scale, paddingVertical: 8 * scale, borderRadius: 20 * scale }]}>
              <Text style={[styles.tagText, { fontSize: 13 * scale }]}>{rudraksha}</Text>
            </View>
          ))}
        </View>
      </View>
    )}
  </Animated.View>
);

// Dosha Tab Component
const DoshaTab = ({ data, scale }: { data: KundliReportData; scale: number }) => (
  <Animated.View entering={FadeInDown.duration(400)} style={styles.tabContent}>
    {/* Mangal Dosha */}
    <View style={[styles.section, { marginBottom: 20 * scale }]}>
      <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Mangal Dosha</Text>
      <View style={[styles.doshaCard, { padding: 16 * scale, marginTop: 12 * scale, borderRadius: 12 * scale }]}>
        <View style={styles.doshaHeader}>
          <Text style={[
            styles.doshaStatus,
            { fontSize: 16 * scale },
            data.mangalDosha.hasDosha ? styles.doshaStatusActive : styles.doshaStatusInactive
          ]}>
            {data.mangalDosha.hasDosha ? 'Present' : 'Not Present'}
          </Text>
          {data.mangalDosha.hasDosha && data.mangalDosha.severity !== 'none' && (
            <View style={[
              styles.severityBadge,
              data.mangalDosha.severity === 'severe' ? styles.severitySevere :
              data.mangalDosha.severity === 'moderate' ? styles.severityModerate : styles.severityMild
            ]}>
              <Text style={[styles.severityText, { fontSize: 10 * scale }]}>{data.mangalDosha.severity}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.doshaDescription, { fontSize: 13 * scale, marginTop: 8 * scale }]}>
          {data.mangalDosha.description}
        </Text>

        {/* Show remedies if dosha present */}
        {data.mangalDosha.hasDosha && data.mangalDosha.remedies && data.mangalDosha.remedies.length > 0 && (
          <View style={[styles.doshaRemediesSection, { marginTop: 12 * scale }]}>
            <Text style={[styles.doshaRemediesTitle, { fontSize: 14 * scale }]}>Remedies:</Text>
            {data.mangalDosha.remedies.map((remedy, idx) => (
              <Text key={idx} style={[styles.doshaRemedyItem, { fontSize: 13 * scale }]}>
                • {remedy}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>

    {/* Kaal Sarp Dosha */}
    <View style={[styles.section, { marginBottom: 20 * scale }]}>
      <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Kaal Sarp Dosha</Text>
      <View style={[styles.doshaCard, { padding: 16 * scale, marginTop: 12 * scale, borderRadius: 12 * scale }]}>
        <View style={styles.doshaHeader}>
          <Text style={[
            styles.doshaStatus,
            { fontSize: 16 * scale },
            data.kaalSarpDosha.hasDosha ? styles.doshaStatusActive : styles.doshaStatusInactive
          ]}>
            {data.kaalSarpDosha.hasDosha ? `Present (${data.kaalSarpDosha.type})` : 'Not Present'}
          </Text>
        </View>
        <Text style={[styles.doshaDescription, { fontSize: 13 * scale, marginTop: 8 * scale }]}>
          {data.kaalSarpDosha.description}
        </Text>

        {/* Show remedies if dosha present */}
        {data.kaalSarpDosha.hasDosha && data.kaalSarpDosha.remedies && data.kaalSarpDosha.remedies.length > 0 && (
          <View style={[styles.doshaRemediesSection, { marginTop: 12 * scale }]}>
            <Text style={[styles.doshaRemediesTitle, { fontSize: 14 * scale }]}>Remedies:</Text>
            {data.kaalSarpDosha.remedies.map((remedy, idx) => (
              <Text key={idx} style={[styles.doshaRemedyItem, { fontSize: 13 * scale }]}>
                • {remedy}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>

    {/* Sade Sati */}
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Sade Sati</Text>
      <View style={[styles.doshaCard, { padding: 16 * scale, marginTop: 12 * scale, borderRadius: 12 * scale }]}>
        <View style={styles.doshaHeader}>
          <Text style={[
            styles.doshaStatus,
            { fontSize: 16 * scale },
            data.sadeSati.isActive ? styles.doshaStatusActive : styles.doshaStatusInactive
          ]}>
            {data.sadeSati.isActive ? `Active (${data.sadeSati.phase})` : 'Not Active'}
          </Text>
        </View>
        {data.sadeSati.description && (
          <Text style={[styles.doshaDescription, { fontSize: 13 * scale, marginTop: 8 * scale }]}>
            {data.sadeSati.description}
          </Text>
        )}
        {data.sadeSati.isActive && data.sadeSati.startDate && data.sadeSati.endDate && (
          <Text style={[styles.doshaDescription, { fontSize: 13 * scale, marginTop: 8 * scale }]}>
            Period: {formatDate(data.sadeSati.startDate)} to {formatDate(data.sadeSati.endDate)}
          </Text>
        )}
        {data.sadeSati.currentTransit && (
          <View style={[styles.transitInfo, { marginTop: 8 * scale }]}>
            <Text style={[styles.transitText, { fontSize: 12 * scale }]}>
              Saturn currently in {data.sadeSati.currentTransit.sign}
              {data.sadeSati.currentTransit.isRetrograde ? ' (Retrograde)' : ''}
            </Text>
          </View>
        )}
      </View>
    </View>
  </Animated.View>
);

// Helper function to check if charts have valid URLs
const hasValidCharts = (charts: KundliReportData['charts'], style: 'south' | 'north'): boolean => {
  if (!charts) return false;
  const allCharts = [charts.rasiChart, charts.navamsaChart, charts.dasamsaChart, charts.saptamsaChart];
  return allCharts.some(chart => {
    if (!chart) return false;
    const url = style === 'south' ? chart.svgUrl : chart.svgUrlNorth;
    return url && url.trim() !== '';
  });
};

// Charts Tab Component
const ChartsTab = ({
  data,
  scale,
  chartStyle,
  onStyleChange
}: {
  data: KundliReportData;
  scale: number;
  chartStyle: 'south' | 'north';
  onStyleChange: (style: 'south' | 'north') => void;
}) => {
  // Filter charts that have valid URLs for the current style
  const charts = [
    { key: 'rasiChart', title: 'Rasi Chart (D1)', data: data.charts?.rasiChart },
    { key: 'navamsaChart', title: 'Navamsa Chart (D9)', data: data.charts?.navamsaChart },
    { key: 'dasamsaChart', title: 'Dasamsa Chart (D10)', data: data.charts?.dasamsaChart },
    { key: 'saptamsaChart', title: 'Saptamsa Chart (D7)', data: data.charts?.saptamsaChart },
  ].filter(c => {
    if (!c.data) return false;
    const url = chartStyle === 'south' ? c.data.svgUrl : c.data.svgUrlNorth;
    return url && url.trim() !== '';
  });

  // If no valid charts, don't render anything
  if (charts.length === 0) {
    return null;
  }

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.tabContent}>
      {/* Chart Style Toggle */}
      <View style={[styles.styleToggle, { marginBottom: 16 * scale }]}>
        <TouchableOpacity
          style={[styles.toggleBtn, chartStyle === 'south' && styles.toggleActive]}
          onPress={() => onStyleChange('south')}
        >
          <Text style={[
            styles.toggleText,
            { fontSize: 13 * scale },
            chartStyle === 'south' && styles.toggleTextActive
          ]}>South Indian</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, chartStyle === 'north' && styles.toggleActive]}
          onPress={() => onStyleChange('north')}
        >
          <Text style={[
            styles.toggleText,
            { fontSize: 13 * scale },
            chartStyle === 'north' && styles.toggleTextActive
          ]}>North Indian</Text>
        </TouchableOpacity>
      </View>

      {/* Render charts with valid URLs */}
      {charts.map((chart) => {
        const svgUrl = chartStyle === 'south' ? chart.data!.svgUrl : chart.data!.svgUrlNorth;
        return (
          <View key={chart.key} style={[styles.section, { marginBottom: 24 * scale }]}>
            <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>{chart.title}</Text>
            <View style={{ marginTop: 12 * scale }}>
              <SvgUri
                width="100%"
                height={undefined}
                uri={svgUrl}
                style={{ aspectRatio: 1 }}
              />
            </View>
          </View>
        );
      })}
    </Animated.View>
  );
};

// Dasha Tab Component
const DashaTab = ({ data, scale }: { data: KundliReportData; scale: number }) => (
  <Animated.View entering={FadeInDown.duration(400)} style={styles.tabContent}>
    {/* Current Dasha */}
    <View style={[styles.section, { marginBottom: 20 * scale }]}>
      <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Current Dasha Period</Text>
      <View style={[styles.dashaCard, { padding: 16 * scale, marginTop: 12 * scale, borderRadius: 12 * scale }]}>
        {/* Mahadasha */}
        <View style={styles.dashaRow}>
          <Text style={[styles.dashaLabel, { fontSize: 13 * scale }]}>Mahadasha</Text>
          <View style={styles.dashaValueContainer}>
            <Text style={[styles.dashaValue, { fontSize: 14 * scale }]}>
              {data.currentDasha.mahadasha.planet}
            </Text>
            {data.currentDasha.mahadasha.yearsRemaining !== undefined && (
              <Text style={[styles.dashaRemaining, { fontSize: 11 * scale }]}>
                ({data.currentDasha.mahadasha.yearsRemaining} years remaining)
              </Text>
            )}
          </View>
        </View>

        {/* Antardasha */}
        <View style={[styles.dashaRow, { marginTop: 12 * scale }]}>
          <Text style={[styles.dashaLabel, { fontSize: 13 * scale }]}>Antardasha</Text>
          <View style={styles.dashaValueContainer}>
            <Text style={[styles.dashaValue, { fontSize: 14 * scale }]}>
              {data.currentDasha.antardasha.planet}
            </Text>
            {data.currentDasha.antardasha.monthsRemaining !== undefined && (
              <Text style={[styles.dashaRemaining, { fontSize: 11 * scale }]}>
                ({data.currentDasha.antardasha.monthsRemaining} months remaining)
              </Text>
            )}
          </View>
        </View>

        {/* Pratyantardasha */}
        {data.currentDasha.pratyantardasha && (
          <View style={[styles.dashaRow, { marginTop: 12 * scale }]}>
            <Text style={[styles.dashaLabel, { fontSize: 13 * scale }]}>Pratyantardasha</Text>
            <View style={styles.dashaValueContainer}>
              <Text style={[styles.dashaValue, { fontSize: 14 * scale }]}>
                {data.currentDasha.pratyantardasha.planet}
              </Text>
              {data.currentDasha.pratyantardasha.daysRemaining !== undefined && (
                <Text style={[styles.dashaRemaining, { fontSize: 11 * scale }]}>
                  ({data.currentDasha.pratyantardasha.daysRemaining} days remaining)
                </Text>
              )}
            </View>
          </View>
        )}
      </View>
    </View>

    {/* Dasha Timeline */}
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>Dasha Timeline</Text>
      <View style={{ marginTop: 12 * scale }}>
        {data.dashaPeriods.map((period, index) => (
          <View
            key={index}
            style={[
              styles.timelineItem,
              { paddingVertical: 12 * scale },
              period.isCurrent && styles.timelineItemCurrent
            ]}
          >
            <View style={[
              styles.timelineDot,
              { width: 12 * scale, height: 12 * scale, borderRadius: 6 * scale },
              period.isCurrent && styles.timelineDotCurrent
            ]} />
            <View style={styles.timelineContent}>
              <View style={styles.timelineHeader}>
                <Text style={[styles.timelinePlanet, { fontSize: 15 * scale }]}>
                  {period.planet} Mahadasha
                </Text>
                {period.durationYears && (
                  <Text style={[styles.timelineDuration, { fontSize: 12 * scale }]}>
                    {period.durationYears} years
                  </Text>
                )}
              </View>
              <Text style={[styles.timelineDates, { fontSize: 12 * scale }]}>
                {formatDate(period.startDate)} - {formatDate(period.endDate)}
              </Text>
              {period.isCurrent && (
                <View style={[styles.currentBadge, { marginTop: 4 * scale }]}>
                  <Text style={[styles.currentBadgeText, { fontSize: 10 * scale }]}>Current</Text>
                </View>
              )}
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

// ==================== MAIN COMPONENT ====================

const KundliReportScreen = ({ navigation, route }: any) => {
  const { scale } = useResponsiveLayout();
  const { kundliId, kundliData } = route.params || {};
  const insets = useSafeAreaInsets();

  // Status bar height for proper spacing
  const statusBarHeight = Platform.OS === 'ios' ? insets.top : RNStatusBar.currentHeight || 24;

  // Yellow header height (hero report: larger for subtitle and tabs)
  const yellowHeaderHeight = 180 * scale + statusBarHeight;

  const [activeTab, setActiveTab] = useState<KundliTab>('general');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState<KundliReportData | null>(null);
  const [chartStyle, setChartStyle] = useState<'south' | 'north'>('south');

  // Map API response to KundliReportData format
  const mapReportData = (report: any): KundliReportData => {
    return {
      nakshatra: {
        name: report.basicInfo?.nakshatra?.name || 'Unknown',
        lord: report.basicInfo?.nakshatra?.lord || 'Unknown',
        pada: report.basicInfo?.nakshatra?.pada || 1,
        deity: report.basicInfo?.nakshatra?.deity,
        symbol: report.basicInfo?.nakshatra?.symbol,
        ganam: report.basicInfo?.nakshatra?.ganam,
        nadi: report.basicInfo?.nakshatra?.nadi,
        animal: report.basicInfo?.nakshatra?.animal,
        syllables: report.basicInfo?.nakshatra?.syllables,
      },
      rasi: {
        name: report.basicInfo?.rasi?.name || 'Unknown',
        lord: report.basicInfo?.rasi?.lord || 'Unknown',
        element: report.basicInfo?.rasi?.element,
      },
      lagna: {
        name: report.basicInfo?.lagna?.name || 'Unknown',
        lord: report.basicInfo?.lagna?.lord || 'Unknown',
        degree: report.basicInfo?.lagna?.degree,
      },
      tithi: report.basicInfo?.tithi,
      yoga: report.basicInfo?.yoga,
      karana: report.basicInfo?.karana,
      sunSign: report.basicInfo?.sunSign,
      moonSign: report.basicInfo?.moonSign,
      planets: (report.planets || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        sign: p.sign,
        signLord: p.signLord,
        degree: p.degree,
        degreeFormatted: p.degreeFormatted,
        isRetrograde: p.isRetrograde,
        isCombust: p.isCombust,
        isExalted: p.isExalted,
        isDebilitated: p.isDebilitated,
        house: p.house,
        nakshatra: p.nakshatra,
        nakshatraLord: p.nakshatraLord,
        nakshatraPada: p.nakshatraPada,
      })),
      yogas: report.yogas,
      charts: report.charts,
      mangalDosha: {
        hasDosha: report.doshas?.mangalDosha?.hasDosha || false,
        severity: (report.doshas?.mangalDosha?.severity as 'none' | 'mild' | 'severe') || 'none',
        type: report.doshas?.mangalDosha?.type,
        description: report.doshas?.mangalDosha?.description || 'Unable to calculate',
        remedies: report.doshas?.mangalDosha?.remedies || [],
        affectedHouses: report.doshas?.mangalDosha?.affectedHouses,
        exceptions: report.doshas?.mangalDosha?.exceptions,
      },
      kaalSarpDosha: {
        hasDosha: report.doshas?.kaalSarpDosha?.hasDosha || false,
        severity: (report.doshas?.kaalSarpDosha?.severity as 'none' | 'mild' | 'severe') || 'none',
        type: report.doshas?.kaalSarpDosha?.type || 'None',
        description: report.doshas?.kaalSarpDosha?.description || 'Unable to calculate',
        remedies: report.doshas?.kaalSarpDosha?.remedies || [],
      },
      sadeSati: {
        isActive: report.doshas?.sadeSati?.isActive || false,
        phase: report.doshas?.sadeSati?.phase || 'None',
        description: report.doshas?.sadeSati?.description,
        startDate: report.doshas?.sadeSati?.startDate || '',
        endDate: report.doshas?.sadeSati?.endDate || '',
        saturnSign: report.doshas?.sadeSati?.saturnSign,
        moonSign: report.doshas?.sadeSati?.moonSign,
        currentTransit: report.doshas?.sadeSati?.currentTransit,
      },
      currentDasha: {
        mahadasha: {
          planet: report.dasha?.current?.mahadasha?.planet || 'Unknown',
          startDate: report.dasha?.current?.mahadasha?.startDate || '',
          endDate: report.dasha?.current?.mahadasha?.endDate || '',
          yearsRemaining: report.dasha?.current?.mahadasha?.yearsRemaining,
          totalYears: report.dasha?.current?.mahadasha?.totalYears,
        },
        antardasha: {
          planet: report.dasha?.current?.antardasha?.planet || 'Unknown',
          startDate: report.dasha?.current?.antardasha?.startDate || '',
          endDate: report.dasha?.current?.antardasha?.endDate || '',
          monthsRemaining: report.dasha?.current?.antardasha?.monthsRemaining,
        },
        pratyantardasha: report.dasha?.current?.pratyantardasha ? {
          planet: report.dasha.current.pratyantardasha.planet,
          startDate: report.dasha.current.pratyantardasha.startDate,
          endDate: report.dasha.current.pratyantardasha.endDate,
          daysRemaining: report.dasha.current.pratyantardasha.daysRemaining,
        } : undefined,
      },
      dashaPeriods: (report.dasha?.timeline || []).map((t: any) => ({
        planet: t.planet,
        startDate: t.startDate,
        endDate: t.endDate,
        durationYears: t.durationYears,
        isCurrent: t.isCurrent,
      })),
      remedies: {
        gemstone: {
          name: report.remedies?.gemstone?.name || 'Unknown',
          planet: report.remedies?.gemstone?.planet,
          finger: report.remedies?.gemstone?.finger || 'Unknown',
          hand: report.remedies?.gemstone?.hand,
          metal: report.remedies?.gemstone?.metal || 'Unknown',
          weight: report.remedies?.gemstone?.weight,
          day: report.remedies?.gemstone?.day,
          time: report.remedies?.gemstone?.time,
          mantra: report.remedies?.gemstone?.mantra,
        },
        luckyColors: report.remedies?.luckyColors || [],
        luckyNumbers: report.remedies?.luckyNumbers || [],
        luckyDays: report.remedies?.luckyDays || [],
        luckyDirection: report.remedies?.luckyDirection,
        mantras: report.remedies?.mantras || [],
        charities: report.remedies?.charities,
        fasting: report.remedies?.fasting,
        rudrakshas: report.remedies?.rudrakshas,
        yantras: report.remedies?.yantras,
      },
      predictions: {
        general: report.predictions?.general || 'Your birth chart analysis is being processed.',
        career: report.predictions?.career,
        love: report.predictions?.love,
        health: report.predictions?.health,
        finance: report.predictions?.finance,
        family: report.predictions?.family,
        education: report.predictions?.education,
      },
    };
  };

  // Fetch report data from API
  const fetchReportData = useCallback(async (refresh: boolean = false) => {
    if (!kundliId) {
      setReportData(getFallbackReportData());
      setLoading(false);
      return;
    }

    try {
      const params: KundliReportParams = {
        language: 'en',
        chartStyle: chartStyle === 'south' ? 'south_indian' : 'north_indian',
        refresh,
      };

      const report = await kundliService.getReport(kundliId, params);
      const mappedData = mapReportData(report);
      setReportData(mappedData);
    } catch (error) {
      console.warn('Failed to fetch kundli report from API:', error);
      setReportData(getFallbackReportData());
    } finally {
      setLoading(false);
    }
  }, [kundliId, chartStyle]);

  // Fetch report on mount
  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchReportData(true);
    setRefreshing(false);
  }, [fetchReportData]);

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

  // Handle chart style change
  const handleChartStyleChange = useCallback((style: 'south' | 'north') => {
    Haptics.selectionAsync();
    setChartStyle(style);
  }, []);

  // Filter tabs - hide Charts tab if no valid charts available
  const visibleTabs = useMemo(() => {
    if (!reportData) return TABS;

    // Check if charts have valid URLs for either style
    const chartsAvailable = hasValidCharts(reportData.charts, 'south') ||
                           hasValidCharts(reportData.charts, 'north');

    if (!chartsAvailable) {
      return TABS.filter(tab => tab.key !== 'charts');
    }
    return TABS;
  }, [reportData]);

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
        return (
          <ChartsTab
            data={reportData}
            scale={scale}
            chartStyle={chartStyle}
            onStyleChange={handleChartStyleChange}
          />
        );
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
          {visibleTabs.map((tab) => (
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

// ==================== STYLES ====================

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

  // Info Grid
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

  // Yogas
  yogaCard: {
    backgroundColor: '#F8F9FA',
    borderLeftWidth: 3,
    borderLeftColor: '#2930A6',
  },
  yogaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  yogaName: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#1a1a1a',
    flex: 1,
  },
  yogaDescription: {
    fontFamily: 'Lexend_400Regular',
    color: '#595959',
  },
  yogaEffects: {
    fontFamily: 'Lexend_400Regular',
    color: '#2930A6',
    fontStyle: 'italic',
  },
  strengthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  strengthStrong: {
    backgroundColor: '#D1FAE5',
  },
  strengthModerate: {
    backgroundColor: '#FEF3C7',
  },
  strengthWeak: {
    backgroundColor: '#FEE2E2',
  },
  strengthText: {
    fontFamily: 'Lexend_500Medium',
    textTransform: 'capitalize',
    color: '#1a1a1a',
  },

  // Predictions
  predictionText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 13,
    color: '#2930A6',
    lineHeight: 20,
  },

  // Planets
  planetsGrid: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  planetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  planetNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planetName: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 14,
    color: '#1a1a1a',
  },
  planetBadges: {
    flexDirection: 'row',
    marginLeft: 6,
    gap: 4,
  },
  retroBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  retroText: {
    fontFamily: 'Lexend_500Medium',
    color: '#EF4444',
  },
  exaltedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  exaltedText: {
    fontFamily: 'Lexend_500Medium',
    color: '#22C55E',
  },
  debilitatedBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  debilitatedText: {
    fontFamily: 'Lexend_500Medium',
    color: '#F59E0B',
  },
  planetDetails: {
    alignItems: 'flex-end',
  },
  planetInfo: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 13,
    color: '#595959',
  },
  planetNakshatra: {
    fontFamily: 'Lexend_400Regular',
    color: '#888888',
  },

  // Gemstone
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

  // Tags
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

  // Mantras
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
  mantraRepetitions: {
    fontFamily: 'Lexend_400Regular',
    color: '#888888',
    marginTop: 4,
  },

  // Charities
  charityItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  charityText: {
    fontFamily: 'Lexend_400Regular',
    color: '#595959',
  },

  // Fasting
  fastingCard: {
    backgroundColor: '#FEF3C7',
  },
  fastingDay: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#1a1a1a',
  },
  fastingDesc: {
    fontFamily: 'Lexend_400Regular',
    color: '#595959',
  },

  // Dosha
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
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  severityMild: {
    backgroundColor: '#FEF3C7',
  },
  severityModerate: {
    backgroundColor: '#FED7AA',
  },
  severitySevere: {
    backgroundColor: '#FEE2E2',
  },
  severityText: {
    fontFamily: 'Lexend_500Medium',
    textTransform: 'capitalize',
    color: '#1a1a1a',
  },
  doshaRemediesSection: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  doshaRemediesTitle: {
    fontFamily: 'Lexend_600SemiBold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  doshaRemedyItem: {
    fontFamily: 'Lexend_400Regular',
    color: '#595959',
    marginBottom: 4,
  },
  transitInfo: {
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 6,
  },
  transitText: {
    fontFamily: 'Lexend_400Regular',
    color: '#2930A6',
  },

  // Charts
  styleToggle: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleActive: {
    backgroundColor: '#2930A6',
  },
  toggleText: {
    fontFamily: 'Lexend_500Medium',
    color: '#595959',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  // Dasha
  dashaCard: {
    backgroundColor: 'rgba(41, 48, 166, 0.08)',
    borderWidth: 1,
    borderColor: '#2930A6',
  },
  dashaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dashaLabel: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 13,
    color: '#595959',
  },
  dashaValueContainer: {
    alignItems: 'flex-end',
  },
  dashaValue: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 14,
    color: '#2930A6',
  },
  dashaRemaining: {
    fontFamily: 'Lexend_400Regular',
    color: '#888888',
    marginTop: 2,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineItemCurrent: {
    backgroundColor: 'rgba(41, 48, 166, 0.05)',
    borderRadius: 8,
    marginHorizontal: -8,
    paddingHorizontal: 8,
  },
  timelineDot: {
    backgroundColor: '#2930A6',
    marginRight: 12,
    marginTop: 4,
  },
  timelineDotCurrent: {
    backgroundColor: '#22C55E',
  },
  timelineContent: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 12,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelinePlanet: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 15,
    color: '#1a1a1a',
  },
  timelineDuration: {
    fontFamily: 'Lexend_400Regular',
    color: '#888888',
  },
  timelineDates: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  currentBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  currentBadgeText: {
    fontFamily: 'Lexend_500Medium',
    color: '#FFFFFF',
  },
});

export default KundliReportScreen;
