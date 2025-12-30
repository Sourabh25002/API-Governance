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

const specsDir = path.join(__dirname, "public");

// List only specified files you want to check
const specificFiles = [
  "Alexa For Business-swagger.json",
  "Amazon API Gateway-swagger.json",
  "Amazon AppStream-swagger.json",
];

app.get("/governance/check/files", (req, res) => {
  const specificFiles = [
    "Alexa For Business-swagger.json", // 93
    "Amazon API Gateway-swagger.json", // 120
    "Amazon AppStream-swagger.json", // 65
    "Amazon Athena-swagger.json", // 60
    "Amazon Chime-swagger.json", // 60
    "Amazon CloudDirectory-swagger.json", // 38
    "Amazon CloudFront-swagger.json", // 49
    "AmazonApiGatewayV2-swagger.json", // 72
    "AmplifyBackend-swagger.json", // 31
    "Auto Scaling-swagger.json", // 65
    "AWS App Runner-swagger.json", // 35
    "AWS Audit Manager.json", // 61
    "AWS Audit Manager-swagger.json", // 61
    "AWS Backup-swagger.json", // 72
    "AWS CloudFormation-swagger.json", // 66
    "AWS CloudTrail-swagger.json", // 34
    "AWS CodeBuild-swagger.json", // 34
    "AWS Cost Explorer Service-swagger.json", // 26
  ];

  const results = [];

  specificFiles.forEach((filename) => {
    const filePath = path.join(__dirname, "public", filename);

    if (!fs.existsSync(filePath)) {
      results.push({ filename, error: "File not found" });
      return;
    }

    try {
      const spec = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const report = runAllRules(spec);
      results.push({ filename, report });
    } catch (err) {
      results.push({ filename, error: err.message });
    }
  });

  res.json({ results });
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
