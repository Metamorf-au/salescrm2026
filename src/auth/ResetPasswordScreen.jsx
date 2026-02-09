import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Target, CheckCircle } from "lucide-react";

export default function ResetPasswordScreen({ onDone }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) { setError(updateError.message); setSaving(false); return; }
    setSuccess(true);
    setTimeout(() => onDone(), 2000);
  }

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif" }} className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
            <Target size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Precision</h1>
          <p className="text-slate-400 text-sm mt-1">Set New Password</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          {success ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={24} className="text-emerald-600" />
              </div>
              <p className="text-lg font-semibold text-slate-800">Password Updated</p>
              <p className="text-sm text-slate-500 mt-1">Redirecting to your dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                  placeholder="Minimum 8 characters"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                  placeholder="Re-enter your password"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
              </div>
              {error && (
                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
              )}
              <button type="submit" disabled={saving}
                className="w-full py-3 rounded-xl font-semibold text-white transition bg-amber-500 hover:bg-amber-600 disabled:opacity-50">
                {saving ? "Updating..." : "Set New Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
