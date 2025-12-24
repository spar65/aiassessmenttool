/**
 * Landing Page - Lead Capture
 *
 * This is the entry point for the AI Assessment Tool demo app.
 * Users must enter their email and company name before proceeding.
 *
 * Features:
 * - Lead capture form (email, company, role)
 * - Validation and error handling
 * - Submits to main platform API for lead tracking
 * - Stores lead data in localStorage for assessment linking
 *
 * Security:
 * - Email validation on client side
 * - Server-side validation via API
 * - No sensitive data collected here (API keys come later)
 *
 * @version 0.7.8.5
 * @see /configure for the next step in the user flow
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Shield, Zap, Target, CheckCircle } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    companyName: "",
    role: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Guard against double-submit
    
    setError("");
    setLoading(true);

    try {
      // Register lead with server (optional - continue even if fails)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://www.aiassesstech.com";
      let leadId: string | undefined;
      
      try {
        const response = await fetch(`${API_URL}/api/leads/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            companyName: formData.companyName,
            role: formData.role || undefined,
            source: "demo-app",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          leadId = data.leadId;
        } else {
          // Lead registration failed - log but continue
          console.warn("Lead registration failed, continuing without tracking");
        }
      } catch (leadError) {
        // Network error on lead registration - continue anyway
        console.warn("Lead registration error:", leadError);
      }

      // Store lead data in localStorage for use during assessment
      // Even without server leadId, store local data for linking
      localStorage.setItem(
        "leadData",
        JSON.stringify({
          leadId: leadId || `local_${Date.now()}`,
          email: formData.email,
          company: formData.companyName,
        })
      );

      router.push("/configure");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false); // Only reset loading on error (not on success redirect)
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-green-400" />
            <span className="text-xl font-bold gradient-text">
              AI Assessment Tool
            </span>
          </div>
          <a
            href="https://www.aiassesstech.com"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Powered by AI Assess Tech
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Hero */}
          <div>
            <h1 className="text-5xl sm:text-6xl font-bold mb-6">
              <span className="gradient-text">What's Your AI's</span>
              <br />
              <span className="text-white">Ethics Score?</span>
            </h1>

            <p className="text-xl text-gray-300 mb-8">
              Test your AI system across 4 ethical dimensions in under 10
              minutes. Free assessment with instant results.
            </p>

            {/* Features */}
            <div className="space-y-4 mb-8">
              {[
                { icon: Target, text: "4 Dimensions: Lying, Cheating, Stealing, Harm" },
                { icon: Zap, text: "120 questions answered in ~10 minutes" },
                { icon: CheckCircle, text: "Instant pass/fail with detailed scores" },
              ].map((feature, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <feature.icon className="h-5 w-5 text-green-400" />
                  <span className="text-gray-300">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Trust indicators */}
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <span>✓ Free to use</span>
              <span>✓ No account required</span>
              <span>✓ Your API key stays in your browser</span>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="glass rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Start Your Assessment
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
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
                  <option value="" className="bg-slate-900">
                    Select your role
                  </option>
                  <option value="Developer" className="bg-slate-900">
                    Developer
                  </option>
                  <option value="PM" className="bg-slate-900">
                    Product Manager
                  </option>
                  <option value="Executive" className="bg-slate-900">
                    Executive
                  </option>
                  <option value="Other" className="bg-slate-900">
                    Other
                  </option>
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
                <span>{loading ? "Starting..." : "Start Assessment"}</span>
                <ArrowRight className="h-5 w-5" />
              </button>

              <p className="text-xs text-gray-500 text-center">
                By continuing, you agree to receive assessment results via
                email.
              </p>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-sm text-gray-500">
          <span>© 2025 AI Assess Tech. All rights reserved.</span>
          <div className="flex items-center space-x-6">
            <a href="#" className="hover:text-white transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms
            </a>
            <a
              href="https://www.aiassesstech.com/support"
              className="hover:text-white transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

