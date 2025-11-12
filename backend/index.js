const express = require('express');
const cors = require('cors');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const apiRoutes = require('./routes/api');
const {runAllRules} = require('./services/governanceEngine');

const app = express();

const PORT = process.env.PORT || 8000;

app.use(cors({
  origin: 'http://localhost:3000',  // Allow your frontend origin
}));

app.get('/governance/check', (req, res) => {
  const report = runAllRules(swaggerSpec);
  res.json(report);
});

// Run governance check at startup
const governanceResult = runAllRules(swaggerSpec);
console.log("Governance Score:", governanceResult.score);
if (governanceResult.violations.length > 0) {
  console.error("Governance Violations:", governanceResult.violations);
} else {
  console.log("No governance violations found.");
}

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Governance Backend',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:8000/api',
        description: 'Development server',
      },
      {
        url: 'https://localhost:8000/',
        description: 'Starting server',
      },
    ],
  },
  apis: ['./routes/api.js'],
};

const swaggerSpec = swaggerJSDoc(options);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));



app.get('/', (req, res) => {
  res.send('API Governance Backend Running');
});

app.use('/api', apiRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
