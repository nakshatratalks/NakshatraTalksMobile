import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'small' | 'medium' | 'large';

const BASE_WIDTH = 384;

const LAYOUT_WIDTH: Record<Breakpoint, number> = {
  small: 340,
  medium: 380,
  large: 420,
};

const HORIZONTAL_GUTTER: Record<Breakpoint, number> = {
  small: 16,
  medium: 24,
  large: 32,
};

export const getBreakpoint = (width: number): Breakpoint => {
  if (width < 375) {
    return 'small';
  }
  if (width < 600) {
    return 'medium';
  }
  return 'large';
};

export const useResponsiveLayout = () => {
  const { width, height } = useWindowDimensions();
  const breakpoint = getBreakpoint(width);

  const cardWidth = Math.min(width - HORIZONTAL_GUTTER[breakpoint] * 2, LAYOUT_WIDTH[breakpoint]);
  const scale = cardWidth / BASE_WIDTH;

  return {
    width,
    height,
    breakpoint,
    cardWidth,
    scale,
    gutters: {
      horizontal: HORIZONTAL_GUTTER[breakpoint],
    },
  };
};

