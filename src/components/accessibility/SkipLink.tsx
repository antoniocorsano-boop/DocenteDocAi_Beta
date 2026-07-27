// MD3 Compliant
/**
 * SkipLink Component
 * 
 * Provides a "Skip to main content" link for keyboard users.
 * Should be the first focusable element on the page.
 * 
 * WCAG 2.1 Success Criterion 2.4.1 (Level A)
 * "Bypass Blocks: A mechanism is available to bypass blocks of content that are repeated on multiple Web pages."
 */

import React from 'react';
import './SkipLink.css';
import Typography from '@mui/material/Typography';

/**
 * SkipLink - Keyboard accessibility component
 * 
 * Usage:
 * Place at the top of your main layout, before other content.
 * 
 * <SkipLink />
 * 
 * The link will:
 * - Only show when focused (keyboard navigation)
 * - Direct focus to main content area
 * - Support high contrast mode
 * - Be read by screen readers
 */
export const SkipLink: React.FC = () => {
  const handleSkipClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    // Find main element
    const main = document.querySelector('main');
    if (main) {
      // Ensure main is focusable
      if (!main.hasAttribute('tabindex')) {
        main.setAttribute('tabindex', '-1');
      }
      
      // Move focus to main
      main.focus();
      
      // Remove tabindex after focus (clean up)
      const handleBlur = () => {
        main.removeAttribute('tabindex');
        main.removeEventListener('blur', handleBlur);
      };
      main.addEventListener('blur', handleBlur);
    }
  };

  return (
    <a
      href="#main-content"
      
      onClick={handleSkipClick}
      aria-label="Skip to main content"
    >
      <Typography component="span">Skip to main content</Typography>
    </a>
  );
};

export default SkipLink;

