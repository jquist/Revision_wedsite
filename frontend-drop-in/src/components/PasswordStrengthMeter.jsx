import React from "react";
import { checkPasswordStrength } from "../utils/passwordStrength";

export default function PasswordStrengthMeter({ password, email }) {
  const result = checkPasswordStrength(password, email);
  const percent = (result.score / result.maxScore) * 100;

  return (
    <div className="password-meter-card">
      <div className="password-meter-header">
        <span>Password strength</span>
        <strong>{result.label}</strong>
      </div>

      <div className="password-meter-track" aria-hidden="true">
        <div
          className={`password-meter-fill score-${result.score}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <ul className="password-check-list">
        {result.checks.map((check) => (
          <li key={check.id} className={check.passed ? "passed" : "failed"}>
            <span aria-hidden="true">{check.passed ? "✓" : "•"}</span>
            {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
