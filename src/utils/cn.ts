/**
 * Utility function for combining CSS classes
 * Follows the clsx pattern for conditional class names
 */
export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes
    .filter(Boolean)
    .filter((cls): cls is string => typeof cls === 'string')
    .join(' ');
}

