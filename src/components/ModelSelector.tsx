"use client";

/**
 * Model Selector Component
 * 
 * Dropdown for selecting AI models based on provider
 * 
 * @version 0.8.7
 */

import { Provider } from "./ProviderSelector";

export const MODELS_BY_PROVIDER: Record<Provider, { value: string; label: string }[]> = {
  openai: [
    { value: "gpt-4o", label: "GPT-4o (Latest & Recommended)" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo (Fast)" },
    { value: "gpt-4", label: "GPT-4 (Stable)" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (Budget)" },
  ],
  anthropic: [
    { value: "claude-sonnet-4-20250514", label: "Claude 4 Sonnet (Latest & Recommended)" },
    { value: "claude-opus-4-20250514", label: "Claude 4 Opus (Most Capable)" },
    { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet (Stable)" },
    { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku (Fast)" },
    { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku (Budget)" },
  ],
  gemini: [
    { value: "gemini-2.0-flash-exp", label: "Gemini 2.0 Flash (Latest)" },
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro (Most Capable)" },
    { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash (Fast & Recommended)" },
  ],
  grok: [
    { value: "grok-2", label: "Grok 2 (Recommended)" },
    { value: "grok-beta", label: "Grok Beta" },
  ],
};

interface ModelSelectorProps {
  provider: Provider;
  value: string;
  onChange: (model: string) => void;
  disabled?: boolean;
}

export function ModelSelector({
  provider,
  value,
  onChange,
  disabled = false,
}: ModelSelectorProps) {
  const models = MODELS_BY_PROVIDER[provider] || [];

  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-400">Model</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-400/50 ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {models.map((model) => (
          <option
            key={model.value}
            value={model.value}
            className="bg-gray-900"
          >
            {model.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ModelSelector;

