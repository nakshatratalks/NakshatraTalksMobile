# NakshatraTalks Development Guidelines

## Skeleton Loaders and Shimmer Effects

This project uses skeleton loaders with shimmer effects to enhance UI/UX during data loading states. ALL new screens and components that fetch data MUST implement these loading states.

### Why Skeleton Loaders?

- **Better UX**: Users see a preview of content structure instead of blank screens or generic spinners
- **Perceived Performance**: Shimmer animations make the app feel faster and more responsive
- **Professional Polish**: Creates a premium, well-crafted user experience
- **Consistency**: Maintains visual continuity across all screens

---

## Implementation Rules

### 1. **ALWAYS Use Skeleton Loaders for Data Loading**

When creating ANY new screen or component that loads data from an API:

✅ **DO:**
```tsx
import { AstrologerCardSkeleton } from '../components/skeleton';

// In your component
{dataLoading && items.length === 0 ? (
  <>
    {[1, 2, 3, 4, 5].map((index) => (
      <AstrologerCardSkeleton key={index} scale={scale} />
    ))}
  </>
) : (
  items.map((item) => <ActualCard key={item.id} item={item} />)
)}
```

❌ **DON'T:**
```tsx
// Never use plain ActivityIndicator or blank loading states
{loading && (
  <ActivityIndicator size="large" color="#2930A6" />
)}
```

---

### 2. **Available Skeleton Components**

All skeleton components are located in `/components/skeleton/`:

#### Base Components (Building Blocks)
- `<SkeletonBox />` - Rectangular skeleton with shimmer
- `<SkeletonCircle />` - Circular skeleton (for avatars)
- `<SkeletonText />` - Text line skeleton (supports multiple lines)
- `<ShimmerEffect />` - Raw shimmer animation (rarely used directly)

#### Pre-built Screen-Specific Components
- `<AstrologerCardSkeleton />` - For browse screens (chat/call)
- `<TopRatedCardSkeleton />` - For top-rated astrologer cards
- `<LiveSessionCardSkeleton />` - For live session carousel cards
- `<ProfileSkeleton />` - For profile screen loading state
- `<LiveSessionListSkeleton />` - For live session list view

#### Import Pattern
```tsx
import { SkeletonBox, SkeletonCircle, SkeletonText } from '../components/skeleton';
// OR
import { AstrologerCardSkeleton } from '../components/skeleton';
```

---

### 3. **Creating New Skeleton Components**

When adding a NEW screen with a unique layout:

**Step 1:** Create a matching skeleton component in `/components/skeleton/`

```tsx
// components/skeleton/YourNewCardSkeleton.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox, SkeletonCircle, SkeletonText } from './index';

interface YourNewCardSkeletonProps {
  scale?: number;
}

export const YourNewCardSkeleton: React.FC<YourNewCardSkeletonProps> = ({
  scale = 1
}) => {
  return (
    <View style={[styles.card, { borderRadius: 16 * scale, padding: 12 * scale }]}>
      {/* Match the structure of your actual card */}
      <SkeletonCircle size={80 * scale} />
      <SkeletonText width="70%" height={18 * scale} />
      <SkeletonText width="50%" height={14 * scale} />
      <SkeletonBox width="100%" height={40 * scale} borderRadius={8 * scale} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
});
```

**Step 2:** Export it in `/components/skeleton/index.ts`

```tsx
export { YourNewCardSkeleton } from './YourNewCardSkeleton';
```

**Step 3:** Use it in your screen

```tsx
import { YourNewCardSkeleton } from '../components/skeleton';

// In render:
{loading && items.length === 0 ? (
  <>
    {[1, 2, 3].map((i) => <YourNewCardSkeleton key={i} scale={scale} />)}
  </>
) : (
  items.map(item => <YourActualCard key={item.id} item={item} />)
)}
```

---

### 4. **Loading State Patterns**

#### Pattern A: List Loading (Recommended)
```tsx
{dataLoading && items.length === 0 ? (
  // Show 3-5 skeleton cards
  <>
    {[1, 2, 3, 4, 5].map((index) => (
      <CardSkeleton key={index} scale={scale} />
    ))}
  </>
) : items.length === 0 ? (
  // Empty state
  <EmptyStateView />
) : (
  // Actual data
  items.map((item) => <ActualCard key={item.id} item={item} />)
)}
```

#### Pattern B: Horizontal Scroll Loading
```tsx
{dataLoading && sessions.length === 0 ? (
  <ScrollView horizontal>
    {[1, 2, 3, 4].map((index) => (
      <LiveSessionCardSkeleton
        key={index}
        scale={scale}
        isLast={index === 4}
      />
    ))}
  </ScrollView>
) : sessions.length > 0 ? (
  <ScrollView horizontal>
    {sessions.map((session) => (
      <LiveSessionCard key={session.id} session={session} />
    ))}
  </ScrollView>
) : null}
```

#### Pattern C: Full Screen Loading
```tsx
if (loading && !hasData) {
  return (
    <View style={styles.container}>
      <ProfileSkeleton scale={scale} />
    </View>
  );
}
```

---

### 5. **Best Practices**

#### Skeleton Count
- **Lists**: Show 3-5 skeleton items (enough to fill the viewport)
- **Horizontal Scrolls**: Show 3-4 skeleton items
- **Forms**: Show skeleton for each input field
- **Cards**: Match the number that would typically be visible

