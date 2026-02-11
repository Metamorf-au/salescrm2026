import { useState } from "react";
import Modal from "../shared/Modal";
import SuccessScreen from "../shared/SuccessScreen";
import { outcomeConfig } from "../shared/constants";
import { Phone, Calendar, MessageSquare, XCircle, FileText } from "lucide-react";

export default function CallLogModal({ contacts, currentUser, onSave, onClose }) {
  const [contact, setContact] = useState("");
  const [outcome, setOutcome] = useState("connected");
  const [summary, setSummary] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingNote, setMeetingNote] = useState("");
  const [quoteRequested, setQuoteRequested] = useState(false);
  const [nextStep, setNextStep] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const outcomes = [
    { key: "connected", label: "Connected", icon: Phone },
    { key: "voicemail", label: "Voicemail", icon: MessageSquare },
    { key: "no_answer", label: "No Answer", icon: XCircle },
    { key: "meeting", label: "Meeting Set", icon: Calendar },
  ];

  async function handleSave() {
    if (!contact) return;
    setError("");
    setSaving(true);
    try {
      await onSave({
        contactId: Number(contact),
        outcome,
        summary,
        quoteRequested,
        meetingDate: outcome === "meeting" ? meetingDate : null,
        meetingTime: outcome === "meeting" ? meetingTime : null,
        meetingNote: outcome === "meeting" ? meetingNote : null,
        nextStep,
        nextDate,
      });
      setSaved(true);
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  return (
    <Modal title="Log Call" onClose={onClose}>
      {saved ? (
        <SuccessScreen message="Call Logged" sub={`Outcome: ${outcomeConfig(outcome).label}`} />
      ) : (
        <div className="px-6 py-5 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
          {error && <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Contact *</label>
            <select value={contact} onChange={e => setContact(e.target.value)}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent">
              <option value="">Select contact...</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name} – {c.company}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Outcome</label>
            <div className="grid grid-cols-2 gap-2">
              {outcomes.map(o => {
                const Icon = o.icon;
                return (
                  <button key={o.key} onClick={() => setOutcome(o.key)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition
                      ${outcome === o.key ? "border-amber-400 bg-amber-50 text-amber-700" : "border-stone-200 bg-white text-slate-500 hover:border-stone-300"}`}>
                    <Icon size={15} />{o.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Summary</label>
            <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={2} placeholder="What happened on this call?"
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none" />
          </div>
          <button type="button" onClick={() => setQuoteRequested(q => !q)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition
              ${quoteRequested ? "border-violet-400 bg-violet-50" : "border-stone-200 bg-stone-50 hover:border-stone-300"}`}>
            <span className="flex items-center gap-2.5">
              <FileText size={16} className={quoteRequested ? "text-violet-600" : "text-slate-400"} />
              <span className={`text-sm font-medium ${quoteRequested ? "text-violet-700" : "text-slate-500"}`}>Quote Requested</span>
            </span>
            <div className={`w-9 h-5 rounded-full transition-colors relative ${quoteRequested ? "bg-violet-500" : "bg-stone-300"}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${quoteRequested ? "left-[18px]" : "left-0.5"}`} />
            </div>
          </button>
          {outcome === "meeting" && (
            <div className="bg-violet-50 rounded-xl border border-violet-200 p-4 space-y-3">
              <p className="text-sm font-semibold text-violet-700">Meeting Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                  <input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Time</label>
                  <input type="time" value={meetingTime} onChange={e => setMeetingTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Meeting Note</label>
                <input type="text" value={meetingNote} onChange={e => setMeetingNote(e.target.value)} placeholder="e.g. Demo with 3 attendees"
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
              </div>
            </div>
          )}
          <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 space-y-3">
            <p className="text-sm font-medium text-slate-600">Next Step (optional)</p>
            <input type="text" value={nextStep} onChange={e => setNextStep(e.target.value)} placeholder="e.g. Send follow-up email"
              className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
            <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
          </div>
          <button onClick={handleSave} disabled={!contact || saving}
            className="w-full py-3 rounded-xl font-semibold text-white transition bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed">
            {saving ? "Saving..." : "Save Call"}
          </button>
        </div>
      )}
    </Modal>
  );
}
