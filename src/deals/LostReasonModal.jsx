import { useState } from "react";
import Modal from "../shared/Modal";
import SuccessScreen from "../shared/SuccessScreen";
import { LOST_REASONS } from "../shared/constants";
import { formatCurrency } from "../shared/formatters";

export default function LostReasonModal({ deal, onSave, onClose }) {
  const [reason, setReason] = useState("");
  const [otherText, setOtherText] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!reason) return;
    setError("");
    setSaving(true);
    try {
      await onSave(deal, reason, otherText);
      setSaved(true);
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  return (
    <Modal title="Mark Deal as Lost" onClose={onClose}>
      {saved ? (
        <SuccessScreen message="Deal Marked as Lost" sub={`"${deal.title}" has been moved to Lost.`} />
      ) : (
        <div className="px-6 py-5 space-y-5 overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
          {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
          <div className="bg-rose-50 rounded-xl border border-rose-200 p-4">
            <p className="text-sm font-semibold text-slate-800">{deal.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{deal.contact} – {deal.company}</p>
            <p className="text-base font-bold text-slate-800 mt-2">{formatCurrency(deal.value)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Why was this deal lost?</label>
            <div className="grid grid-cols-2 gap-2">
              {LOST_REASONS.map(r => (
                <button key={r.key} onClick={() => setReason(r.key)}
                  className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition
                    ${reason === r.key ? "border-rose-400 bg-rose-50 text-rose-700" : "border-stone-200 bg-white text-slate-500 hover:border-stone-300"}`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          {reason === "other" && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Details</label>
              <input type="text" value={otherText} onChange={e => setOtherText(e.target.value)} placeholder="Please specify..."
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
            </div>
          )}
          <button onClick={handleSave} disabled={!reason || saving}
            className="w-full py-3 rounded-xl font-semibold text-white transition bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed">
            {saving ? "Saving..." : "Confirm Lost"}
          </button>
        </div>
      )}
    </Modal>
  );
}
