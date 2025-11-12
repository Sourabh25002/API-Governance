const path = require('path');
const { runAllRules } = require('../services/governanceEngine');

// Import your OpenAPI spec only once here
const swaggerSpec = require(path.resolve(__dirname, '../path/to/swaggerSpec.json'));

const result = runAllRules(swaggerSpec);

console.log('Governance Score:', result.score);

if (result.violations.length > 0) {
  console.error('Violations:', result.violations);
  process.exit(1); // Fail if violations found
}

process.exit(0);
