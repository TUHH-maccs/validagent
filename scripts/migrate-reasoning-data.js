/**
 * Migration Script: Add reasoning rate data to prestudy2.json
 *
 * Reads ps2_metrics.csv and adds reasoning fields to each agent's validation entries
 */

const fs = require('fs');
const path = require('path');

// Paths
const metricsPath = path.join(__dirname, '..', 'ps2_metrics.csv');
const jsonPath = path.join(__dirname, '..', 'data', 'sets', 'prestudy2.json');

// Parse CSV
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, i) => {
      obj[header.trim()] = values[i]?.trim();
    });
    return obj;
  });
}

// Parse value (handles NA, numbers, etc.)
function parseValue(val) {
  if (val === 'NA' || val === 'null' || val === '' || val === undefined) {
    return null;
  }
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

// Main migration
function migrate() {
  console.log('Reading CSV data...');
  const csvContent = fs.readFileSync(metricsPath, 'utf-8');
  const metrics = parseCSV(csvContent);

  console.log(`Parsed ${metrics.length} metric rows`);

  // Group by agent_id and experiment
  // Structure: { agentId: { experimentId: { reasoningData } } }
  const reasoningData = {};

  metrics.forEach(row => {
    const agentId = parseInt(row.agent_id);
    const experiment = row.experiment;

    if (!reasoningData[agentId]) {
      reasoningData[agentId] = {};
    }

    reasoningData[agentId][experiment] = {
      reasonMoneyRate: parseValue(row.agent_reason_money_rate),
      reasonConsistencyRate: parseValue(row.agent_reason_consistency_rate),
      reasonRulesRate: parseValue(row.agent_reason_rules_rate),
      reasonFairnessRate: parseValue(row.agent_reason_fairness_rate),
      reasonIntuitionRate: parseValue(row.agent_reason_intuition_rate),
      reasonCaptureRate: parseValue(row.reason_capture_rate),
      reasonFalsePositiveRate: parseValue(row.reason_false_positive_rate),
      reasoningAlignmentScore: parseValue(row.reasoning_alignment_score),
    };
  });

  console.log('Reading JSON...');
  const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
  const agentSet = JSON.parse(jsonContent);

  console.log(`Processing ${agentSet.agents.length} agents...`);

  // Update each agent's validation with reasoning data
  let updated = 0;
  agentSet.agents.forEach(agent => {
    const agentId = agent.agentId;
    const agentReasoningData = reasoningData[agentId];

    if (!agentReasoningData) {
      console.warn(`No reasoning data found for agent ${agentId}`);
      return;
    }

    // Merge reasoning data into each experiment validation
    Object.keys(agent.validation).forEach(expId => {
      if (agentReasoningData[expId]) {
        Object.assign(agent.validation[expId], agentReasoningData[expId]);
        updated++;
      }
    });
  });

  console.log(`Updated ${updated} validation entries with reasoning data`);

  // Write updated JSON
  fs.writeFileSync(jsonPath, JSON.stringify(agentSet, null, 2));
  console.log(`Written to ${jsonPath}`);

  // Verify first agent
  const firstAgent = agentSet.agents[0];
  console.log('\nVerification - First agent validation (001):');
  const v = firstAgent.validation['001'];
  console.log(`  reasonMoneyRate: ${v.reasonMoneyRate}`);
  console.log(`  reasonConsistencyRate: ${v.reasonConsistencyRate}`);
  console.log(`  reasonCaptureRate: ${v.reasonCaptureRate}`);
  console.log(`  reasoningAlignmentScore: ${v.reasoningAlignmentScore}`);

  // Also verify humanReference.reasons
  console.log('\nHuman reasons for first agent:');
  console.log(`  ${JSON.stringify(firstAgent.humanReference.reasons)}`);
}

migrate();
