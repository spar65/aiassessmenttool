/**
 * Results Page
 *
 * Displays the results of an AI ethics assessment, including:
 * - Overall pass/fail status with classification
 * - Average score across all dimensions
 * - Individual dimension scores with pass/fail indicators
 * - Verification links and session IDs
 * - Recommendations for failed dimensions
 *
 * Data Flow:
 * 1. Results are loaded from localStorage (saved by assess page)
 * 2. Run ID from URL params used for verification link
 * 3. Session ID links to main platform for verification
 *
 * Features:
 * - Color-coded dimension scores
 * - "AI is ONLINE" or "AI is OFFLINE" status display
 * - External verification link to main platform
 * - "Run Again" button to restart assessment
 * - Failure recommendations for improving system prompt
 *
 * @version 0.7.8.5
 * @see /assess for how results are generated
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  RotateCcw,
  Shield,
} from "lucide-react";
import { Header, Footer } from "@/components";

interface AssessmentResult {
  runId: string;
  sdkSessionId: string;
  scores: {
    lying: number;
    cheating: number;
    stealing: number;
    harm: number;
  };
  passed: {
    lying: boolean;
    cheating: boolean;
    stealing: boolean;
    harm: boolean;
  };
  overallPassed: boolean;
  classification: string;
  completedAt: string;
}

const DIMENSION_COLORS = {
  lying: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" },
  cheating: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
  stealing: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" },
  harm: { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30" },
};

export default function ResultsPage({ params }: { params: { runId: string } }) {
  const router = useRouter();
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedResult = localStorage.getItem("assessmentResult");
    if (savedResult) {
      setResult(JSON.parse(savedResult));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-400"></div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-4">
            Result not found
          </h2>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg"
          >
            Start New Assessment
          </button>
        </div>
      </div>
    );
  }

  const averageScore =
    (result.scores.lying +
      result.scores.cheating +
      result.scores.stealing +
      result.scores.harm) /
    4;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header showBackButton backUrl="/" />

      {/* Main Content */}
      <main className="flex-1 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Result Header */}
        <div className="glass rounded-2xl p-8 mb-6">
          <div className="flex items-center justify-center mb-6">
            {result.overallPassed ? (
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-green-400">PASSED</h1>
                  <p className="text-gray-400">{result.classification}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-red-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-red-400">FAILED</h1>
                  <p className="text-gray-400">{result.classification}</p>
                </div>
              </div>
            )}
          </div>

          {/* Overall Score */}
          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-white mb-1">
              {averageScore.toFixed(1)}
            </div>
            <div className="text-gray-400 text-sm">Overall Score (out of 10)</div>
          </div>

          {/* AI Status */}
          <div
            className={`p-4 rounded-lg text-center ${
              result.overallPassed
                ? "bg-green-500/10 border border-green-500/30"
                : "bg-red-500/10 border border-red-500/30"
            }`}
          >
            {result.overallPassed ? (
              <p className="text-green-400">
                🟢 AI is ONLINE and ready to serve users
              </p>
            ) : (
              <p className="text-red-400">
                ⚠️ AI is OFFLINE - Health check failed
              </p>
            )}
          </div>
        </div>

        {/* Dimension Scores */}
        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Dimension Scores
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(["lying", "cheating", "stealing", "harm"] as const).map(
              (dimension) => {
                const colors =
                  DIMENSION_COLORS[dimension as keyof typeof DIMENSION_COLORS];
                const passed = result.passed[dimension];
                const score = result.scores[dimension];

                return (
                  <div
                    key={dimension}
                    className={`p-4 rounded-xl ${colors.bg} border ${colors.border}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 capitalize text-sm">
                        {dimension}
                      </span>
                      {passed ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                    <div className={`text-2xl font-bold ${colors.text}`}>
                      {score.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {passed ? "Passed" : "Failed"}
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
            <h2 className="text-lg font-semibold text-white">Verification</h2>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400 text-sm">Run ID</span>
              <code className="text-xs text-white bg-white/10 px-2 py-1 rounded">
                {result.runId}
              </code>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400 text-sm">Session ID</span>
              <code className="text-xs text-white bg-white/10 px-2 py-1 rounded">
                {result.sdkSessionId}
              </code>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400 text-sm">Completed</span>
              <span className="text-white text-sm">
                {new Date(result.completedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => {
              localStorage.removeItem("assessmentResult");
              router.push("/configure");
            }}
            className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition-colors"
          >
            <RotateCcw className="h-5 w-5" />
            <span>Run Again</span>
          </button>

          <a
            href={`https://www.aiassesstech.com/verify/${result.runId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            <ExternalLink className="h-5 w-5" />
            <span>Verify Result</span>
          </a>
        </div>

        {/* Failed Dimensions Help */}
        {!result.overallPassed && (
          <div className="mt-6 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <h3 className="text-yellow-400 font-semibold mb-2">
              Recommendations
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              Your AI failed on the following dimensions. Consider updating your
              system prompt to address these areas:
            </p>
            <ul className="space-y-2">
              {(["lying", "cheating", "stealing", "harm"] as const)
                .filter((d) => !result.passed[d])
                .map((dimension) => (
                  <li
                    key={dimension}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <XCircle className="h-4 w-4 text-red-400" />
                    <span className="text-gray-300 capitalize">
                      {dimension}: {result.scores[dimension].toFixed(1)} (below
                      threshold)
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

