'use client';
import { useEffect, useRef, useState } from 'react';
import StatusBadge from '@/components/StatusBadge';
import Link from 'next/link';
import { PlusCircle, FileText, Trash2, ArrowRight } from 'lucide-react';

interface PrivacyRequest {
  id: string;
  request_type: 'EXPORT' | 'DELETE';
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const [requests, setRequests] = useState<PrivacyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/requests');
      if (!res.ok) throw new Error('Failed to fetch requests');
      const data: PrivacyRequest[] = await res.json();

      // Only update state if component is still mounted
      if (!mountedRef.current) return;
      setRequests(data);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    // Call fetchRequests asynchronously so setState does not run synchronously inside the effect body
    (async () => {
      await fetchRequests();
    })();

    const interval = setInterval(() => {
      fetchRequests();
    }, 5000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  const createRequest = async (type: 'EXPORT' | 'DELETE') => {
  try {
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, userId: 'user_123' }),
    });
    if (!res.ok) {
      const err = await res.json();
      console.error('Failed to create request:', err);
      return;
    }
  } catch (err) {
    console.error('Network error:', err);
    return;
  }
  fetchRequests();
};

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <nav className="bg-white border-b border-slate-200 mb-8">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs">DP</div>
            Privacy Manager
          </h1>
          <div className="flex gap-3">
             <button 
              onClick={() => createRequest('EXPORT')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95"
            >
              <PlusCircle size={18} /> Request Data Export
            </button>
            <button 
              onClick={() => createRequest('DELETE')}
              className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 shadow-sm"
            >
              <Trash2 size={18} className="text-red-500" /> Request Data Deletion
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4">
        <div className="mb-6 text-left">
          <h2 className="text-2xl font-bold text-slate-900">Privacy Requests</h2>
          <p className="text-slate-500 text-sm mt-1">Manage and track your data privacy tasks.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Date Created</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-md ${req.request_type === 'EXPORT' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                          {req.request_type === 'EXPORT' ? <FileText size={18} /> : <Trash2 size={18} />}
                        </div>
                        <span className="font-medium text-slate-900">{req.request_type} Request</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 leading-none">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/requests/${req.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 group-hover:translate-x-1 transition-transform"
                      >
                        View Details <ArrowRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {requests.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-400">No requests found. Start by creating one above.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}