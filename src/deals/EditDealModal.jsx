import { useState } from "react";
import { ArrowRight } from "lucide-react";
import Modal from "../shared/Modal";
import SuccessScreen from "../shared/SuccessScreen";
import { formatCurrency } from "../shared/formatters";

const ACTIVE_STAGES = [
  { key: "discovery", label: "Discovery", color: "border-sky-400 bg-sky-50 text-sky-700", next: "quote_request", nextLabel: "Quote Request" },
  { key: "quote_request", label: "Quote Request", color: "border-violet-400 bg-violet-50 text-violet-700", next: "quote_sent", nextLabel: "Quote Sent" },
  { key: "quote_sent", label: "Quote Sent", color: "border-amber-400 bg-amber-50 text-amber-700", next: null, nextLabel: null },
];

export default function EditDealModal({ deal, onSave, onClose }) {
  const [title, setTitle] = useState(deal.title);
  const [value, setValue] = useState(String(deal.value || ""));
  const [nextAction, setNextAction] = useState(deal.nextAction || "");
  const [nextDate, setNextDate] = useState(deal.nextDate || "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const currentStage = ACTIVE_STAGES.find(s => s.key === deal.stage);
  const canAdvance = currentStage?.next;

  async function handleSave(advanceStage) {
    if (!title.trim()) return;
    setError("");
    setSaving(true);
    try {
      const updates = {
        title: title.trim(),
        value: Number(value) || 0,
        nextAction: nextAction.trim() || null,
        nextDate: nextDate || null,
      };
      if (advanceStage && currentStage?.next) {
        updates.stage = currentStage.next;
        if (currentStage.next === "quote_request") {
          updates.quoteRequestedAt = new Date().toISOString();
        } else if (currentStage.next === "quote_sent") {
          updates.quoteSentAt = new Date().toISOString();
        }
      }
      await onSave(deal, updates);
      setSaved(true);
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  const successMsg = saved && "Deal Updated";

  return (
    <Modal title="Edit Deal" onClose={onClose}>
      {saved ? (
        <SuccessScreen message={successMsg} sub={`"${title}" has been updated.`} />
      ) : (
        <div className="px-6 py-5 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
          {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

          {/* Current stage indicator */}
          {currentStage && (
            <div className={`px-3 py-2 rounded-xl border-2 text-center text-xs font-medium ${currentStage.color}`}>
              Current Stage: {currentStage.label}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Deal Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Bulk supply agreement"
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
          </div>

          {/* Contact & company (read-only) */}
          <div className="bg-stone-50 rounded-xl border border-stone-200 px-3 py-2.5">
            <p className="text-sm text-slate-700 font-medium">{deal.contact}</p>
            <p className="text-xs text-slate-500">{deal.company}</p>
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

          {/* Action buttons */}
          <div className="space-y-2 pt-1">
            <button onClick={() => handleSave(false)} disabled={!title.trim() || saving}
              className="w-full py-3 rounded-xl font-semibold text-white transition bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed">
              {saving ? "Saving..." : "Save Changes"}
            </button>

            {canAdvance && (
              <button onClick={() => handleSave(true)} disabled={!title.trim() || saving}
                className="w-full py-3 rounded-xl font-semibold text-white transition bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <ArrowRight size={16} />
                {saving ? "Saving..." : `Save & Advance to ${currentStage.nextLabel}`}
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
