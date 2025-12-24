"use client";

/**
 * Saved Prompts Component
 * 
 * Displays a library of saved prompts with CRUD operations
 * 
 * @version 0.7.8.5
 */

import { useState, useEffect } from "react";
import {
  Bookmark,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  Star,
} from "lucide-react";
import {
  SavedPrompt,
  getSavedPrompts,
  savePrompt,
  deletePrompt,
  duplicatePrompt,
  initializeExamplePrompts,
  recordPromptUsage,
} from "@/lib/prompts";

interface SavedPromptsProps {
  onSelect: (prompt: SavedPrompt) => void;
  currentPrompt?: string;
  currentProvider?: string;
  currentModel?: string;
  currentThresholds?: {
    lying: number;
    cheating: number;
    stealing: number;
    harm: number;
  };
}

export function SavedPrompts({
  onSelect,
  currentPrompt,
  currentProvider,
  currentModel,
  currentThresholds,
}: SavedPromptsProps) {
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Load saved prompts on mount
  useEffect(() => {
    initializeExamplePrompts();
    setPrompts(getSavedPrompts());
  }, []);

  const handleSave = () => {
    if (!currentPrompt || !saveName.trim()) return;

    savePrompt(saveName.trim(), currentPrompt, {
      provider: currentProvider,
      model: currentModel,
      thresholds: currentThresholds,
    });

    setPrompts(getSavedPrompts());
    setSaveName("");
    setIsSaving(false);
  };

  const handleSelect = (prompt: SavedPrompt) => {
    recordPromptUsage(prompt.id);
    onSelect(prompt);
    setIsOpen(false);
    setPrompts(getSavedPrompts()); // Refresh to update usage counts
  };

  const handleDelete = (id: string) => {
    deletePrompt(id);
    setPrompts(getSavedPrompts());
    setConfirmDelete(null);
  };

  const handleDuplicate = (id: string) => {
    duplicatePrompt(id);
    setPrompts(getSavedPrompts());
  };

  return (
    <div className="space-y-3">
      {/* Header with toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Bookmark className="h-4 w-4 text-green-400" />
          <span className="text-white font-medium">Saved Prompts</span>
          {prompts.length > 0 && (
            <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs text-gray-400">
              {prompts.length}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="space-y-3 p-3 bg-white/5 rounded-lg border border-white/10">
          {/* Save current prompt */}
          {currentPrompt && (
            <div className="pb-3 border-b border-white/10">
              {isSaving ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Enter prompt name..."
                    className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave();
                      if (e.key === "Escape") setIsSaving(false);
                    }}
                  />
                  <button
                    onClick={handleSave}
                    disabled={!saveName.trim()}
                    className="p-2 bg-green-500 hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    <Check className="h-4 w-4 text-black" />
                  </button>
                  <button
                    onClick={() => setIsSaving(false)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSaving(true)}
                  className="flex items-center space-x-2 text-sm text-green-400 hover:text-green-300 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Save current prompt</span>
                </button>
              )}
            </div>
          )}

          {/* Prompt list */}
          {prompts.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              No saved prompts yet
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {prompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="group p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <button
                      onClick={() => handleSelect(prompt)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium text-sm truncate">
                          {prompt.name}
                        </span>
                        {prompt.usageCount > 0 && (
                          <span className="flex items-center space-x-1 text-xs text-gray-500">
                            <Star className="h-3 w-3" />
                            <span>{prompt.usageCount}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                        {prompt.prompt.substring(0, 100)}
                        {prompt.prompt.length > 100 && "..."}
                      </p>
                      {prompt.lastUsedAt && (
                        <p className="flex items-center space-x-1 text-xs text-gray-600 mt-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            Last used{" "}
                            {new Date(prompt.lastUsedAt).toLocaleDateString()}
                          </span>
                        </p>
                      )}
                    </button>

                    {/* Actions */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDuplicate(prompt.id)}
                        className="p-1.5 hover:bg-white/10 rounded transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                      {confirmDelete === prompt.id ? (
                        <>
                          <button
                            onClick={() => handleDelete(prompt.id)}
                            className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded transition-colors"
                            title="Confirm delete"
                          >
                            <Check className="h-3.5 w-3.5 text-red-400" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="p-1.5 hover:bg-white/10 rounded transition-colors"
                            title="Cancel"
                          >
                            <X className="h-3.5 w-3.5 text-gray-400" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(prompt.id)}
                          className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Metadata badges */}
                  {(prompt.provider || prompt.model) && (
                    <div className="flex items-center space-x-2 mt-2">
                      {prompt.provider && (
                        <span className="px-2 py-0.5 bg-white/10 rounded text-xs text-gray-400 capitalize">
                          {prompt.provider}
                        </span>
                      )}
                      {prompt.model && (
                        <span className="px-2 py-0.5 bg-white/10 rounded text-xs text-gray-400">
                          {prompt.model}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SavedPrompts;

