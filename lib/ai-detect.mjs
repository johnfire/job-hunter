/**
 * ai-detect.mjs — Detect which AI model is currently in use
 *
 * Detects model from environment variables set by various AI CLIs.
 * Falls back to 'manual' if detection fails.
 */

const MODEL_MAP = {
  // Claude / Anthropic models
  'claude-opus-4.7': 'opus4.7',
  'claude-opus-4.7-20250620': 'opus4.7',
  'claude-opus-4.6': 'opus4.6',
  'claude-3-5-sonnet': 'sonnet4.6',
  'claude-3-5-sonnet-20250620': 'sonnet4.6',
  'claude-3-haiku': 'haiku4.6',
  'claude-3-haiku-20240307': 'haiku4.6',

  // DeepSeek models
  'deepseek-v4-pro': 'deepseek-v4-pro',
  'deepseek-v4': 'deepseek-v4-pro',
  'deepseek-v2': 'deepseek-v2',
  'deepseek-v2-chat': 'deepseek-v2',

  // Mistral models
  'mistral-large': 'mistral-large',
  'mistral-large-2407': 'mistral-large',
  'mistral-large-2402': 'mistral-large',
  'mistral-small': 'mistral-small',
  'mistral-small-2402': 'mistral-small',
  'mistral-medium': 'mistral-medium',
  'mistral-medium-2402': 'mistral-medium',
};

const VALID_MODELS = new Set([
  'opus4.7', 'opus4.6', 'sonnet4.6', 'haiku4.6',
  'deepseek-v4-pro', 'deepseek-v2',
  'mistral-large', 'mistral-small', 'mistral-medium',
  'manual'
]);

/**
 * Detect the current AI model from environment variables.
 * Checks common CLI environment variables in priority order.
 * @returns {string} One of: opus4.7, opus4.6, sonnet4.6, haiku4.6, deepseek-v4-pro, deepseek-v2, mistral-large, mistral-small, mistral-medium, manual
 */
export function detectModel() {
  // 1. Check Vibe/Claude Opus environment (Mistral Vibe uses CLAUDE_MODEL)
  if (process.env.CLAUDE_MODEL) {
    const mapped = MODEL_MAP[process.env.CLAUDE_MODEL] || process.env.CLAUDE_MODEL;
    if (VALID_MODELS.has(mapped)) return mapped;
  }

  // 2. Check Anthropic direct
  if (process.env.ANTHROPIC_MODEL) {
    const mapped = MODEL_MAP[process.env.ANTHROPIC_MODEL] || process.env.ANTHROPIC_MODEL;
    if (VALID_MODELS.has(mapped)) return mapped;
  }

  // 3. Check Mistral
  if (process.env.MISTRAL_MODEL) {
    const mapped = MODEL_MAP[process.env.MISTRAL_MODEL] || process.env.MISTRAL_MODEL;
    if (VALID_MODELS.has(mapped)) return mapped;
  }

  // 4. Check DeepSeek
  if (process.env.DEEPSEEK_MODEL) {
    const mapped = MODEL_MAP[process.env.DEEPSEEK_MODEL] || process.env.DEEPSEEK_MODEL;
    if (VALID_MODELS.has(mapped)) return mapped;
  }

  // 5. Check generic MODEL env var
  if (process.env.MODEL) {
    const mapped = MODEL_MAP[process.env.MODEL] || process.env.MODEL;
    if (VALID_MODELS.has(mapped)) return mapped;
  }

  // 6. Fallback
  return 'manual';
}

/**
 * Validate a model string against known models.
 * @param {string} model - The model string to validate
 * @returns {string} The validated model, or 'manual' if invalid
 */
export function validateModel(model) {
  if (!model || typeof model !== 'string') return 'manual';
  const trimmed = model.trim().toLowerCase();
  
  // Check exact matches first
  if (VALID_MODELS.has(trimmed)) return trimmed;
  
  // Check with dashes (opus-4.7 vs opus4.7)
  const normalized = trimmed.replace(/-|_|\s/g, '');
  for (const valid of VALID_MODELS) {
    const validNormalized = valid.replace(/-|_|\s/g, '');
    if (normalized === validNormalized) return valid;
  }
  
  return 'manual';
}

/**
 * Get list of all valid model names.
 * @returns {Array<string>} Array of valid model strings
 */
export function getValidModels() {
  return Array.from(VALID_MODELS).sort();
}
