/**
 * Rate Limit Proxy
 * 
 * Proxies rate limit check to main API
 * This allows the demo app to check rate limits before starting an assessment
 * 
 * @version 0.7.8.5
 */

import { NextResponse } from "next/server";

// The demo Health Check Key (public, rate-limited)
const DEMO_HEALTH_CHECK_KEY = process.env.NEXT_PUBLIC_HEALTH_CHECK_KEY;

// Get the API URL and ensure it has a valid scheme
function getApiUrl(): string {
  let url = process.env.NEXT_PUBLIC_API_URL || "https://aiassesstech.com";
  
  // Add https:// if no scheme is present
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  
  // Remove trailing slash
  return url.replace(/\/$/, "");
}

const API_BASE_URL = getApiUrl();

export async function GET() {
  if (!DEMO_HEALTH_CHECK_KEY) {
    return NextResponse.json(
      { 
        canProceed: true,
        limit: 0,
        remaining: 0,
        resetAt: new Date().toISOString(),
        message: "Demo key not configured - proceeding without rate limit check"
      },
      { status: 200 }
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
    // Return a permissive response on error - let the main API handle rate limiting
    return NextResponse.json(
      { 
        canProceed: true,
        limit: 5,
        remaining: 5,
        resetAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        message: "Rate limit check unavailable - proceeding"
      },
      { status: 200 }
    );
  }
}

