"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import { PrivacyRequest, Evidence, AuditLog } from '@/lib/types';

type RequestDetail = PrivacyRequest & {
  evidence: Evidence[];
  audit_logs: AuditLog[];
};

const WORKFLOW_STATES = ['SUBMITTED', 'PROCESSING', 'COMPLETED'];

export default function RequestDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      const res = await fetch(`/api/requests/${id}`);
      const data = await res.json();
      setRequest(data);
      setLoading(false);
    };

    fetchDetail();
    const interval = setInterval(fetchDetail, 5000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;
  if (!request) return <div className="p-8 text-red-500">Request not found.</div>;

  const currentStep = WORKFLOW_STATES.indexOf(request.status);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <button
        onClick={() => router.push('/')}
        className="mb-6 text-blue-600 hover:underline text-sm"
      >
        ← Back to Dashboard
      </button>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Request Details</h1>
        <StatusBadge status={request.status} />
      </div>

      {/* Request Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="font-semibold text-lg mb-4">Request Info</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Request ID</p>
            <p className="font-mono">{request.id}</p>
          </div>
          <div>
            <p className="text-gray-500">Type</p>
            <p className="font-semibold">{request.request_type}</p>
          </div>
          <div>
            <p className="text-gray-500">Created At</p>
            <p>{new Date(request.created_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Last Updated</p>
            <p>{new Date(request.updated_at).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Workflow Timeline */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="font-semibold text-lg mb-6">Workflow Timeline</h2>
        <div className="flex items-center justify-between">
          {WORKFLOW_STATES.map((state, index) => (
            <div key={state} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                  ${index <= currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'}`}>
                  {index <= currentStep ? '✓' : index + 1}
                </div>
                <p className={`mt-2 text-xs font-medium ${index <= currentStep ? 'text-green-600' : 'text-gray-400'}`}>
                  {state}
                </p>
              </div>
              {index < WORKFLOW_STATES.length - 1 && (
                <div className={`flex-1 h-1 mx-2 mb-5 ${index < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Evidence */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="font-semibold text-lg mb-4">Evidence</h2>
        {request.evidence.length === 0 ? (
          <p className="text-gray-500 text-sm">No evidence yet. Job is still processing.</p>
        ) : (
          request.evidence.map((ev: Evidence) => (
            <div key={ev.id} className="border border-gray-100 rounded p-3 mb-2 bg-gray-50">
              <p className="text-sm">{ev.description}</p>
              {ev.file_url && (
                <a href={ev.file_url} className="text-blue-600 text-xs hover:underline mt-1 block">
                  Download File →
                </a>
              )}
              <p className="text-xs text-gray-400 mt-1">{new Date(ev.created_at).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>

      {/* Audit Logs */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="font-semibold text-lg mb-4">Audit Log</h2>
        {request.audit_logs.length === 0 ? (
          <p className="text-gray-500 text-sm">No audit logs yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 text-gray-500">Action</th>
                <th className="text-left p-2 text-gray-500">Performed By</th>
                <th className="text-left p-2 text-gray-500">Time</th>
              </tr>
            </thead>
            <tbody>
              {request.audit_logs.map((log: AuditLog) => (
                <tr key={log.id} className="border-b last:border-0">
                  <td className="p-2">{log.action}</td>
                  <td className="p-2 text-gray-500">{log.performed_by}</td>
                  <td className="p-2 text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}