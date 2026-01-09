/**
 * Lead Registration Proxy
 * 
 * Proxies lead registration to main API
 * 
 * @version 0.7.8.5
 */

import { NextRequest, NextResponse } from "next/server";

// The main API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://aiassesstech.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/leads/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to register lead" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Register Proxy] Error:", error);
    return NextResponse.json(
      { error: "Failed to register lead" },
      { status: 500 }
    );
  }
}

