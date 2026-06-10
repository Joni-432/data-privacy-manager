"use client";

import { useState, useEffect, useCallback } from 'react';
import StatusBadge from '@/components/StatusBadge';
import { PrivacyRequest } from '@/lib/types';

export default function Dashboard() {
  const [requests, setRequests] = useState<PrivacyRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    const res = await fetch('/api/requests');
    const data = await res.json();
    setRequests(data);
  }, []);

  useEffect(() => {
    const loadRequests = async () => {
      const res = await fetch('/api/requests');
      const data = await res.json();
      setRequests(data);
    };

    loadRequests();
    const interval = setInterval(loadRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  const createRequest = async (type: 'EXPORT' | 'DELETE') => {
    setLoading(true);
    await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    });
    setLoading(false);
    fetchRequests();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Data Privacy Request Manager</h1>

      <div className="flex gap-4 mb-10">
        <button
          onClick={() => createRequest('EXPORT')}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Submitting...' : 'Request Data Export'}
        </button>
        <button
          onClick={() => createRequest('DELETE')}
          disabled={loading}
          className="bg-red-600 text-white px-6 py-2 rounded shadow hover:bg-red-700 disabled:bg-gray-400"
        >
          {loading ? 'Submitting...' : 'Request Data Deletion'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-sm">ID</th>
              <th className="p-4 font-semibold text-sm">Type</th>
              <th className="p-4 font-semibold text-sm">Status</th>
              <th className="p-4 font-semibold text-sm">Date</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  No requests yet. Click a button above to create one!
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr 
                  key={req.id} 
                  className="border-b last:border-0 hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => window.location.href = `/requests/${req.id}`}
                  >
                  <td className="p-4 text-sm font-mono text-gray-500">{req.id.slice(0, 8)}...</td>
                  <td className="p-4 text-sm font-medium">{req.request_type}</td>
                  <td className="p-4"><StatusBadge status={req.status} /></td>
                  <td className="p-4 text-sm text-gray-500">{new Date(req.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}