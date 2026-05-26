export const MIN_PASSWORD_SCORE = 4;

const COMMON_WEAK_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "qwerty",
  "qwerty123",
  "letmein",
  "welcome",
  "welcome1",
  "admin",
  "admin123",
  "iloveyou",
  "monkey",
  "dragon",
  "football",
  "abc123",
  "123456",
  "12345678",
  "123456789",
  "111111",
  "000000"
]);

const SEQUENCES = [
  "abcdefghijklmnopqrstuvwxyz",
  "qwertyuiop",
  "asdfghjkl",
  "zxcvbnm",
  "0123456789"
];

function hasSequence(password) {
  const lower = password.toLowerCase();

  return SEQUENCES.some((sequence) => {
    for (let index = 0; index <= sequence.length - 4; index += 1) {
      const chunk = sequence.slice(index, index + 4);
      const reversed = chunk.split("").reverse().join("");

      if (lower.includes(chunk) || lower.includes(reversed)) {
        return true;
      }
    }

    return false;
  });
}

function hasRepeatedCharacters(password) {
  return /(.)\1{3,}/.test(password);
}

export function checkPasswordStrength(password, email = "") {
  const value = String(password || "");
  const lower = value.toLowerCase();
  const emailName = String(email || "").split("@")[0]?.toLowerCase();

  const checks = [
    {
      id: "length",
      label: "Use at least 10 characters",
      passed: value.length >= 10
    },
    {
      id: "upperLower",
      label: "Use uppercase and lowercase letters",
      passed: /[a-z]/.test(value) && /[A-Z]/.test(value)
    },
    {
      id: "number",
      label: "Use at least one number",
      passed: /\d/.test(value)
    },
    {
      id: "symbol",
      label: "Use at least one symbol",
      passed: /[^A-Za-z0-9]/.test(value)
    },
    {
      id: "common",
      label: "Avoid common weak passwords",
      passed: !COMMON_WEAK_PASSWORDS.has(lower)
    },
    {
      id: "email",
      label: "Do not include your email name",
      passed: !emailName || emailName.length < 3 || !lower.includes(emailName)
    },
    {
      id: "repeated",
      label: "Avoid repeated characters like aaaa or 1111",
      passed: !hasRepeatedCharacters(value)
    },
    {
      id: "sequence",
      label: "Avoid obvious sequences like abcd or 1234",
      passed: !hasSequence(value)
    }
  ];

  let score = 0;

  if (value.length >= 8) score += 1;
  if (value.length >= 10) score += 1;
  if (value.length >= 14) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  if (COMMON_WEAK_PASSWORDS.has(lower)) score = 0;
  if (hasRepeatedCharacters(value)) score = Math.max(0, score - 1);
  if (hasSequence(value)) score = Math.max(0, score - 1);

  if (emailName && emailName.length >= 3 && lower.includes(emailName)) {
    score = Math.max(0, score - 2);
  }

  score = Math.min(5, score);

  const isStrong =
    score >= MIN_PASSWORD_SCORE &&
    checks.every((check) => check.passed);

  return {
    score,
    maxScore: 5,
    passedCount: checks.filter((check) => check.passed).length,
    totalChecks: checks.length,
    isStrong,
    checks,
    label:
      score <= 1
        ? "Very weak"
        : score === 2
          ? "Weak"
          : score === 3
            ? "Okay"
            : score === 4
              ? "Strong"
              : "Very strong"
  };
}

export function getPasswordError(password, email = "") {
  const result = checkPasswordStrength(password, email);

  if (result.isStrong) {
    return "";
  }

  const failed = result.checks.find((check) => !check.passed);

  return failed
    ? failed.label
    : "Please choose a stronger password.";
}
