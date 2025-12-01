/**
 * KundliMatchingReportScreen
 * Displays Kundli Matching compatibility results with Ashtakoot analysis
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import {
  ChevronLeft,
  Heart,
  Share2,
  ChevronDown,
  ChevronUp,
  Star,
  Check,
  X,
  AlertCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

import { BottomNavBar } from '../components/BottomNavBar';
import { ShimmerEffect } from '../components/skeleton/ShimmerEffect';
import { useResponsiveLayout } from '../src/utils/responsive';
import { SavedMatching } from '../src/types/kundli';

// Ashtakoot Guna data structure
interface GunaItem {
  id: string;
  name: string;
  maxPoints: number;
  obtainedPoints: number;
  description: string;
  boyAttribute: string;
  girlAttribute: string;
  verdict: 'excellent' | 'good' | 'average' | 'poor';
}

// Mock Ashtakoot data - will be replaced with API data
const generateAshtakootData = (totalScore: number): GunaItem[] => {
  // Distribute score across 8 gunas
  const gunas: GunaItem[] = [
    {
      id: 'varna',
      name: 'Varna',
      maxPoints: 1,
      obtainedPoints: totalScore >= 20 ? 1 : 0,
      description: 'Varna represents the spiritual compatibility and ego levels. It indicates the mental compatibility of the couple.',
      boyAttribute: 'Brahmin',
      girlAttribute: 'Kshatriya',
      verdict: totalScore >= 20 ? 'excellent' : 'average',
    },
    {
      id: 'vashya',
      name: 'Vashya',
      maxPoints: 2,
      obtainedPoints: totalScore >= 18 ? 2 : totalScore >= 12 ? 1 : 0,
      description: 'Vashya indicates the power equation and mutual attraction between partners. It shows who will have more influence in the relationship.',
      boyAttribute: 'Manav',
      girlAttribute: 'Manav',
      verdict: totalScore >= 18 ? 'excellent' : totalScore >= 12 ? 'good' : 'poor',
    },
    {
      id: 'tara',
      name: 'Tara',
      maxPoints: 3,
      obtainedPoints: totalScore >= 25 ? 3 : totalScore >= 18 ? 2 : 1,
      description: 'Tara or Dina represents the birth star compatibility. It indicates the health and well-being of both partners after marriage.',
      boyAttribute: 'Ashwini',
      girlAttribute: 'Rohini',
      verdict: totalScore >= 25 ? 'excellent' : totalScore >= 18 ? 'good' : 'average',
    },
    {
      id: 'yoni',
      name: 'Yoni',
      maxPoints: 4,
      obtainedPoints: totalScore >= 28 ? 4 : totalScore >= 20 ? 3 : totalScore >= 15 ? 2 : 1,
      description: 'Yoni represents physical and sexual compatibility between partners. It indicates the intimacy and physical attraction.',
      boyAttribute: 'Horse',
      girlAttribute: 'Elephant',
      verdict: totalScore >= 28 ? 'excellent' : totalScore >= 20 ? 'good' : 'average',
    },
    {
      id: 'graha_maitri',
      name: 'Graha Maitri',
      maxPoints: 5,
      obtainedPoints: totalScore >= 26 ? 5 : totalScore >= 20 ? 4 : totalScore >= 15 ? 3 : 2,
      description: 'Graha Maitri or Rasyadhipati indicates the mental compatibility and friendship between the couple based on Moon sign lords.',
      boyAttribute: 'Mars',
      girlAttribute: 'Venus',
      verdict: totalScore >= 26 ? 'excellent' : totalScore >= 20 ? 'good' : 'average',
    },
    {
      id: 'gana',
      name: 'Gana',
      maxPoints: 6,
      obtainedPoints: totalScore >= 30 ? 6 : totalScore >= 24 ? 5 : totalScore >= 18 ? 4 : 2,
      description: 'Gana represents the temperament and behavior compatibility. It indicates how well the couple will get along in daily life.',
      boyAttribute: 'Deva',
      girlAttribute: 'Manushya',
      verdict: totalScore >= 30 ? 'excellent' : totalScore >= 24 ? 'good' : 'average',
    },
    {
      id: 'bhakoot',
      name: 'Bhakoot',
      maxPoints: 7,
      obtainedPoints: totalScore >= 32 ? 7 : totalScore >= 25 ? 5 : totalScore >= 18 ? 3 : 0,
      description: 'Bhakoot or Rashikoot indicates the emotional compatibility and love between partners. It affects the financial prosperity and family happiness.',
      boyAttribute: 'Aries',
      girlAttribute: 'Leo',
      verdict: totalScore >= 32 ? 'excellent' : totalScore >= 25 ? 'good' : totalScore >= 18 ? 'average' : 'poor',
    },
    {
      id: 'nadi',
      name: 'Nadi',
      maxPoints: 8,
      obtainedPoints: totalScore >= 28 ? 8 : totalScore >= 20 ? 4 : 0,
      description: 'Nadi is the most important factor in Kundli matching. It indicates the genetic compatibility and health of future children.',
      boyAttribute: 'Madhya',
      girlAttribute: 'Antya',
      verdict: totalScore >= 28 ? 'excellent' : totalScore >= 20 ? 'average' : 'poor',
    },
  ];

  return gunas;
};

// Get verdict based on score
const getVerdict = (score: number): { text: string; color: string; bgColor: string } => {
  if (score >= 25) {
    return { text: 'Excellent Match', color: '#22C55E', bgColor: 'rgba(34, 197, 94, 0.15)' };
  }
  if (score >= 18) {
    return { text: 'Good Match', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.15)' };
  }
  if (score >= 12) {
    return { text: 'Average Match', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.15)' };
  }
  return { text: 'Below Average', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.15)' };
};

// Get initials from name
const getInitials = (name: string): string => {
  return name.charAt(0).toUpperCase();
};

// Guna Card Component
const GunaCard = React.memo(({
  guna,
  index,
  scale,
  expanded,
  onToggle,
}: {
  guna: GunaItem;
  index: number;
  scale: number;
  expanded: boolean;
  onToggle: () => void;
}) => {
  const rotation = useSharedValue(expanded ? 180 : 0);

  React.useEffect(() => {
    rotation.value = withTiming(expanded ? 180 : 0, { duration: 300 });
  }, [expanded]);

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const getVerdictIcon = () => {
    switch (guna.verdict) {
      case 'excellent':
        return <Check size={14 * scale} color="#22C55E" />;
      case 'good':
        return <Check size={14 * scale} color="#F59E0B" />;
      case 'average':
        return <AlertCircle size={14 * scale} color="#3B82F6" />;
      case 'poor':
        return <X size={14 * scale} color="#EF4444" />;
    }
  };

  const getVerdictColor = () => {
    switch (guna.verdict) {
      case 'excellent': return '#22C55E';
      case 'good': return '#F59E0B';
      case 'average': return '#3B82F6';
      case 'poor': return '#EF4444';
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(400)}
    >
      <TouchableOpacity
        style={[styles.gunaCard, {
          padding: 16 * scale,
          borderRadius: 16 * scale,
          marginBottom: 12 * scale,
        }]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        {/* Header Row */}
        <View style={styles.gunaHeader}>
          <View style={styles.gunaHeaderLeft}>
            <View style={[styles.gunaNumberBadge, {
              width: 28 * scale,
              height: 28 * scale,
              borderRadius: 14 * scale,
            }]}>
              <Text style={[styles.gunaNumber, { fontSize: 12 * scale }]}>
                {index + 1}
              </Text>
            </View>
            <Text style={[styles.gunaName, { fontSize: 16 * scale, marginLeft: 12 * scale }]}>
              {guna.name}
            </Text>
          </View>

          <View style={styles.gunaHeaderRight}>
            {/* Score */}
            <View style={[styles.gunaScoreBadge, {
              backgroundColor: getVerdictColor() + '15',
              paddingHorizontal: 10 * scale,
              paddingVertical: 4 * scale,
              borderRadius: 12 * scale,
              marginRight: 8 * scale,
            }]}>
              {getVerdictIcon()}
              <Text style={[styles.gunaScoreText, {
                fontSize: 12 * scale,
                color: getVerdictColor(),
                marginLeft: 4 * scale,
              }]}>
                {guna.obtainedPoints}/{guna.maxPoints}
              </Text>
            </View>

            {/* Arrow */}
            <Animated.View style={arrowStyle}>
              <ChevronDown size={20 * scale} color="#888888" />
            </Animated.View>
          </View>
        </View>

        {/* Expanded Content */}
        {expanded && (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={[styles.gunaExpanded, { marginTop: 16 * scale }]}
          >
            {/* Attributes Row */}
            <View style={[styles.attributesRow, {
              padding: 12 * scale,
              borderRadius: 12 * scale,
              marginBottom: 12 * scale,
            }]}>
              <View style={styles.attributeItem}>
                <Text style={[styles.attributeLabel, { fontSize: 11 * scale }]}>Boy's {guna.name}</Text>
                <Text style={[styles.attributeValue, { fontSize: 13 * scale }]}>{guna.boyAttribute}</Text>
              </View>
              <View style={[styles.attributeDivider, { height: 30 * scale }]} />
              <View style={styles.attributeItem}>
                <Text style={[styles.attributeLabel, { fontSize: 11 * scale }]}>Girl's {guna.name}</Text>
                <Text style={[styles.attributeValue, { fontSize: 13 * scale }]}>{guna.girlAttribute}</Text>
              </View>
            </View>

            {/* Description */}
            <Text style={[styles.gunaDescription, { fontSize: 13 * scale, lineHeight: 20 * scale }]}>
              {guna.description}
            </Text>
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

// Score Circle Component
const ScoreCircle = ({ score, maxScore, scale }: { score: number; maxScore: number; scale: number }) => {
  const percentage = (score / maxScore) * 100;
  const verdict = getVerdict(score);

  return (
    <Animated.View
      entering={FadeInUp.delay(200).duration(600)}
      style={[styles.scoreCircleContainer, {
        width: 180 * scale,
        height: 180 * scale,
      }]}
    >
      {/* Background Circle */}
      <View style={[styles.scoreCircleBg, {
        width: 180 * scale,
        height: 180 * scale,
        borderRadius: 90 * scale,
        borderWidth: 12 * scale,
      }]} />

      {/* Progress Circle - simplified visual */}
      <View style={[styles.scoreCircleProgress, {
        width: 180 * scale,
        height: 180 * scale,
        borderRadius: 90 * scale,
        borderWidth: 12 * scale,
        borderColor: verdict.color,
        borderTopColor: 'transparent',
        borderRightColor: percentage > 25 ? verdict.color : 'transparent',
        borderBottomColor: percentage > 50 ? verdict.color : 'transparent',
        borderLeftColor: percentage > 75 ? verdict.color : 'transparent',
        transform: [{ rotate: '-45deg' }],
      }]} />

      {/* Inner Circle with Score */}
      <View style={[styles.scoreCircleInner, {
        width: 140 * scale,
        height: 140 * scale,
        borderRadius: 70 * scale,
      }]}>
        <Text style={[styles.scoreValue, { fontSize: 48 * scale }]}>{score}</Text>
        <Text style={[styles.scoreMax, { fontSize: 16 * scale }]}>out of {maxScore}</Text>
      </View>
    </Animated.View>
  );
};

// Loading Skeleton
const ReportSkeleton = ({ scale }: { scale: number }) => (
  <View style={[styles.skeletonContainer, { padding: 20 * scale }]}>
    {/* Hero Section Skeleton */}
    <View style={[styles.skeletonHero, { marginBottom: 24 * scale }]}>
      <ShimmerEffect width={180 * scale} height={180 * scale} borderRadius={90 * scale} />
    </View>

    {/* Verdict Skeleton */}
    <View style={{ alignItems: 'center', marginBottom: 20 * scale }}>
      <ShimmerEffect width={160 * scale} height={32 * scale} borderRadius={16 * scale} />
    </View>

    {/* Avatars Skeleton */}
    <View style={[styles.skeletonAvatars, { marginBottom: 32 * scale }]}>
      <ShimmerEffect width={60 * scale} height={60 * scale} borderRadius={30 * scale} />
      <ShimmerEffect width={40 * scale} height={40 * scale} borderRadius={20 * scale} />
      <ShimmerEffect width={60 * scale} height={60 * scale} borderRadius={30 * scale} />
    </View>

    {/* Guna Cards Skeleton */}
    {[0, 1, 2, 3].map((index) => (
      <View key={index} style={[styles.skeletonCard, {
        padding: 16 * scale,
        borderRadius: 16 * scale,
        marginBottom: 12 * scale,
      }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ShimmerEffect width={28 * scale} height={28 * scale} borderRadius={14 * scale} />
          <View style={{ marginLeft: 12 * scale }}>
            <ShimmerEffect width={100 * scale} height={18 * scale} borderRadius={4} />
          </View>
          <View style={{ flex: 1 }} />
          <ShimmerEffect width={50 * scale} height={24 * scale} borderRadius={12 * scale} />
        </View>
      </View>
    ))}
  </View>
);

const KundliMatchingReportScreen = ({ navigation, route }: any) => {
  const { scale } = useResponsiveLayout();
  const { matchingId, matchingData } = route.params || {};
  const insets = useSafeAreaInsets();

  // Status bar height for proper spacing
  const statusBarHeight = Platform.OS === 'ios' ? insets.top : RNStatusBar.currentHeight || 24;

  // Yellow header height (hero report: larger for score circle)
  const yellowHeaderHeight = 300 * scale + statusBarHeight;

  const [loading, setLoading] = useState(true);
  const [expandedGunas, setExpandedGunas] = useState<string[]>([]);

  // Simulate loading
  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Get matching data
  const matching: SavedMatching | null = matchingData || null;
  const score = matching?.score || 0;
  const verdict = getVerdict(score);
  const gunas = useMemo(() => generateAshtakootData(score), [score]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  }, [navigation]);

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!matching) return;

    try {
      await Share.share({
        message: `Kundli Matching Report\n\n${matching.boy.name} & ${matching.girl.name}\nCompatibility Score: ${score}/36\nVerdict: ${verdict.text}\n\nGenerated by NakshatraTalks`,
        title: 'Kundli Matching Report',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [matching, score, verdict]);

  const toggleGuna = useCallback((gunaId: string) => {
    Haptics.selectionAsync();
    setExpandedGunas(prev =>
      prev.includes(gunaId)
        ? prev.filter(id => id !== gunaId)
        : [...prev, gunaId]
    );
  }, []);

  if (!matching) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={[styles.mainContent, { paddingTop: statusBarHeight }]}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No matching data found</Text>
            <TouchableOpacity
              style={[styles.errorButton, { padding: 12 * scale, borderRadius: 12 * scale }]}
              onPress={handleBack}
            >
              <Text style={styles.errorButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

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
            Matching Report
          </Text>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Share2 size={22 * scale} color="#333333" />
          </TouchableOpacity>
        </View>

        {/* Subtitle - On Yellow */}
        <Text style={[styles.subtitle, { fontSize: 13 * scale }]}>
          Ashtakoot Guna Milan
        </Text>

        {loading ? (
          <ReportSkeleton scale={scale} />
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 * scale }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Section */}
            <View style={[styles.heroSection, { paddingHorizontal: 20 * scale }]}>
              {/* Score Circle */}
              <ScoreCircle score={score} maxScore={36} scale={scale} />

              {/* Verdict Badge */}
              <Animated.View
                entering={FadeInUp.delay(400).duration(400)}
                style={[styles.verdictBadge, {
                  backgroundColor: verdict.bgColor,
                  paddingHorizontal: 20 * scale,
                  paddingVertical: 10 * scale,
                  borderRadius: 20 * scale,
                  marginTop: 16 * scale,
                }]}
              >
                <Star size={16 * scale} color={verdict.color} fill={verdict.color} />
                <Text style={[styles.verdictText, {
                  fontSize: 16 * scale,
                  color: verdict.color,
                  marginLeft: 8 * scale,
                }]}>
                  {verdict.text}
                </Text>
              </Animated.View>

              {/* Couple Avatars */}
              <Animated.View
                entering={FadeInUp.delay(500).duration(400)}
                style={[styles.coupleAvatars, { marginTop: 24 * scale }]}
              >
                {/* Boy Avatar */}
                <View style={styles.avatarWithLabel}>
                  <View style={[styles.avatarCircle, styles.avatarBoy, {
                    width: 56 * scale,
                    height: 56 * scale,
                    borderRadius: 28 * scale,
                  }]}>
                    <Text style={[styles.avatarText, { fontSize: 20 * scale }]}>
                      {getInitials(matching.boy.name)}
                    </Text>
                  </View>
                  <Text style={[styles.avatarName, { fontSize: 13 * scale, marginTop: 8 * scale }]} numberOfLines={1}>
                    {matching.boy.name}
                  </Text>
                </View>

                {/* Heart Icon */}
                <View style={[styles.heartContainer, {
                  width: 44 * scale,
                  height: 44 * scale,
                  borderRadius: 22 * scale,
                  marginHorizontal: 16 * scale,
                }]}>
                  <Heart size={22 * scale} color="#FFFFFF" fill="#FFFFFF" />
                </View>

                {/* Girl Avatar */}
                <View style={styles.avatarWithLabel}>
                  <View style={[styles.avatarCircle, styles.avatarGirl, {
                    width: 56 * scale,
                    height: 56 * scale,
                    borderRadius: 28 * scale,
                  }]}>
                    <Text style={[styles.avatarText, { fontSize: 20 * scale }]}>
                      {getInitials(matching.girl.name)}
                    </Text>
                  </View>
                  <Text style={[styles.avatarName, { fontSize: 13 * scale, marginTop: 8 * scale }]} numberOfLines={1}>
                    {matching.girl.name}
                  </Text>
                </View>
              </Animated.View>
            </View>

            {/* White Content Area starts here */}
            <View style={[styles.whiteContentArea, { marginTop: 16 * scale }]}>
            {/* Progress Bar Section */}
            <Animated.View
              entering={FadeInUp.delay(600).duration(400)}
              style={[styles.progressSection, {
                marginHorizontal: 20 * scale,
                marginTop: 20 * scale,
                padding: 16 * scale,
                borderRadius: 16 * scale,
              }]}
            >
              <View style={styles.progressHeader}>
                <Text style={[styles.progressTitle, { fontSize: 14 * scale }]}>
                  Overall Compatibility
                </Text>
                <Text style={[styles.progressPercent, { fontSize: 14 * scale }]}>
                  {Math.round((score / 36) * 100)}%
                </Text>
              </View>
              <View style={[styles.progressBarBg, {
                height: 10 * scale,
                borderRadius: 5 * scale,
                marginTop: 10 * scale,
              }]}>
                <Animated.View
                  style={[styles.progressBarFill, {
                    height: 10 * scale,
                    borderRadius: 5 * scale,
                    width: `${(score / 36) * 100}%`,
                    backgroundColor: verdict.color,
                  }]}
                />
              </View>
            </Animated.View>

            {/* Ashtakoot Analysis Section */}
            <View style={[styles.ashtakootSection, {
              marginTop: 24 * scale,
              paddingHorizontal: 20 * scale,
            }]}>
              <Animated.View
                entering={FadeInUp.delay(700).duration(400)}
                style={styles.sectionHeader}
              >
                <Text style={[styles.sectionTitle, { fontSize: 18 * scale }]}>
                  Ashtakoot Analysis
                </Text>
                <Text style={[styles.sectionSubtitle, { fontSize: 13 * scale }]}>
                  8 Guna Milan Points
                </Text>
              </Animated.View>

              {/* Guna Cards */}
              {gunas.map((guna, index) => (
                <GunaCard
                  key={guna.id}
                  guna={guna}
                  index={index}
                  scale={scale}
                  expanded={expandedGunas.includes(guna.id)}
                  onToggle={() => toggleGuna(guna.id)}
                />
              ))}
            </View>

            {/* Summary Section */}
            <Animated.View
              entering={FadeInUp.delay(900).duration(400)}
              style={[styles.summarySection, {
                marginHorizontal: 20 * scale,
                marginTop: 24 * scale,
                padding: 20 * scale,
                borderRadius: 16 * scale,
              }]}
            >
              <Text style={[styles.summaryTitle, { fontSize: 16 * scale, marginBottom: 12 * scale }]}>
                Compatibility Summary
              </Text>
              <Text style={[styles.summaryText, { fontSize: 14 * scale, lineHeight: 22 * scale }]}>
                {score >= 25
                  ? `The Kundli matching between ${matching.boy.name} and ${matching.girl.name} shows excellent compatibility with a score of ${score}/36. This indicates a highly favorable match with strong prospects for a harmonious and prosperous married life.`
                  : score >= 18
                  ? `The Kundli matching between ${matching.boy.name} and ${matching.girl.name} shows good compatibility with a score of ${score}/36. This indicates a favorable match with good prospects for a happy married life. Minor remedies may help enhance compatibility.`
                  : score >= 12
                  ? `The Kundli matching between ${matching.boy.name} and ${matching.girl.name} shows average compatibility with a score of ${score}/36. While the match is acceptable, it is recommended to consult an astrologer for detailed analysis and appropriate remedies.`
                  : `The Kundli matching between ${matching.boy.name} and ${matching.girl.name} shows below average compatibility with a score of ${score}/36. It is strongly recommended to consult an experienced astrologer for detailed analysis before proceeding.`
                }
              </Text>
            </Animated.View>

            {/* Disclaimer */}
            <Animated.View
              entering={FadeInUp.delay(1000).duration(400)}
              style={[styles.disclaimer, {
                marginHorizontal: 20 * scale,
                marginTop: 20 * scale,
                padding: 16 * scale,
                borderRadius: 12 * scale,
              }]}
            >
              <AlertCircle size={16 * scale} color="#888888" />
              <Text style={[styles.disclaimerText, { fontSize: 12 * scale, marginLeft: 10 * scale }]}>
                This report is generated for educational purposes. Please consult a qualified astrologer for detailed analysis and life decisions.
              </Text>
            </Animated.View>
            </View>
          </ScrollView>
        )}

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
  shareButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 100,
    // Border instead of shadow for performance
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderBottomWidth: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingTop: 8,
  },
  scoreCircleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCircleBg: {
    position: 'absolute',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  scoreCircleProgress: {
    position: 'absolute',
  },
  scoreCircleInner: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    // Border instead of shadow for performance
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  scoreValue: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 48,
    color: '#2930A6',
  },
  scoreMax: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 16,
    color: '#888888',
    marginTop: -4,
  },
  verdictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verdictText: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 16,
  },
  // Couple Avatars
  coupleAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWithLabel: {
    alignItems: 'center',
    width: 80,
  },
  avatarCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBoy: {
    backgroundColor: '#2930A6',
  },
  avatarGirl: {
    backgroundColor: '#E91E8C',
  },
  avatarText: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  avatarName: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 13,
    color: '#595959',
    maxWidth: 80,
    textAlign: 'center',
  },
  heartContainer: {
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Progress Section
  progressSection: {
    backgroundColor: '#FFFFFF',
    // Border instead of shadow for performance
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 14,
    color: '#1a1a1a',
  },
  progressPercent: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 14,
    color: '#2930A6',
  },
  progressBarBg: {
    backgroundColor: '#F0F0F0',
    overflow: 'hidden',
  },
  progressBarFill: {
    backgroundColor: '#22C55E',
  },
  // Ashtakoot Section
  ashtakootSection: {},
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 18,
    color: '#1a1a1a',
  },
  sectionSubtitle: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 13,
    color: '#888888',
    marginTop: 2,
  },
  // Guna Card
  gunaCard: {
    backgroundColor: '#FFFFFF',
    // Border instead of shadow for performance
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  gunaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gunaHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  gunaHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gunaNumberBadge: {
    backgroundColor: '#2930A6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gunaNumber: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  gunaName: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 16,
    color: '#1a1a1a',
  },
  gunaScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gunaScoreText: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 12,
  },
  gunaExpanded: {},
  attributesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8F8F8',
  },
  attributeItem: {
    flex: 1,
    alignItems: 'center',
  },
  attributeLabel: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 11,
    color: '#888888',
    marginBottom: 4,
  },
  attributeValue: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 13,
    color: '#2930A6',
  },
  attributeDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  gunaDescription: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 13,
    color: '#595959',
  },
  // Summary Section
  summarySection: {
    backgroundColor: 'rgba(41, 48, 166, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(41, 48, 166, 0.1)',
  },
  summaryTitle: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 16,
    color: '#2930A6',
  },
  summaryText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 14,
    color: '#595959',
  },
  // Disclaimer
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F8F8',
  },
  disclaimerText: {
    flex: 1,
    fontFamily: 'Lexend_400Regular',
    fontSize: 12,
    color: '#888888',
    lineHeight: 18,
  },
  // Error State
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 16,
    color: '#888888',
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#2930A6',
  },
  errorButtonText: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  // Skeleton
  skeletonContainer: {
    flex: 1,
  },
  skeletonHero: {
    alignItems: 'center',
  },
  skeletonAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
});

export default KundliMatchingReportScreen;
