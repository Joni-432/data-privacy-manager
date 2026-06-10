import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { qstashClient } from '@/lib/qstash';

export async function POST(request: Request) {
  try {
    const { type, userId } = await request.json();

    if (!type || !['EXPORT', 'DELETE'].includes(type)) {
      return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
    }

    const { data: privacyRequest, error: dbError } = await supabaseAdmin
      .from('privacy_requests')
      .insert([{ request_type: type, user_id: userId || null, status: 'SUBMITTED' }])
      .select()
      .single();

    if (dbError) throw dbError;

    await supabaseAdmin.from('audit_logs').insert([{
      request_id: privacyRequest.id,
      action: `User created a ${type} request`,
      performed_by: userId || 'Anonymous'
    }]);

    await qstashClient.publishJSON({
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/jobs/process`,
      body: { requestId: privacyRequest.id, type: type },
      headers: {
        "ngrok-skip-browser-warning": "true"
      }
    });

    return NextResponse.json(privacyRequest);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error creating request:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('privacy_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}