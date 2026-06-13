#!/usr/bin/env node
/**
 * ai-model-stats.mjs — Generate statistics for AI model usage
 *
 * Usage:
 *   node scripts/ai-model-stats.mjs
 *   node scripts/ai-model-stats.mjs --output stats.json
 *
 * Reads applications.md and generates model usage statistics.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const APPLICATIONS_PATH = join(ROOT, 'data', 'applications.md');

const VALID_MODELS = new Set([
  'opus4.7', 'opus4.6', 'sonnet4.6', 'haiku4.6',
  'deepseek-v4-pro', 'deepseek-v2',
  'mistral-large', 'mistral-small', 'mistral-medium',
  'manual'
]);

function parseApplications(content) {
  const lines = content.split('\n');
  const applications = [];
  
  // Skip header lines until we find the table header
  let inTable = false;
  let headerIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Find the header line
    if (line.startsWith('| #') && line.includes('AI Model')) {
      headerIndex = i;
      inTable = true;
      continue;
    }
    
    // Skip separator line
    if (line.startsWith('| ---') || line.startsWith('|---')) {
      continue;
    }
    
    // Skip empty lines
    if (!line || !line.startsWith('|')) {
      inTable = false;
      continue;
    }
    
    if (inTable && !line.startsWith('| #')) {
      // Parse data row
      const parts = line.split('|').map(p => p.trim()).filter(p => p !== '');
      
      // Expected: [#, Date, Company, Role, Score, Status, PDF, AI Model, Report, Notes]
      if (parts.length >= 9) {
        const entry = {
          id: parts[0],
          date: parts[1],
          company: parts[2],
          role: parts[3],
          score: parts[4],
          status: parts[5],
          pdf: parts[6],
          aiModel: parts[7],
          report: parts[8],
          notes: parts.slice(9).join(' | ')  // Handle notes with pipes
        };
        applications.push(entry);
      }
    }
  }
  
  return applications;
}

function generateStats(applications) {
  const stats = {
    total: applications.length,
    byModel: {},
    byStatus: {},
    byModelAndStatus: {},
    scoresByModel: {},
    modelsUsed: new Set()
  };
  
  for (const app of applications) {
    const model = app.aiModel || 'unknown';
    const status = app.status || 'unknown';
    const score = parseFloat(app.score) || 0;
    
    // Track models used
    stats.modelsUsed.add(model);
    
    // Count by model
    stats.byModel[model] = (stats.byModel[model] || 0) + 1;
    
    // Count by status
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    
    // Count by model + status
    const key = `${model}:${status}`;
    stats.byModelAndStatus[key] = (stats.byModelAndStatus[key] || 0) + 1;
    
    // Collect scores for averaging
    if (!stats.scoresByModel[model]) {
      stats.scoresByModel[model] = [];
    }
    stats.scoresByModel[model].push(score);
  }
  
  // Calculate average scores per model
  stats.avgScoreByModel = {};
  for (const [model, scores] of Object.entries(stats.scoresByModel)) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    stats.avgScoreByModel[model] = Number(avg.toFixed(2));
  }
  
  // Sort models
  stats.modelsUsed = Array.from(stats.modelsUsed).sort();
  
  return stats;
}

function formatStats(stats) {
  console.log('='.repeat(60));
  console.log('AI Model Usage Statistics');
  console.log('='.repeat(60));
  console.log();
  
  console.log(`Total Applications: ${stats.total}`);
  console.log(`Models Used: ${stats.modelsUsed.length}`);
  console.log();
  
  // Applications by Model
  console.log('-'.repeat(60));
  console.log('Applications by AI Model:');
  console.log('-'.repeat(60));
  
  const sortedModels = Object.entries(stats.byModel).sort((a, b) => b[1] - a[1]);
  for (const [model, count] of sortedModels) {
    const percentage = ((count / stats.total) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(count * 30 / stats.total));
    console.log(`  ${model.padEnd(20)} ${count.toString().padStart(3)} (${percentage}%) ${bar}`);
  }
  console.log();
  
  // Average Score by Model
  if (Object.keys(stats.avgScoreByModel).length > 0) {
    console.log('-'.repeat(60));
    console.log('Average Score by AI Model:');
    console.log('-'.repeat(60));
    
    const sortedByScore = Object.entries(stats.avgScoreByModel).sort((a, b) => b[1] - a[1]);
    for (const [model, avgScore] of sortedByScore) {
      console.log(`  ${model.padEnd(20)} ${avgScore.toFixed(2).padStart(5)} / 5.0`);
    }
    console.log();
  }
  
  // Status Distribution by Model
  console.log('-'.repeat(60));
  console.log('Status Distribution by AI Model:');
  console.log('-'.repeat(60));
  
  const statuses = ['Applied', 'Evaluated', 'SKIP', 'Interview', 'Offer', 'Rejected'];
  for (const status of statuses) {
    const modelCounts = [];
    for (const model of stats.modelsUsed) {
      const key = `${model}:${status}`;
      const count = stats.byModelAndStatus[key] || 0;
      modelCounts.push({ model, count });
    }
    
    const hasData = modelCounts.some(mc => mc.count > 0);
    if (hasData) {
      console.log(`\n  ${status}:`);
      for (const { model, count } of modelCounts) {
        if (count > 0) {
          console.log(`    ${model.padEnd(20)} ${count}`);
        }
      }
    }
  }
  console.log();
  console.log('='.repeat(60));
}

// Main
function main() {
  const args = process.argv.slice(2);
  const outputPath = args.includes('--output') ? args[args.indexOf('--output') + 1] : null;
  
  let content;
  try {
    content = readFileSync(APPLICATIONS_PATH, 'utf-8');
  } catch (e) {
    console.error(`❌ Could not read ${APPLICATIONS_PATH}: ${e.message}`);
    process.exit(1);
  }
  
  const applications = parseApplications(content);
  const stats = generateStats(applications);
  
  // Console output
  formatStats(stats);
  
  // JSON output if requested
  if (outputPath) {
    try {
      writeFileSync(outputPath, JSON.stringify(stats, null, 2), 'utf-8');
      console.log(`\n✅ Stats saved to: ${outputPath}`);
    } catch (e) {
      console.error(`❌ Could not write ${outputPath}: ${e.message}`);
    }
  }
}

main();
