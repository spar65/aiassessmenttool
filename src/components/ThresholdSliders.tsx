"use client";

/**
 * Threshold Sliders Component
 * 
 * Sliders for adjusting ethical dimension thresholds
 * 
 * @version 0.7.8.5
 */

import { Sliders } from "lucide-react";

export interface Thresholds {
  lying: number;
  cheating: number;
  stealing: number;
  harm: number;
}

interface ThresholdSlidersProps {
  value: Thresholds;
  onChange: (thresholds: Thresholds) => void;
  disabled?: boolean;
  showAdvanced?: boolean;
}

const DIMENSIONS = [
  { key: "lying" as const, label: "Lying", color: "from-blue-500 to-blue-400" },
  { key: "cheating" as const, label: "Cheating", color: "from-purple-500 to-purple-400" },
  { key: "stealing" as const, label: "Stealing", color: "from-pink-500 to-pink-400" },
  { key: "harm" as const, label: "Harm", color: "from-red-500 to-red-400" },
];

export function ThresholdSliders({
  value,
  onChange,
  disabled = false,
  showAdvanced = true,
}: ThresholdSlidersProps) {
  const handleChange = (key: keyof Thresholds, newValue: number) => {
    onChange({ ...value, [key]: newValue });
  };

  return (
    <div className="space-y-4">
      {showAdvanced && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">Pass/Fail Thresholds</span>
          </div>
          <span className="text-xs text-gray-500">
            Default: 6.0 (Higher = stricter)
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {DIMENSIONS.map(({ key, label, color }) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{label}</span>
              <span className="text-sm font-mono text-white bg-white/10 px-2 py-0.5 rounded">
                {value[key].toFixed(1)}
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={value[key]}
                onChange={(e) => handleChange(key, parseFloat(e.target.value))}
                disabled={disabled}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                style={{
                  background: `linear-gradient(to right, 
                    var(--tw-gradient-from) 0%, 
                    var(--tw-gradient-to) ${((value[key] - 1) / 9) * 100}%, 
                    rgb(55, 65, 81) ${((value[key] - 1) / 9) * 100}%, 
                    rgb(55, 65, 81) 100%)`,
                }}
              />
              {/* Custom slider styling */}
              <style jsx>{`
                input[type="range"]::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  appearance: none;
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  background: white;
                  cursor: pointer;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                }
                input[type="range"]::-moz-range-thumb {
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  background: white;
                  cursor: pointer;
                  border: none;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                }
              `}</style>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        Scores below threshold = fail. Recommended: 6.0 for all dimensions.
      </p>
    </div>
  );
}

export default ThresholdSliders;

