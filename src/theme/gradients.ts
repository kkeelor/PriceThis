import { brandStops } from './palettes';

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

/** Viewfinder corner colors matching logo brackets */
export const viewfinderCorners = {
  topLeft: brandStops.gold,
  topRight: brandStops.magenta,
  bottomLeft: brandStops.teal,
  bottomRight: brandStops.violet,
} as const;
