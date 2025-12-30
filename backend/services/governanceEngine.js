/**
 * Governance Checker Module
 * Checks OpenAPI specs for compliance with internal and industry standards.
 */

// 1. INFO & VERSIONING CHECKS (NEW)

function checkInfoBlock(spec) {
  const violations = [];

  if (!spec.info) {
    violations.push({
      path: "root",
      message: 'Missing "info" object',
      severity: "error",
    });
    return violations;
  }

  // Title Check
  if (!spec.info.title) {
    violations.push({
      path: "info.title",
      message: "API Title is missing",
      severity: "error",
    });
  }

  // Description Check
  if (!spec.info.description || spec.info.description.length < 10) {
    violations.push({
      path: "info.description",
      message: "API Description is missing or too short",
      severity: "warning",
    });
  }

  // Semantic Versioning Check (SemVer)
  const semVerRegex = /^\d+\.\d+\.\d+$/;
  if (!spec.info.version) {
    violations.push({
      path: "info.version",
      message: "API Version is missing",
      severity: "error",
    });
  } else if (!semVerRegex.test(spec.info.version)) {
    violations.push({
      path: "info.version",
      message: "Version should follow SemVer (e.g., 1.0.0)",
      severity: "warning",
    });
  }

  return violations;
}
// 2. NAMING CONVENTIONS CHECKS

function runNamingChecks(spec) {
  const violations = [];

  // Check Path Prefix
  for (const path in spec.paths) {
    if (!path.startsWith("/api")) {
      violations.push({
        path,
        message: "Path should start with /api",
        severity: "warning",
      });
    }
  }

  // Check Path Naming Conventions and Additional Rules
  for (const path in spec.paths) {
    if (/[A-Z]/.test(path)) {
      violations.push({
        path,
        message: "Path should be lowercase",
        severity: "warning",
      });
    }
    if (/_/.test(path)) {
      violations.push({
        path,
        message: "Path should use hyphens (-) instead of underscores (_)",
        severity: "warning",
      });
    }
    if (path.endsWith("/")) {
      violations.push({
        path,
        message: "Path should not have trailing slash",
        severity: "warning",
      });
    }

    // Use Nouns, Not Verbs in path segments
    // Extract last segment of the path (excluding parameters)
    const segments = path
      .split("/")
      .filter((seg) => seg && !seg.startsWith("{"));
    segments.forEach((segment) => {
      // Simple verb regex to catch common verbs like get, create, update, delete
      if (
        /^(get|create|update|delete|add|remove|post|put|patch)s?$/i.test(
          segment
        )
      ) {
        violations.push({
          path,
          message: `Path segment "${segment}" looks like a verb; paths should use nouns, not verbs`,
          severity: "warning",
        });
      }
    });

    // Use Plurals for collection names (basic heuristic: last segment should be plural if no param)
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      // If last segment is not a parameter and not plural (not ending in 's'), warn
      if (!lastSegment.endsWith("s") && !lastSegment.match(/^\{.*\}$/)) {
        violations.push({
          path,
          message: `Path segment "${lastSegment}" should be plural for collections`,
          severity: "warning",
        });
      }
    }

    // Use Hierarchies to show relationships (basic heuristic: check nesting makes sense)
    // Example: /users/123/orders is good; a flat path like /users/orders/123 is less clear
    // This is a soft check, just checks path length > 2 and parameter followed by noun
    for (let i = 0; i < segments.length - 1; i++) {
      if (segments[i].match(/^\d+$/) || segments[i].startsWith("{")) {
        // Next segment should be a plural noun (for relationship)
        if (!segments[i + 1].endsWith("s")) {
          violations.push({
            path,
            message: `Path hierarchy may not be clear: expected plural noun after ID or param but found "${segments[i + 1]}"`,
            severity: "warning",
          });
        }
      }
    }
  }

  // Check OperationId Naming
  for (const path in spec.paths) {
    const methods = spec.paths[path];
    for (const method in methods) {
      const op = methods[method];
      if (!op.operationId) {
        violations.push({
          path,
          method,
          message: "Missing operationId",
          severity: "error",
        });
      } else if (!/^[a-z]+(_[a-z]+)*$/.test(op.operationId)) {
        violations.push({
          path,
          method,
          message: "operationId should be lowercase with underscores",
          severity: "warning",
        });
      }
    }
  }

  return violations;
}

// 3. RESPONSE DEFINITIONS CHECKS

