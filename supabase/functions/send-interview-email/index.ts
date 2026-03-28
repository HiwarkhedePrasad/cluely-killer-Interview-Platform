// Supabase Edge Function: Send Interview Email
// Deploy with: supabase functions deploy send-interview-email

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SMTP_HOST = Deno.env.get("SMTP_HOST") || "smtp.gmail.com";
const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "587");
const SMTP_USER = Deno.env.get("SMTP_USER") || "";
const SMTP_PASS = Deno.env.get("SMTP_PASS") || "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@recruitment.com";
const FROM_NAME = Deno.env.get("FROM_NAME") || "Recruitment Platform";
const APP_DOWNLOAD_URL = Deno.env.get("APP_DOWNLOAD_URL") || "https://yourcompany.com/download";

interface EmailRequest {
  to: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  interviewCode: string;
  expiresAt?: string;
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const { to, candidateName, jobTitle, companyName, interviewCode, expiresAt }: EmailRequest = await req.json();

    if (!to || !candidateName || !jobTitle || !interviewCode) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const expiryText = expiresAt 
      ? `This code expires on ${new Date(expiresAt).toLocaleDateString()}.`
      : "This code is valid for 7 days.";

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Invitation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #111; border-radius: 12px; overflow: hidden; border: 1px solid #222;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
                Interview Invitation
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 32px;">
              <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                Hello <strong style="color: #fff;">${candidateName}</strong>,
              </p>
              
              <p style="color: #a0a0a0; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                You've been invited to interview for the position of 
                <strong style="color: #6366f1;">${jobTitle}</strong>
                ${companyName ? ` at <strong style="color: #fff;">${companyName}</strong>` : ""}.
              </p>
              
              <p style="color: #a0a0a0; font-size: 15px; line-height: 1.6; margin: 0 0 32px;">
                This is an AI-powered interview that you can complete at your convenience. 
                The interview typically takes 20-30 minutes and includes technical questions 
                tailored to your experience and the job requirements.
              </p>
              
              <!-- Interview Code -->
              <div style="background-color: #1a1a1a; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 32px; border: 1px solid #333;">
                <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px;">
                  Your Interview Code
                </p>
                <div style="font-family: 'SF Mono', Monaco, monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #6366f1;">
                  ${interviewCode}
                </div>
                <p style="color: #666; font-size: 13px; margin: 16px 0 0;">
                  ${expiryText}
                </p>
              </div>
              
              <!-- Steps -->
              <div style="margin-bottom: 32px;">
                <p style="color: #fff; font-size: 14px; font-weight: 600; margin: 0 0 16px;">
                  How to start your interview:
                </p>
                <ol style="color: #a0a0a0; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Download and install the Interview App</li>
                  <li>Open the app and click "Join"</li>
                  <li>Enter your interview code: <code style="background: #222; padding: 2px 6px; border-radius: 4px; color: #6366f1;">${interviewCode}</code></li>
                  <li>Allow camera and microphone access when prompted</li>
                  <li>Complete the interview with our AI interviewers</li>
                </ol>
              </div>
              
              <!-- Download Button -->
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${APP_DOWNLOAD_URL}" 
                   style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                  Download Interview App
                </a>
              </div>
              
              <p style="color: #666; font-size: 13px; text-align: center; margin: 0;">
                If the button doesn't work, copy this link: ${APP_DOWNLOAD_URL}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #0d0d0d; padding: 24px 32px; border-top: 1px solid #222;">
              <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
                This is an automated message from the Recruitment Platform.<br>
                Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const textContent = `
Interview Invitation

Hello ${candidateName},

You've been invited to interview for the position of ${jobTitle}${companyName ? ` at ${companyName}` : ""}.

Your Interview Code: ${interviewCode}
${expiryText}

How to start your interview:
1. Download and install the Interview App from: ${APP_DOWNLOAD_URL}
2. Open the app and click "Join"
3. Enter your interview code: ${interviewCode}
4. Allow camera and microphone access when prompted
5. Complete the interview with our AI interviewers

Good luck!

---
This is an automated message from the Recruitment Platform.
    `;

    // Use Deno's built-in SMTP or a service like Resend/SendGrid
    // For simplicity, we'll use a fetch-based email API approach
    // You can replace this with your preferred email service
    
    // Option 1: Using Resend (recommended for production)
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (RESEND_API_KEY) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: [to],
          subject: `Interview Invitation: ${jobTitle}`,
          html: htmlContent,
          text: textContent,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Email sending failed: ${error}`);
      }

      const result = await response.json();
      return new Response(
        JSON.stringify({ success: true, messageId: result.id }),
        { 
          status: 200, 
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          } 
        }
      );
    }

    // Option 2: Mock response for development
    console.log("Email would be sent to:", to);
    console.log("Interview code:", interviewCode);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email logged (no email service configured)",
        preview: { to, interviewCode, jobTitle }
      }),
      { 
        status: 200, 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        } 
      }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        } 
      }
    );
  }
});
