import type { Sensitivity } from "@/types";

const HIGH = [
  "cap table",
  "captable",
  "salary",
  "payroll",
  "credential",
  "password",
  "secret",
  "ssn",
  "passport",
  "bank",
  "wire",
  "nda",
  "p&l",
  "board deck",
];

const MEDIUM = [
  "contract",
  "financial",
  "invoice",
  "pii",
  "offer letter",
  "compensation",
];

/** Keyword heuristic only — not a real classifier. */
export function classifySensitivity(name: string): Sensitivity {
  const n = name.toLowerCase();
  if (HIGH.some((k) => n.includes(k))) return "high";
  if (MEDIUM.some((k) => n.includes(k))) return "medium";
  return "unknown";
}
