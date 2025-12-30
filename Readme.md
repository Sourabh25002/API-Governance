# API Governance Engine (Policy-as-Code for OpenAPI)

A lightweight policy-as-code engine that analyzes OpenAPI specifications, detects governance violations (security, responses, naming, versioning), computes a compliance score, and integrates with CI/CD and a dashboard for visibility.

## Features

- Rule-based validation across 4 governance areas:
- Info & versioning (metadata completeness, SemVer checks).
- Naming conventions (RESTful path conventions, `operationId` presence/style).
- Response definitions (2xx/4xx/5xx coverage, response structure completeness).
- Security scheme validations (HTTPS, security schemes, unsafe method protection, 429 recommendation).
- Portfolio-level compliance scoring in the range [0, 100] using category weights, severity multipliers, and normalization.
- CI/CD workflow that runs governance checks on push/PR and can block merges/deployments below a threshold.
- Dashboard UI that shows compliance score and violations grouped by category.

## Repository Structure

- `backend/` — Node.js/Express backend that loads OpenAPI specs and runs governance checks.
- `frontend/` — Next.js/React dashboard that fetches reports and visualizes results.
- `backend/public/` — Public OpenAPI JSON files (sampled from APIs.guru) for evaluation.
- `backend/routes/` — Synthetic API routes used to generate OpenAPI specs via JSDoc annotations.
- `.github/workflows/` — CI/CD workflow for automated governance checks.

## Prerequisites

- Node.js 20.x (recommended).
- npm (comes with Node).

## Quick Start (Local)

1. Clone the repository:

   ```
   git clone https://github.com/Sourabh25002/API-Governance.git
   cd API-GovernANCE
   ```

2. Start the backend:

   ```
   cd backend
   npm ci
   npm start
   ```

3. (Optional) Start the dashboard:

   ```
   cd ../frontend
   npm ci
   npm run dev
   ```

4. Run a governance check (example):
   - Open your browser or use curl to call the backend endpoint that triggers evaluation and returns a JSON report.

## API Endpoints (Backend)

Typical endpoints exposed by the backend:

- `GET /governance/check` — Evaluate the primary OpenAPI spec and return score + violations.
- `GET /governance/checkfiles` — Evaluate a configured set of OpenAPI JSON files and return aggregated results.

(Exact route names and response formats are described in the paper and codebase.)

## CI/CD Integration (GitHub Actions)

The project includes a GitHub Actions workflow that:

- Runs on push and pull requests.
- Starts the backend.
- Calls governance endpoints to generate reports.
- Fails the pipeline if the compliance score drops below the configured threshold.

To enable CI gating in your fork:

1. Keep the workflow file in `.github/workflows/`.
2. Adjust the threshold and endpoints if needed.
3. Commit and push—checks will run automatically on PRs.

## How Scoring Works (High-level)

- Violations are grouped into categories (security, responses, naming, versioning, other).
- Errors have higher penalty than warnings (severity multiplier).
- Penalties are normalized by portfolio size and capped by category weights.
- Final score: `100 - total_penalty`, clipped to [0, 100].

## Dataset (For Reproducing Paper Results)

- Synthetic e-commerce APIs: generated from route/JSDoc specs.
- Public OpenAPI specs: JSON files stored under `backend/public/`, sampled from APIs.guru.

## Contributing

- Add new rules as modular JavaScript functions.
- Keep rule outputs consistent (category, severity, path/method context).
- Add tests (recommended) and update documentation.

## License

Add your license here (MIT/Apache-2.0/etc.). If you haven’t chosen one yet, create a `LICENSE` file and reference it here.

## Citation

If you use this work in academic context, cite the accompanying paper/report from this repository.
