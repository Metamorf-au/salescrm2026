import { useState } from "react";
import Modal from "../shared/Modal";
import { DEFAULT_KPI_TARGETS } from "../shared/constants";
import { upsertKpiTargets } from "../supabaseData";
import { Phone, Calendar, UserPlus, Send } from "lucide-react";

const KPI_FIELDS = [
  { key: "weeklyCalls", dbKey: "weekly_calls", label: "Weekly Calls", icon: Phone, accent: "text-sky-600", bg: "bg-sky-50" },
  { key: "weeklyMeetings", dbKey: "weekly_meetings", label: "Weekly Meetings", icon: Calendar, accent: "text-violet-600", bg: "bg-violet-50" },
  { key: "weeklyContacts", dbKey: "weekly_contacts", label: "Weekly Contacts", icon: UserPlus, accent: "text-sky-600", bg: "bg-sky-50" },
  { key: "weeklyQuotes", dbKey: "weekly_quotes", label: "Weekly Quotes", icon: Send, accent: "text-amber-600", bg: "bg-amber-50" },
];

export default function EditKPIModal({ user, targets, onClose, onSaved }) {
  const defaults = {
    weeklyCalls: DEFAULT_KPI_TARGETS.weekly_calls,
    weeklyMeetings: DEFAULT_KPI_TARGETS.weekly_meetings,
    weeklyContacts: DEFAULT_KPI_TARGETS.weekly_contacts,
    weeklyQuotes: DEFAULT_KPI_TARGETS.weekly_quotes,
  };
  const current = targets || defaults;

  const [form, setForm] = useState({
    weeklyCalls: current.weeklyCalls,
    weeklyMeetings: current.weeklyMeetings,
    weeklyContacts: current.weeklyContacts,
    weeklyQuotes: current.weeklyQuotes,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(key, value) {
    const num = parseInt(value, 10);
    setForm(prev => ({ ...prev, [key]: isNaN(num) ? 0 : Math.max(0, num) }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await upsertKpiTargets(user.id, form);
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  return (
    <Modal title={`KPI Targets – ${user.name}`} onClose={onClose}>
      <div className="px-6 py-5 space-y-4">
        {error && (
          <div className="px-4 py-3 rounded-xl text-sm font-medium bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {KPI_FIELDS.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.key} className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${f.bg}`}>
                    <Icon size={14} className={f.accent} />
                  </div>
                  {f.label}
                </label>
                <input
                  type="number"
                  min="0"
                  value={form[f.key]}
                  onChange={e => handleChange(f.key, e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-400">These are weekly targets. Daily call target is automatically calculated as weekly calls / 5.</p>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} disabled={saving}
            className="flex-1 py-3 rounded-xl font-semibold text-slate-700 bg-stone-100 hover:bg-stone-200 transition disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-xl font-semibold text-white bg-amber-500 hover:bg-amber-600 transition disabled:opacity-50 shadow-md">
            {saving ? "Saving..." : "Save Targets"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
