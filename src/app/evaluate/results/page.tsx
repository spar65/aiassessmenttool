/**
 * Evaluation Results Page
 *
 * Displays the results of an LCSH correspondence evaluation:
 * - Overall verdict (GREEN / YELLOW / RED)
 * - Dimension scores and per-dimension verdicts
 * - Alignment count
 * - Verification link
 *
 * @version 0.1.0
 * @see /evaluate for input form
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  RotateCcw,
  Shield,
  Clock,
} from "lucide-react";
import { Header, Footer } from "@/components";
import {
  getEvalResult,
  getVerdictColor,
  getVerdictBg,
  getDimensionVerdictColor,
  formatDuration,
  type EvaluationResultData,
} from "@/lib/evaluation";

const DIMENSION_META: Record<
  string,
  { label: string; bg: string; border: string; text: string }
> = {
  lying: { label: "Lying", bg: "bg-red-500/20", border: "border-red-500/30", text: "text-red-400" },
  cheating: { label: "Cheating", bg: "bg-amber-500/20", border: "border-amber-500/30", text: "text-amber-400" },
  stealing: { label: "Stealing", bg: "bg-purple-500/20", border: "border-purple-500/30", text: "text-purple-400" },
  harm: { label: "Harm", bg: "bg-cyan-500/20", border: "border-cyan-500/30", text: "text-cyan-400" },
};

function VerdictIcon({ verdict }: { verdict: string }) {
  switch (verdict) {
    case "GREEN":
      return <CheckCircle className="h-12 w-12 text-green-400" />;
    case "YELLOW":
      return <AlertTriangle className="h-12 w-12 text-yellow-400" />;
    case "RED":
      return <XCircle className="h-12 w-12 text-red-400" />;
    default:
      return null;
  }
}

function verdictLabel(verdict: string): string {
  switch (verdict) {
    case "GREEN":
      return "Ethically Aligned";
    case "YELLOW":
      return "Caution Advised";
    case "RED":
      return "Ethical Concerns Detected";
    default:
      return verdict;
  }
}

export default function EvaluationResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<EvaluationResultData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = getEvalResult();
    setResult(data);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-400" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-4">
            No evaluation results found
          </h2>
          <button
            onClick={() => router.push("/evaluate")}
            className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg"
          >
            Run an Evaluation
          </button>
        </div>
      </div>
    );
  }

  const scorePercent = Math.round(result.overallScore * 100);

  return (
    <div className="min-h-screen flex flex-col">
      <Header showBackButton backUrl="/evaluate" />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Verdict Header */}
          <div className="glass rounded-2xl p-8 mb-6">
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-4">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${getVerdictBg(
                    result.verdict
                  )}`}
                >
                  <VerdictIcon verdict={result.verdict} />
                </div>
                <div>
                  <h1
                    className={`text-3xl font-bold ${getVerdictColor(
                      result.verdict
                    )}`}
                  >
                    {result.verdict}
                  </h1>
                  <p className="text-gray-400">{verdictLabel(result.verdict)}</p>
                </div>
              </div>
            </div>

            {/* Overall Score */}
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-white mb-1">
                {scorePercent}%
              </div>
              <div className="text-gray-400 text-sm">
                Overall Alignment Score
              </div>
            </div>

            {/* Alignment count */}
            <div
              className={`p-4 rounded-lg text-center border ${getVerdictBg(
                result.verdict
              )}`}
            >
              <p className={getVerdictColor(result.verdict)}>
                {result.alignedCount} of {result.totalPrinciples} principles
                aligned
              </p>
            </div>
          </div>

          {/* Dimension Scores */}
          <div className="glass rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Dimension Scores
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(["lying", "cheating", "stealing", "harm"] as const).map(
                (dim) => {
                  const meta = DIMENSION_META[dim];
                  const score = result.scores[dim];
                  const dimVerdict = result.verdicts[dim];

                  return (
                    <div
                      key={dim}
                      className={`p-4 rounded-xl ${meta.bg} border ${meta.border}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 text-sm">
                          {meta.label}
                        </span>
                      </div>
                      <div className={`text-2xl font-bold ${meta.text}`}>
                        {(score * 100).toFixed(0)}%
                      </div>
                      <div
                        className={`text-xs font-medium mt-1 ${getDimensionVerdictColor(
                          dimVerdict
                        )}`}
                      >
                        {dimVerdict}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Verification */}
          <div className="glass rounded-2xl p-6 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="h-5 w-5 text-green-400" />
              <h2 className="text-lg font-semibold text-white">
                Verification
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400 text-sm">Evaluation ID</span>
                <code className="text-xs text-white bg-white/10 px-2 py-1 rounded max-w-[200px] truncate">
                  {result.evaluationId}
                </code>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400 text-sm">Evaluated At</span>
                <span className="text-white text-sm">
                  {new Date(result.evaluatedAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-gray-400 text-sm">Duration</span>
                <div className="flex items-center space-x-1.5 text-white text-sm">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <span>{formatDuration(result.durationMs)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push("/evaluate")}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition-colors"
            >
              <RotateCcw className="h-5 w-5" />
              <span>Evaluate Again</span>
            </button>

            <a
              href={result.verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <ExternalLink className="h-5 w-5" />
              <span>Verify Result</span>
            </a>
          </div>

          {/* Warning for RED results */}
          {result.verdict === "RED" && (
            <div className="mt-6 p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
              <h3 className="text-red-400 font-semibold mb-2">
                Ethical Concerns Detected
              </h3>
              <p className="text-gray-300 text-sm">
                This AI output was flagged for potential ethical issues. Review
                the dimension scores above to understand which areas need
                attention. Consider revising your AI&apos;s system prompt or
                fine-tuning to improve alignment.
              </p>
            </div>
          )}

          {result.verdict === "YELLOW" && (
            <div className="mt-6 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <h3 className="text-yellow-400 font-semibold mb-2">
                Caution Advised
              </h3>
              <p className="text-gray-300 text-sm">
                This AI output shows partial alignment. Some dimensions passed
                while others need improvement. Review the dimension breakdown
                above for specifics.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
