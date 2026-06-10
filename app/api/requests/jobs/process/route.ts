import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { requestId, type } = await request.json();

    await supabaseAdmin
      .from('privacy_requests')
      .update({ status: 'PROCESSING' })
      .eq('id', requestId);

    await new Promise((resolve) => setTimeout(resolve, 3000));

    await supabaseAdmin.from('evidence').insert([
      {
        request_id: requestId,
        description:
          type === 'EXPORT'
            ? 'Data export generated successfully.'
            : 'User data deleted successfully.',
        file_url: null,
      },
    ]);

    await supabaseAdmin
      .from('privacy_requests')
      .update({ status: 'COMPLETED' })
      .eq('id', requestId);

    await supabaseAdmin.from('audit_logs').insert([
      {
        request_id: requestId,
        action: `System completed ${type} request`,
        performed_by: 'System Worker',
      },
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Job processing error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}