#!/usr/bin/env node
/**
 * open-brain-client.mjs — Open Brain API client for career-ops
 *
 * Wraps the Open Brain MCP server into plain async functions so any
 * LLM integration (Mistral, Gemini, OpenAI, etc.) can read and write
 * to Open Brain without going through Claude or the MCP protocol.
 *
 * Protocol: MCP JSON-RPC 2.0 over HTTP with SSE responses.
 * Auth:     x-brain-key header (set OPEN_BRAIN_KEY in .env)
 *
 * Usage:
 *   import { searchThoughts, captureThought } from './open-brain-client.mjs';
 *   const results = await searchThoughts('job evaluation career');
 *   await captureThought('Mistral scored Acme at 4.2/5 — strong AI team', 'career-ops');
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

// ---------------------------------------------------------------------------
// Config — reads key from env or ~/.claude/.mcp.json
// ---------------------------------------------------------------------------
function resolveConfig() {
  const url =
    process.env.OPEN_BRAIN_URL ||
    "https://qaonmvqhlvrrvfkqcjbf.supabase.co/functions/v1/open-brain-mcp";

  if (process.env.OPEN_BRAIN_KEY) {
    return { url, key: process.env.OPEN_BRAIN_KEY };
  }

  // Fall back to reading from Claude's MCP config
  // claude_mcp_config.json has the secret key; .mcp.json may have a Supabase
  // publishable key (sb_publishable_*) which the Open Brain server rejects.
  const candidates = [
    join(homedir(), ".claude", "claude_mcp_config.json"),
    join(homedir(), ".claude", ".mcp.json"),
  ];

  for (const configPath of candidates) {
    if (!existsSync(configPath)) continue;
    try {
      const cfg = JSON.parse(readFileSync(configPath, "utf-8"));
      const ob = cfg?.mcpServers?.["open-brain"];
      if (ob?.headers?.["x-brain-key"]) {
        return { url: ob.url || url, key: ob.headers["x-brain-key"] };
      }
    } catch {
      // continue to next candidate
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Low-level MCP call — sends one JSON-RPC request, parses SSE response
// ---------------------------------------------------------------------------
async function mcpCall(method, params = {}) {
  const config = resolveConfig();
  if (!config) {
    throw new Error(
      "Open Brain key not found.\n" +
        "Set OPEN_BRAIN_KEY in .env, or ensure ~/.claude/.mcp.json is configured.",
    );
  }

  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: Date.now(),
    method,
    params,
  });

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "x-brain-key": config.key,
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Open Brain HTTP ${response.status}: ${text}`);
  }

  const text = await response.text();

  // Parse SSE format: "event: message\ndata: {...}\n\n"
  // or plain JSON fallback
  let jsonStr = text;
  const dataLine = text.match(/^data:\s*(.+)$/m);
  if (dataLine) {
    jsonStr = dataLine[1];
  }

  const parsed = JSON.parse(jsonStr);
  if (parsed.error) {
    throw new Error(`Open Brain RPC error: ${JSON.stringify(parsed.error)}`);
  }
  return parsed.result;
}

// ---------------------------------------------------------------------------
// Tool wrappers
// ---------------------------------------------------------------------------

/**
 * Search Open Brain by meaning/semantics.
 * @param {string} query
 * @param {number} [limit=10]
 * @param {number} [threshold=0.5]
 */
export async function searchThoughts(query, limit = 10, threshold = 0.5) {
  const result = await mcpCall("tools/call", {
    name: "search_thoughts",
    arguments: { query, limit, threshold },
  });
  return extractText(result);
}

/**
 * Vector search + graph expansion — surfaces non-obvious connections.
 * @param {string} query
 * @param {number} [limit=5]
 * @param {number} [threshold=0.5]
 * @param {number} [graphDepth=1]
 */
export async function searchWithGraph(
  query,
  limit = 5,
  threshold = 0.5,
  graphDepth = 1,
) {
  const result = await mcpCall("tools/call", {
    name: "search_with_graph",
    arguments: { query, limit, threshold, graph_depth: graphDepth },
  });
  return extractText(result);
}

/**
 * List recent thoughts with optional filters.
 * @param {{ type?: string, topic?: string, person?: string, days?: number, project?: string, status?: string, limit?: number }} [filters]
 */
export async function listThoughts(filters = {}) {
  const result = await mcpCall("tools/call", {
    name: "list_thoughts",
    arguments: { limit: 10, ...filters },
  });
  return extractText(result);
}

/**
 * Save a new thought to Open Brain.
 * @param {string} content  A standalone statement that makes sense when retrieved later.
 * @param {string} [project]
 */
export async function captureThought(content, project) {
  const args = { content };
  if (project) args.project = project;
  const result = await mcpCall("tools/call", {
    name: "capture_thought",
    arguments: args,
  });
  return extractText(result);
}

/**
 * Push a structured artifact (spec/plan/evaluation) to Open Brain.
 * @param {string} project
 * @param {string} title
 * @param {string} spec     The main content
 * @param {string} [rationale]
 * @param {'high'|'normal'|'low'} [priority='normal']
 */
export async function pushArtifact(
  project,
  title,
  spec,
  rationale,
  priority = "normal",
) {
  const args = { project, title, spec, priority };
  if (rationale) args.rationale = rationale;
  const result = await mcpCall("tools/call", {
    name: "push_artifact",
    arguments: args,
  });
  return extractText(result);
}

/**
 * Retrieve pending artifacts for a project.
 * @param {string} project
 * @param {'pending'|'claimed'|'complete'|'failed'|'all'} [status='pending']
 * @param {number} [limit=10]
 */
export async function getArtifacts(project, status = "pending", limit = 10) {
  const result = await mcpCall("tools/call", {
    name: "get_artifacts",
    arguments: { project, status, limit },
  });
  return extractText(result);
}

/**
 * Get a summary of all thoughts: totals, types, top topics, people.
 */
export async function thoughtStats() {
  const result = await mcpCall("tools/call", {
    name: "thought_stats",
    arguments: {},
  });
  return extractText(result);
}

/**
 * Raw tool call — use this for tools not wrapped above.
 * @param {string} toolName
 * @param {object} args
 */
export async function callTool(toolName, args = {}) {
  return mcpCall("tools/call", { name: toolName, arguments: args });
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
function extractText(result) {
  // MCP tool results are: { content: [{ type: 'text', text: '...' }], isError?: bool }
  if (result?.isError) {
    throw new Error(
      `Tool error: ${result.content?.[0]?.text || JSON.stringify(result)}`,
    );
  }
  if (Array.isArray(result?.content)) {
    return result.content
      .map((c) => c.text || "")
      .join("\n")
      .trim();
  }
  return JSON.stringify(result);
}

// ---------------------------------------------------------------------------
// CLI — run directly to test the connection
// ---------------------------------------------------------------------------
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const cmd = process.argv[2] || "stats";

  try {
    if (cmd === "stats") {
      console.log(await thoughtStats());
    } else if (cmd === "search" && process.argv[3]) {
      console.log(await searchThoughts(process.argv[3]));
    } else if (cmd === "capture" && process.argv[3]) {
      console.log(await captureThought(process.argv[3], process.argv[4]));
    } else {
      console.log(
        "Usage: node open-brain-client.mjs [stats|search <query>|capture <text> [project]]",
      );
    }
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}
