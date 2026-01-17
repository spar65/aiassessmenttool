/**
 * Send Assessment Results Email API
 * 
 * POST /api/send-results
 * Sends the assessment results to the user's email via Resend
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend client
const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[Send Results] RESEND_API_KEY not set - emails will not be sent');
    return null;
  }
  return new Resend(apiKey);
};

interface ResultsEmailRequest {
  email: string;
  sdkSessionId: string;
  overallScore: number;
  overallPassed: boolean;
  dimensionScores: Record<string, { score: number; passed: boolean }>;
  provider?: string;
  model?: string;
  completedAt?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ResultsEmailRequest = await request.json();
    
    // Validate required fields
    if (!body.email || !body.sdkSessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: email, sdkSessionId' },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    const resend = getResend();
    if (!resend) {
      console.log('[Send Results] Skipping email - RESEND_API_KEY not configured');
      return NextResponse.json({
        success: false,
        message: 'Email service not configured',
        skipped: true,
      });
    }
    
    // Format dimension scores for email
    const dimensionRows = Object.entries(body.dimensionScores || {})
      .map(([dimension, data]) => {
        const emoji = data.passed ? '✅' : '❌';
        const scoreFormatted = (data.score * 10).toFixed(1);
        return `<tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-transform: capitalize;">${dimension}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${scoreFormatted}/10</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${emoji} ${data.passed ? 'Passed' : 'Failed'}</td>
        </tr>`;
      })
      .join('');
    
    const overallEmoji = body.overallPassed ? '✅' : '❌';
    const overallScoreFormatted = (body.overallScore * 10).toFixed(1);
    const statusColor = body.overallPassed ? '#22c55e' : '#ef4444';
    const statusText = body.overallPassed ? 'PASSED' : 'NEEDS IMPROVEMENT';
    
    // Build email HTML
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #111827; margin: 0 0 8px 0; font-size: 28px;">🤖 AI Assessment Results</h1>
      <p style="color: #6b7280; margin: 0; font-size: 14px;">Your AI Ethics Score Report</p>
    </div>
    
    <!-- Main Card -->
    <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <!-- Overall Score Banner -->
      <div style="background: ${statusColor}; color: white; padding: 24px; text-align: center;">
        <div style="font-size: 48px; font-weight: bold;">${overallScoreFormatted}/10</div>
        <div style="font-size: 18px; margin-top: 8px;">${overallEmoji} ${statusText}</div>
      </div>
      
      <!-- Details -->
      <div style="padding: 24px;">
        <!-- Assessment Info -->
        <div style="margin-bottom: 24px; padding: 16px; background: #f9fafb; border-radius: 8px;">
          <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Assessment Details</div>
          <div style="color: #111827; font-size: 14px;">
            <strong>Session ID:</strong> ${body.sdkSessionId}<br/>
            ${body.provider ? `<strong>AI Provider:</strong> ${body.provider}${body.model ? ` (${body.model})` : ''}<br/>` : ''}
            <strong>Completed:</strong> ${body.completedAt || new Date().toISOString()}
          </div>
        </div>
        
        <!-- Dimension Scores Table -->
        <div style="margin-bottom: 24px;">
          <h3 style="color: #111827; margin: 0 0 16px 0; font-size: 16px;">Dimension Scores</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Dimension</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Score</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${dimensionRows || '<tr><td colspan="3" style="padding: 12px; text-align: center; color: #6b7280;">No dimension data available</td></tr>'}
            </tbody>
          </table>
        </div>
        
        <!-- CTA Button -->
        <div style="text-align: center;">
          <a href="https://aiassessmenttool.com/results/${body.sdkSessionId}" 
             style="display: inline-block; padding: 14px 32px; background: #22c55e; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
            View Full Results
          </a>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px; color: #6b7280; font-size: 12px;">
      <p style="margin: 0 0 8px 0;">
        <a href="https://aiassessmenttool.com" style="color: #22c55e; text-decoration: none;">AI Assessment Tool</a>
        · Powered by <a href="https://aiassesstech.com" style="color: #22c55e; text-decoration: none;">AI Assess Tech</a>
      </p>
      <p style="margin: 0;">
        What's Your AI's Ethics Score?
      </p>
    </div>
  </div>
</body>
</html>
    `;
    
    // Send email via Resend
    const result = await resend.emails.send({
      from: 'AI Assessment Tool <results@aiassessmenttool.com>',
      to: body.email,
      subject: `${overallEmoji} Your AI Ethics Score: ${overallScoreFormatted}/10`,
      html: htmlContent,
    });
    
    console.log(`[Send Results] Email sent to ${body.email}:`, result);
    
    return NextResponse.json({
      success: true,
      messageId: result.data?.id,
      email: body.email,
    });
    
  } catch (error) {
    console.error('[Send Results] Error:', error);
    
    // Don't fail the assessment if email fails
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }, { status: 500 });
  }
}
