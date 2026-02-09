import { useState } from "react";
import Modal from "../shared/Modal";
import SuccessScreen from "../shared/SuccessScreen";
import { NOTE_TYPES, REMINDER_PRESETS } from "../shared/constants";
import { getReminderDate, formatReminderDate } from "../shared/formatters";
import { Bell } from "lucide-react";

export default function QuickNoteModal({ contacts, currentUser, onSave, onClose }) {
  const [contactId, setContactId] = useState("");
  const [type, setType] = useState("general");
  const [text, setText] = useState("");
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderPreset, setReminderPreset] = useState("");
  const [reminderCustom, setReminderCustom] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function getReminder() {
    if (!reminderOn) return null;
    if (reminderCustom) return reminderCustom;
    if (reminderPreset) return getReminderDate(reminderPreset).toISOString();
    return null;
  }

  async function handleSave() {
    if (!contactId || !text.trim()) return;
    setError("");
    setSaving(true);
    try {
      await onSave({
        contactId: Number(contactId),
        type,
        text: text.trim(),
        reminderAt: getReminder(),
      });
      setSaved(true);
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  return (
    <Modal title="Quick Note" onClose={onClose}>
      {saved ? (
        <SuccessScreen message="Note Added" sub="Your note has been saved." />
      ) : (
        <div className="px-6 py-5 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
          {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Contact *</label>
            <select value={contactId} onChange={e => setContactId(e.target.value)}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent">
              <option value="">Select contact...</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name} – {c.company}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Type</label>
            <div className="flex flex-wrap gap-1.5">
              {NOTE_TYPES.map(t => (
                <button key={t.key} onClick={() => setType(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition
                    ${type === t.key ? `${t.bg} ${t.text} border-current` : "bg-white text-slate-400 border-stone-200 hover:border-stone-300"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Note *</label>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={3} placeholder="Write your note..."
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button onClick={() => { setReminderOn(!reminderOn); if (reminderOn) { setReminderPreset(""); setReminderCustom(""); } }}
                className={`w-8 h-5 rounded-full transition-colors flex items-center ${reminderOn ? "bg-amber-500 justify-end" : "bg-stone-300 justify-start"}`}>
                <div className="w-4 h-4 bg-white rounded-full shadow mx-0.5" />
              </button>
              <Bell size={13} className={reminderOn ? "text-amber-500" : "text-slate-400"} />
              <span className="text-xs text-slate-500">Remind me</span>
            </div>
            {reminderOn && (
              <div className="flex flex-wrap items-center gap-1.5">
                {REMINDER_PRESETS.map(p => (
                  <button key={p.key} onClick={() => { setReminderPreset(p.key); setReminderCustom(""); }}
                    className={`px-2 py-1 rounded text-[10px] font-medium border transition
                      ${reminderPreset === p.key && !reminderCustom ? "bg-amber-100 text-amber-700 border-amber-300" : "bg-white text-slate-500 border-stone-200 hover:border-stone-300"}`}>
                    {p.label}
                  </button>
                ))}
                <input type="date" value={reminderCustom} onChange={e => { setReminderCustom(e.target.value); setReminderPreset(""); }}
                  className="px-2 py-1 bg-stone-50 border border-stone-200 rounded text-slate-800 text-[10px] focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
                {getReminder() && (
                  <span className="text-[10px] text-amber-600 flex items-center gap-1"><Bell size={10} />{formatReminderDate(getReminder())}</span>
                )}
              </div>
            )}
          </div>
          <button onClick={handleSave} disabled={!contactId || !text.trim() || saving}
            className="w-full py-3 rounded-xl font-semibold text-white transition bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed">
            {saving ? "Saving..." : "Save Note"}
          </button>
        </div>
      )}
    </Modal>
  );
}
