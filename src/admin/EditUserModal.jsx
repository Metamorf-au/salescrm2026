import { useState } from "react";
import Modal from "../shared/Modal";
import SuccessScreen from "../shared/SuccessScreen";
import { callAdminFn } from "./adminApi";

export default function EditUserModal({ user, onClose, currentUser }) {
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [role, setRole] = useState(user.role || "rep");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const emailChanged = email !== user.email;
  const isSelf = user.id === currentUser?.id;

  async function handleSave() {
    setError("");
    setSaving(true);

    const updates = { userId: user.id };
    if (name !== user.name) updates.name = name;
    if (emailChanged) updates.email = email;
    if (role !== user.role) updates.role = role;
    if (phone !== (user.phone || "")) updates.phone = phone;

    if (Object.keys(updates).length <= 1) {
      // Only userId, no actual changes
      onClose();
      return;
    }

    try {
      await callAdminFn("update-user", updates);
      setSaved(true);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  return (
    <Modal title="Edit User" onClose={onClose}>
      {saved ? (
        <SuccessScreen message="User Updated" sub={`${name} has been updated.${emailChanged ? " A confirmation email has been sent to the new address." : ""}`} />
      ) : (
        <div className="px-6 py-5 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Full Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sarah Mitchell"
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Email *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. sarah.m@thepg.com.au"
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
            {emailChanged && (
              <p className="text-xs text-amber-600 mt-1.5">A confirmation email will be sent to the new address.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 0412 345 678"
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Role *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "rep", label: "Rep", color: "border-sky-400 bg-sky-50 text-sky-700" },
                { key: "manager", label: "Manager", color: "border-violet-400 bg-violet-50 text-violet-700" },
                { key: "admin", label: "Admin", color: "border-amber-400 bg-amber-50 text-amber-700" },
              ].map(r => (
                <button key={r.key} onClick={() => !isSelf || r.key === "admin" ? setRole(r.key) : null}
                  disabled={isSelf && r.key !== "admin"}
                  className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition
                    ${role === r.key ? r.color : "border-stone-200 bg-white text-slate-500 hover:border-stone-300"}
                    ${isSelf && r.key !== "admin" ? "opacity-40 cursor-not-allowed" : ""}`}>
                  {r.label}
                </button>
              ))}
            </div>
            {isSelf && <p className="text-xs text-slate-400 mt-1.5">You cannot change your own role.</p>}
          </div>
          <button onClick={handleSave} disabled={!name || !email || saving}
            className="w-full py-3 rounded-xl font-semibold text-white transition bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </Modal>
  );
}
