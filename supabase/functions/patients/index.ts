import { createClient } from 'npm:@supabase/supabase-js';
import { parsePatientPayload } from '../_shared/validation.ts';

const supabaseUrl =
  Deno.env.get('SUPABASE_URL') ?? Deno.env.get('PROJECT_URL');
const serviceRoleKey =
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
  Deno.env.get('SERVICE_ROLE_KEY');

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  throw new Error('Supabase environment variables are not set');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const corsHeaders: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Create a JSON response with shared CORS headers.
 */
function jsonResponse(status: number, body: unknown, extraHeaders: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...extraHeaders,
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'OPTIONS, GET, POST',
      },
    });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('last_updated', { ascending: false });

    if (error) {
      console.error('Error fetching patients', error);
      return jsonResponse(500, { error: 'Internal server error' });
    }

    return jsonResponse(200, data ?? []);
  }

  if (req.method === 'POST') {
    let body: unknown;
    try {
      body = await req.json();
    } catch (_error) {
      return jsonResponse(400, { error: 'Invalid JSON body' });
    }

    const parsed = parsePatientPayload(body);
    if ('error' in parsed) {
      return jsonResponse(400, { error: parsed.error });
    }

    const { patientId, name, payload, lastUpdated } = parsed.value;
    const { data: upserted, error } = await supabase
      .from('patients')
      .upsert(
        {
          patient_id: patientId,
          name,
          payload,
          last_updated: lastUpdated,
        },
        { onConflict: 'patient_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error upserting patient', error);
      return jsonResponse(500, { error: 'Internal server error' });
    }

    return jsonResponse(201, upserted);
  }

  return jsonResponse(405, { error: 'Method not allowed' }, {
    Allow: 'OPTIONS, GET, POST',
    'Access-Control-Allow-Methods': 'OPTIONS, GET, POST',
  });
});
