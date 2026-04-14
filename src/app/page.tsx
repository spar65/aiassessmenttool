/**
 * Landing Page - Lead Capture with Assessment / Evaluation Toggle
 *
 * Entry point for the AI Assessment Tool demo app.
 * Users pick Assessment (120-question battery) or Evaluation (paste AI output),
 * enter their info, and proceed to the appropriate flow.
 *
 * @version 0.8.0 — Phase 4: Added evaluation mode toggle + SDK snippets
 * @see /configure for assessment flow
 * @see /evaluate for evaluation flow
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  Zap,
  Target,
  CheckCircle,
  FileText,
  Clock,
  Shield,
} from "lucide-react";

type DemoMode = "assessment" | "evaluation";

export default function LandingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<DemoMode>("assessment");
  const [formData, setFormData] = useState({
    email: "",
    companyName: "",
    role: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [website, setWebsite] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "https://aiassesstech.com";
      let leadId: string | undefined;

      try {
        const response = await fetch(`${API_URL}/api/leads/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            companyName: formData.companyName,
            role: formData.role || undefined,
            source: mode === "evaluation" ? "demo-app-eval" : "demo-app",
            website,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          leadId = data.leadId;
        } else {
          console.warn("Lead registration failed, continuing without tracking");
        }
      } catch (leadError) {
        console.warn("Lead registration error:", leadError);
      }

      localStorage.setItem(
        "leadData",
        JSON.stringify({
          leadId: leadId || `local_${Date.now()}`,
          email: formData.email,
          company: formData.companyName,
        })
      );

      router.push(mode === "evaluation" ? "/evaluate" : "/configure");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const assessmentFeatures = [
    { icon: Target, text: "4 Moral Dimensions: Lying, Cheating, Stealing, Harm" },
    { icon: Zap, text: "120 questions answered in ~10 minutes" },
    { icon: CheckCircle, text: "Instant pass/fail with detailed scores" },
  ];

  const evaluationFeatures = [
    { icon: FileText, text: "Paste any AI-generated output text" },
    { icon: Clock, text: "LCSH behavioral classification in ~30 seconds" },
    { icon: Shield, text: "GREEN / YELLOW / RED verdict with dimension scores" },
  ];

  const features = mode === "evaluation" ? evaluationFeatures : assessmentFeatures;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image
              src="https://www.aiassesstech.com/logo-64.png"
              alt="AI Assess Tech"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-xl font-bold gradient-text">
              AI Assessment Tool
            </span>
          </div>
          <a
            href="https://www.aiassesstech.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Powered by AI Assess Tech
          </a>
        </div>
      </header>

      {/* Got Responsible AI? Tagline Banner */}
      <div className="bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <p className="text-5xl sm:text-6xl font-bold">
            <span className="text-white">Got </span>
            <span className="gradient-text">Responsible AI</span>
            <span className="text-white">?</span>
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Hero (adapts to mode) */}
          <div>
            <h1 className="text-5xl sm:text-6xl font-bold mb-6">
              {mode === "evaluation" ? (
                <>
                  <span className="gradient-text">Is Your AI&apos;s Output</span>
                  <br />
                  <span className="text-white">Ethically Aligned?</span>
                </>
              ) : (
                <>
                  <span className="gradient-text">What&apos;s Your AI&apos;s</span>
                  <br />
                  <span className="text-white">Morality Score?</span>
                </>
              )}
            </h1>

            <p className="text-xl text-gray-300 mb-8">
              {mode === "evaluation"
                ? "Paste AI-generated text and get an instant ethical alignment verdict. Free evaluation with detailed dimension scores."
                : "Test your AI system across 4 moral dimensions in under 10 minutes. Free assessment with instant results."}
            </p>

            <div className="space-y-4 mb-8">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <feature.icon className="h-5 w-5 text-green-400" />
                  <span className="text-gray-300">{feature.text}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <span>✓ Free to use</span>
              <span>✓ No account required</span>
              {mode === "evaluation" ? (
                <span>✓ No API key needed</span>
              ) : (
                <span>✓ Your API key stays in your browser</span>
              )}
            </div>
          </div>

          {/* Right side - Form with mode toggle */}
          <div className="glass rounded-2xl p-8">
            {/* Mode Toggle */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setMode("assessment")}
                className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                  mode === "assessment"
                    ? "border-green-400 bg-green-400/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                <Target
                  className={`h-6 w-6 mb-2 ${
                    mode === "assessment" ? "text-green-400" : "text-gray-400"
                  }`}
                />
                <span
                  className={`text-sm font-semibold ${
                    mode === "assessment" ? "text-green-400" : "text-gray-300"
                  }`}
                >
                  Full Assessment
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  120 Q&apos;s · ~10 min
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode("evaluation")}
                className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                  mode === "evaluation"
                    ? "border-green-400 bg-green-400/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                <FileText
                  className={`h-6 w-6 mb-2 ${
                    mode === "evaluation" ? "text-green-400" : "text-gray-400"
                  }`}
                />
                <span
                  className={`text-sm font-semibold ${
                    mode === "evaluation" ? "text-green-400" : "text-gray-300"
                  }`}
                >
                  Quick Evaluation
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  Paste output · ~30s
                </span>
              </button>
            </div>

            <h2 className="text-2xl font-bold text-white mb-6">
              {mode === "evaluation"
                ? "Start Your Evaluation"
                : "Start Your Assessment"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <input
                type="text"
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="absolute -left-[9999px] opacity-0 h-0 w-0 pointer-events-none"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all"
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Company Name *
                </label>
                <input
                  type="text"
                  id="companyName"
                  required
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all"
                  placeholder="Acme Corp"
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Role (optional)
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all"
                >
                  <option value="" className="bg-slate-900">Select your role</option>
                  <option value="Developer" className="bg-slate-900">Developer</option>
                  <option value="PM" className="bg-slate-900">Product Manager</option>
                  <option value="Executive" className="bg-slate-900">Executive</option>
                  <option value="Other" className="bg-slate-900">Other</option>
                </select>
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-green-500 hover:bg-green-400 disabled:bg-green-500/50 text-black font-semibold rounded-lg transition-all animate-pulse-glow"
              >
                <span>
                  {loading
                    ? "Starting..."
                    : mode === "evaluation"
                    ? "Start Evaluation"
                    : "Start Assessment"}
                </span>
                <ArrowRight className="h-5 w-5" />
              </button>

              <p className="text-xs text-gray-500 text-center">
                By continuing, you agree to receive results via email.
              </p>
            </form>
          </div>
        </div>
      </main>

      {/* SDK Code Snippets Section */}
      <section className="border-t border-white/10 bg-black/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-center mb-3">
            <span className="gradient-text">Integrate with Your CI/CD</span>
          </h2>
          <p className="text-gray-400 text-center mb-10 max-w-2xl mx-auto">
            Use the same SDK for both assessments and evaluations. One key, two
            capabilities.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Assessment snippet */}
            <div className="glass rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Target className="h-4 w-4 text-green-400" />
                <span className="text-sm font-semibold text-green-400">
                  Assessment — 120 Questions
                </span>
              </div>
              <pre className="text-sm text-gray-300 overflow-x-auto">
                <code>{`import { AIAssessClient } from '@aiassesstech/sdk';

const client = new AIAssessClient({
  healthCheckKey: process.env.AIASSESS_KEY!
});

const result = await client.assess(
  async (question) => {
    return await myAI.chat(question);
  }
);

console.log(result.overallPassed);
// true
console.log(result.classification);
// "Well Adjusted"`}</code>
              </pre>
            </div>

            {/* Evaluation snippet */}
            <div className="glass rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="h-4 w-4 text-green-400" />
                <span className="text-sm font-semibold text-green-400">
                  Evaluation — Paste Output
                </span>
              </div>
              <pre className="text-sm text-gray-300 overflow-x-auto">
                <code>{`import { AIAssessClient } from '@aiassesstech/sdk';

const client = new AIAssessClient({
  healthCheckKey: process.env.AIASSESS_KEY!
});

const result = await client.evaluate({
  outputText: "AI-generated text...",
  targetAi: {
    provider: "anthropic",
    model: "claude-sonnet-4"
  },
});

console.log(result.verdict);
// "GREEN"
console.log(result.overallScore);
// 0.83`}</code>
              </pre>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            Available as{" "}
            <a
              href="https://www.npmjs.com/package/@aiassesstech/sdk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:text-green-300"
            >
              @aiassesstech/sdk
            </a>{" "}
            (TypeScript) and{" "}
            <a
              href="https://pypi.org/project/aiassess/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:text-green-300"
            >
              aiassess
            </a>{" "}
            (Python)
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-gray-500">
          <div className="text-center sm:text-left">
            <p>© {new Date().getFullYear()} AI Assess Tech. All rights reserved.</p>
            <p className="text-xs mt-1 text-gray-600">
              U.S. Patent Pending · Application No. 63/949,454
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-400">
              Responsible AI Assessment Technology
            </p>
          </div>
          <nav className="flex items-center space-x-6">
            <a href="https://www.aiassesstech.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Privacy</a>
            <a href="https://www.aiassesstech.com/terms" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Terms</a>
            <a href="https://www.aiassesstech.com/docs" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Docs</a>
            <a href="https://www.aiassesstech.com/contact" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
