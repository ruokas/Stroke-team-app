import { createClient } from 'npm:@supabase/supabase-js';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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

    if (typeof body !== 'object' || body === null) {
      return jsonResponse(400, { error: 'Invalid request body' });
    }

    const payload = body as Record<string, unknown>;
    const {
      patient_id: snakeId,
      patientId: camelId,
      name,
      payload: bodyPayload,
      data,
      last_updated: snakeLastUpdated,
      lastUpdated: camelLastUpdated,
    } = payload;

    if (typeof name !== 'string' || name.trim() === '') {
      return jsonResponse(400, { error: 'Invalid patient name' });
    }

    const resolvedPatientId = snakeId ?? camelId;
    if (
      resolvedPatientId !== undefined &&
      resolvedPatientId !== null &&
      `${resolvedPatientId}`.trim() === ''
    ) {
      return jsonResponse(400, { error: 'Invalid patient_id' });
    }

    const resolvedPayload = bodyPayload ?? data;
    if (typeof resolvedPayload !== 'object' || resolvedPayload === null) {
      return jsonResponse(400, { error: 'Invalid payload' });
    }

    const resolvedLastUpdated = snakeLastUpdated ?? camelLastUpdated ?? null;
    let normalizedLastUpdated: string;
    if (resolvedLastUpdated === null) {
      normalizedLastUpdated = new Date().toISOString();
    } else {
      const parsedLastUpdated = new Date(String(resolvedLastUpdated));
      if (Number.isNaN(parsedLastUpdated.getTime())) {
        return jsonResponse(400, { error: 'Invalid last_updated value' });
      }
      normalizedLastUpdated = parsedLastUpdated.toISOString();
    }

    const normalizedPatientId =
      resolvedPatientId !== undefined && resolvedPatientId !== null
        ? `${resolvedPatientId}`.trim()
        : crypto.randomUUID();

    const { data: upserted, error } = await supabase
      .from('patients')
      .upsert(
        {
          patient_id: normalizedPatientId,
          name: name.trim(),
          payload: resolvedPayload,
          last_updated: normalizedLastUpdated,
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
