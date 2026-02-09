import { useState } from "react";
import Modal from "../shared/Modal";
import SuccessScreen from "../shared/SuccessScreen";
import { callAdminFn } from "./adminApi";

export default function AddUserModal({ onClose }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("rep");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      await callAdminFn("invite", {
        email,
        name: `${firstName} ${lastName}`.trim(),
        role,
        phone,
      });
      setSaved(true);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  return (
    <Modal title="Add User" onClose={onClose}>
      {saved ? (
        <SuccessScreen message="User Created" sub={`${firstName} ${lastName} has been added. Invite email sent to ${email}.`} />
      ) : (
        <div className="px-6 py-5 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">First Name *</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="e.g. Sarah"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Last Name *</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="e.g. Mitchell"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Email *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. sarah.m@thepg.com.au"
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
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
                <button key={r.key} onClick={() => setRole(r.key)}
                  className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition
                    ${role === r.key ? r.color : "border-stone-200 bg-white text-slate-500 hover:border-stone-300"}`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 py-1 px-1">
            <div className="w-10 h-6 rounded-full bg-amber-500 flex items-center justify-end cursor-default">
              <div className="w-5 h-5 bg-white rounded-full shadow mx-0.5" />
            </div>
            <div>
              <span className="text-sm font-medium text-slate-700">Send invite email</span>
              <p className="text-xs text-slate-400">User will receive a link to set their password</p>
            </div>
          </div>
          <button onClick={handleSave} disabled={!firstName || !lastName || !email || saving}
            className="w-full py-3 rounded-xl font-semibold text-white transition bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed">
            {saving ? "Creating..." : "Create User"}
          </button>
        </div>
      )}
    </Modal>
  );
}
