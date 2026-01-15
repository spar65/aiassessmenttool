/**
 * Lead Registration Proxy
 * 
 * Proxies lead registration to main API
 * 
 * @version 0.7.8.5
 * @updated v1.5.1 - Added honeypot bot detection
 */

import { NextRequest, NextResponse } from "next/server";

// The main API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://aiassesstech.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // v1.5.1: Honeypot check - if filled, it's a bot
    // Check at proxy level for defense in depth
    if (body.website && typeof body.website === "string" && body.website.trim() !== "") {
      console.warn(`🤖 Bot detected at proxy: honeypot filled with "${body.website}" from ${body.email}`);
      // Return fake success to not tip off the bot
      return NextResponse.json({
        success: true,
        leadId: "blocked",
        email: body.email,
        isReturning: false,
      });
    }

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

