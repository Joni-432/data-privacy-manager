'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { ArrowLeft, Clock, ShieldCheck, Database, History } from 'lucide-react';

interface PrivacyRequest {
  id: string;
  request_type: 'EXPORT' | 'DELETE';
  status: string;
  created_at: string;
  updated_at?: string | null;
}

interface Evidence {
  id: string;
  request_id: string;
  description: string;
  file_url?: string | null;
  created_at: string;
}

interface AuditLog {
  id: string;
  request_id: string;
  action: string;
  performed_by?: string | null;
  created_at: string;
}

export default function RequestDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<PrivacyRequest | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const mountedRef = useRef(true);

  const fetchAll = async () => {
    try {
      const [reqRes, evRes, logRes] = await Promise.allSettled([
        fetch(`/api/requests/${id}`),
        fetch(`/api/requests/${id}/evidence`),
        fetch(`/api/requests/${id}/logs`),
      ]);

      if (reqRes.status === 'fulfilled' && reqRes.value.ok) {
        const reqJson = await reqRes.value.json();
        if (mountedRef.current) setRequest(reqJson);
      } else {
        try {
          const listRes = await fetch('/api/requests');
          if (listRes.ok) {
            const listJson: PrivacyRequest[] = await listRes.json();
            const found = listJson.find((r) => r.id === id) ?? null;
            if (mountedRef.current) setRequest(found);
          }
        } catch { /* ignore */ }
      }

      if (evRes.status === 'fulfilled' && evRes.value.ok) {
        const evJson: Evidence[] = await evRes.value.json();
        if (mountedRef.current) setEvidence(evJson);
      } else {
        try {
          const fallback = await fetch(`/api/evidence?requestId=${id}`);
          if (fallback.ok) {
            const fallbackJson: Evidence[] = await fallback.json();
            if (mountedRef.current) setEvidence(fallbackJson);
          }
        } catch { /* ignore */ }
      }

      if (logRes.status === 'fulfilled' && logRes.value.ok) {
        const logJson: AuditLog[] = await logRes.value.json();
        if (mountedRef.current) setLogs(logJson);
      } else {
        try {
          const fallback = await fetch(`/api/audit_logs?requestId=${id}`);
          if (fallback.ok) {
            const fallbackJson: AuditLog[] = await fallback.json();
            if (mountedRef.current) setLogs(fallbackJson);
          }
        } catch { /* ignore */ }
      }
    } catch (err) {
      console.error('Failed to load request details', err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    (async () => { await fetchAll(); })();
    const interval = setInterval(() => { fetchAll(); }, 4000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-400">Loading request details…</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
          <p className="text-slate-700 mb-4">Request not found.</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => router.back()} className="px-4 py-2 bg-slate-100 rounded-md">Go Back</button>
            <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-md">Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  const steps = ['SUBMITTED', 'PROCESSING', 'COMPLETED'];
  const currentStepIdx = Math.max(0, steps.indexOf(request.status));

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Request Details</h1>
          <StatusBadge status={request.status} />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm text-slate-500 uppercase tracking-wider font-medium">Request ID</h3>
              <p className="font-mono text-xs text-slate-700 break-all mt-2">{request.id}</p>
            </div>
            <div>
              <h3 className="text-sm text-slate-500 uppercase tracking-wider font-medium">Type</h3>
              <p className="text-sm font-bold mt-2">{request.request_type}</p>
            </div>
            <div>
              <h3 className="text-sm text-slate-500 uppercase tracking-wider font-medium">Created</h3>
              <p className="text-sm mt-2">{new Date(request.created_at).toLocaleString()}</p>
            </div>
            <div>
              <h3 className="text-sm text-slate-500 uppercase tracking-wider font-medium">Last Updated</h3>
              <p className="text-sm mt-2">{request.updated_at ? new Date(request.updated_at).toLocaleString() : '-'}</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Clock size={16} /> Workflow Timeline
          </h3>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs font-semibold uppercase tracking-wider mb-2">
              <span className={request.status === 'SUBMITTED' ? 'text-blue-600' : 'text-slate-400'}>Submitted</span>
              <span className={request.status === 'PROCESSING' ? 'text-amber-500' : 'text-slate-400'}>Processing</span>
              <span className={request.status === 'COMPLETED' ? 'text-emerald-500' : 'text-slate-400'}>Completed</span>
            </div>
            <div className="overflow-hidden h-3 rounded-full bg-slate-100 border border-slate-200">
              <div
                style={{
                  width: request.status === 'SUBMITTED' ? '33.3%' : request.status === 'PROCESSING' ? '66.6%' : '100%',
                  transition: 'width 1s ease-in-out'
                }}
                className={`h-full rounded-full transition-all duration-1000 ${
                  request.status === 'SUBMITTED' ? 'bg-blue-500' :
                  request.status === 'PROCESSING' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
            </div>
          </div>

          {/* Step Circles */}
          <div className="relative flex justify-between items-center">
            <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-100 -z-10"></div>
            {steps.map((s, i) => {
              const done = i <= currentStepIdx;
              return (
                <div key={s} className="flex flex-col items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-all ${
                      done ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {done ? <ShieldCheck size={18} /> : <div className="w-2 h-2 bg-slate-400 rounded-full" />}
                  </div>
                  <span className={`text-xs font-bold ${done ? 'text-slate-900' : 'text-slate-400'}`}>{s}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Evidence */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Database size={16} /> Evidence
          </h3>
          {evidence.length > 0 ? (
            <div className="space-y-4">
              {evidence.map((ev) => (
                <div key={ev.id} className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-slate-900">{ev.description}</p>
                  {ev.file_url && (
                    <a className="text-blue-600 text-sm mt-2 inline-block" href={ev.file_url} target="_blank" rel="noreferrer">
                      Download evidence
                    </a>
                  )}
                  <div className="text-xs text-slate-400 mt-2">{new Date(ev.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
              Waiting for system to generate evidence...
            </div>
          )}
        </div>

        {/* Audit Log */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-12">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <History size={16} /> Audit Log
          </h3>
          {logs.length > 0 ? (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 border-l-2 border-slate-100">
                  <div className="pt-1">
                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-900 font-medium">{log.action}</p>
                    <div className="flex gap-3 mt-1 text-xs text-slate-400">
                      <span>By {log.performed_by ?? 'System'}</span>
                      <span>•</span>
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-400 py-8">No audit logs yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}