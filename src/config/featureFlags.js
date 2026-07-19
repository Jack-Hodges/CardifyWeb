/**
 * Feature flags — flip these to enable AI UX without redeploying schema.
 * All AI features ship built but OFF by default.
 */
const featureFlags = {
  /** Master switch for topic-based generate in Create */
  aiGenerate: false,
  /** Generate from notes / PDF / pasted lecture */
  aiGenerateFromNotes: false,
  /** Explain / simplify card assist */
  aiCardAssist: false,
};

export default featureFlags;
