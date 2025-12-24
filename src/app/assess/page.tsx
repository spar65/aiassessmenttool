/**
 * Assessment Runner Page
 *
 * This page runs the 120-question AI ethics assessment in real-time.
 *
 * Flow:
 * 1. Load configuration from localStorage
 * 2. Check rate limit (prevents abuse)
 * 3. Initialize AI client (OpenAI or Anthropic)
 * 4. Run assessment via SDK with progress updates
 * 5. Store results and redirect to results page
 *
 * Key Features:
 * - Real-time progress bar with question count
 * - Time elapsed and estimated time remaining
 * - Current dimension indicator
 * - Cancel capability with graceful abort
 * - Rate limit handling with user-friendly messages
 *
 * Security:
 * - API keys are used directly in browser (never sent to our servers)
 * - Anthropic calls go through a server-side proxy (CORS workaround)
 * - OpenAI calls use the OpenAI npm package directly
 *
 * @version 0.7.8.5
 * @see https://www.aiassesstech.com/docs/sdk for SDK documentation
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, XCircle, Clock, Zap, AlertTriangle } from "lucide-react";

interface Progress {
  current: number;
  total: number;
  percentage: number;
  dimension: string;
  elapsedMs: number;
  estimatedRemainingMs: number;
}

interface RateLimitStatus {
  canProceed: boolean;
  limit: number;
  remaining: number;
  resetAt: string;
  message: string;
}

export default function AssessPage() {
  const router = useRouter();
  const [status, setStatus] = useState<
    "loading" | "checking-rate-limit" | "rate-limited" | "running" | "completed" | "error" | "cancelled"
  >("loading");
  const [progress, setProgress] = useState<Progress>({
    current: 0,
    total: 120,
    percentage: 0,
    dimension: "",
    elapsedMs: 0,
    estimatedRemainingMs: 0,
  });
  const [error, setError] = useState("");
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus | null>(null);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  // Check rate limit before starting assessment
  const checkRateLimit = useCallback(async (): Promise<boolean> => {
    setStatus("checking-rate-limit");
    try {
      const response = await fetch("/api/rate-limit");
      const data: RateLimitStatus = await response.json();
      setRateLimitStatus(data);
      
      if (!data.canProceed) {
        setStatus("rate-limited");
        setError(data.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn("Rate limit check failed, proceeding anyway:", err);
      // If rate limit check fails, let the server handle it
      return true;
    }
  }, []);

  const runAssessment = useCallback(async () => {
    const configStr = localStorage.getItem("assessmentConfig");
    const leadStr = localStorage.getItem("leadData");

    if (!configStr) {
      setError("No configuration found. Please go back and configure.");
      setStatus("error");
      return;
    }

    // Check rate limit first (v0.7.8.5)
    const canProceed = await checkRateLimit();
    if (!canProceed) {
      return; // Stop here if rate limited
    }

    const config = JSON.parse(configStr);
    const lead = leadStr ? JSON.parse(leadStr) : {};
    const controller = new AbortController();
    setAbortController(controller);
    setStatus("running");

    const startTime = Date.now();

    try {
      // Get provider from config (default to openai for backwards compatibility)
      const provider = config.provider || "openai";
      const apiKey = config.apiKey || config.openaiApiKey;

      console.log(`🚀 Starting assessment with ${provider} (${config.model})`);
      console.log(`📝 System prompt: ${config.systemPrompt.substring(0, 100)}...`);

      // Initialize AI client based on provider
      let callAI: (question: string) => Promise<string>;

      if (provider === "anthropic") {
        // Anthropic/Claude - use server-side proxy to avoid CORS issues
        callAI = async (question: string) => {
          const response = await fetch("/api/proxy/anthropic", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              apiKey: apiKey,
              model: config.model || "claude-sonnet-4-20250514",
              systemPrompt: config.systemPrompt,
              userMessage: question,
              maxTokens: 150,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.error || `Anthropic API error: ${response.status}`
            );
          }

          const data = await response.json();
          return data.response || "A";
        };
      } else {
        // OpenAI - use OpenAI npm package
        const { default: OpenAI } = await import("openai");
        const openai = new OpenAI({
          apiKey: apiKey,
          dangerouslyAllowBrowser: true,
        });

        callAI = async (question: string) => {
          const completion = await openai.chat.completions.create({
            model: config.model || "gpt-4",
            messages: [
              { role: "system", content: config.systemPrompt },
              { role: "user", content: question },
            ],
          });
          return completion.choices[0]?.message?.content || "A";
        };
      }

      // Import the SDK dynamically
      const { AIAssessClient } = await import("@aiassesstech/sdk");

      // Get Health Check Key from environment
      const healthCheckKey =
        process.env.NEXT_PUBLIC_HEALTH_CHECK_KEY || "";

      if (!healthCheckKey || !healthCheckKey.startsWith("hck_")) {
        throw new Error(
          "Health Check Key not configured. Please set NEXT_PUBLIC_HEALTH_CHECK_KEY in your environment."
        );
      }

      // Create SDK client with generous timeouts for slower models
      const client = new AIAssessClient({
        healthCheckKey,
        baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://www.aiassesstech.com",
        perQuestionTimeoutMs: 120000,  // 2 minutes per question
        overallTimeoutMs: 1800000,     // 30 minutes total
      });

      console.log("📡 Connected to AI Assess Tech API");

      // Run assessment using the SDK
      const result = await client.assess(
        // AI callback - this is called for each question
        async (question: string) => {
          if (controller.signal.aborted) {
            throw new Error("cancelled");
          }
          return await callAI(question);
        },
        // Options with progress callback
        {
          onProgress: (progressData) => {
            // SDK provides: current, total, percentage, dimension, elapsedMs, estimatedRemainingMs
            setProgress({
              current: progressData.current,
              total: progressData.total,
              percentage: Math.round(progressData.percentage),
              dimension: progressData.dimension || "",
              elapsedMs: progressData.elapsedMs,
              estimatedRemainingMs: progressData.estimatedRemainingMs,
            });
          },
          metadata: {
            provider,
            model: config.model,
            source: "demo-app",
            // Lead linking (v0.7.8.5) - for email + PDF delivery
            leadId: lead?.leadId,
            email: lead?.email,
          },
        }
      );

      console.log("✅ Assessment complete:", result);

      // Store result in localStorage
      localStorage.setItem("assessmentResult", JSON.stringify(result));
      setStatus("completed");

      // Navigate to results page
      router.push(`/results/${result.sdkSessionId}`);
    } catch (err: any) {
      if (err.message === "cancelled") {
        setStatus("cancelled");
        setError("Assessment cancelled. No results were saved.");
      } else {
        console.error("Assessment error:", err);
        setStatus("error");
        setError(getErrorMessage(err));
      }
    }
  }, [router]);

  useEffect(() => {
    runAssessment();
  }, [runAssessment]);

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  const handleGoBack = () => {
    router.push("/configure");
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full glass rounded-2xl p-8">
        {status === "loading" && (
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-green-400 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white">
              Connecting to AI Assess Tech...
            </h2>
          </div>
        )}

        {status === "running" && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                <Zap className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Assessment in Progress
              </h2>
              <p className="text-gray-400 text-sm">
                Testing your AI's ethical alignment...
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  Question {progress.current} of {progress.total}
                </span>
                <span className="text-white font-medium">
                  {progress.percentage}%
                </span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>

            {/* Current Dimension */}
            {progress.dimension && (
              <div className="flex items-center justify-center space-x-2 text-sm">
                <span className="text-gray-400">Testing:</span>
                <span className="px-2 py-1 bg-white/10 rounded text-white capitalize">
                  {progress.dimension}
                </span>
              </div>
            )}

            {/* Time Stats */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-white/5 rounded-lg">
                <Clock className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                <div className="text-sm text-gray-400">Elapsed</div>
                <div className="text-white font-mono">
                  {formatTime(progress.elapsedMs)}
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <Clock className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                <div className="text-sm text-gray-400">Remaining</div>
                <div className="text-white font-mono">
                  ~{formatTime(progress.estimatedRemainingMs)}
                </div>
              </div>
            </div>

            {/* Cancel Button */}
            <button
              onClick={handleCancel}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Rate Limited State (v0.7.8.5) */}
        {status === "rate-limited" && rateLimitStatus && (
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/20 mb-4">
              <AlertTriangle className="h-8 w-8 text-yellow-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Rate Limit Reached</h2>
            <p className="text-gray-400 text-sm">{rateLimitStatus.message}</p>
            <div className="p-4 bg-white/5 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-center text-sm">
                <div>
                  <div className="text-gray-400">Used</div>
                  <div className="text-white font-semibold">
                    {rateLimitStatus.limit - rateLimitStatus.remaining} / {rateLimitStatus.limit}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Resets At</div>
                  <div className="text-white font-semibold">
                    {new Date(rateLimitStatus.resetAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Want unlimited assessments?{" "}
              <a
                href="https://www.aiassesstech.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 underline"
              >
                Sign up for a free account
              </a>
            </p>
            <button
              onClick={handleGoBack}
              className="w-full py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        )}

        {/* Checking Rate Limit State */}
        {status === "checking-rate-limit" && (
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 text-green-400 animate-spin mx-auto" />
            <p className="text-gray-400">Checking availability...</p>
          </div>
        )}

        {(status === "error" || status === "cancelled") && (
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-4">
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              {status === "cancelled" ? "Assessment Cancelled" : "Error"}
            </h2>
            <p className="text-gray-400 text-sm">{error}</p>
            <button
              onClick={handleGoBack}
              className="w-full py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function getErrorMessage(error: any): string {
  // SDK-specific errors
  if (error.code === "INVALID_KEY") {
    return "Invalid Health Check Key. Please contact support.";
  }
  if (error.code === "RATE_LIMITED" || error.code === "RATE_LIMIT_EXCEEDED") {
    // Check if this is a demo tier rate limit
    const isDemoLimit = error.message?.includes("Demo tier") || error.tier === "DEMO";
    if (isDemoLimit) {
      return "Demo limit reached (5 assessments/hour). Please wait an hour or sign up at aiassesstech.com for unlimited access.";
    }
    return "Rate limit reached. Please wait and try again.";
  }
  if (error.code === "QUESTION_TIMEOUT") {
    return "A question timed out. Your AI may be responding too slowly.";
  }
  if (error.code === "OVERALL_TIMEOUT") {
    return "Assessment timed out. Please try again with a faster model.";
  }

  // Provider-specific errors
  if (error.status === 401 || error.message?.includes("401")) {
    return "Your API key appears to be invalid. Please check and try again.";
  }
  if (error.status === 429 || error.message?.includes("rate")) {
    // Check if this is from our API or the AI provider
    if (error.message?.includes("Demo tier")) {
      return "Demo limit reached (5 assessments/hour). Please wait an hour or sign up at aiassesstech.com for unlimited access.";
    }
    return "AI provider rate limit reached. Please wait a moment and try again.";
  }
  if (
    error.message?.includes("insufficient") ||
    error.message?.includes("credit")
  ) {
    return "Your API account may not have sufficient credits.";
  }
  if (error.message?.includes("network") || error.message?.includes("fetch")) {
    return "Network error. Please check your connection.";
  }
  if (error.message?.includes("Anthropic")) {
    return error.message;
  }
  if (error.message?.includes("Health Check Key not configured")) {
    return error.message;
  }

  return error.message || "An unexpected error occurred.";
}
