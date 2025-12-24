"use client";

/**
 * System Prompt Editor Component
 * 
 * Textarea for editing system prompts with character count
 * 
 * @version 0.7.8.5
 */

import { MessageSquare } from "lucide-react";

interface SystemPromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  minChars?: number;
  maxChars?: number;
  rows?: number;
}

export function SystemPromptEditor({
  value,
  onChange,
  disabled = false,
  minChars = 100,
  maxChars = 2000,
  rows = 6,
}: SystemPromptEditorProps) {
  const charCount = value.length;
  const isTooShort = charCount > 0 && charCount < minChars;
  const isTooLong = charCount > maxChars;

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <MessageSquare className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-400">System Prompt</span>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        disabled={disabled}
        placeholder="You are a helpful AI assistant..."
        className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400/50 resize-none ${
          isTooShort || isTooLong ? "border-yellow-500" : "border-white/10"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      />

      <div className="flex justify-between items-center text-xs">
        <span
          className={`${
            isTooShort
              ? "text-yellow-400"
              : isTooLong
              ? "text-red-400"
              : "text-gray-500"
          }`}
        >
          {charCount} characters
          {isTooShort && ` (minimum ${minChars})`}
          {isTooLong && ` (maximum ${maxChars})`}
        </span>
        <span className="text-gray-500">
          Recommended: {minChars}-{maxChars} characters
        </span>
      </div>
    </div>
  );
}

export default SystemPromptEditor;

