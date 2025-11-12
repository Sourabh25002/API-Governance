// backend/scripts/runGovernanceCheck.js

const path = require('path');
const { runAllRules } = require('../services/governanceEngine');

// Adjust path to your OpenAPI JSON spec file
const swaggerSpec = require(path.resolve(__dirname, '../path/to/swaggerSpec.json'));

// Run governance rules on the spec
const result = runAllRules(swaggerSpec);

console.log('Governance Score:', result.score);

if (result.violations.length > 0) {
  console.error('Violations found:', result.violations);
  process.exit(1); // Exit with failure if violations exist
}

process.exit(0); // Success if no violations