function checkResponsesDefined(spec) {
  const violations = [];
  const validStatusCodes = /^1\d\d|2\d\d|3\d\d|4\d\d|5\d\d$/;

  // Essential status codes expected per category with example messages
  const essentialStatusCodes = {
    "2xx": ["200", "201", "204"],
    "4xx": ["400", "401", "403", "404"],
    "5xx": ["500"],
  };

  for (const path in spec.paths) {
    const methods = spec.paths[path];
    for (const method in methods) {
      const operation = methods[method];
      if (
        !operation.responses ||
        Object.keys(operation.responses).length === 0
      ) {
        violations.push({
          path,
          method,
          message: "No responses defined for this operation",
          severity: "error",
        });
        continue;
      }

      const responseCodes = Object.keys(operation.responses);

      // Validate status code format & required presence of key status codes depending on method
      for (const statusCode of responseCodes) {
        const response = operation.responses[statusCode];

        // Validate status code format
        if (!validStatusCodes.test(statusCode)) {
          violations.push({
            path,
            method,
            statusCode,
            message: `Invalid HTTP status code: ${statusCode}`,
            severity: "warning",
          });
        }

        // Check for response description
        if (!response.description || response.description.trim() === "") {
          violations.push({
            path,
            method,
            statusCode,
            message: "Response description is missing or empty",
            severity: "warning",
          });
        }

        // Check content presence for 2xx responses (optional)
        if (statusCode.startsWith("2")) {
          if (!response.content || Object.keys(response.content).length === 0) {
            violations.push({
              path,
              method,
              statusCode,
              message:
                "Successful response should specify content and media types",
              severity: "warning",
            });
          }
        }
      }

      // Enforce expected status codes depending on HTTP method
      const methodUpper = method.toUpperCase();

      // Check for 2xx category status codes presence (success)
      if (
        !responseCodes.some((code) =>
          essentialStatusCodes["2xx"].includes(code)
        )
      ) {
        violations.push({
          path,
          method,
          message:
            "Successful responses (2xx) like 200, 201, or 204 should be defined",
          severity: "error",
        });
      }

      // 4xx client error checks (should generally be present)
      if (
        !responseCodes.some((code) =>
          essentialStatusCodes["4xx"].includes(code)
        )
      ) {
        violations.push({
          path,
          method,
          message:
            "Client error responses (4xx) like 400, 401, 403, or 404 should be defined",
          severity: "warning",
        });
      }

      // 5xx server error check
      if (!responseCodes.includes("500")) {
        violations.push({
          path,
          method,
          message: "Server error response 500 should be defined",
          severity: "warning",
        });
      }
    }
  }

  return violations;
}

// 4. SECURITY SCHEMES CHECKS

