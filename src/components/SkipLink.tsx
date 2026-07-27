// MD3 Compliant - Uses CSS custom properties for theming
import React from 'react';
/**
 * SkipLink Component
 * 
 * Provides a hidden link that becomes visible on focus, allowing keyboard users
 * to skip repetitive navigation and jump directly to main content.
 * 
 * WCAG 2.1 Success Criterion 2.4.1: Bypass Blocks (Level A)
 * 
 * Migration Status: ✅ MD3 Compliant (uses CSS custom properties)
 * 
 * @example
 * ```tsx
 * <SkipLink href="#main-content" label="Skip to main content" />
 * ```
 */

interface SkipLinkProps {
  /**
   * The ID of the target element (main content area)
   * @default "#main-content"
   */
  href?: string;

  /**
   * The visible text when focused
   * @default "Skip to main content"
   */
  label?: string;
}

const SkipLink: React.FC<SkipLinkProps> = ({
  href = '#main-content',
  label = 'Skip to main content',
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.querySelector(href);
    
    if (target) {
      // Set focus to target
      (target as HTMLElement).focus();
      // Scroll to target
      target.scrollIntoView({ behavior: 'smooth' });
      e.preventDefault();
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      aria-label={label}
      className="skip-link"
      onKeyDown={(e: React.KeyboardEvent<HTMLAnchorElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick(e as unknown as React.MouseEvent<HTMLAnchorElement>);
        }
      }}
    >
      {label}
    </a>
  );
};

export default SkipLink;

