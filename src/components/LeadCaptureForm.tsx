"use client";

/**
 * Lead Capture Form Component
 * 
 * Form for capturing demo lead information
 * 
 * @version 0.7.8.5
 */

import { useState } from "react";
import { Loader2, User, Building2, Briefcase, ArrowRight } from "lucide-react";

export interface LeadFormData {
  email: string;
  companyName: string;
  role?: string;
  useCase?: string;
}

interface LeadCaptureFormProps {
  onSubmit: (data: LeadFormData) => Promise<void>;
  disabled?: boolean;
  submitText?: string;
}

export function LeadCaptureForm({
  onSubmit,
  disabled = false,
  submitText = "Start Assessment",
}: LeadCaptureFormProps) {
  const [formData, setFormData] = useState<LeadFormData>({
    email: "",
    companyName: "",
    role: "",
    useCase: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || disabled) return;

    // Validation
    if (!formData.email || !formData.companyName) {
      setError("Email and company name are required.");
      return;
    }

    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email */}
      <div>
        <label className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
          <User className="h-4 w-4" />
          <span>Work Email *</span>
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="you@company.com"
          required
          disabled={disabled || isSubmitting}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400/50"
        />
      </div>

      {/* Company Name */}
      <div>
        <label className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
          <Building2 className="h-4 w-4" />
          <span>Company Name *</span>
        </label>
        <input
          type="text"
          value={formData.companyName}
          onChange={(e) =>
            setFormData({ ...formData, companyName: e.target.value })
          }
          placeholder="Acme Inc."
          required
          disabled={disabled || isSubmitting}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400/50"
        />
      </div>

      {/* Role (optional) */}
      <div>
        <label className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
          <Briefcase className="h-4 w-4" />
          <span>Your Role</span>
        </label>
        <select
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          disabled={disabled || isSubmitting}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-400/50"
        >
          <option value="" className="bg-gray-900">
            Select role (optional)
          </option>
          <option value="developer" className="bg-gray-900">
            Developer / Engineer
          </option>
          <option value="pm" className="bg-gray-900">
            Product Manager
          </option>
          <option value="executive" className="bg-gray-900">
            Executive / Leadership
          </option>
          <option value="ai_ml" className="bg-gray-900">
            AI/ML Specialist
          </option>
          <option value="compliance" className="bg-gray-900">
            Compliance / Legal
          </option>
          <option value="other" className="bg-gray-900">
            Other
          </option>
        </select>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={disabled || isSubmitting || !formData.email || !formData.companyName}
        className="w-full py-4 bg-green-500 hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Registering...</span>
          </>
        ) : (
          <>
            <span>{submitText}</span>
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>

      {/* Privacy note */}
      <p className="text-xs text-gray-500 text-center">
        We&apos;ll send your assessment results to this email. 
        By continuing, you agree to receive communications from AI Assess Tech.
      </p>
    </form>
  );
}

export default LeadCaptureForm;

