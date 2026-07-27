/**
 * services/tagging.ts — Automatic semantic tag extraction (P32-C)
 *
 * Extracts a concise set of keyword tags from free text using pure string
 * operations (no external dependencies, no network calls).
 *
 * Algorithm:
 *   1. Lowercase + strip punctuation
 *   2. Tokenize on whitespace
 *   3. Remove stop-words (Italian + English, ~180 terms)
 *   4. Keep only tokens with length >= 3
 *   5. Deduplicate + return first MAX_TAGS tokens
 *
 * The resulting tags are stored in the `TEXT[]` column on memory_entries so
 * they can be queried directly in SQL (e.g. `WHERE tags @> ARRAY['scuola']`)
 * and used for the tag-boost component of the composite ranking score.
 *
 * P33 upgrade path: replace with NLP-based key-phrase extraction (spaCy or
 * an LLM call) for higher recall on multi-word concepts.
 */

const MAX_TAGS = 10;

// ── Stop-word list (IT + EN) ──────────────────────────────────────────────────
// Curated set covering the most frequent function words in Italian and English.
// Deliberately compact — purpose is to filter noise, not to be exhaustive.
const STOP_WORDS = new Set([
  // Italian
  'che', 'con', 'come', 'del', 'dei', 'delle', 'della', 'dello', 'degli',
  'dal', 'dai', 'dalla', 'dalle', 'dagli', 'nel', 'nei', 'nella', 'nelle',
  'negli', 'sul', 'sui', 'sulla', 'sulle', 'sugli', 'per', 'tra', 'fra',
  'una', 'uno', 'gli', 'lei', 'lui', 'noi', 'voi', 'loro', 'mio', 'mia',
  'miei', 'mie', 'tuo', 'tua', 'tuoi', 'tue', 'suo', 'sua', 'suoi', 'sue',
  'questo', 'questa', 'questi', 'queste', 'quello', 'quella', 'quelli',
  'quelle', 'sono', 'sei', 'siamo', 'siete', 'essere', 'avere', 'fare',
  'non', 'anche', 'solo', 'molto', 'più', 'mai', 'poi', 'già', 'così',
  'quando', 'dove', 'come', 'cosa', 'chi', 'quale', 'quanto', 'ogni',
  'tutti', 'tutto', 'tutte', 'tutta', 'può', 'deve', 'vuole', 'viene',
  'però', 'però', 'quindi', 'oppure', 'allora', 'ancora', 'sempre',
  'adesso', 'ora', 'oggi', 'domani', 'ieri', 'dopo', 'prima', 'poi',
  'mentre', 'senza', 'fino', 'verso', 'sotto', 'sopra', 'fuori', 'dentro',
  'perché', 'perche', 'anche', 'pure', 'quasi', 'forse', 'proprio',
  // English
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'has',
  'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his',
  'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'use', 'way',
  'who', 'did', 'does', 'each', 'from', 'had', 'have', 'here', 'into',
  'just', 'like', 'make', 'more', 'most', 'over', 'said', 'some', 'than',
  'that', 'them', 'then', 'they', 'this', 'time', 'very', 'well', 'what',
  'when', 'will', 'with', 'your', 'been', 'came', 'come', 'does', 'down',
  'even', 'give', 'going', 'good', 'great', 'have', 'help', 'here', 'high',
  'into', 'know', 'last', 'left', 'life', 'long', 'made', 'many', 'much',
  'must', 'next', 'only', 'open', 'same', 'such', 'sure', 'take', 'tell',
  'than', 'that', 'them', 'then', 'they', 'this', 'those', 'thought',
  'through', 'too', 'under', 'until', 'upon', 'used', 'using', 'want',
  'were', 'which', 'while', 'whose', 'within', 'without', 'would',
]);

/**
 * Extract up to MAX_TAGS keyword tags from the given text.
 *
 * Guaranteed to return an array (may be empty if all tokens are stop-words
 * or too short). Never throws.
 */
export function extractTags(content: string): string[] {
  try {
    const cleaned = content
      .toLowerCase()
      .replace(/[^\w\s\u00C0-\u024F]/g, ' ') // keep latin-extended (accented chars)
      .replace(/\s+/g, ' ')
      .trim();

    const seen  = new Set<string>();
    const tags: string[] = [];

    for (const token of cleaned.split(' ')) {
      if (tags.length >= MAX_TAGS) break;
      const t = token.trim();
      if (t.length < 3)        continue;
      if (STOP_WORDS.has(t))   continue;
      if (seen.has(t))         continue;
      // Exclude pure numbers and tokens that are only digits/underscores
      if (/^\d+$/.test(t))     continue;
      seen.add(t);
      tags.push(t);
    }

    return tags;
  } catch {
    return [];
  }
}
