/**
 * Assessment Runner Page - Conversational Mode Support
 *
 * This page runs the 120-question AI ethics assessment in real-time.
 *
 * Flow:
 * 1. Load configuration from localStorage
 * 2. Check rate limit (prevents abuse)
 * 3. Try to recover from previous session (if interrupted)
 * 4. Initialize AI client (OpenAI or Anthropic)
 * 5. Run assessment with conversation context (if enabled)
 * 6. Store results and redirect to results page
 *
 * Key Features:
 * - CONVERSATIONAL mode: AI sees last 20 Q&A pairs for context
 * - ISOLATED mode: Each question asked independently
 * - Session recovery: Resume after page refresh
 * - Real-time progress bar with question count
 * - Cancel capability with graceful abort
 * - Error retry with progress saved
 *
 * Security:
 * - API keys are used directly in browser (never sent to our servers)
 * - Anthropic calls go through a server-side proxy (CORS workaround)
 * - OpenAI calls use the OpenAI npm package directly
 *
 * @version 0.8.0
 * @see https://www.aiassesstech.com/docs/sdk for SDK documentation
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, XCircle, Clock, Zap, AlertTriangle, MessageCircle, FileText, Shield, ExternalLink } from "lucide-react";
import { Header, Footer } from "@/components";

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
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isConversational, setIsConversational] = useState(true);
  
  // v0.8.9.7: Track assessment info for display during progress
  const [assessmentInfo, setAssessmentInfo] = useState<{
    provider: string;
    model: string;
    promptName: string;
    email: string;
  } | null>(null);

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

    // Check rate limit first
    const canProceed = await checkRateLimit();
    if (!canProceed) {
      return;
    }

    const config = JSON.parse(configStr);
    const lead = leadStr ? JSON.parse(leadStr) : {};
    const controller = new AbortController();
    setAbortController(controller);
    setStatus("running");

    // Get provider and mode from config
    const provider = config.provider || "openai";
    const apiKey = config.apiKey || config.openaiApiKey;
    const conversationalMode = config.conversationalMode !== false; // Default: true
    setIsConversational(conversationalMode);
    
    // v0.8.9.7: Set assessment info for display
    setAssessmentInfo({
      provider: provider,
      model: config.model || "default",
      promptName: config.promptName || "",
      email: lead?.email || "",
    });

    console.log(
      `🚀 Starting ${conversationalMode ? "CONVERSATIONAL" : "ISOLATED"} assessment with ${provider} (${config.model})`
    );
    console.log(`📝 System prompt: ${config.systemPrompt.substring(0, 100)}...`);

    // Conversation history for conversational mode
    const conversationHistory: Array<{
      role: "user" | "assistant";
      content: string;
    }> = [];

    // Partial results for error recovery
    const partialResults: Array<{
      questionIndex: number;
      question: string;
      answer: string;
      timestamp: number;
    }> = [];

    // Context window size (last N Q&A pairs to include)
    const CONTEXT_WINDOW_SIZE = 20; // 20 pairs = 40 messages

    // Try to recover from previous session if exists
    try {
      const savedHistory = sessionStorage.getItem("assessment_history");
      const savedResults = sessionStorage.getItem("assessment_partial_results");
      if (savedHistory && savedResults) {
        const resumeConfirmed = window.confirm(
          "Found a previous incomplete assessment. Would you like to resume?\n\n" +
            "(Note: The AI will continue with the same conversation context)"
        );
        if (resumeConfirmed) {
          conversationHistory.push(...JSON.parse(savedHistory));
          partialResults.push(...JSON.parse(savedResults));
          console.log(`📂 Resumed with ${partialResults.length} previous Q&A pairs in context`);
        } else {
          sessionStorage.removeItem("assessment_history");
          sessionStorage.removeItem("assessment_partial_results");
        }
      }
    } catch (e) {
      // Ignore recovery errors
    }

    // Initialize AI callback based on provider and mode
    let callAI: (question: string) => Promise<string>;

    try {
      if (provider === "anthropic") {
        if (conversationalMode) {
          // ============================================
          // CONVERSATIONAL MODE FOR ANTHROPIC
          // ============================================
          callAI = async (question: string) => {
            // Add new question to history
            conversationHistory.push({ role: "user", content: question });

            // Get windowed context (last N pairs)
            const windowStart = Math.max(0, conversationHistory.length - CONTEXT_WINDOW_SIZE * 2);
            const windowedHistory = conversationHistory.slice(windowStart);

            const response = await fetch("/api/proxy/anthropic", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                apiKey: apiKey,
                model: config.model || "claude-sonnet-4-20250514",
                systemPrompt: config.systemPrompt,
                messages: windowedHistory,
                maxTokens: 10, // Only need a letter
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `Anthropic API error: ${response.status}`);
            }

            const data = await response.json();
            const answer = data.response || "A";

            // Add response to history
            conversationHistory.push({ role: "assistant", content: answer });

            // Persist to sessionStorage for recovery
            try {
              sessionStorage.setItem("assessment_history", JSON.stringify(conversationHistory));
            } catch (e) {
              // Ignore storage errors
            }

            return answer;
          };
        } else {
          // ============================================
          // ISOLATED MODE FOR ANTHROPIC (Legacy)
          // ============================================
          callAI = async (question: string) => {
            const response = await fetch("/api/proxy/anthropic", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                apiKey: apiKey,
                model: config.model || "claude-sonnet-4-20250514",
                systemPrompt: config.systemPrompt,
                userMessage: question,
                maxTokens: 10,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `Anthropic API error: ${response.status}`);
            }

            const data = await response.json();
            return data.response || "A";
          };
        }
      } else if (provider === "gemini") {
        // ============================================
        // GEMINI (v0.8.9.3: Added Gemini support)
        // ============================================
        if (conversationalMode) {
          callAI = async (question: string) => {
            conversationHistory.push({ role: "user", content: question });

            const windowStart = Math.max(0, conversationHistory.length - CONTEXT_WINDOW_SIZE * 2);
            const windowedHistory = conversationHistory.slice(windowStart);

            const response = await fetch("/api/proxy/gemini", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                apiKey: apiKey,
                model: config.model || "gemini-2.0-flash",
                systemPrompt: config.systemPrompt,
                messages: windowedHistory,
                maxTokens: 10,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `Gemini API error: ${response.status}`);
            }

            const data = await response.json();
            const answer = data.response || "A";

            conversationHistory.push({ role: "assistant", content: answer });

            try {
              sessionStorage.setItem("assessment_history", JSON.stringify(conversationHistory));
            } catch (e) {
              // Ignore storage errors
            }

            return answer;
          };
        } else {
          callAI = async (question: string) => {
            const response = await fetch("/api/proxy/gemini", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                apiKey: apiKey,
                model: config.model || "gemini-2.0-flash",
                systemPrompt: config.systemPrompt,
                userMessage: question,
                maxTokens: 10,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `Gemini API error: ${response.status}`);
            }

            const data = await response.json();
            return data.response || "A";
          };
        }
      } else if (provider === "grok") {
        // ============================================
        // GROK (v0.8.9.3: Added Grok support)
        // ============================================
        if (conversationalMode) {
          callAI = async (question: string) => {
            conversationHistory.push({ role: "user", content: question });

            const windowStart = Math.max(0, conversationHistory.length - CONTEXT_WINDOW_SIZE * 2);
            const windowedHistory = conversationHistory.slice(windowStart);

            const response = await fetch("/api/proxy/grok", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                apiKey: apiKey,
                model: config.model || "grok-3",
                systemPrompt: config.systemPrompt,
                messages: windowedHistory,
                maxTokens: 10,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `Grok API error: ${response.status}`);
            }

            const data = await response.json();
            const answer = data.response || "A";

            conversationHistory.push({ role: "assistant", content: answer });

            try {
              sessionStorage.setItem("assessment_history", JSON.stringify(conversationHistory));
            } catch (e) {
              // Ignore storage errors
            }

            return answer;
          };
        } else {
          callAI = async (question: string) => {
            const response = await fetch("/api/proxy/grok", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                apiKey: apiKey,
                model: config.model || "grok-3",
                systemPrompt: config.systemPrompt,
                userMessage: question,
                maxTokens: 10,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `Grok API error: ${response.status}`);
            }

            const data = await response.json();
            return data.response || "A";
          };
        }
      } else {
        // ============================================
        // OPENAI (Default - Both modes)
        // ============================================
        const { default: OpenAI } = await import("openai");
        const openai = new OpenAI({
          apiKey: apiKey,
          dangerouslyAllowBrowser: true,
        });

        if (conversationalMode) {
          // Start with system prompt
          const openaiHistory: Array<{
            role: "system" | "user" | "assistant";
            content: string;
          }> = [{ role: "system", content: config.systemPrompt }];

          callAI = async (question: string) => {
            openaiHistory.push({ role: "user", content: question });

            // Apply context window (keep system + last N pairs)
            const systemMsg = openaiHistory[0];
            const recentMessages = openaiHistory.slice(1).slice(-(CONTEXT_WINDOW_SIZE * 2));
            const windowedHistory = [systemMsg, ...recentMessages];

            const completion = await openai.chat.completions.create({
              model: config.model || "gpt-3.5-turbo",
              messages: windowedHistory,
              max_tokens: 10,
            });

            const answer = completion.choices[0]?.message?.content || "A";
            openaiHistory.push({ role: "assistant", content: answer });

            // Also track in conversationHistory for sessionStorage
            conversationHistory.push({ role: "user", content: question });
            conversationHistory.push({ role: "assistant", content: answer });

            try {
              sessionStorage.setItem("assessment_history", JSON.stringify(conversationHistory));
            } catch (e) {
              // Ignore storage errors
            }

            return answer;
          };
        } else {
          // Isolated mode
          callAI = async (question: string) => {
            const completion = await openai.chat.completions.create({
              model: config.model || "gpt-3.5-turbo",
              messages: [
                { role: "system", content: config.systemPrompt },
                { role: "user", content: question },
              ],
              max_tokens: 10,
            });

            return completion.choices[0]?.message?.content || "A";
          };
        }
      }

      // Track question index for partial results
      let questionIndex = partialResults.length;

      // Rate limit protection settings (v0.8.9: Added Gemini/Grok specific delays)
      // v1.6.19: Increased Anthropic from 100ms to 500ms for token-based rate limits
      const DELAY_BETWEEN_QUESTIONS_MS: Record<string, number> = {
        openai: 500,    // OpenAI needs more delay
        anthropic: 500, // v1.6.19: Anthropic has token-based rate limits (100k tokens/min)
        gemini: 200,    // Gemini is moderate
        grok: 1500,     // xAI has strict rate limits (60 req/min) - needs ~1.5s spacing
      };
      const questionDelay = DELAY_BETWEEN_QUESTIONS_MS[provider] || 100;
      const MAX_RETRIES = 3;
      const INITIAL_RETRY_DELAY_MS = 2000;

      // Helper: delay function
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      // Helper: call AI with retry logic for rate limits
      const callAIWithRetry = async (question: string, retryCount = 0): Promise<string> => {
        try {
          return await callAI(question);
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          const isRateLimitError = 
            errorMessage.includes("429") || 
            errorMessage.includes("rate") || 
            errorMessage.includes("Rate") ||
            errorMessage.includes("too many requests") ||
            errorMessage.includes("Too Many Requests");

          if (isRateLimitError && retryCount < MAX_RETRIES) {
            const retryDelay = INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount);
            console.log(`⏳ Rate limited. Retrying in ${retryDelay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            await delay(retryDelay);
            return callAIWithRetry(question, retryCount + 1);
          }
          throw err;
        }
      };

      // Wrap callAI to track partial results with rate limiting
      const trackedCallAI = async (question: string) => {
        if (controller.signal.aborted) {
          throw new Error("cancelled");
        }

        // Add delay between questions to avoid rate limits (v0.8.9)
        if (questionIndex > 0) {
          await delay(questionDelay);
        }

        const answer = await callAIWithRetry(question);

        partialResults.push({
          questionIndex: questionIndex++,
          question,
          answer,
          timestamp: Date.now(),
        });

        // Save partial results for recovery
        try {
          sessionStorage.setItem("assessment_partial_results", JSON.stringify(partialResults));
        } catch (e) {
          // Ignore storage errors
        }

        return answer;
      };

      // Import the SDK and run assessment
      const { AIAssessClient } = await import("@aiassesstech/sdk");

      const healthCheckKey = process.env.NEXT_PUBLIC_HEALTH_CHECK_KEY || "";

      if (!healthCheckKey || !healthCheckKey.startsWith("hck_")) {
        throw new Error(
          "Health Check Key not configured. Please set NEXT_PUBLIC_HEALTH_CHECK_KEY in your environment."
        );
      }

      const client = new AIAssessClient({
        healthCheckKey,
        baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://aiassesstech.com",
        perQuestionTimeoutMs: 120000,
        overallTimeoutMs: 1800000,
      });

      console.log("📡 Connected to AI Assess Tech API");

      const result = await client.assess(trackedCallAI, {
        onProgress: (progressData) => {
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
          conversationalMode,
          leadId: lead?.leadId,
          email: lead?.email,
          // v1.2.22: Include system prompt for tracking
          systemPrompt: config.systemPrompt,
        },
      });

      console.log("✅ Assessment complete:", result);

      // Clear recovery data on success
      sessionStorage.removeItem("assessment_history");
      sessionStorage.removeItem("assessment_partial_results");
      sessionStorage.removeItem("assessment_error");

      // Store result in localStorage
      localStorage.setItem("assessmentResult", JSON.stringify(result));
      setStatus("completed");

      // Send results email if we have an email address
      if (lead?.email) {
        try {
          console.log(`📧 Sending results email to ${lead.email}...`);
          
          // Calculate overall score from dimension scores (average of 4 dimensions)
          const scores = result.scores || { lying: 0, cheating: 0, stealing: 0, harm: 0 };
          const overallScore = (scores.lying + scores.cheating + scores.stealing + scores.harm) / 4 / 10; // Normalize to 0-1
          
          // Format dimension scores for email
          const dimensionScores = {
            lying: { score: scores.lying / 10, passed: result.passed?.lying || false },
            cheating: { score: scores.cheating / 10, passed: result.passed?.cheating || false },
            stealing: { score: scores.stealing / 10, passed: result.passed?.stealing || false },
            harm: { score: scores.harm / 10, passed: result.passed?.harm || false },
          };
          
          const emailResponse = await fetch("/api/send-results", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: lead.email,
              sdkSessionId: result.sdkSessionId,
              overallScore: overallScore,
              overallPassed: result.overallPassed || false,
              dimensionScores: dimensionScores,
              provider: provider,
              model: config.model,
              completedAt: result.completedAt || new Date().toISOString(),
            }),
          });
          
          if (emailResponse.ok) {
            const emailResult = await emailResponse.json();
            if (emailResult.success) {
              console.log("✅ Results email sent successfully");
            } else if (emailResult.skipped) {
              console.log("⚠️ Email skipped - service not configured");
            }
          } else {
            console.warn("⚠️ Failed to send results email");
          }
        } catch (emailError) {
          console.warn("⚠️ Email send error:", emailError);
          // Don't block navigation on email failure
        }
      }

      // Navigate to results page
      router.push(`/results/${result.sdkSessionId}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      if (errorMessage === "cancelled") {
        setStatus("cancelled");
        setError("Assessment cancelled. Your progress has been saved.");
      } else {
        console.error("Assessment error:", err);

        // Save state for recovery
        const errorState = {
          error: errorMessage,
          completedQuestions: partialResults.length,
          timestamp: Date.now(),
        };

        try {
          sessionStorage.setItem("assessment_error", JSON.stringify(errorState));
        } catch (e) {
          // Ignore storage errors
        }

        setStatus("error");
        setError(getErrorMessage(err));

        // Show retry option for recoverable errors
        if (partialResults.length > 0) {
          const retryConfirmed = window.confirm(
            `Assessment failed after ${partialResults.length} questions.\n\n` +
              `Error: ${errorMessage}\n\n` +
              `Your progress has been saved. Would you like to retry?`
          );

          if (retryConfirmed) {
            // Reset status and retry
            setStatus("loading");
            setError("");
            await runAssessment();
          }
        }
      }
    }
  }, [router, checkRateLimit]);

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
    <div className="min-h-screen flex flex-col">
      <Header showBackButton backUrl="/configure" />
      
      <main className="flex-1 flex items-center justify-center px-4">
      <div className="max-w-md w-full glass rounded-2xl p-8">
        {status === "loading" && (
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-green-400 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white">Connecting to AI Assess Tech...</h2>
          </div>
        )}

        {status === "running" && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                <Zap className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Assessment in Progress</h2>
              <p className="text-gray-400 text-sm">Testing your AI's ethical alignment...</p>
            </div>

            {/* Mode Indicator */}
            <div className="flex items-center justify-center space-x-2 text-xs">
              {isConversational ? (
                <>
                  <MessageCircle className="h-3 w-3 text-green-400" />
                  <span className="text-green-400">Conversational Mode</span>
                </>
              ) : (
                <>
                  <FileText className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-400">Isolated Mode</span>
                </>
              )}
            </div>

            {/* Assessment Info (v0.8.9.7) */}
            {assessmentInfo && (
              <div className="p-3 bg-white/5 rounded-lg space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">AI Provider:</span>
                  <span className="text-white font-medium">
                    {assessmentInfo.provider === "openai" && "🤖 OpenAI"}
                    {assessmentInfo.provider === "anthropic" && "🧠 Anthropic"}
                    {assessmentInfo.provider === "gemini" && "✨ Google Gemini"}
                    {assessmentInfo.provider === "grok" && "🚀 xAI Grok"}
                    {" "}{assessmentInfo.model}
                  </span>
                </div>
                {assessmentInfo.promptName && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Prompt:</span>
                    <span className="text-green-400 font-medium truncate max-w-[180px]">
                      {assessmentInfo.promptName}
                    </span>
                  </div>
                )}
                {assessmentInfo.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Results to:</span>
                    <span className="text-gray-300 truncate max-w-[180px]">
                      {assessmentInfo.email}
                    </span>
                  </div>
                )}
                {/* Question Bank with ETH Verification */}
                <div className="flex items-center justify-between pt-1.5 border-t border-white/10">
                  <span className="text-gray-500">Question Bank:</span>
                  <a
                    href="https://etherscan.io/tx/0xea1c7c85fb5902b0db213f444c4a30c4bc63f62b4cb264d177b5893d0142fa47"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <Shield className="h-3 w-3" />
                    <span className="font-medium">Morality v1.0.0</span>
                    <span className="text-emerald-500 text-[10px]">ETH Verified</span>
                    <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                  </a>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  Question {progress.current} of {progress.total}
                </span>
                <span className="text-white font-medium">{progress.percentage}%</span>
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
                <div className="text-white font-mono">{formatTime(progress.elapsedMs)}</div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <Clock className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                <div className="text-sm text-gray-400">Remaining</div>
                <div className="text-white font-mono">~{formatTime(progress.estimatedRemainingMs)}</div>
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

        {/* Rate Limited State - SDK Assessment Limit (NOT AI Provider) */}
        {status === "rate-limited" && rateLimitStatus && (
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/20 mb-4">
              <AlertTriangle className="h-8 w-8 text-yellow-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Demo Assessment Limit Reached</h2>
            <p className="text-gray-400 text-sm">
              You&apos;ve used all your free demo assessments.
              <br />
              <span className="text-yellow-400">This is NOT an issue with your AI provider.</span>
            </p>
            <div className="p-4 bg-white/5 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-center text-sm">
                <div>
                  <div className="text-gray-400">Assessments Used</div>
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
            
            {/* Upgrade CTA - Primary Action */}
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-400 font-semibold mb-2">🚀 Get Unlimited Assessments</p>
              <p className="text-gray-400 text-xs mb-3">
                Create a free account for higher limits, or upgrade to a paid plan for unlimited AI ethics testing.
              </p>
              <a
                href="https://www.aiassesstech.com/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition-colors text-center"
              >
                View Plans & Pricing
              </a>
            </div>
            
            <button
              onClick={handleGoBack}
              className="w-full py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition-colors text-sm"
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
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              error.includes("🔒") ? "bg-yellow-500/20" : "bg-red-500/20"
            }`}>
              {error.includes("🔒") ? (
                <AlertTriangle className="h-8 w-8 text-yellow-400" />
              ) : (
                <XCircle className="h-8 w-8 text-red-400" />
              )}
            </div>
            <h2 className="text-xl font-semibold text-white">
              {status === "cancelled" 
                ? "Assessment Cancelled" 
                : error.includes("🔒") 
                  ? "Assessment Limit Reached" 
                  : "Error"}
            </h2>
            <p className="text-gray-400 text-sm">{error}</p>
            
            {/* Show upgrade CTA for SDK rate limit errors */}
            {error.includes("🔒") && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-400 font-semibold mb-2">🚀 Need More Assessments?</p>
                <p className="text-gray-400 text-xs mb-3">
                  Create a free account or upgrade to unlock unlimited AI ethics testing.
                </p>
                <a
                  href="https://www.aiassesstech.com/pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition-colors text-center"
                >
                  View Plans & Pricing
                </a>
              </div>
            )}
            
            <button
              onClick={handleGoBack}
              className={`w-full py-3 rounded-lg transition-colors ${
                error.includes("🔒") 
                  ? "bg-white/10 hover:bg-white/20 text-gray-300" 
                  : "bg-green-500 hover:bg-green-400 text-black font-semibold"
              }`}
            >
              Go Back
            </button>
          </div>
        )}
      </div>
      </main>
      
      <Footer minimal />
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const err = error as Error & { code?: string; status?: number; tier?: string };

    // ==========================================================================
    // SDK ASSESSMENT LIMITS (aiassesstech.com platform limits)
    // These are NOT AI provider issues - user needs to upgrade their plan
    // ==========================================================================
    if (err.code === "INVALID_KEY") {
      return "Invalid Health Check Key. Please contact support.";
    }
    if (err.code === "RATE_LIMITED" || err.code === "RATE_LIMIT_EXCEEDED") {
      const isDemoLimit = err.message?.includes("Demo tier") || err.tier === "DEMO";
      if (isDemoLimit) {
        return "🔒 Demo Assessment Limit Reached (5/hour). Your AI provider is working fine! Sign up at aiassesstech.com/pricing for unlimited assessments.";
      }
      return "🔒 Assessment Limit Reached. Your AI provider is working fine! Upgrade your plan at aiassesstech.com/pricing for more assessments.";
    }
    if (err.code === "SAFETY_LIMIT") {
      return "🔒 Safety Limit Reached. You can raise this limit in your dashboard at aiassesstech.com.";
    }
    if (err.code === "QUESTION_TIMEOUT") {
      return "⏱️ Question Timeout. Your AI took too long to respond. Try a faster model.";
    }
    if (err.code === "OVERALL_TIMEOUT") {
      return "⏱️ Assessment Timeout. The full test took too long. Try a faster model.";
    }

    // ==========================================================================
    // AI PROVIDER ERRORS (OpenAI, Anthropic, Gemini, Grok issues)
    // These ARE related to the user's AI provider or API key
    // ==========================================================================
    if (err.status === 401 || err.message?.includes("401") || err.message?.includes("unauthorized")) {
      return "🔑 Invalid API Key. Your AI provider rejected the key. Please check it's correct and active.";
    }
    if (err.status === 403 || err.message?.includes("403") || err.message?.includes("forbidden")) {
      return "🔑 API Access Denied. Your AI provider blocked the request. Check your account permissions.";
    }
    if (err.status === 429 || err.message?.includes("rate") || err.message?.includes("too many")) {
      // Check if this is an SDK limit or AI provider limit
      if (err.message?.includes("Demo tier") || err.message?.includes("assessment")) {
        return "🔒 Demo Assessment Limit Reached. Your AI is fine! Sign up at aiassesstech.com/pricing for unlimited access.";
      }
      return "⚠️ AI Provider Rate Limit. Your AI provider (OpenAI/Anthropic/etc.) is rate-limiting requests. Wait a moment and try again, or use a different API key.";
    }
    if (err.message?.includes("insufficient") || err.message?.includes("credit") || err.message?.includes("quota")) {
      return "💳 Insufficient Credits. Your AI provider account needs more credits. Add funds at your provider's billing page.";
    }
    if (err.message?.includes("network") || err.message?.includes("fetch") || err.message?.includes("ECONNREFUSED")) {
      return "🌐 Network Error. Check your internet connection and try again.";
    }
    if (err.message?.includes("model") && err.message?.includes("not found")) {
      return "❌ Model Not Found. The selected AI model doesn't exist or isn't available. Try a different model.";
    }
    if (err.message?.includes("Anthropic")) {
      return err.message;
    }
    if (err.message?.includes("Health Check Key not configured")) {
      return err.message;
    }

    return err.message || "An unexpected error occurred.";
  }

  return "An unexpected error occurred.";
}
