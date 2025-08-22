import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify user is admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw new Error('Admin access required')
    }

    // Calculate statistics
    const [incidentsResult, usersResult, resourcesResult] = await Promise.all([
      supabaseClient.from('incident_reports').select('id, status').eq('status', 'active'),
      supabaseClient.from('profiles').select('id'),
      supabaseClient.from('resource_requests').select('id, status').eq('status', 'pending')
    ])

    const stats = {
      activeIncidents: incidentsResult.data?.length || 0,
      totalUsers: usersResult.data?.length || 0,
      pendingRequests: resourcesResult.data?.length || 0,
      totalReports: await getTotalReports(supabaseClient)
    }

    return new Response(
      JSON.stringify(stats),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

async function getTotalReports(supabaseClient: any) {
  const { data } = await supabaseClient.from('incident_reports').select('id')
  return data?.length || 0
}