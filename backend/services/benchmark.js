const fs = require("fs");
const path = require("path");
const os = require("os");
const { performance } = require("perf_hooks");
// --- CRITICAL: CHECK THIS PATH ---
// Make sure this points to the file where your logic lives (e.g., governance.js)
// If you are unsure, try: require('./governanceService') or require('./linter')
const { runAllRules } = require("./governanceEngine");
// Rename it to 'runGovernance' so the rest of your script works:
const runGovernance = runAllRules;
// Path to your public folder
const specsDir = path.join(__dirname, "../public");

// --- 1. DEBUG IMPORT ---
// This will tell us if the import is working correctly
console.log("\n=== DEBUGGING IMPORT ===");
console.log(`Type of runGovernance: ${typeof runGovernance}`);
if (typeof runGovernance !== "function") {
  console.error(
    `❌ FATAL ERROR: runGovernance is imported as a "${typeof runGovernance}", not a function.`
  );
  console.error(
    "If it prints an object below, you need to destructure your import (e.g., const { functionName } = require(...))"
  );
  console.log(runGovernance);
  process.exit(1); // Stop script immediately
} else {
  console.log("✅ Import looks good (it is a function).");
}

// --- HELPER: System Info ---
function getSystemInfo() {
  const cpus = os.cpus();
  const cpuModel = cpus.length > 0 ? cpus[0].model : "Unknown CPU";
  const totalMem = (os.totalmem() / 1024 ** 3).toFixed(2);
  return { cpuModel, cores: cpus.length, totalMem };
}

(async () => {
  // Print System Config
  const sys = getSystemInfo();
  console.log(`\n=== SYSTEM CONFIGURATION ===`);
  console.log(`CPU Model  : ${sys.cpuModel}`);
  console.log(`Cores      : ${sys.cores}`);
  console.log(`Total RAM  : ${sys.totalMem} GB`);
  console.log(`OS         : ${os.platform()} ${os.release()}`);
  console.log(
    `-----------------------------------------------------------------------`
  );
  console.log(`File Name,Endpoints,Violations,Time(ms),Memory(MB)`);
  console.log(
    `-----------------------------------------------------------------------`
  );

  try {
    const files = fs.readdirSync(specsDir).filter((f) => f.endsWith(".json"));

    for (const file of files) {
      const filePath = path.join(specsDir, file);

      try {
        const fileContent = fs.readFileSync(filePath, "utf8");
        const json = JSON.parse(fileContent);

        if (global.gc) global.gc();

        const startMem = process.memoryUsage().heapUsed;
        const start = performance.now();

        // --- EXECUTE GOVERNANCE CHECK ---
        const result = await runGovernance(json);

        const end = performance.now();
        const endMem = process.memoryUsage().heapUsed;

        const timeTaken = (end - start).toFixed(3);
        const memoryDiff = ((endMem - startMem) / 1024 / 1024).toFixed(4);

        const endpointCount = json.paths ? Object.keys(json.paths).length : 0;

        let violationCount = 0;
        if (Array.isArray(result)) {
          violationCount = result.length;
        } else if (result && result.violations) {
          violationCount = result.violations.length;
        } else if (result && result.errors) {
          violationCount = result.errors.length;
        }

        console.log(
          `${file},${endpointCount},${violationCount},${timeTaken},${memoryDiff}`
        );
      } catch (err) {
        // --- CRITICAL: PRINT THE ACTUAL ERROR ---
        console.error(`${file},ERROR,0,0,0 -> ${err.message}`);
      }
    }
  } catch (err) {
    console.error("Critical Error:", err.message);
  }
})();
