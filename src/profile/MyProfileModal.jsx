import { useState } from "react";
import { supabase } from "../supabaseClient";
import Modal from "../shared/Modal";
import SuccessScreen from "../shared/SuccessScreen";

export default function MyProfileModal({ currentUser, onClose, onProfileUpdate }) {
  const [name, setName] = useState(currentUser.name || "");
  const [email, setEmail] = useState(currentUser.email || "");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("details"); // "details" | "password"

  const emailChanged = email !== currentUser.email;

  async function handleSaveDetails() {
    setError("");
    setSaving(true);

    try {
      // Update name in profiles table
      if (name !== currentUser.name) {
        const { error: profileErr } = await supabase
          .from("profiles")
          .update({ name })
          .eq("id", currentUser.id);
        if (profileErr) throw new Error(profileErr.message);
      }

      // Update email via Supabase Auth (triggers confirmation email)
      if (emailChanged) {
        const { error: emailErr } = await supabase.auth.updateUser({ email });
        if (emailErr) throw new Error(emailErr.message);
      }

      setSaved(true);
      if (onProfileUpdate) onProfileUpdate();
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  async function handleChangePassword() {
    setError("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSaving(true);
    try {
      // Verify current password by re-authenticating
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: currentPassword,
      });
      if (signInErr) throw new Error("Current password is incorrect");

      // Update to new password
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
      if (updateErr) throw new Error(updateErr.message);

      setSaved(true);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  return (
    <Modal title="My Profile" onClose={onClose}>
      {saved ? (
        <SuccessScreen message={activeTab === "details" ? "Profile Updated" : "Password Changed"}
          sub={activeTab === "details" && emailChanged ? `Check ${email} for a confirmation link to complete the email change.` : "Your changes have been saved."} />
      ) : (
        <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
          {/* Tabs */}
          <div className="flex border-b border-stone-200">
            <button onClick={() => { setActiveTab("details"); setError(""); }}
              className={`flex-1 py-3 text-sm font-medium transition ${activeTab === "details" ? "text-amber-600 border-b-2 border-amber-500" : "text-slate-400 hover:text-slate-600"}`}>
              Details
            </button>
            <button onClick={() => { setActiveTab("password"); setError(""); }}
              className={`flex-1 py-3 text-sm font-medium transition ${activeTab === "password" ? "text-amber-600 border-b-2 border-amber-500" : "text-slate-400 hover:text-slate-600"}`}>
              Change Password
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            {error && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
            )}

            {activeTab === "details" ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Full Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
                  {emailChanged && (
                    <p className="text-xs text-amber-600 mt-1.5">A confirmation email will be sent to verify the new address.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Role</label>
                  <div className="px-3 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-slate-500 text-sm">
                    {currentUser.role === "admin" ? "Administrator" : currentUser.role === "manager" ? "Sales Manager" : "Sales Representative"}
                    <span className="text-xs text-slate-400 ml-2">(contact admin to change)</span>
                  </div>
                </div>
                <button onClick={handleSaveDetails} disabled={!name || !email || saving}
                  className="w-full py-3 rounded-xl font-semibold text-white transition bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Current Password</label>
                  <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">New Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Confirm New Password</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
                </div>
                <button onClick={handleChangePassword} disabled={!currentPassword || !newPassword || !confirmPassword || saving}
                  className="w-full py-3 rounded-xl font-semibold text-white transition bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed">
                  {saving ? "Changing..." : "Change Password"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
