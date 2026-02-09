import { useState } from "react";
import Modal from "../shared/Modal";
import SuccessScreen from "../shared/SuccessScreen";
import { stageConfig } from "../shared/constants";
import { formatCurrency } from "../shared/formatters";

export default function CloseDealModal({ deal, onSave, onClose }) {
  const [reason, setReason] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      await onSave(deal, reason);
      setSaved(true);
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  return (
    <Modal title="Void Deal" onClose={onClose}>
      {saved ? (
        <SuccessScreen message="Deal Voided" sub={`"${deal.title}" has been moved to voided deals.`} />
      ) : (
        <div className="px-6 py-5 space-y-5 overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
          {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-800">{deal.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{deal.contact} – {deal.company}</p>
            <p className="text-base font-bold text-slate-800 mt-2">{formatCurrency(deal.value)}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stageConfig(deal.stage).bg} ${stageConfig(deal.stage).text}`}>
                {stageConfig(deal.stage).label}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-3">This deal will be moved to voided deals where it can be filtered and re-evaluated at a later date.</p>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Reason for voiding (optional)</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
              placeholder="e.g. Budget freeze, contact left company, revisit Q3..."
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none" />
          </div>
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3 rounded-xl font-semibold text-white transition bg-slate-600 hover:bg-slate-700 disabled:opacity-40">
            {saving ? "Saving..." : "Void Deal"}
          </button>
        </div>
      )}
    </Modal>
  );
}