function checkSecuritySchemes(spec) {
  const violations = [];

  const securitySchemes = spec.components?.securitySchemes || {};
  const validTypes = ["apiKey", "http", "oauth2", "openIdConnect"];

  // Verify global security
  const globalSecurity =
    Array.isArray(spec.security) && spec.security.length > 0;

  // Check for unused security schemes
  const usedSchemes = new Set();

  function validateSecurityRequirement(requirement, path, method) {
    for (const schemeName in requirement) {
      if (!securitySchemes[schemeName]) {
        violations.push({
          path,
          method,
          message: `Security scheme "${schemeName}" not defined in components.securitySchemes`,
          severity: "error",
        });
      } else {
        usedSchemes.add(schemeName);
      }
    }
  }

  // Check if servers use HTTPS URLs
  if (spec.servers) {
    spec.servers.forEach((server) => {
      if (!server.url.startsWith("https://")) {
        violations.push({
          path: "servers.url",
          message: `Server URL "${server.url}" is not HTTPS; SSL/TLS is required`,
          severity: "error",
        });
      }
    });
  } else {
    violations.push({
      path: "servers",
      message: "No servers defined; need HTTPS servers defined",
      severity: "warning",
    });
  }

  for (const path in spec.paths) {
    const pathItem = spec.paths[path];
    for (const method in pathItem) {
      const operation = pathItem[method];

      // Operation-level security
      const hasSecurity =
        Array.isArray(operation.security) && operation.security.length > 0;
      if (!globalSecurity && !hasSecurity) {
        violations.push({
          path,
          method,
          message: "No security scheme defined globally or on this operation",
          severity: "error",
        });
      }

      // Validate operation security requirement objects
      if (hasSecurity) {
        operation.security.forEach((req) =>
          validateSecurityRequirement(req, path, method)
        );

        // Check for Bearer Token usage (http scheme with bearer format)
        const bearerSchemeUsed = operation.security.some((req) =>
          Object.keys(req).some((schemeName) => {
            const scheme = securitySchemes[schemeName];
            return (
              scheme && scheme.type === "http" && scheme.scheme === "bearer"
            );
          })
        );
        if (!bearerSchemeUsed) {
          violations.push({
            path,
            method,
            message:
              "Operations should use Bearer token authentication (JWT) where applicable",
            severity: "warning",
          });
        }
      }

      // Check HTTP methods that should be secured
      if (
        ["post", "put", "delete", "patch"].includes(method.toLowerCase()) &&
        !hasSecurity &&
        !globalSecurity
      ) {
        violations.push({
          path,
          method,
          message: "Unsafe HTTP method must have a security scheme",
          severity: "error",
        });
      }

      // Check for Rate Limiting status response 429
      if (operation.responses) {
        if (!operation.responses["429"]) {
          violations.push({
            path,
            method,
            message:
              "Rate limiting response (429 Too Many Requests) is recommended",
            severity: "warning",
          });
        }
      } else {
        violations.push({
          path,
          method,
          message:
            "No responses defined; unable to check for rate limiting response",
          severity: "error",
        });
      }
    }
  }

  // Validate security scheme types
  for (const [schemeName, scheme] of Object.entries(securitySchemes)) {
    if (!validTypes.includes(scheme.type)) {
      violations.push({
        message: `Security scheme "${schemeName}" has invalid type "${scheme.type}"`,
        severity: "error",
      });
    }
    if (
      scheme.type === "apiKey" &&
      !["header", "query", "cookie"].includes(scheme.in)
    ) {
      violations.push({
        message: `apiKey security scheme "${schemeName}" must have 'in' as 'header', 'query', or 'cookie'`,
        severity: "error",
      });
    }
  }

  // Warn about unused security schemes
  for (const schemeName of Object.keys(securitySchemes)) {
    if (!usedSchemes.has(schemeName)) {
      violations.push({
        message: `Security scheme "${schemeName}" declared but not used in any operation`,
        severity: "warning",
      });
    }
  }

  return violations;
}

// SCORING MECHANISM

function calculateWeightedScore(violations, totalApis = 1) {
  // Normalize violations per API (scale invariant)
  const violationsPerApi = violations.length / totalApis;

  // Category distribution weights (gentler, total=100%)
  const CATEGORY_WEIGHTS = {
    security: 30, // Reduced from 40
    responses: 25,
    naming: 20,
    versioning: 15, // Slightly increased, still lowest
  };

  // Group by category + severity
  const categoryViolations = {};
  violations.forEach((v) => {
    const cat = v.category || "other";
    if (!categoryViolations[cat])
      categoryViolations[cat] = { errors: 0, warnings: 0 };
    categoryViolations[cat][v.severity === "error" ? "errors" : "warnings"]++;
  });

  // Calculate weighted percentage penalty (0-100%)
  let weightedPenaltyPercentage = 0;
  Object.keys(categoryViolations).forEach((cat) => {
    const weight = CATEGORY_WEIGHTS[cat] || 10; // Uncategorised = 10%

    // Violations per API for this category
    const catViolationsPerApi =
      (categoryViolations[cat].errors + categoryViolations[cat].warnings) /
      totalApis;

    // Severity multiplier (gentler: error=1.5x, warning=1x)
    const severityMultiplier =
      (categoryViolations[cat].errors * 1.5 +
        categoryViolations[cat].warnings) /
      totalApis;

    // Category penalty as percentage of weight (max = weight)
    const categoryPenaltyPct = Math.min(weight, severityMultiplier * 10); // 10 = sensitivity factor
    weightedPenaltyPercentage += categoryPenaltyPct;
  });

  // Final score: 100% - total weighted penalty percentage
  const score = Math.max(0, Math.round(100 - weightedPenaltyPercentage));
  return score;
}

/**
 * Runs all governance rules on the OpenAPI spec.
 * @param {object} spec OpenAPI spec JSON object
 * @returns {object} compliance report including violations and score
 */
function runAllRules(spec) {
  let violations = [];

  violations = violations.concat(checkInfoBlock(spec));
  violations = violations.concat(runNamingChecks(spec));
  violations = violations.concat(checkResponsesDefined(spec));
  violations = violations.concat(checkSecuritySchemes(spec));

  //Weighted Percentage Scoring
  const score = calculateWeightedScore(violations);

  return { score, violations };
}

module.exports = { runAllRules };
