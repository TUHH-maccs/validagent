/**
 * Migration Script: Add run-level data to prestudy2.json
 *
 * Reads ps2_results.csv and adds 'runs' array to each agent's validation entries
 * Each runs array contains 10 agent_decision values (one per run)
 */

const fs = require('fs');
const path = require('path');

// Paths
const resultsPath = path.join(__dirname, '..', 'ps2_results.csv');
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

// Main migration
function migrate() {
  console.log('Reading CSV data...');
  const csvContent = fs.readFileSync(resultsPath, 'utf-8');
  const results = parseCSV(csvContent);

  console.log(`Parsed ${results.length} result rows`);

  // Group by agent_id and experiment
  // Structure: { agentId: { experimentId: [decisions sorted by run] } }
  const runData = {};

  results.forEach(row => {
    const agentId = parseInt(row.agent_id);
    const experiment = row.experiment;
    const run = parseInt(row.run);
    const decision = parseInt(row.agent_decision);

    if (!runData[agentId]) {
      runData[agentId] = {};
    }
    if (!runData[agentId][experiment]) {
      runData[agentId][experiment] = [];
    }

    // Store decision at run index
    runData[agentId][experiment][run] = decision;
  });

  console.log('Reading JSON...');
  const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
  const agentSet = JSON.parse(jsonContent);

  console.log(`Processing ${agentSet.agents.length} agents...`);

  // Update each agent's validation with runs array
  let updated = 0;
  agentSet.agents.forEach(agent => {
    const agentId = agent.agentId;
    const agentRunData = runData[agentId];

    if (!agentRunData) {
      console.warn(`No run data found for agent ${agentId}`);
      return;
    }

    // Add runs to each experiment validation
    Object.keys(agent.validation).forEach(expId => {
      if (agentRunData[expId]) {
        agent.validation[expId].runs = agentRunData[expId];
        updated++;
      }
    });
  });

  console.log(`Updated ${updated} validation entries with run data`);

  // Write updated JSON
  const outputPath = jsonPath;
  fs.writeFileSync(outputPath, JSON.stringify(agentSet, null, 2));
  console.log(`Written to ${outputPath}`);

  // Verify first agent
  const firstAgent = agentSet.agents[0];
  console.log('\nVerification - First agent validation:');
  console.log(`Agent ${firstAgent.agentId}:`);
  Object.entries(firstAgent.validation).slice(0, 2).forEach(([exp, data]) => {
    console.log(`  ${exp}: honestRate=${data.honestRate}, runs=[${data.runs?.join(', ')}]`);
  });
}

migrate();
