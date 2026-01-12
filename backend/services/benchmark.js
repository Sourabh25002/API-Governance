const { runAllRules } = require("./governanceEngine");
const { performance } = require("perf_hooks");

// SYNTHETIC DATA GENERATOR
function generateSyntheticSpec(pathCount) {
  const paths = {};

  for (let i = 0; i < pathCount; i++) {
    const pathName = `/api/resources/item-${i}`;

    paths[pathName] = {
      get: {
        operationId: `getItem_${i}`,
        responses: {
          200: { description: "Success", content: { "application/json": {} } },
          404: { description: "Not Found" },
        },
      },
      post: {
        operationId: `createItem_${i}`,
        security: [{ bearerAuth: [] }],
        responses: {
          201: { description: "Created" },
        },
      },
    };
  }

  return {
    openapi: "3.0.0",
    info: {
      title: `Synthetic Benchmark API (Size: ${pathCount})`,
      version: "1.0.0",
      description:
        "A synthetic API generated for performance characterization tests.",
    },
    paths: paths,
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer" },
      },
    },
  };
}

// 2. STATISTICAL HELPERS
function calculateStats(samples) {
  const n = samples.length;
  const mean = samples.reduce((a, b) => a + b, 0) / n;

  // Standard Deviation
  const variance =
    samples.reduce((arr, val) => arr + Math.pow(val - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);

  const marginOfError = 1.96 * (stdDev / Math.sqrt(n));

  return { mean, marginOfError };
}

// 3. EXPERIMENT RUNNER
async function runExperiment() {
  const sizes = [1, 10, 50, 100, 500, 1000];
  const iterations = 50;

  console.log("Size,Time(ms),Time_CI,Memory(MB),Memory_CI,CPU_Est(ms)");
  console.log("-------------------------------------------------------");

  for (const size of sizes) {
    const timeSamples = [];
    const memorySamples = [];
    const cpuSamples = [];

    // Warm-up run (V8 optimization)
    runAllRules(generateSyntheticSpec(size));

    for (let i = 0; i < iterations; i++) {
      const spec = generateSyntheticSpec(size);

      if (global.gc) global.gc();

      const startMem = process.memoryUsage().heapUsed;
      const startCpu = process.cpuUsage();
      const startTime = performance.now();

      runAllRules(spec);

      const endTime = performance.now();
      const endCpu = process.cpuUsage(startCpu);
      const endMem = process.memoryUsage().heapUsed;

      // Metrics
      timeSamples.push(endTime - startTime);

      // CPU Usage (User + System converted to ms)
      const cpuTimeMs = (endCpu.user + endCpu.system) / 1000;
      cpuSamples.push(cpuTimeMs);

      // Memory diff
      const memDiff = (endMem - startMem) / 1024 / 1024; // MB
      memorySamples.push(Math.max(0, memDiff));
    }

    const timeStats = calculateStats(timeSamples);
    const memStats = calculateStats(memorySamples);
    const cpuStats = calculateStats(cpuSamples);

    console.log(
      `${size},` +
        `${timeStats.mean.toFixed(3)},` +
        `${timeStats.marginOfError.toFixed(3)},` +
        `${memStats.mean.toFixed(3)},` +
        `${memStats.marginOfError.toFixed(3)},` +
        `${cpuStats.mean.toFixed(3)}`
    );
  }
}

runExperiment();
