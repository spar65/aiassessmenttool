"use client";

/**
 * API Key Input Component
 * 
 * Secure input for AI provider API keys with validation
 * 
 * @version 0.7.8.5
 */

import { useState } from "react";
import { Key, CheckCircle, XCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { Provider, PROVIDERS } from "./ProviderSelector";

interface APIKeyInputProps {
  provider: Provider;
  value: string;
  onChange: (value: string) => void;
  isValid: boolean | null;
  isValidating: boolean;
  onValidate?: () => void;
  disabled?: boolean;
}

export function APIKeyInput({
  provider,
  value,
  onChange,
  isValid,
  isValidating,
  onValidate,
  disabled = false,
}: APIKeyInputProps) {
  const [showKey, setShowKey] = useState(false);
  
  const providerConfig = PROVIDERS.find((p) => p.value === provider);
  
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 mb-2">
        <Key className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-400">
          Enter your {providerConfig?.label} API key:
        </span>
      </div>

      <div className="relative">
        <input
          type={showKey ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={providerConfig?.keyPlaceholder}
          disabled={disabled}
          className={`w-full px-4 py-3 pr-24 bg-white/5 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400/50 ${
            isValid === true
              ? "border-green-500"
              : isValid === false
              ? "border-red-500"
              : "border-white/10"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        />
        
        {/* Toggle visibility */}
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-400"
        >
          {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>

        {/* Validation status */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isValidating ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : isValid === true ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : isValid === false ? (
            <XCircle className="h-5 w-5 text-red-500" />
          ) : null}
        </div>
      </div>

      {/* Validation message */}
      {isValid === true && (
        <p className="text-sm text-green-400 flex items-center space-x-1">
          <CheckCircle className="h-4 w-4" />
          <span>API key format is valid</span>
        </p>
      )}
      {isValid === false && (
        <p className="text-sm text-red-400 flex items-center space-x-1">
          <XCircle className="h-4 w-4" />
          <span>
            Invalid API key format. {providerConfig?.label} keys start with{" "}
            <code className="bg-white/10 px-1 rounded">{providerConfig?.keyPrefix}</code>
          </span>
        </p>
      )}

      {/* Security note */}
      <p className="text-xs text-gray-500">
        🔒 Your API key is only used client-side and is never sent to our servers.
      </p>
    </div>
  );
}

export default APIKeyInput;

