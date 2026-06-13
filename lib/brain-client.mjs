/**
 * brain-client.mjs — Open Brain integration for career-ops
 *
 * Wraps the mistral-open-brain-mcp client for easy access from career-ops scripts.
 * Auto-detects Open Brain config from ~/.claude/claude_mcp_config.json
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Open Brain MCP is at ~/programming/mistral-open-brain-mcp
const OPEN_BRAIN_CLIENT_PATH = join(homedir(), 'programming', 'mistral-open-brain-mcp', 'open-brain-client.mjs');

// Dynamic import cache
let brainClient;

/**
 * Get the Open Brain client functions
 * Falls back to graceful failure if mistral-open-brain-mcp is not available
 */
async function getBrainClient() {
  if (brainClient) return brainClient;
  
  try {
    const module = await import(OPEN_BRAIN_CLIENT_PATH);
    brainClient = module;
    return brainClient;
  } catch (e) {
    // Open Brain client not available — return no-op functions
    console.warn('⚠️  Open Brain client not available, memory features disabled');
    return {
      captureThought: async () => {},
      searchThoughts: async () => [],
      thoughtStats: async () => ({}),
    };
  }
}

/**
 * Capture a thought to Open Brain with AI model attribution
 * @param {string} thought - The thought/text to capture
 * @param {string} project - Project name (e.g., 'career-ops')
 * @param {string} aiModel - The AI model used (e.g., 'mistral-medium', 'sonnet4.6')
 * @param {string} [type] - Thought type (task, observation, idea, etc.)
 */
export async function captureToBrain(thought, project, aiModel, type = 'task') {
  const client = await getBrainClient();
  
  // Add model attribution to the thought
  const fullThought = `[${aiModel}] ${thought}`;
  
  try {
    await client.captureThought(fullThought, project, type);
    console.log(`🧠 Saved to Open Brain [${aiModel}]`);
  } catch (e) {
    console.warn(`⚠️  Failed to save to Open Brain: ${e.message}`);
  }
}

/**
 * Search Open Brain for relevant context
 * @param {string} query - Search query
 * @param {number} [limit] - Max results
 * @returns {Array} Array of matching thoughts
 */
export async function searchBrain(query, limit = 5) {
  const client = await getBrainClient();
  
  try {
    const results = await client.searchThoughts(query);
    return results.slice(0, limit);
  } catch (e) {
    console.warn(`⚠️  Failed to search Open Brain: ${e.message}`);
    return [];
  }
}

/**
 * Get Open Brain stats
 */
export async function getBrainStats() {
  const client = await getBrainClient();
  
  try {
    return await client.thoughtStats();
  } catch (e) {
    console.warn(`⚠️  Failed to get Open Brain stats: ${e.message}`);
    return {};
  }
}

/**
 * Check if Open Brain is available
 */
export async function isBrainAvailable() {
  try {
    const client = await getBrainClient();
    // Try a simple call
    await client.thoughtStats();
    return true;
  } catch {
    return false;
  }
}
