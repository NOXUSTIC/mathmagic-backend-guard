import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (req.method === 'GET' || action === 'generate') {
      // Generate a new math captcha
      const operations = ['+', '-', '*'];
      const operation = operations[Math.floor(Math.random() * operations.length)];
      
      let num1: number, num2: number, answer: number, question: string;

      switch (operation) {
        case '+':
          num1 = Math.floor(Math.random() * 50) + 1;
          num2 = Math.floor(Math.random() * 50) + 1;
          answer = num1 + num2;
          question = `${num1} + ${num2}`;
          break;
        case '-':
          num1 = Math.floor(Math.random() * 50) + 25;
          num2 = Math.floor(Math.random() * 25) + 1;
          answer = num1 - num2;
          question = `${num1} - ${num2}`;
          break;
        case '*':
          num1 = Math.floor(Math.random() * 12) + 1;
          num2 = Math.floor(Math.random() * 12) + 1;
          answer = num1 * num2;
          question = `${num1} × ${num2}`;
          break;
        default:
          throw new Error('Invalid operation');
      }

      // Generate unique session ID
      const sessionId = crypto.randomUUID();
      
      // Clean up expired sessions first
      await supabase.from('captcha_sessions').delete().lt('expires_at', new Date().toISOString());

      // Store captcha in database (expires in 5 minutes)
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      
      const { error } = await supabase
        .from('captcha_sessions')
        .insert({
          session_id: sessionId,
          question,
          answer,
          expires_at: expiresAt
        });

      if (error) {
        console.error('Error storing captcha:', error);
        throw error;
      }

      console.log(`Generated captcha: ${question} = ${answer}, Session: ${sessionId}`);

      return new Response(
        JSON.stringify({ 
          sessionId, 
          question,
          expiresAt 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (req.method === 'POST') {
      // Verify captcha answer
      const { sessionId, userAnswer } = await req.json();

      if (!sessionId || userAnswer === undefined) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing sessionId or userAnswer' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get captcha session from database
      const { data: session, error } = await supabase
        .from('captcha_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error || !session) {
        console.error('Captcha session not found:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid or expired captcha session' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if expired
      if (new Date(session.expires_at) < new Date()) {
        console.log('Captcha session expired');
        return new Response(
          JSON.stringify({ success: false, error: 'Captcha has expired' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if already verified
      if (session.verified) {
        console.log('Captcha already verified');
        return new Response(
          JSON.stringify({ success: false, error: 'Captcha already used' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify answer
      const isCorrect = parseInt(userAnswer) === session.answer;
      
      if (isCorrect) {
        // Mark as verified
        await supabase
          .from('captcha_sessions')
          .update({ verified: true })
          .eq('session_id', sessionId);
        
        console.log(`Captcha verified successfully for session: ${sessionId}`);
      } else {
        console.log(`Captcha verification failed for session: ${sessionId}. Expected: ${session.answer}, Got: ${userAnswer}`);
      }

      return new Response(
        JSON.stringify({ success: isCorrect }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid method. Use GET to generate or POST to verify' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in captcha function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});