/**
 * HTML Sanitizer Utility
 * XSS protection using DOMPurify for dangerouslySetInnerHTML usage.
 *
 * DOMPurify is the industry standard for client-side HTML sanitization.
 * See: https://github.com/cure53/DOMPurify
 */

import DOMPurify from 'dompurify';

type AllowedTags = 
  | 'p' | 'br' | 'strong' | 'b' | 'em' | 'i' | 'u' 
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'ul' | 'ol' | 'li' | 'span' | 'div'
  | 'a' | 'code' | 'pre' | 'blockquote';

interface SanitizeOptions {
  allowedTags?: AllowedTags[];
  allowedAttributes?: string[];
  stripScripts?: boolean;
}

const _DEFAULT_ALLOWED_TAGS: AllowedTags[] = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'span', 'div',
  'a', 'code', 'pre', 'blockquote'
];

const _DEFAULT_ALLOWED_ATTRIBUTES = ['href', 'target', 'rel', 'class'];

export { _DEFAULT_ALLOWED_TAGS as DEFAULT_ALLOWED_TAGS, _DEFAULT_ALLOWED_ATTRIBUTES as DEFAULT_ALLOWED_ATTRIBUTES };

/**
 * Sanitizes HTML using DOMPurify.
 * Safe for use with dangerouslySetInnerHTML.
 */
export const sanitizeHtml = (
  html: string,
  options: SanitizeOptions = {}
): string => {
  if (!html) return '';

  const allowedTags = options.allowedTags ?? _DEFAULT_ALLOWED_TAGS;
  const allowedAttributes = options.allowedAttributes ?? _DEFAULT_ALLOWED_ATTRIBUTES;

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttributes,
    FORCE_BODY: false,
  });
};

/**
 * Simple text escape for plain text content.
 */
export const escapeHtml = (text: string): string => {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Convert newlines to <br> tags (safe for React).
 */
export const nl2br = (text: string): string => {
  if (!text) return '';
  return escapeHtml(text).replace(/\n/g, '<br />');
};

/**
 * Check if string contains HTML.
 */
export const containsHtml = (text: string): boolean => {
  if (!text) return false;
  return /<[^>]+>/.test(text);
};

/**
 * Strip all HTML tags, return plain text.
 */
export const stripHtml = (html: string): string => {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
  return tmp.textContent || tmp.innerText || '';
};
