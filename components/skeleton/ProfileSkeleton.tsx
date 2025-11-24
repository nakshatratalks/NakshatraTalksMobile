import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonCircle, SkeletonText, SkeletonBox } from './index';

interface ProfileSkeletonProps {
  scale?: number;
}

export const ProfileSkeleton: React.FC<ProfileSkeletonProps> = ({ scale = 1 }) => {
  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={[styles.header, { paddingHorizontal: 20 * scale, paddingVertical: 20 * scale }]}>
        <View style={styles.headerRow}>
          <SkeletonBox width={40 * scale} height={40 * scale} borderRadius={20 * scale} />
          <View style={{ flex: 1 }} />
          <SkeletonBox width={40 * scale} height={40 * scale} borderRadius={20 * scale} />
        </View>
      </View>

      {/* Profile Picture */}
      <View style={[styles.profileSection, { marginTop: 20 * scale, marginBottom: 30 * scale }]}>
        <SkeletonCircle size={120 * scale} />
      </View>

      {/* Form Fields */}
      <View style={[styles.formSection, { paddingHorizontal: 20 * scale }]}>
        {/* Name Field */}
        <View style={[styles.fieldGroup, { marginBottom: 20 * scale }]}>
          <SkeletonText width={60 * scale} height={12 * scale} style={{ marginBottom: 8 * scale }} />
          <SkeletonBox width="100%" height={50 * scale} borderRadius={12 * scale} />
        </View>

        {/* Email Field */}
        <View style={[styles.fieldGroup, { marginBottom: 20 * scale }]}>
          <SkeletonText width={80 * scale} height={12 * scale} style={{ marginBottom: 8 * scale }} />
          <SkeletonBox width="100%" height={50 * scale} borderRadius={12 * scale} />
        </View>

        {/* Phone Field */}
        <View style={[styles.fieldGroup, { marginBottom: 20 * scale }]}>
          <SkeletonText width={100 * scale} height={12 * scale} style={{ marginBottom: 8 * scale }} />
          <SkeletonBox width="100%" height={50 * scale} borderRadius={12 * scale} />
        </View>

        {/* Date of Birth Field */}
        <View style={[styles.fieldGroup, { marginBottom: 20 * scale }]}>
          <SkeletonText width={90 * scale} height={12 * scale} style={{ marginBottom: 8 * scale }} />
          <SkeletonBox width="100%" height={50 * scale} borderRadius={12 * scale} />
        </View>

        {/* Gender Field */}
        <View style={[styles.fieldGroup, { marginBottom: 30 * scale }]}>
          <SkeletonText width={70 * scale} height={12 * scale} style={{ marginBottom: 8 * scale }} />
          <View style={styles.genderRow}>
            <SkeletonBox width="48%" height={50 * scale} borderRadius={12 * scale} />
            <SkeletonBox width="48%" height={50 * scale} borderRadius={12 * scale} />
          </View>
        </View>

        {/* Save Button */}
        <SkeletonBox width="100%" height={54 * scale} borderRadius={27 * scale} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  profileSection: {
    alignItems: 'center',
  },
  formSection: {
    flex: 1,
  },
  fieldGroup: {
    width: '100%',
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
