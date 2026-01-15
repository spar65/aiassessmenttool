/**
 * SDK Assess Endpoint - Scoring with JWT Verification
 *
 * This endpoint scores assessment responses using the answer mappings
 * encoded in the signed JWT token from the config endpoint.
 *
 * Security:
 * - JWT signature is verified (tampered tokens rejected)
 * - Expired tokens rejected (2 hour limit)
 * - Answer mappings extracted from verified JWT only
 *
 * @version 0.8.0
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, errors as JoseErrors } from "jose";

// Must match the secret used in config endpoint
const getSecret = () => {
  const secret = process.env.ANSWER_MAPPING_SECRET;
  if (!secret) {
    console.warn(
      "[SDK Assess] ANSWER_MAPPING_SECRET not set - using fallback (NOT SECURE FOR PRODUCTION)"
    );
    // Fallback for development - NOT SECURE FOR PRODUCTION
    return new TextEncoder().encode("dev-secret-do-not-use-in-production-32ch");
  }
  return new TextEncoder().encode(secret);
};

interface AssessmentResponse {
  questionId: string;
  answer: string;
  dimension?: string;
}

interface JWTPayload {
  mappings: Record<string, string>;
  questionCount: number;
  createdAt: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { responses, mappingToken } = body as {
      responses: AssessmentResponse[];
      mappingToken: string;
    };

    // Validate required fields
    if (!mappingToken) {
      return NextResponse.json(
        { error: "Missing mappingToken - cannot score without it" },
        { status: 400 }
      );
    }

    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid responses array" },
        { status: 400 }
      );
    }

    // Verify and decode JWT
    let payload: JWTPayload;
    try {
      const verified = await jwtVerify(mappingToken, getSecret());
      payload = verified.payload as unknown as JWTPayload;
    } catch (error) {
      if (error instanceof JoseErrors.JWTExpired) {
        return NextResponse.json(
          {
            error: "Assessment session expired. Please start a new assessment.",
            code: "TOKEN_EXPIRED",
          },
          { status: 401 }
        );
      }
      if (error instanceof JoseErrors.JWSSignatureVerificationFailed) {
        return NextResponse.json(
          {
            error: "Invalid token - possible tampering detected.",
            code: "TOKEN_INVALID",
          },
          { status: 401 }
        );
      }
      throw error;
    }

    const { mappings, questionCount } = payload;

    // Validate response count
    if (responses.length !== questionCount) {
      console.warn(
        `[SDK Assess] Response count mismatch: got ${responses.length}, expected ${questionCount}`
      );
      // Continue anyway - might be partial assessment
    }

    // Score each response
    const scoredResponses = responses.map((r) => {
      const correctAnswer = mappings[r.questionId];
      const userAnswer = r.answer?.toUpperCase()?.trim();
      const isCorrect = userAnswer === correctAnswer;

      return {
        questionId: r.questionId,
        dimension: r.dimension,
        userAnswer,
        correctAnswer,
        isCorrect,
        score: isCorrect ? 1 : 0,
      };
    });

    // Calculate dimension scores
    const dimensionScores: Record<
      string,
      { correct: number; total: number; percentage: number }
    > = {};

    scoredResponses.forEach((r) => {
      if (r.dimension) {
        if (!dimensionScores[r.dimension]) {
          dimensionScores[r.dimension] = {
            correct: 0,
            total: 0,
            percentage: 0,
          };
        }
        dimensionScores[r.dimension].total++;
        if (r.isCorrect) {
          dimensionScores[r.dimension].correct++;
        }
      }
    });

    // Calculate percentages
    Object.keys(dimensionScores).forEach((dim) => {
      const { correct, total } = dimensionScores[dim];
      dimensionScores[dim].percentage =
        total > 0 ? Math.round((correct / total) * 100) : 0;
    });

    // Calculate overall score
    const totalCorrect = scoredResponses.filter((r) => r.isCorrect).length;
    const totalQuestions = scoredResponses.length;
    const overallPercentage =
      totalQuestions > 0
        ? Math.round((totalCorrect / totalQuestions) * 100)
        : 0;

    return NextResponse.json({
      success: true,
      results: {
        overall: {
          correct: totalCorrect,
          total: totalQuestions,
          percentage: overallPercentage,
        },
        dimensions: dimensionScores,
        responses: scoredResponses,
      },
      metadata: {
        assessedAt: new Date().toISOString(),
        tokenCreatedAt: new Date(payload.createdAt).toISOString(),
      },
    });
  } catch (error) {
    console.error("[SDK Assess] Error:", error);
    return NextResponse.json(
      { error: "Failed to process assessment" },
      { status: 500 }
    );
  }
}

