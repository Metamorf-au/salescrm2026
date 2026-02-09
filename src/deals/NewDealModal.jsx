import { useState } from "react";
import Modal from "../shared/Modal";
import SuccessScreen from "../shared/SuccessScreen";

export default function NewDealModal({ contacts, currentUser, defaultContact, onSave, onClose }) {
  const [title, setTitle] = useState("");
  const [contactId, setContactId] = useState(defaultContact ? String(defaultContact) : "");
  const [stage, setStage] = useState("discovery");
  const [value, setValue] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const stages = [
    { key: "discovery", label: "Discovery", color: "border-sky-400 bg-sky-50 text-sky-700" },
    { key: "quote_request", label: "Quote Request", color: "border-violet-400 bg-violet-50 text-violet-700" },
    { key: "quote_sent", label: "Quote Sent", color: "border-amber-400 bg-amber-50 text-amber-700" },
  ];

  async function handleSave() {
    if (!title.trim() || !contactId) return;
    setError("");
    setSaving(true);
    try {
      const selectedContact = contacts.find(c => String(c.id) === contactId);
      await onSave({
        title: title.trim(),
        contactId: Number(contactId),
        companyId: selectedContact?.companyId || null,
        stage,
        value: Number(value) || 0,
        nextAction: nextAction.trim() || null,
        nextDate: nextDate || null,
        quoteRequestedAt: stage === "quote_request" ? new Date().toISOString() : null,
        quoteSentAt: stage === "quote_sent" ? new Date().toISOString() : null,
      });
      setSaved(true);
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  return (
    <Modal title="New Deal" onClose={onClose}>
      {saved ? (
        <SuccessScreen message="Deal Created" sub={`"${title}" has been added to the pipeline.`} />
      ) : (
        <div className="px-6 py-5 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
          {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Deal Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Bulk supply agreement"
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Contact *</label>
            <select value={contactId} onChange={e => setContactId(e.target.value)}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent">
              <option value="">Select contact...</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name} – {c.company}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Stage</label>
            <div className="grid grid-cols-3 gap-2">
              {stages.map(s => (
                <button key={s.key} onClick={() => setStage(s.key)}
                  className={`px-3 py-2.5 rounded-xl border-2 text-xs font-medium transition
                    ${stage === s.key ? s.color : "border-stone-200 bg-white text-slate-500 hover:border-stone-300"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Value ($)</label>
            <input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="0"
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Next Action</label>
            <input type="text" value={nextAction} onChange={e => setNextAction(e.target.value)} placeholder="e.g. Send quote by Friday"
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Next Date</label>
            <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
          </div>
          <button onClick={handleSave} disabled={!title.trim() || !contactId || saving}
            className="w-full py-3 rounded-xl font-semibold text-white transition bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed">
            {saving ? "Creating..." : "Create Deal"}
          </button>
        </div>
      )}
    </Modal>
  );
}
