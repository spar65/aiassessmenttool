"use client";

/**
 * Provider Selector Component
 * 
 * Toggle between AI providers (OpenAI, Anthropic, Gemini, Grok)
 * 
 * @version 0.8.7
 */

import { Building2 } from "lucide-react";

export type Provider = "openai" | "anthropic" | "gemini" | "grok";

export interface ProviderOption {
  value: Provider;
  label: string;
  icon: string;
  keyPrefix: string;
  keyPlaceholder: string;
  description: string;
}

export const PROVIDERS: ProviderOption[] = [
  {
    value: "openai",
    label: "OpenAI",
    icon: "🤖",
    keyPrefix: "sk-",
    keyPlaceholder: "sk-proj-xxxxxxxxxxxxxxxxxx",
    description: "GPT-4o, GPT-4 Turbo, GPT-3.5",
  },
  {
    value: "anthropic",
    label: "Anthropic (Claude)",
    icon: "🧠",
    keyPrefix: "sk-ant-",
    keyPlaceholder: "sk-ant-xxxxxxxxxxxxxxxxxx",
    description: "Claude 4 Sonnet, Claude 4 Opus",
  },
  {
    value: "gemini",
    label: "Google Gemini",
    icon: "✨",
    keyPrefix: "AIza",
    keyPlaceholder: "AIzaSyDxxxxxxxxxxxxxxxxxx",
    description: "Gemini 2.0 Flash, Gemini 1.5 Pro",
  },
  {
    value: "grok",
    label: "xAI Grok",
    icon: "🚀",
    keyPrefix: "xai-",
    keyPlaceholder: "xai-xxxxxxxxxxxxxxxxxx",
    description: "Grok 2, Grok Beta",
  },
];

interface ProviderSelectorProps {
  value: Provider;
  onChange: (provider: Provider) => void;
  disabled?: boolean;
}

export function ProviderSelector({
  value,
  onChange,
  disabled = false,
}: ProviderSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 mb-2">
        <Building2 className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-400">Select your AI provider:</span>
      </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PROVIDERS.map((provider) => (
          <button
            key={provider.value}
            onClick={() => onChange(provider.value)}
            disabled={disabled}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              value === provider.value
                ? "border-green-500 bg-green-500/10"
                : "border-white/10 bg-white/5 hover:border-white/20"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{provider.icon}</span>
              <div>
                <div className="text-white font-medium">{provider.label}</div>
                <div className="text-xs text-gray-500">{provider.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ProviderSelector;

