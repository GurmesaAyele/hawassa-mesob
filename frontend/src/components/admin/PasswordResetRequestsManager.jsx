import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../../services/adminApi";
import { API_CONFIG } from "../../config/api";
import { Button, FIELD_CLASS, EmptyState } from "./AdminFields";
import { Skeleton, SkeletonTable } from "./AdminSkeleton";
import ConfirmationDialog from "./ConfirmationDialog";

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function PasswordResetRequestsManager() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [search, setSearch] = useState("");

  // Approval Modal
  const [approvingRequest, setApprovingRequest] = useState(null);
  const [customTempPassword, setCustomTempPassword] = useState("");
  const [approvingBusy, setApprovingBusy] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Rejection Modal
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectingBusy, setRejectingBusy] = useState(false);

  // Deletion Dialog
  const [deletingRequest, setDeletingRequest] = useState(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const fetchRequests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await adminApi.resetRequests.list(params);
      setRequests(res?.data || []);
    } catch (err) {
      if (!silent) setError(err.message || "Failed to load password reset requests.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchRequests(false);

    let eventSource = null;
    try {
      const streamUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VIP_DASHBOARD}/stream`;
      eventSource = new EventSource(streamUrl);
      eventSource.addEventListener("queue_update", () => {
        fetchRequests(true);
      });
    } catch {}

    const interval = setInterval(() => {
      fetchRequests(true);
    }, 6000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, [fetchRequests]);

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!approvingRequest) return;

    setApprovingBusy(true);
    setError("");
    try {
      const res = await adminApi.resetRequests.approve(
        approvingRequest.id,
        customTempPassword.trim() || null
      );

      setGeneratedResult({
        tempPassword: res.tempPassword,
        officerName: approvingRequest.name,
        officerPhone: approvingRequest.phone,
        officerEmail: approvingRequest.email,
      });

      setNotice(`Password reset approved for ${approvingRequest.name}. Temporary credentials generated.`);
      fetchRequests(true);
    } catch (err) {
      setError(err.message || "Failed to approve password reset request.");
    } finally {
      setApprovingBusy(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectingRequest) return;

    setRejectingBusy(true);
    setError("");
    try {
      await adminApi.resetRequests.reject(rejectingRequest.id, rejectionReason.trim());
      setNotice(`Password reset request for ${rejectingRequest.name} was rejected.`);
      setRejectingRequest(null);
      setRejectionReason("");
      fetchRequests(true);
    } catch (err) {
      setError(err.message || "Failed to reject request.");
    } finally {
      setRejectingBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRequest) return;
    setDeletingBusy(true);
    setError("");
    try {
      await adminApi.resetRequests.delete(deletingRequest.id);
      setNotice("Request removed from history.");
      setDeletingRequest(null);
      fetchRequests(true);
    } catch (err) {
      setError(err.message || "Failed to delete request.");
    } finally {
      setDeletingBusy(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-4">
      {/* Notices */}
      {notice && (
        <div role="status" className="border-l-4 border-emerald-600 bg-emerald-50 p-3.5 text-xs text-emerald-950 font-semibold rounded-r-xl flex items-center justify-between">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} className="text-emerald-700 hover:text-emerald-950">×</button>
        </div>
      )}

      {error && (
        <div role="alert" className="border-l-4 border-red-600 bg-red-50 p-3.5 text-xs text-red-950 font-semibold rounded-r-xl flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="text-red-700 hover:text-red-950">×</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {["PENDING", "APPROVED", "REJECTED", "COMPLETED", "all"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                statusFilter === status
                  ? "bg-[#294491] text-white shadow-2xs"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200/70"
              }`}
            >
              {status === "all" ? "All Requests" : status.charAt(0) + status.slice(1).toLowerCase()}
              {status === "PENDING" && pendingCount > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-400 px-1.5 py-0.2 text-[10px] font-black text-blue-950">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search officer name, email, phone..."
            className="w-full sm:w-64 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-900 focus:border-[#294491] focus:ring-2 focus:ring-[#294491]/20 focus:outline-none"
          />
          <Button type="button" variant="outline" onClick={() => fetchRequests(false)} className="text-xs py-1.5">
            Refresh
          </Button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-xs">
        {loading && requests.length === 0 ? (
          <SkeletonTable rows={4} columns={6} />
        ) : requests.length === 0 ? (
          <EmptyState
            title="No password reset requests found"
            description="When authorized staff officers or operators submit password reset requests from the login screen, they will appear here for supervised identity verification."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/75 text-[11px] font-bold uppercase tracking-wider text-stone-600">
                  <th className="px-4 py-3.5">Officer & Account</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Official Contact</th>
                  <th className="px-4 py-3.5">Reason & Details</th>
                  <th className="px-4 py-3.5">Date & IP</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-stone-50/60 transition-colors">
                    {/* Officer & Email */}
                    <td className="px-4 py-3.5">
                      <p className="font-extrabold text-stone-900">{req.name}</p>
                      <p className="text-[11px] text-stone-500 font-mono mt-0.5">{req.email}</p>
                      {req.institutionName && (
                        <span className="inline-block mt-1 rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-600 font-medium">
                          {req.institutionName}
                        </span>
                      )}
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide border ${
                        req.role === "SUPER_ADMIN"
                          ? "bg-purple-50 text-purple-800 border-purple-200"
                          : req.role === "OPERATOR"
                          ? "bg-blue-50 text-[#294491] border-blue-200"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200"
                      }`}>
                        {req.role.replace("_", " ")}
                      </span>
                    </td>

                    {/* Official Contact */}
                    <td className="px-4 py-3.5">
                      <p className="font-mono text-stone-900 font-medium">{req.phone || "—"}</p>
                      <p className="text-[10px] text-stone-400">Verified official number</p>
                    </td>

                    {/* Reason */}
                    <td className="px-4 py-3.5 max-w-xs">
                      <p className="text-stone-700 line-clamp-2">{req.reason || "—"}</p>
                      {req.rejectionReason && (
                        <p className="mt-1 text-[11px] text-red-600 italic">Rejection: {req.rejectionReason}</p>
                      )}
                      {req.reviewedByName && (
                        <p className="text-[10px] text-stone-400 mt-0.5">
                          Reviewed by {req.reviewedByName} on {formatDate(req.reviewedAt)}
                        </p>
                      )}
                    </td>

                    {/* Date & IP */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="text-stone-700 font-medium">{formatDate(req.createdAt)}</p>
                      {req.ipAddress && (
                        <p className="text-[10px] text-stone-400 font-mono mt-0.5">IP: {req.ipAddress}</p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${
                        req.status === "PENDING"
                          ? "bg-amber-50 text-amber-900 border-amber-300"
                          : req.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                          : req.status === "REJECTED"
                          ? "bg-red-50 text-red-900 border-red-200"
                          : "bg-blue-50 text-[#294491] border-blue-200"
                      }`}>
                        {req.status === "PENDING" && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />}
                        {req.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      {req.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="primary"
                            onClick={() => {
                              setApprovingRequest(req);
                              setCustomTempPassword("");
                              setGeneratedResult(null);
                            }}
                            className="bg-emerald-700 hover:bg-emerald-800 text-[11px] py-1 px-2.5"
                          >
                            Approve & Reset
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setRejectingRequest(req);
                              setRejectionReason("");
                            }}
                            className="text-red-700 hover:bg-red-50 text-[11px] py-1 px-2.5"
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingRequest(req)}
                          className="rounded-lg p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Purge record"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Approval Modal ─── */}
      {approvingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/65 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-stone-200/90 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-emerald-600 to-emerald-400" />
            <div className="p-6">
              <h3 className="text-lg font-extrabold text-stone-900 mb-1">
                {generatedResult ? "Temporary Access Code Issued" : "Authorize Password Reset"}
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                Officer: <strong className="text-stone-800">{approvingRequest.name}</strong> ({approvingRequest.email})
              </p>

              {generatedResult ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                    <p className="text-xs font-bold text-emerald-950 mb-1">Single-Use Temporary Password:</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <code className="rounded-lg bg-white border border-emerald-300 px-3 py-1.5 font-mono text-base font-extrabold text-emerald-800 tracking-wider">
                        {generatedResult.tempPassword}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => copyToClipboard(generatedResult.tempPassword)}
                        className="py-1 px-2 text-xs"
                      >
                        {copied ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600 space-y-1.5">
                    <p className="font-bold text-stone-900">Next Administrative Step:</p>
                    <p className="leading-relaxed">
                      Deliver this code directly to Officer {generatedResult.officerName} via phone contact (<strong>{generatedResult.officerPhone}</strong>) or in person.
                    </p>
                    <p className="text-stone-500 text-[11px]">
                      The officer will be forced to choose their own personal password immediately upon logging in.
                    </p>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => {
                        setApprovingRequest(null);
                        setGeneratedResult(null);
                      }}
                      className="bg-[#294491] hover:bg-[#1f3473]"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleApprove} className="space-y-4">
                  <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 leading-relaxed">
                    <p className="font-bold mb-0.5">Verification Checklist:</p>
                    <p>Have you confirmed Officer {approvingRequest.name}'s identity via registered phone (<strong>{approvingRequest.phone}</strong>) or in person?</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Custom Temporary Password <span className="text-stone-400 font-normal">(Optional - leave blank to auto-generate)</span>
                    </label>
                    <input
                      type="text"
                      value={customTempPassword}
                      onChange={(e) => setCustomTempPassword(e.target.value)}
                      placeholder="e.g. Leave blank to generate secure code"
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:border-[#294491] focus:ring-2 focus:ring-[#294491]/20 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <Button type="button" variant="outline" onClick={() => setApprovingRequest(null)} disabled={approvingBusy}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={approvingBusy} className="bg-emerald-700 hover:bg-emerald-800">
                      {approvingBusy ? "Approving..." : "Confirm & Generate Code"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Rejection Modal ─── */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/65 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-stone-200/90 overflow-hidden">
            <div className="h-1.5 bg-red-600" />
            <div className="p-6">
              <h3 className="text-lg font-extrabold text-stone-900 mb-1">Reject Password Reset Request</h3>
              <p className="text-xs text-stone-500 mb-4">
                Officer: <strong className="text-stone-800">{rejectingRequest.name}</strong> ({rejectingRequest.email})
              </p>

              <form onSubmit={handleReject} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Unverified requester, officer did not confirm via official phone, suspicious IP origin"
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <Button type="button" variant="outline" onClick={() => setRejectingRequest(null)} disabled={rejectingBusy}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="danger" disabled={rejectingBusy || !rejectionReason.trim()}>
                    {rejectingBusy ? "Rejecting..." : "Reject Request"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── Deletion Confirmation Dialog ─── */}
      <ConfirmationDialog
        isOpen={Boolean(deletingRequest)}
        title="Purge Request Record"
        message={`Are you sure you want to permanently delete the password reset audit record for "${deletingRequest?.name}" (${deletingRequest?.email})?`}
        confirmText={deletingBusy ? "Deleting..." : "Delete Record"}
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeletingRequest(null)}
      />
    </div>
  );
}
