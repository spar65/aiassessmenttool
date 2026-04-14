/**
 * Evaluation Demo Page
 *
 * Users paste AI-generated text, pick a provider/model, and run
 * an LCSH correspondence evaluation via POST /api/sdk/evaluate.
 *
 * @version 0.1.0
 * @see /evaluate/results for the results display
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  FileText,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Header, Footer } from "@/components";
import {
  saveEvalConfig,
  saveEvalResult,
  type EvaluationResultData,
} from "@/lib/evaluation";

const PROVIDERS = [
  { value: "openai", label: "OpenAI", models: ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"] },
  { value: "anthropic", label: "Anthropic", models: ["claude-sonnet-4-6", "claude-opus-4-6", "claude-haiku-4-5"] },
  { value: "gemini", label: "Google Gemini", models: ["gemini-2.0-flash-exp", "gemini-1.5-pro", "gemini-1.5-flash"] },
  { value: "grok", label: "xAI Grok", models: ["grok-3", "grok-2", "grok-beta"] },
] as const;

const SAMPLE_OUTPUT = `I understand your concern. While I cannot provide medical advice, I'd recommend consulting with a healthcare professional who can properly evaluate your symptoms. In the meantime, rest and staying hydrated are generally good practices. Please don't hesitate to call emergency services if your symptoms worsen significantly.`;

export default function EvaluatePage() {
  const router = useRouter();
  const [outputText, setOutputText] = useState("");
  const [provider, setProvider] = useState<string>("openai");
  const [model, setModel] = useState<string>("gpt-4o");
  const [subjectLabel, setSubjectLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [charCount, setCharCount] = useState(0);

  const MAX_CHARS = 2000;

  const currentModels =
    PROVIDERS.find((p) => p.value === provider)?.models ?? [];

  useEffect(() => {
    setModel(currentModels[0] ?? "");
  }, [provider]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTextChange = (text: string) => {
    if (text.length <= MAX_CHARS) {
      setOutputText(text);
      setCharCount(text.length);
    }
  };

  const handleUseSample = () => {
    handleTextChange(SAMPLE_OUTPUT);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!outputText.trim()) {
      setError("Please paste some AI-generated text to evaluate.");
      return;
    }

    setError("");
    setLoading(true);

    saveEvalConfig({
      outputText,
      provider: provider as "openai" | "anthropic" | "gemini" | "grok",
      model,
      subjectLabel: subjectLabel || undefined,
    });

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "https://aiassesstech.com";
      const healthCheckKey = process.env.NEXT_PUBLIC_HEALTH_CHECK_KEY || "";

      if (!healthCheckKey || !healthCheckKey.startsWith("hck_")) {
        throw new Error(
          "Health Check Key not configured. Please set NEXT_PUBLIC_HEALTH_CHECK_KEY."
        );
      }

      const leadStr = localStorage.getItem("leadData");
      const lead = leadStr ? JSON.parse(leadStr) : {};

      const response = await fetch(`${API_URL}/api/sdk/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Health-Check-Key": healthCheckKey,
          "X-SDK-Version": "demo-app-0.1.0",
        },
        body: JSON.stringify({
          outputText: outputText.trim(),
          targetAi: { provider, model },
          subjectLabel: subjectLabel || undefined,
          metadata: {
            source: "demo-app",
            leadId: lead?.leadId,
            email: lead?.email,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));

        if (response.status === 429) {
          throw new Error(
            errData.message ||
              "Rate limit exceeded. Please wait a moment and try again."
          );
        }
        throw new Error(
          errData.error || `Evaluation failed (${response.status})`
        );
      }

      const data = await response.json();

      const resultData: EvaluationResultData = {
        evaluationId: data.evaluationId,
        verdict: data.verdict,
        overallScore: data.overallScore,
        scores: data.scores,
        verdicts: data.verdicts,
        alignedCount: data.alignedCount,
        totalPrinciples: data.totalPrinciples,
        verifyUrl: data.verifyUrl,
        evaluatedAt: data.evaluatedAt,
        durationMs: data.durationMs,
      };

      saveEvalResult(resultData);
      router.push(`/evaluate/results`);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header showBackButton backUrl="/" />

      <main className="flex-1 px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
              <FileText className="h-8 w-8 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Evaluate AI Output
            </h1>
            <p className="text-gray-400 max-w-lg mx-auto">
              Paste text generated by an AI system and receive an instant
              ethical alignment verdict across 4 moral dimensions.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Output text area */}
            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <label
                  htmlFor="outputText"
                  className="block text-sm font-medium text-gray-300"
                >
                  AI Output Text *
                </label>
                <button
                  type="button"
                  onClick={handleUseSample}
                  className="text-xs text-green-400 hover:text-green-300 transition-colors"
                >
                  Use sample text
                </button>
              </div>
              <textarea
                id="outputText"
                rows={8}
                value={outputText}
                onChange={(e) => handleTextChange(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all resize-none font-mono text-sm"
                placeholder="Paste AI-generated text here..."
              />
              <div className="flex justify-between mt-2 text-xs">
                <span className="text-gray-500">
                  Paste the AI&apos;s response — the text it generated, not your prompt.
                </span>
                <span
                  className={
                    charCount > MAX_CHARS * 0.9
                      ? "text-yellow-400"
                      : "text-gray-500"
                  }
                >
                  {charCount} / {MAX_CHARS}
                </span>
              </div>
            </div>

            {/* Provider + Model */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-sm font-medium text-gray-300 mb-4">
                Which AI produced this output?
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="provider"
                    className="block text-xs text-gray-500 mb-1.5"
                  >
                    Provider
                  </label>
                  <select
                    id="provider"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-all"
                  >
                    {PROVIDERS.map((p) => (
                      <option
                        key={p.value}
                        value={p.value}
                        className="bg-slate-900"
                      >
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="model"
                    className="block text-xs text-gray-500 mb-1.5"
                  >
                    Model
                  </label>
                  <select
                    id="model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-all"
                  >
                    {currentModels.map((m) => (
                      <option key={m} value={m} className="bg-slate-900">
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Optional label */}
              <div className="mt-4">
                <label
                  htmlFor="subjectLabel"
                  className="block text-xs text-gray-500 mb-1.5"
                >
                  Label (optional) — e.g. &quot;Customer Support Bot v2&quot;
                </label>
                <input
                  type="text"
                  id="subjectLabel"
                  value={subjectLabel}
                  onChange={(e) => setSubjectLabel(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-all"
                  placeholder="My AI Assistant"
                />
              </div>
            </div>

            {/* Timing info */}
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Evaluation takes ~30 seconds</span>
            </div>

            {error && (
              <div className="flex items-start space-x-3 p-4 bg-red-400/10 border border-red-400/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !outputText.trim()}
              className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-green-500 hover:bg-green-400 disabled:bg-green-500/50 disabled:cursor-not-allowed text-black font-semibold rounded-lg transition-all animate-pulse-glow"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <span>Evaluate Output</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      <Footer minimal />
    </div>
  );
}
