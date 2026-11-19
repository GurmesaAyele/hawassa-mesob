import { useState } from "react";
import { adminApi } from "../../services/adminApi";
import { Button } from "./AdminFields";

export default function PasswordResetRequestModal({ isOpen, onClose }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("STAFF");
  const [phone, setPhone] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [reason, setReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError("Please complete all required fields (Name, Email, Phone).");
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.requestPasswordReset({
        name: name.trim(),
        email: email.trim(),
        role,
        phone: phone.trim(),
        institutionName: institutionName.trim() || null,
        reason: reason.trim() || "Forgotten password",
      });

      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Unable to submit password reset request. Please check your network connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setName("");
    setEmail("");
    setRole("STAFF");
    setPhone("");
    setInstitutionName("");
    setReason("");
    setError("");
    setSubmitted(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/65 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-stone-200/90 overflow-hidden">
        {/* Government Gold & Blue Accent Bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#294491] via-[#3d5fb8] to-[#d9a83f]" />

        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#294491]">Identity & Security Desk</p>
              <h3 id="reset-modal-title" className="text-xl font-extrabold tracking-tight text-stone-900">
                Request Password Reset
              </h3>
            </div>
            <button
              type="button"
              onClick={handleResetForm}
              className="rounded-lg p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              aria-label="Close modal"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {submitted ? (
            <div className="space-y-4 py-2">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mb-3 shadow-2xs">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-base font-extrabold text-emerald-950">Reset Request Dispatched</h4>
                <p className="mt-1.5 text-xs text-emerald-900/90 leading-relaxed max-w-md mx-auto">
                  Your password reset request has been logged and forwarded directly to the Super Administrator.
                </p>
              </div>

              <div className="rounded-xl border border-stone-200/80 bg-stone-50 p-4 text-xs text-stone-600 space-y-2">
                <p className="font-bold text-stone-900 flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-[#294491]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Anti-Hijacking Security Protection:</span>
                </p>
                <p className="leading-relaxed">
                  To protect public records from mailbox takeover attacks, reset links are never sent via email. Your supervisor will verify your identity via your registered contact (<strong>{phone}</strong>) or in person at the Hawassa Mesob Center and issue an authorized temporary access code.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="button" variant="primary" onClick={handleResetForm} className="bg-[#294491] hover:bg-[#1f3473]">
                  Return to Sign In
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Security Banner */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-[11px] text-[#1c3270] leading-relaxed flex items-start gap-2.5">
                <svg className="h-4 w-4 text-[#294491] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span className="font-bold">Supervised Identity Verification: </span>
                  For municipal security compliance, reset requests are manually verified by the Super Administrator to prevent unauthorized resets through compromised personal mailboxes.
                </div>
              </div>

              {error && (
                <div role="alert" className="rounded-xl border-l-4 border-red-600 bg-red-50 p-3 text-xs text-red-900 font-medium">
                  {error}
                </div>
              )}

              {/* Full Name & Official Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Abebe Bikila"
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:border-[#294491] focus:ring-2 focus:ring-[#294491]/20 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Official Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@hawassamesobcenter.et"
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:border-[#294491] focus:ring-2 focus:ring-[#294491]/20 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Role & Official Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Assigned Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:border-[#294491] focus:ring-2 focus:ring-[#294491]/20 focus:outline-none transition-all font-medium"
                  >
                    <option value="STAFF">Service Staff Officer</option>
                    <option value="OPERATOR">Operations Desk Officer</option>
                    <option value="SUPER_ADMIN">Super Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Official Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+251 91 123 4567"
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:border-[#294491] focus:ring-2 focus:ring-[#294491]/20 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Institution / Department */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Department / Assigned Institution <span className="text-stone-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="e.g. Commercial Bank of Ethiopia (CBE) Desk"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:border-[#294491] focus:ring-2 focus:ring-[#294491]/20 focus:outline-none transition-all"
                />
              </div>

              {/* Reason / Notes */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Reason for Request <span className="text-stone-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Password forgotten, workstation locked"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:border-[#294491] focus:ring-2 focus:ring-[#294491]/20 focus:outline-none transition-all resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button type="button" variant="outline" onClick={handleResetForm} disabled={submitting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                  className="bg-[#294491] hover:bg-[#1f3473]"
                >
                  {submitting ? "Submitting request..." : "Submit Reset Request"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
