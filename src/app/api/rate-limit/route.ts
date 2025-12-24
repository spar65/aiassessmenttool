/**
 * Rate Limit Proxy
 * 
 * Proxies rate limit check to main API
 * This allows the demo app to check rate limits before starting an assessment
 * 
 * @version 0.7.8.5
 */

import { NextResponse } from "next/server";

// The main API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://www.aiassesstech.com";

// The demo Health Check Key (public, rate-limited)
const DEMO_HEALTH_CHECK_KEY = process.env.NEXT_PUBLIC_HEALTH_CHECK_KEY;

export async function GET() {
  if (!DEMO_HEALTH_CHECK_KEY) {
    return NextResponse.json(
      { error: "Demo key not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/sdk/rate-limit-check`, {
      method: "GET",
      headers: {
        "X-Health-Check-Key": DEMO_HEALTH_CHECK_KEY,
      },
    });

    const data = await response.json();

    // Pass through rate limit headers
    const headers = new Headers();
    const rateLimitHeaders = ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"];
    for (const header of rateLimitHeaders) {
      const value = response.headers.get(header);
      if (value) {
        headers.set(header, value);
      }
    }

    return NextResponse.json(data, { 
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error("[Rate Limit Proxy] Error:", error);
    return NextResponse.json(
      { error: "Failed to check rate limit" },
      { status: 500 }
    );
  }
}

