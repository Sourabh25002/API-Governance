# API Governance Engine (Policy-as-Code for OpenAPI)

A lightweight policy-as-code engine that analyzes OpenAPI specifications, detects governance violations across security, responses, naming, and versioning categories, computes a weighted compliance score, and integrates with CI/CD and a dashboard for visibility.

## Features

- **Rule-based validation** across 4 governance categories:
  - **Info & Versioning** — metadata completeness, SemVer format checks.
  - **Naming Conventions** — RESTful path conventions (lowercase, hyphens, nouns, plurals), `operationId` presence and style.
  - **Response Definitions** — 2xx/4xx/5xx coverage, response descriptions, content type validation.
  - **Security Schemes** — HTTPS enforcement, bearer token usage, unsafe method protection, rate limiting (429), unused scheme detection.
- **Weighted compliance scoring** in [0, 100] using category weights, severity multipliers, and normalization.
- **CI/CD pipeline** that runs governance checks on push/PR and blocks merges below 80% threshold.
- **Dashboard UI** that displays compliance score and violations grouped by severity.
- **Performance benchmarking** tool to measure execution time and memory usage per spec.

## Repository Structure

```
├── backend/
│   ├── index.js                  # Express server entry point
│   ├── routes/api.js             # Synthetic e-commerce API (Swagger JSDoc)
│   ├── services/
│   │   ├── governanceEngine.js   # Core rule engine + scoring
│   │   └── benchmark.js          # Performance benchmarking CLI
│   └── public/                   # OpenAPI JSON specs (AWS/Amazon + auto-generated)
├── frontend/
│   └── src/app/
│       ├── page.js               # Next.js page entry
│       ├── GovernanceDashboard.js # React dashboard component
│       └── GovernanceDashboard.module.css
└── .github/workflows/ci.yml     # GitHub Actions CI/CD workflow
```

## Prerequisites

- Node.js 20.x (recommended)
- npm (comes with Node)

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/Sourabh25002/API-Governance.git
cd API-Governance
```

### 2. Start the backend (port 8000)

```bash
cd backend
npm ci
npm start
```

### 3. Start the frontend dashboard (port 3000)

```bash
cd frontend
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

### 4. Run a governance check

```bash
# Single-spec check (auto-generated spec)
curl http://localhost:8000/governance/check

# Multi-file check (17 public AWS/Amazon specs)
curl http://localhost:8000/governance/check/files
```

## API Endpoints

| Endpoint                  | Method | Description                                                               |
|---------------------------|--------|---------------------------------------------------------------------------|
| `/governance/check`       | GET    | Validate the auto-generated OpenAPI spec and return `{score, violations}` |
| `/governance/check/files` | GET    | Validate 17 preset public OpenAPI specs and return per-file results       |
| `/api-docs`               | GET    | Swagger UI for browsing the synthetic e-commerce APIs                     |
| `/api-docs.json`          | GET    | Raw OpenAPI JSON spec download                                            |

## Running the Benchmark

The benchmark script measures governance engine performance (execution time and memory usage) against all OpenAPI specs in the `public/` folder.

```bash
cd backend
node services/benchmark.js
```

**Output format** (CSV):

```
File Name,Endpoints,Violations,Time(ms),Memory(MB)
```

The script also prints system configuration (CPU, cores, RAM, OS) for reproducibility.

## How Scoring Works

- Violations are grouped into categories: **Security (30%)**, **Responses (25%)**, **Naming (20%)**, **Versioning (15%)**, **Other (10%)**.
- Severity multipliers: **Errors = 1.5×**, **Warnings = 1.0×**.
- Each category penalty is capped at its weight to prevent single-category domination.
- Final score: `100 − total_weighted_penalty`, clipped to [0, 100].

## CI/CD Integration (GitHub Actions)

The included workflow (`.github/workflows/ci.yml`) runs on every push and PR to `main`:

1. Installs dependencies and starts the backend.
2. Runs single-file and multi-file governance checks.
3. **Fails the pipeline** if compliance score drops below **80%**.
4. Uploads `governance-report.json` as a build artifact (30-day retention).
5. Comments on PRs with score, violation count, and merge readiness.

## Contributing

- Add new rules as modular functions in `governanceEngine.js`.
- Keep rule outputs consistent: `{path, method, message, severity}`.
- Update tests and documentation accordingly.

## License

MIT
