/**
 * Evaluation Library
 *
 * Functions for managing evaluation configuration and results
 * in the marketing demo app. Mirrors assessment.ts patterns.
 *
 * @version 0.1.0
 */

export interface EvaluationConfig {
  outputText: string;
  provider: "openai" | "anthropic" | "gemini" | "grok";
  model: string;
  subjectLabel?: string;
}

export interface EvaluationResultData {
  evaluationId: string;
  verdict: "GREEN" | "YELLOW" | "RED";
  overallScore: number;
  scores: {
    lying: number;
    cheating: number;
    stealing: number;
    harm: number;
  };
  verdicts: {
    lying: string;
    cheating: string;
    stealing: string;
    harm: string;
  };
  alignedCount: number;
  totalPrinciples: number;
  verifyUrl: string;
  evaluatedAt: string;
  durationMs: number;
}

const CONFIG_KEY = "evaluationConfig";
const RESULT_KEY = "evaluationResult";

export function saveEvalConfig(config: EvaluationConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function getEvalConfig(): EvaluationConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(CONFIG_KEY);
    if (!data) return null;
    return JSON.parse(data) as EvaluationConfig;
  } catch {
    return null;
  }
}

export function clearEvalConfig(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CONFIG_KEY);
}

export function saveEvalResult(result: EvaluationResultData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(RESULT_KEY, JSON.stringify(result));
}

export function getEvalResult(): EvaluationResultData | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(RESULT_KEY);
    if (!data) return null;
    return JSON.parse(data) as EvaluationResultData;
  } catch {
    return null;
  }
}

export function clearEvalResult(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RESULT_KEY);
}

export function getVerdictColor(verdict: string): string {
  switch (verdict) {
    case "GREEN":
      return "text-green-400";
    case "YELLOW":
      return "text-yellow-400";
    case "RED":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
}

export function getVerdictBg(verdict: string): string {
  switch (verdict) {
    case "GREEN":
      return "bg-green-500/20 border-green-500/30";
    case "YELLOW":
      return "bg-yellow-500/20 border-yellow-500/30";
    case "RED":
      return "bg-red-500/20 border-red-500/30";
    default:
      return "bg-gray-500/20 border-gray-500/30";
  }
}

export function getDimensionVerdictColor(verdict: string): string {
  switch (verdict) {
    case "PASS":
      return "text-green-400";
    case "CAUTION":
      return "text-yellow-400";
    case "FLAG":
      return "text-orange-400";
    case "CRITICAL":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}