#### Timing
- Show skeletons ONLY when: `loading === true AND data.length === 0`
- Never show skeletons if data already exists (even during refresh)
- Use `RefreshControl` for pull-to-refresh instead of skeleton replacement

#### Styling
- **Always respect the `scale` prop** for responsive layouts
- Match skeleton dimensions to actual component dimensions
- Use same padding, margins, and border radius as real components
- Keep skeleton background subtle: `#E0E0E0` (already set in ShimmerEffect)

#### Animation
- Shimmer animation is automatic via `<ShimmerEffect />`
- Duration: 1500ms loop (already configured)
- Colors: `['#E0E0E0', '#F5F5F5', '#E0E0E0']` (light gray gradient)
- Direction: Left to right horizontal sweep

---

### 6. **Responsive Design**

ALWAYS use the `scale` prop from `useResponsiveLayout()`:

```tsx
const { scale } = useResponsiveLayout();

<CardSkeleton scale={scale} />
```

Multiply ALL dimensions by `scale`:
```tsx
width: 120 * scale,
height: 80 * scale,
borderRadius: 16 * scale,
padding: 12 * scale,
```

---

### 7. **Screen-by-Screen Reference**

| Screen | Skeleton Used | Location |
|--------|---------------|----------|
| HomeScreen | `LiveSessionCardSkeleton`, `TopRatedCardSkeleton` | Live sessions carousel, Top rated list |
| BrowseChatScreen | `AstrologerCardSkeleton` | Astrologer list |
| BrowseCallScreen | `AstrologerCardSkeleton` | Astrologer list |
| ProfileScreen | `SkeletonCircle`, `SkeletonBox` | Profile picture, form fields |
| LiveSessionScreen | `SkeletonBox` | Full screen loading |

---

### 8. **Testing Your Skeleton Implementation**

Before committing changes:

1. **Slow Network Test**: Use React Native Debugger to throttle network to "Slow 3G"
2. **Visual Verification**: Ensure skeleton matches actual component layout
3. **Animation Check**: Verify shimmer animation is smooth (60 FPS)
4. **Transition**: Confirm smooth fade from skeleton → actual content
5. **Empty State**: Test that empty states show correctly when no data exists

---

### 9. **Common Mistakes to Avoid**

❌ **Using ActivityIndicator instead of skeletons**
```tsx
{loading && <ActivityIndicator />} // DON'T DO THIS
```

❌ **Showing skeleton when data already exists**
```tsx
{loading && ( // Wrong - should check data.length === 0
  <Skeleton />
)}
```

❌ **Forgetting the scale prop**
```tsx
<SkeletonBox width={100} height={50} /> // Missing scale multiplication
```

❌ **Not matching actual component structure**
```tsx
// Skeleton should have same visual structure as real component
<SkeletonBox /> // Too simple
<ActualCard>
  <Image />
  <Text />
  <Text />
  <Button />
</ActualCard>
```

✅ **Correct approach**
```tsx
<CardSkeleton>
  <SkeletonCircle /> {/* Matches Image */}
  <SkeletonText /> {/* Matches first Text */}
  <SkeletonText /> {/* Matches second Text */}
  <SkeletonBox /> {/* Matches Button */}
</CardSkeleton>
```

---

### 10. **Performance Considerations**

- Skeleton components are lightweight (React Native Animated API)
- Shimmer animation uses `useNativeDriver: true` for 60 FPS
- No images or heavy assets - pure View/Animated components
- Maximum 5-6 skeleton items per screen to maintain performance

---

## Quick Checklist for New Screens

When creating a new screen with data loading:

- [ ] Import appropriate skeleton component(s)
- [ ] Implement loading state with skeletons (not ActivityIndicator)
- [ ] Show 3-5 skeleton items for lists
- [ ] Use `scale` prop from `useResponsiveLayout()`
- [ ] Match skeleton structure to actual component
- [ ] Test with slow network simulation
- [ ] Ensure smooth transition from skeleton → content
- [ ] Handle empty state separately from loading state

---

## Example: Complete Implementation

```tsx
import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useResponsiveLayout } from '../src/utils/responsive';
import { useYourDataHook } from '../src/hooks/useYourDataHook';
import { YourCardSkeleton } from '../components/skeleton';

const YourNewScreen = ({ navigation }) => {
  const { scale } = useResponsiveLayout();
  const { data, loading, error, refetch } = useYourDataHook();

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Loading State with Skeletons */}
        {loading && data.length === 0 ? (
          <>
            {[1, 2, 3, 4, 5].map((index) => (
              <YourCardSkeleton key={index} scale={scale} />
            ))}
          </>
        ) : data.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyState}>
            <Text>No data found</Text>
          </View>
        ) : (
          /* Actual Data */
          data.map((item) => (
            <YourCard key={item.id} item={item} scale={scale} />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default YourNewScreen;
```

---

## Summary

**Golden Rule**: Every screen that loads data MUST show skeleton loaders during loading. No exceptions.

This creates a consistent, professional, and delightful user experience across the entire NakshatraTalks application.

---

**Last Updated**: 2025-01-24
**Maintainer**: Development Team
**Status**: ✅ Enforced for all new screens
