import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: privacyRequest, error } = await supabaseAdmin
    .from('privacy_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: evidence } = await supabaseAdmin
    .from('evidence')
    .select('*')
    .eq('request_id', id)
    .order('created_at', { ascending: true });

  const { data: auditLogs } = await supabaseAdmin
    .from('audit_logs')
    .select('*')
    .eq('request_id', id)
    .order('created_at', { ascending: true });

  return NextResponse.json({
    ...privacyRequest,
    evidence: evidence ?? [],
    audit_logs: auditLogs ?? []
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status } = await request.json();

  const { data, error } = await supabaseAdmin
    .from('privacy_requests')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}