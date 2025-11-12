// services/governanceEngine.js

/**
 * Governance rule: All paths must start with /api.
 * @param {object} spec OpenAPI spec JSON object
 * @returns {Array} List of violations found
 */
function checkPathPrefix(spec) {
  const violations = [];
  for (const path in spec.paths) {
    if (!path.startsWith('/api')) {
      violations.push({
        path,
        message: 'Path should start with /api',
        severity: 'warning',
      });
    }
  }
  return violations;
}

/**
 * Governance rule: Every path must define at least one response.
 * @param {object} spec OpenAPI spec JSON object
 * @returns {Array} List of violations found
 */
function checkResponsesDefined(spec) {
  const violations = [];
  for (const path in spec.paths) {
    const methods = spec.paths[path];
    for (const method in methods) {
      if (
        !methods[method].responses ||
        Object.keys(methods[method].responses).length === 0
      ) {
        violations.push({
          path,
          method,
          message: 'No responses defined for this operation',
          severity: 'error',
        });
      }
    }
  }
  return violations;
}

/**
 * Governance rule: Security schemes must be defined globally or per path.
 * @param {object} spec OpenAPI spec JSON object
 * @returns {Array} List of violations found
 */
function checkSecuritySchemes(spec) {
  const violations = [];

  const globalSecurity = spec.security && spec.security.length > 0;

  for (const path in spec.paths) {
    const pathItem = spec.paths[path];
    for (const method in pathItem) {
      const operation = pathItem[method];
      const hasSecurity = operation.security && operation.security.length > 0;
      if (!globalSecurity && !hasSecurity) {
        violations.push({
          path,
          method,
          message: 'No security scheme defined globally or on this operation',
          severity: 'error',
        });
      }
    }
  }

  return violations;
}

/**
 * Runs all governance rules on the OpenAPI spec.
 * @param {object} spec OpenAPI spec JSON object
 * @returns {object} compliance report including violations and score
 */
function runAllRules(spec) {
  let violations = [];

  violations = violations.concat(checkPathPrefix(spec));
  violations = violations.concat(checkResponsesDefined(spec));
  violations = violations.concat(checkSecuritySchemes(spec));

  // Calculate a simple compliance score
  // For example: Start at 100, subtract 10 per error, 5 per warning (min 0)
  const errorCount = violations.filter(v => v.severity === 'error').length;
  const warningCount = violations.filter(v => v.severity === 'warning').length;

  let score = 100 - errorCount * 10 - warningCount * 5;
  if (score < 0) score = 0;

  return {
    score,
    violations,
  };
}

module.exports = { runAllRules };
