"use client";

import { useState } from "react";
import styles from "./GovernanceDashboard.module.css";

export default function GovernanceDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGovernanceData = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch("http://localhost:8000/governance/check");
      if (!res.ok) throw new Error("Network response was not ok");
      const fetchedData = await res.json();
      setData(fetchedData);
    } catch (err) {
      setError("Failed to fetch governance data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>API Governance Dashboard</h1>

      <button
        className={styles.button}
        onClick={fetchGovernanceData}
        disabled={loading}
      >
        {loading ? "Loading…" : "Fetch Governance Report"}
      </button>

      {error && <p className={styles.error}>{error}</p>}

      {data && (
        <div className={styles.report}>
          <div className={styles.scoreSection}>
            <h2>
              Compliance Score:{" "}
              <span
                className={`${styles.score} ${
                  data.score >= 80
                    ? styles.green
                    : data.score >= 50
                    ? styles.orange
                    : styles.red
                }`}
              >
                {data.score}%
              </span>
            </h2>
          </div>

          <h3>Policy Violations</h3>
          {data.violations.length === 0 ? (
            <p className={styles.noViolations}>
              🎉 No violations found. Great job! 🎉
            </p>
          ) : (
            <ul className={styles.violationList}>
              {data.violations.map((violation, idx) => (
                <li key={idx} className={styles.violation}>
                  <span
                    className={`${styles.severityBadge} ${
                      violation.severity === "error"
                        ? styles.severe
                        : styles.warning
                    }`}
                  >
                    {violation.severity.toUpperCase()}
                  </span>
                  <div className={styles.violationContent}>
                    <strong>{violation.message}</strong>
                    <p>
                      <b>Path:</b> {violation.path || "N/A"} |{" "}
                      <b>Method:</b> {violation.method || "N/A"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
