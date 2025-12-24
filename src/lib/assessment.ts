/**
 * Assessment Library
 * 
 * Functions for managing assessment configuration and results
 * 
 * @version 0.7.8.5
 */

export interface AssessmentConfig {
  provider: "openai" | "anthropic";
  apiKey: string;
  model: string;
  systemPrompt: string;
  thresholds: {
    lying: number;
    cheating: number;
    stealing: number;
    harm: number;
  };
}

export interface AssessmentResult {
  runId: string;
  passed: boolean;
  overallScore: number;
  classification: string;
  scores: {
    lying: number;
    cheating: number;
    stealing: number;
    harm: number;
  };
  dimensionPassed: {
    lying: boolean;
    cheating: boolean;
    stealing: boolean;
    harm: boolean;
  };
  resultHash: string;
  verifyUrl: string;
  completedAt: string;
}

const CONFIG_KEY = "assessmentConfig";
const RESULT_KEY = "assessmentResult";

/**
 * Save assessment configuration
 */
export function saveConfig(config: AssessmentConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  console.log("💾 Assessment config saved");
}

/**
 * Get assessment configuration
 */
export function getConfig(): AssessmentConfig | null {
  if (typeof window === "undefined") return null;
  
  try {
    const data = localStorage.getItem(CONFIG_KEY);
    if (!data) return null;
    return JSON.parse(data) as AssessmentConfig;
  } catch (error) {
    console.error("Failed to load assessment config:", error);
    return null;
  }
}

/**
 * Clear assessment configuration
 */
export function clearConfig(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CONFIG_KEY);
  console.log("🗑️ Assessment config cleared");
}

/**
 * Save assessment result
 */
export function saveResult(result: AssessmentResult): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(RESULT_KEY, JSON.stringify(result));
  console.log("💾 Assessment result saved");
}

/**
 * Get assessment result
 */
export function getResult(): AssessmentResult | null {
  if (typeof window === "undefined") return null;
  
  try {
    const data = localStorage.getItem(RESULT_KEY);
    if (!data) return null;
    return JSON.parse(data) as AssessmentResult;
  } catch (error) {
    console.error("Failed to load assessment result:", error);
    return null;
  }
}

/**
 * Clear assessment result
 */
export function clearResult(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RESULT_KEY);
  console.log("🗑️ Assessment result cleared");
}

/**
 * Clear all assessment data (config + result)
 */
export function clearAll(): void {
  clearConfig();
  clearResult();
  console.log("🗑️ All assessment data cleared");
}

/**
 * Check if we have a valid configuration
 */
export function hasValidConfig(): boolean {
  const config = getConfig();
  return !!(config?.apiKey && config?.systemPrompt);
}

/**
 * Get classification color for UI
 */
export function getClassificationColor(classification: string): string {
  switch (classification.toLowerCase()) {
    case "exemplary":
      return "text-green-400";
    case "strong":
      return "text-emerald-400";
    case "moderate":
      return "text-yellow-400";
    case "needs improvement":
      return "text-orange-400";
    case "critical":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
}

/**
 * Get score color based on value
 */
export function getScoreColor(score: number, threshold: number = 6): string {
  if (score >= threshold + 2) return "text-green-400";
  if (score >= threshold) return "text-emerald-400";
  if (score >= threshold - 1) return "text-yellow-400";
  if (score >= threshold - 2) return "text-orange-400";
  return "text-red-400";
}

/**
 * Format duration from milliseconds
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes === 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Estimate assessment duration based on model
 */
export function estimateDuration(model: string): string {
  const estimates: Record<string, string> = {
    "gpt-4": "8-12 minutes",
    "gpt-4-turbo": "6-10 minutes",
    "gpt-4o": "5-8 minutes",
    "gpt-3.5-turbo": "4-6 minutes",
    "claude-sonnet-4-20250514": "6-10 minutes",
    "claude-opus-4-20250514": "10-15 minutes",
  };
  
  return estimates[model] || "5-10 minutes";
}

