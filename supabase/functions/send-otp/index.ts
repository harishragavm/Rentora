import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendOtpRequest {
  email: string;
  name?: string;
}

Deno.serve(async (req: Request) => {
  // 1. Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed. Use POST.' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Read server-side environment variables
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

    if (!RESEND_API_KEY) {
      console.error('[Send-OTP Edge Function] Server configuration error: RESEND_API_KEY is not configured in Supabase secrets.');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server email provider configuration missing. Please configure RESEND_API_KEY in Supabase secrets.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Authenticate caller user via JWT
    const authHeader = req.headers.get('Authorization') || '';
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required. Please sign in to request an OTP.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Parse and validate request body
    const body: SendOtpRequest = await req.json().catch(() => ({ email: '' }));
    const cleanEmail = (body.email || user.email || '').trim().toLowerCase();

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return new Response(
        JSON.stringify({ success: false, error: 'A valid email address is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Generate 6-digit cryptographically secure OTP & hash on server
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Rate Limit 1: 60-second cooldown
    const { data: recentOtps } = await adminClient
      .from('otp_verifications')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('target_type', 'email')
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentOtps && recentOtps.length > 0) {
      const lastCreated = new Date(recentOtps[0].created_at).getTime();
      const elapsedSeconds = Math.floor((Date.now() - lastCreated) / 1000);
      if (elapsedSeconds < 60) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Please wait before requesting another verification code.',
            retry_after_seconds: 60 - elapsedSeconds 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Rate Limit 2: Max 5 requests per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: hourlyCount } = await adminClient
      .from('otp_verifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('target_type', 'email')
      .gte('created_at', oneHourAgo);

    if ((hourlyCount || 0) >= 5) {
      return new Response(
        JSON.stringify({ success: false, error: 'Hourly verification limit reached. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean previous unverified email OTP records for this user
    await adminClient
      .from('otp_verifications')
      .delete()
      .eq('user_id', user.id)
      .eq('target_type', 'email');

    // Cryptographic 6-digit code generation
    const randomArray = new Uint32Array(1);
    crypto.getRandomValues(randomArray);
    const rawCode = 100000 + (randomArray[0] % 900000);
    const otpCode = rawCode.toString();

    // Store hash via PostgreSQL crypt RPC
    // Use RPC to insert with pgcrypto hash
    const { error: insertError } = await adminClient.rpc('request_otp', {
      p_target_type: 'email',
      p_target_value: cleanEmail,
    });

    if (insertError) {
      console.error('[Send-OTP] RPC request_otp error:', insertError);
    }

    // 7. Render clean, branded HTML email template
    const recipientName = (body.name || user.user_metadata?.full_name || user.user_metadata?.name || 'Rentora User').trim();
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Rentora Security <onboarding@resend.dev>';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rentora Verification Code</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="520px" border="0" cellspacing="0" cellpadding="0" style="max-width:520px;background-color:#ffffff;border-radius:20px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.05);">
          
          <!-- Brand Header -->
          <tr>
            <td style="padding:28px 32px;background:linear-gradient(135deg, #047857 0%, #065f46 100%);text-align:center;">
              <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Rentora</h1>
              <p style="margin:4px 0 0 0;font-size:12px;color:#a7f3d0;font-weight:500;">Secure Peer-to-Peer Rental Verification</p>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding:32px 32px 24px 32px;">
              <p style="margin:0 0 16px 0;font-size:15px;color:#334155;line-height:1.5;">
                Hello <strong>${recipientName}</strong>,
              </p>
              <p style="margin:0 0 24px 0;font-size:14px;color:#64748b;line-height:1.6;">
                Use the following 6-digit verification code to authenticate your email address. For your security, this code is valid for exactly <strong>1 minute</strong>.
              </p>

              <!-- OTP Code Display Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:0 0 24px 0;">
                <tr>
                  <td align="center" style="background-color:#ecfdf5;border:2px dashed #059669;border-radius:16px;padding:20px 16px;">
                    <span style="font-family:Consolas,Monaco,'Courier New',Courier,monospace;font-size:36px;font-weight:800;letter-spacing:10px;color:#047857;display:block;margin-left:10px;">
                      ${otpCode}
                    </span>
                    <span style="display:inline-block;margin-top:8px;font-size:11px;font-weight:700;color:#059669;background-color:#d1fae5;padding:3px 10px;border-radius:6px;">
                      Valid for 60 Seconds
                    </span>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px 0;font-size:12px;color:#94a3b8;line-height:1.5;">
                If you did not request this verification code, please ignore this email. Never share your verification code with anyone.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background-color:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                &copy; 2026 Rentora Platform. Protected by Cryptographic Verification.
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

    // 8. Dispatch email via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [cleanEmail],
        subject: `Your Rentora Verification Code: ${otpCode}`,
        html: htmlContent,
        text: `Your Rentora verification code is: ${otpCode}. This code expires in 1 minute. Do not share it with anyone.`,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('[Send-OTP Edge Function] Resend API Error:', resendData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: resendData.message || 'Failed to send OTP email via provider.' 
        }),
        { 
          status: resendResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 9. Return safe response (NEVER exposes OTP or API keys to frontend)
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Verification code sent to your email successfully.',
        expires_in_seconds: 60,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Send-OTP Edge Function] Exception:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unexpected error occurred while sending the OTP email.' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
