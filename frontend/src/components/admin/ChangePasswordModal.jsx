import { useState } from "react";
import { adminApi } from "../../services/adminApi";
import { Button } from "./AdminFields";

export default function ChangePasswordModal({ isOpen, onClose, onSuccess, forced = false }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  // Validation rules
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const complexityCount = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
  const isFormValid =
    currentPassword.trim().length > 0 &&
    hasMinLength &&
    complexityCount >= 3 &&
    passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isFormValid) {
      if (!passwordsMatch) {
        setError("New passwords do not match.");
        return;
      }
      if (!hasMinLength) {
        setError("New password must be at least 8 characters long.");
        return;
      }
      if (complexityCount < 3) {
        setError("New password must satisfy at least 3 complexity requirements.");
        return;
      }
      setError("Please fill all required fields correctly.");
      return;
    }

    setSaving(true);
    try {
      await adminApi.changePassword({
        currentPassword,
        newPassword,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || "Failed to update password. Please verify your current password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-stone-200/90 overflow-hidden">
        {/* Brand Accent Bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#294491] via-[#3d5fb8] to-[#d9a83f]" />

        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#294491]">
                {forced ? "Mandatory Identity Verification" : "Account Security"}
              </p>
              <h3 id="change-password-title" className="text-xl font-extrabold tracking-tight text-stone-900">
                {forced ? "Set Personal Password" : "Change Account Password"}
              </h3>
            </div>
            {!forced && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                aria-label="Close modal"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {forced && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">Security Notice: </span>
              You have authenticated using an administrative temporary code. Government access policy requires you to set your own private password before proceeding to the console.
            </div>
          )}

          {error && (
            <div role="alert" className="mb-4 rounded-xl border-l-4 border-red-600 bg-red-50 p-3 text-xs text-red-900 font-medium">
              {error}
            </div>
          )}

          {success && (
            <div role="status" className="mb-4 rounded-xl border-l-4 border-emerald-600 bg-emerald-50 p-3 text-xs text-emerald-900 font-bold flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Password successfully updated! Closing...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Current Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current or temporary password"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs text-stone-900 pr-10 focus:border-[#294491] focus:ring-2 focus:ring-[#294491]/20 focus:outline-none transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  aria-label={showCurrent ? "Hide password" : "Show password"}
                >
                  {showCurrent ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create a strong new password"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs text-stone-900 pr-10 focus:border-[#294491] focus:ring-2 focus:ring-[#294491]/20 focus:outline-none transition-all"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  aria-label={showNew ? "Hide password" : "Show password"}
                >
                  {showNew ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type your new password"
                  className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs text-stone-900 pr-10 focus:outline-none transition-all ${
                    confirmPassword && !passwordsMatch
                      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                      : "border-stone-300 focus:border-[#294491] focus:ring-2 focus:ring-[#294491]/20"
                  }`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Requirements Checklist */}
            <div className="rounded-xl border border-stone-100 bg-stone-50 p-3 space-y-1.5 text-[11px]">
              <p className="font-bold text-stone-600 mb-1">Password Requirements (NIST SP 800-63B):</p>
              <div className="grid grid-cols-2 gap-1.5 text-stone-500">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-700 font-semibold" : ""}`}>
                  <span>{hasMinLength ? "✓" : "○"}</span>
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper ? "text-emerald-700 font-semibold" : ""}`}>
                  <span>{hasUpper ? "✓" : "○"}</span>
                  <span>Uppercase (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLower ? "text-emerald-700 font-semibold" : ""}`}>
                  <span>{hasLower ? "✓" : "○"}</span>
                  <span>Lowercase (a-z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasDigit || hasSpecial ? "text-emerald-700 font-semibold" : ""}`}>
                  <span>{hasDigit || hasSpecial ? "✓" : "○"}</span>
                  <span>Number or symbol</span>
                </div>
              </div>
              <div className={`flex items-center gap-1.5 pt-1 border-t border-stone-200/60 ${passwordsMatch ? "text-emerald-700 font-semibold" : "text-stone-500"}`}>
                <span>{passwordsMatch ? "✓" : "○"}</span>
                <span>Passwords match</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              {!forced && (
                <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                variant="primary"
                disabled={saving || !isFormValid}
                className="bg-[#294491] hover:bg-[#1f3473]"
              >
                {saving ? "Updating password..." : "Update Password"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
