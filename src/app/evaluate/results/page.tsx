/**
 * Evaluation Results Page
 *
 * Displays the results of an LCSH correspondence evaluation,
 * matching the main platform's verify/evaluation format.
 *
 * @version 0.2.0
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
  formatDuration,
  type EvaluationResultData,
} from "@/lib/evaluation";

const VERDICT_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  GREEN: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30" },
  YELLOW: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
  RED: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" },
  PASS: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30" },
  CAUTION: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30" },
  FLAG: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30" },
  CRITICAL: { bg: "bg-red-600/20", text: "text-red-500", border: "border-red-600/30" },
};

const DIM_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  lying: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" },
  cheating: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
  stealing: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" },
  harm: { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30" },
};

function VerdictIcon({ verdict }: { verdict: string }) {
  switch (verdict) {
    case "GREEN":
      return <CheckCircle className="h-10 w-10 text-green-400" />;
    case "YELLOW":
      return <AlertTriangle className="h-10 w-10 text-amber-400" />;
    case "RED":
      return <XCircle className="h-10 w-10 text-red-400" />;
    default:
      return null;
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

  const vc = VERDICT_COLORS[result.verdict] ?? VERDICT_COLORS.RED;

  return (
    <div className="min-h-screen flex flex-col">
      <Header showBackButton backUrl="/evaluate" />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Result Summary */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 mb-8">
            <div className="text-center mb-8">
              {/* Verdict badge */}
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-16 h-16 rounded-full ${vc.bg} flex items-center justify-center`}
                  >
                    <VerdictIcon verdict={result.verdict} />
                  </div>
                  <div className="text-left">
                    <h1 className={`text-3xl font-bold ${vc.text}`}>
                      {result.verdict}
                    </h1>
                    <p className="text-gray-400">AI Output Evaluation</p>
                  </div>
                </div>
              </div>

              {/* Key metrics */}
              <div className="flex items-center justify-center gap-8 mt-6">
                <div>
                  <div className="text-4xl font-bold text-white">
                    {(result.overallScore * 100).toFixed(0)}%
                  </div>
                  <div className="text-gray-400 text-sm">Overall Score</div>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div>
                  <div className="text-4xl font-bold text-white">
                    {result.alignedCount}/{result.totalPrinciples}
                  </div>
                  <div className="text-gray-400 text-sm">
                    Principles Aligned
                  </div>
                </div>
              </div>
            </div>

            {/* Dimension Scores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {(["lying", "cheating", "stealing", "harm"] as const).map(
                (dim) => {
                  const colors = DIM_COLORS[dim];
                  const score = result.scores[dim];
                  const dimVerdict = result.verdicts[dim];
                  const dvc = VERDICT_COLORS[dimVerdict] ?? VERDICT_COLORS.RED;
                  const aligned = Math.round(score * 3);

                  return (
                    <div
                      key={dim}
                      className={`p-4 rounded-xl ${colors.bg} border ${colors.border}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 capitalize text-sm">
                          {dim}
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${dvc.bg} ${dvc.text}`}
                        >
                          {dimVerdict}
                        </span>
                      </div>
                      <div className={`text-2xl font-bold ${colors.text}`}>
                        {(score * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {aligned}/3 aligned
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {/* Details grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Timestamps</span>
                </h3>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400 text-sm">Completed</span>
                  <span className="text-white text-sm font-medium">
                    {new Date(result.evaluatedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400 text-sm">Duration</span>
                  <span className="text-white text-sm font-medium">
                    {formatDuration(result.durationMs)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Assessment</span>
                </h3>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400 text-sm">Framework</span>
                  <span className="text-white text-sm font-medium">
                    LCSH v1.0
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400 text-sm">Evaluation ID</span>
                  <code className="text-xs text-white bg-white/10 px-2 py-1 rounded max-w-[180px] truncate">
                    {result.evaluationId}
                  </code>
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
