/**
 * OpenAI API Proxy - Conversational Mode Support
 *
 * Routes OpenAI API calls through the server to avoid CORS issues.
 * Supports both:
 * - CONVERSATIONAL mode: Full message history with sliding window
 * - ISOLATED mode (legacy): Single question per request
 *
 * The user's API key is passed in the request body and used directly -
 * it never gets stored or logged.
 *
 * @version 0.8.7
 */

import { NextRequest, NextResponse } from "next/server";

// CORS headers for the proxy endpoint
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Maximum messages to accept (20 Q&A pairs = 40 messages)
const MAX_CONTEXT_MESSAGES = 40;

// Default model
// v0.8.9.5: Updated to GPT-3.5 (GPT-4 rate limited)
const DEFAULT_MODEL = "gpt-3.5-turbo";

// API endpoint
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// Answer format instruction to inject into system prompt
const ANSWER_FORMAT_INSTRUCTION = `

CRITICAL: When you receive multiple-choice questions (with options A, B, C, D), you MUST respond with ONLY the single letter of your choice (A, B, C, or D). Do not explain, analyze, or add any other text. Just the letter.`;

/**
 * Extract answer letter from AI response (robust extraction)
 * Handles various response formats like "A", "The answer is B", "I choose C", etc.
 */
function extractAnswerLetter(response: string): string | null {
  const cleaned = response.trim().toUpperCase();

  // Priority 1: Response is just a single letter
  if (/^[ABCD]$/i.test(cleaned)) {
    return cleaned;
  }

  // Priority 2: Starts with letter followed by non-letter
  if (/^[ABCD]([^A-Z]|$)/i.test(cleaned)) {
    return cleaned[0];
  }

  // Priority 3: Common patterns
  const patterns = [
    /(?:answer|choice|option|select|choose)[:\s]*([ABCD])/i,
    /^([ABCD])\)/,
    /^([ABCD])\./,
    /\b([ABCD])\s*[-–—]\s/,
    /^"?([ABCD])"?$/,
    /I (?:would )?(?:choose|select|pick) ([ABCD])/i,
    /(?:my|the) answer is ([ABCD])/i,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) return match[1].toUpperCase();
  }

  // Priority 4: First standalone letter A-D
  const letterMatch = cleaned.match(/\b([ABCD])\b/);
  if (letterMatch) return letterMatch[1];

  // No valid answer found
  return null;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Detect mode based on payload structure
    if (body.messages && Array.isArray(body.messages)) {
      return handleConversationalMode(body);
    } else {
      return handleLegacyMode(body);
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("[OpenAI Proxy] Error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Conversational mode - accepts message history array
 * Used for realistic multi-turn assessment testing
 */
async function handleConversationalMode(body: {
  apiKey: string;
  model?: string;
  systemPrompt?: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens?: number;
}) {
  const { apiKey, model = DEFAULT_MODEL, systemPrompt, messages, maxTokens = 10 } = body;

  // Validation
  if (!apiKey || !messages || messages.length === 0) {
    return NextResponse.json(
      { error: "Missing required fields: apiKey, messages" },
      { status: 400, headers: corsHeaders }
    );
  }

  // Validate API key format (allow both sk- and sk-proj-)
  if (!apiKey.startsWith("sk-")) {
    return NextResponse.json(
      { error: "Invalid OpenAI API key format. Key should start with 'sk-'" },
      { status: 400, headers: corsHeaders }
    );
  }

  // Enforce context window limit (take most recent messages)
  const windowedMessages = messages.slice(-MAX_CONTEXT_MESSAGES);

  // Ensure messages end with user message
  const lastMessage = windowedMessages[windowedMessages.length - 1];
  if (lastMessage?.role !== "user") {
    return NextResponse.json(
      { error: "Messages must end with a user message" },
      { status: 400, headers: corsHeaders }
    );
  }

  // Build OpenAI messages array
  const enhancedSystemPrompt = systemPrompt
    ? systemPrompt + ANSWER_FORMAT_INSTRUCTION
    : ANSWER_FORMAT_INSTRUCTION.trim();

  const openaiMessages = [
    { role: "system", content: enhancedSystemPrompt },
    ...windowedMessages,
  ];

  // Make API call with 30-second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: openaiMessages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      console.error("[OpenAI Proxy] API Error:", data);
      return NextResponse.json(
        {
          error: data.error?.message || "OpenAI API error",
          type: data.error?.type || "api_error",
        },
        { status: response.status, headers: corsHeaders }
      );
    }

    // Extract response text
    const rawResponse = data.choices?.[0]?.message?.content || "";

    if (!rawResponse) {
      return NextResponse.json(
        {
          error: "No response generated by OpenAI",
          type: "empty_response",
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // Use robust letter extraction
    const extractedLetter = extractAnswerLetter(rawResponse);
    const responseText = extractedLetter || rawResponse;

    return NextResponse.json(
      {
        response: responseText,
        rawResponse: rawResponse !== responseText ? rawResponse : undefined,
        model: data.model,
        usage: data.usage,
        contextSize: openaiMessages.length,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "OpenAI API request timed out after 30 seconds" },
        { status: 504, headers: corsHeaders }
      );
    }
    throw error;
  }
}

/**
 * Legacy mode - single message (backward compatible)
 * Each question is asked independently with no context
 */
async function handleLegacyMode(body: {
  apiKey: string;
  model?: string;
  systemPrompt?: string;
  userMessage: string;
  maxTokens?: number;
}) {
  const { apiKey, model = DEFAULT_MODEL, systemPrompt, userMessage, maxTokens = 100 } = body;

  if (!apiKey || !userMessage) {
    return NextResponse.json(
      { error: "Missing required fields: apiKey, userMessage" },
      { status: 400, headers: corsHeaders }
    );
  }

  // Validate API key format
  if (!apiKey.startsWith("sk-")) {
    return NextResponse.json(
      { error: "Invalid OpenAI API key format. Key should start with 'sk-'" },
      { status: 400, headers: corsHeaders }
    );
  }

  // Build messages with system prompt
  const enhancedSystemPrompt = systemPrompt
    ? systemPrompt + ANSWER_FORMAT_INSTRUCTION
    : ANSWER_FORMAT_INSTRUCTION.trim();

  const openaiMessages = [
    { role: "system", content: enhancedSystemPrompt },
    { role: "user", content: userMessage },
  ];

  // Make API call with 30-second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: openaiMessages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      console.error("[OpenAI Proxy] API Error:", data);
      return NextResponse.json(
        {
          error: data.error?.message || "OpenAI API error",
          type: data.error?.type || "api_error",
        },
        { status: response.status, headers: corsHeaders }
      );
    }

    const rawResponse = data.choices?.[0]?.message?.content || "";

    if (!rawResponse) {
      return NextResponse.json(
        {
          error: "No response generated by OpenAI",
          type: "empty_response",
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // Use robust letter extraction
    const extractedLetter = extractAnswerLetter(rawResponse);
    const responseText = extractedLetter || rawResponse;

    return NextResponse.json(
      {
        response: responseText,
        rawResponse: rawResponse !== responseText ? rawResponse : undefined,
        model: data.model,
        usage: data.usage,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "OpenAI API request timed out after 30 seconds" },
        { status: 504, headers: corsHeaders }
      );
    }
    throw error;
  }
}

