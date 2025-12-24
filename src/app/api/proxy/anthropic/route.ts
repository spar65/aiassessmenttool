/**
 * Anthropic API Proxy
 * 
 * Routes Anthropic API calls through the server to avoid CORS issues.
 * The user's API key is passed in the request body and used directly -
 * it never gets stored or logged.
 */

import { NextRequest, NextResponse } from "next/server";

// CORS headers for the proxy endpoint
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, model, systemPrompt, userMessage, maxTokens = 100 } = body;

    // Validate required fields
    if (!apiKey || !model || !userMessage) {
      return NextResponse.json(
        { error: "Missing required fields: apiKey, model, userMessage" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Make the request to Anthropic's API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt || undefined,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Anthropic Proxy] API Error:", data);
      return NextResponse.json(
        { 
          error: data.error?.message || "Anthropic API error",
          type: data.error?.type || "api_error",
        },
        { status: response.status, headers: corsHeaders }
      );
    }

    // Extract the text response
    const textContent = data.content?.find((c: any) => c.type === "text");
    const responseText = textContent?.text || "";

    return NextResponse.json(
      { 
        response: responseText,
        model: data.model,
        usage: data.usage,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("[Anthropic Proxy] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

