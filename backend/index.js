const express = require("express");
const cors = require("cors");
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const path = require("path");

const apiRoutes = require("./routes/api");
const { runAllRules } = require("./services/governanceEngine");

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS for frontend origin
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

// Swagger JSDoc configuration
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Governance Backend",
      version: "1.0.0",
      description: "User management API",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    servers: [
      {
        url: "http://localhost:8000/api",
        description: "Development server",
      },
      {
        url: "https://localhost:8000/",
        description: "Starting server",
      },
    ],
  },
  apis: ["./routes/api.js"],
};

// Initialize Swagger specification from JSDoc options
const swaggerSpec = swaggerJSDoc(options);

// Load external Swagger spec JSON file for governance evaluation
// const swaggerSpecPath = path.join(
//   __dirname,
//   "Adobe Experience Manager (AEM) API-swagger.json"
// );
// const loadedSpec = JSON.parse(fs.readFileSync(swaggerSpecPath, "utf8"));

// // Run governance rules on loaded Swagger spec
// const initialGovernanceResult = runAllRules(loadedSpec);
// console.log("Governance Score:", initialGovernanceResult.score);

// if (initialGovernanceResult.violations.length > 0) {
//   console.error("Governance Violations:", initialGovernanceResult.violations);
// } else {
//   console.log("No governance violations found.");
// }

const specsDir = path.join(__dirname, "public");

// List only specified files you want to check
const specificFiles = [
  "Alexa For Business-swagger.json",
  "Amazon API Gateway-swagger.json",
  "Amazon AppStream-swagger.json",
];

specificFiles.forEach((file) => {
  const filePath = path.join(specsDir, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${file}`);
    return;
  }
  const spec = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const result = runAllRules(spec);
  console.log(`Governance Score for ${file}:`, result.score);

  if (result.violations.length > 0) {
    console.error(`Violations for ${file}:`, result.violations);
  } else {
    console.log(`No violations found for ${file}.`);
  }
});

// Endpoint: API Governance check that runs governance engine against swaggerSpec dynamically
app.get("/governance/check", (req, res) => {
  const report = runAllRules(swaggerSpec);
  res.json(report);
});

// Use Swagger UI middleware to serve API documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve raw Swagger JSON spec
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Basic root endpoint to verify server is running
app.get("/", (req, res) => {
  res.send("API Governance Backend Running");
});

// Mount API routes under /api prefix
app.use("/api", apiRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
