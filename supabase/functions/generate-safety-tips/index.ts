import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [] } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Build conversation context for Gemini API
    const contents = [];

    // Add conversation history with proper user/model alternation
    if (conversationHistory.length > 0) {
      conversationHistory.forEach((msg: { role: string; content: string }) => {
        if (msg.role === 'user') {
          contents.push({
            parts: [{ text: msg.content }]
          });
        } else if (msg.role === 'assistant') {
          // Add model response
          contents.push({
            parts: [{ text: msg.content }]
          });
        }
      });
    }

    // Add current user message
    contents.push({
      parts: [{ text: `You are a disaster preparedness and safety expert AI assistant. Help users with questions about emergency preparedness, disaster response, safety tips, and emergency planning. Provide practical, actionable advice that could save lives. Be concise but thorough.\n\nUser question: ${message}` }]
    });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          maxOutputTokens: 800,
          temperature: 0.7,
        }
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate response');
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I cannot generate a response at this time.';

    return new Response(
      JSON.stringify({ reply }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error generating safety tips:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});