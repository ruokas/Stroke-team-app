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
        'Access-Control-Allow-Methods': 'OPTIONS, POST',
      },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' }, {
      Allow: 'OPTIONS, POST',
      'Access-Control-Allow-Methods': 'OPTIONS, POST',
    });
  }

  let events: unknown;
  try {
    events = await req.json();
  } catch (_error) {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  if (!Array.isArray(events) || events.length === 0) {
    return jsonResponse(400, { error: 'Events payload must be a non-empty array' });
  }

  const normalizedEvents: { event: string; payload: unknown }[] = [];
  for (let index = 0; index < events.length; index += 1) {
    const entry = events[index];
    if (typeof entry !== 'object' || entry === null) {
      return jsonResponse(400, { error: `Invalid event at index ${index}` });
    }

    const { event, payload } = entry as { event?: unknown; payload?: unknown };
    if (typeof event !== 'string' || event.trim() === '') {
      return jsonResponse(400, { error: `Invalid event name at index ${index}` });
    }

    normalizedEvents.push({
      event: event.trim(),
      payload: payload ?? null,
    });
  }

  try {
    const { error } = await supabase.from('events').insert(normalizedEvents);
    if (error) throw error;
  } catch (error) {
    console.error('Error inserting events', error);
    return jsonResponse(500, { error: 'Internal server error' });
  }

  return jsonResponse(201, { inserted: normalizedEvents.length });
});
