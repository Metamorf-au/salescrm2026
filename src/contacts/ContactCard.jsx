import { useState } from "react";
import { Phone, Mail, MapPin, User, Building2, Briefcase, StickyNote, ArrowRight, Bell, Pencil, Trash2 } from "lucide-react";
import { contactStatusStyle, outcomeConfig, stageConfig, noteTypeConfig, NOTE_TYPES, REMINDER_PRESETS } from "../shared/constants";
import { formatCurrency, formatReminderDate, getReminderDate, isOverdue } from "../shared/formatters";
import Modal from "../shared/Modal";

export default function ContactCard({ contact, deals, calls, notes, isExpanded, onToggle, onNewDeal, onAddNote, onEdit, onDelete, isSelected, onSelect, isMobile }) {
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState("general");
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderPreset, setReminderPreset] = useState("");
  const [reminderCustom, setReminderCustom] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const cs = contactStatusStyle(contact.status);

  function getInlineReminder() {
    if (!reminderOn) return null;
    if (reminderCustom) return reminderCustom;
    if (reminderPreset) return getReminderDate(reminderPreset).toISOString().split("T")[0];
    return null;
  }

  function handleSubmitNote() {
    if (!noteText.trim()) return;
    const reminder = getInlineReminder();
    onAddNote({
      contactId: contact.id,
      type: noteType,
      text: noteText.trim(),
      reminderAt: reminder,
    });
    setNoteText("");
    setNoteType("general");
    setReminderOn(false);
    setReminderPreset("");
    setReminderCustom("");
  }

  return (
    <div className={`bg-white rounded-xl border overflow-hidden transition-all ${isExpanded ? "border-amber-400 ring-1 ring-amber-200" : "border-stone-200"}`}>
      {/* Collapsed Tile */}
      <div className={`${isMobile ? "p-4" : "px-4 py-3"} cursor-pointer hover:bg-stone-50 transition`} onClick={onToggle}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <input type="checkbox" checked={isSelected} onChange={(e) => { e.stopPropagation(); onSelect(contact.id); }}
              onClick={e => e.stopPropagation()}
              className="mt-2.5 w-4 h-4 rounded border-stone-300 text-amber-500 focus:ring-amber-400 cursor-pointer flex-shrink-0" />
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
              {contact.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-800">{contact.name}</p>
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${cs.dot}`} />
                  <span className="text-xs text-slate-500">{cs.label}</span>
                </div>
              </div>
              <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                <Building2 size={13} /> {contact.company}
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-400 flex-shrink-0">
            {isMobile ? (
              <>
                <p>Last contact:</p>
                <p>{contact.lastContact}</p>
              </>
            ) : (
              <p>Last contact: {contact.lastContact}</p>
            )}
            {deals.length > 0 && <p className="mt-1 font-medium text-amber-600">{deals.length} deal{deals.length > 1 ? "s" : ""}</p>}
          </div>
        </div>
        {isMobile ? (
          <div className="flex items-end gap-3 mt-2">
            <div className="grid grid-cols-1 gap-1.5 flex-1 text-xs text-slate-500">
              <a href={`tel:${contact.phone || contact.mobile}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-slate-500 hover:text-amber-600 underline decoration-slate-300 hover:decoration-amber-400 transition"><Phone size={12} /> {contact.phone || contact.mobile}</a>
              <a href={`mailto:${contact.email}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-slate-500 hover:text-amber-600 underline decoration-slate-300 hover:decoration-amber-400 transition"><Mail size={12} /> {contact.email}</a>
              <span className="flex items-center gap-1"><MapPin size={12} /> {contact.location}</span>
              <span className="flex items-center gap-1"><User size={12} /> {contact.owner}</span>
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button onClick={(e) => { e.stopPropagation(); onEdit(contact); }}
                className="flex items-center justify-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-500 bg-white border border-stone-200 rounded-lg hover:border-amber-400 hover:text-amber-600 transition">
                <Pencil size={11} /> Edit
              </button>
              <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                className="flex items-center justify-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-500 bg-white border border-stone-200 rounded-lg hover:border-rose-400 hover:bg-rose-50 transition">
                <Trash2 size={11} /> Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <a href={`tel:${contact.phone || contact.mobile}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-slate-500 hover:text-amber-600 underline decoration-slate-300 hover:decoration-amber-400 transition"><Phone size={12} /> {contact.phone || contact.mobile}</a>
              <span className="text-stone-300">·</span>
              <a href={`mailto:${contact.email}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-slate-500 hover:text-amber-600 underline decoration-slate-300 hover:decoration-amber-400 transition"><Mail size={12} /> {contact.email}</a>
              <span className="text-stone-300">·</span>
              <span className="flex items-center gap-1"><MapPin size={12} /> {contact.location}</span>
              <span className="text-stone-300">·</span>
              <span className="flex items-center gap-1"><User size={12} /> {contact.owner}</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
              <button onClick={(e) => { e.stopPropagation(); onEdit(contact); }}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-500 bg-white border border-stone-200 rounded-lg hover:border-amber-400 hover:text-amber-600 transition">
                <Pencil size={11} /> Edit
              </button>
              <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-500 bg-white border border-stone-200 rounded-lg hover:border-rose-400 hover:bg-rose-50 transition">
                <Trash2 size={11} /> Delete
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal title="Delete Contact" onClose={() => setShowDeleteConfirm(false)}>
          <div className="px-6 py-5">
            <p className="text-sm text-slate-700 mb-4">
              Are you sure you want to delete <strong>{contact.name}</strong>? This will also remove all their calls and notes. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-stone-200 hover:bg-stone-50 transition disabled:opacity-50">
                Cancel
              </button>
              <button onClick={async () => {
                  setDeleting(true);
                  try { await onDelete(contact.id, contact.name, contact.company); }
                  catch (err) { console.error(err); }
                  setDeleting(false);
                  setShowDeleteConfirm(false);
                }}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 transition disabled:opacity-50">
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Expanded Section */}
      {isExpanded && (
        <div className="border-t border-amber-200 bg-stone-50/60">
          {/* Recent Calls */}
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <Phone size={15} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700">Recent Calls</h3>
              <span className="text-xs text-slate-400 bg-stone-200 px-1.5 py-0.5 rounded-full">{calls.length}</span>
            </div>
            {calls.length > 0 ? (
              <div className="space-y-1.5">
                {calls.map(call => {
                  const oc = outcomeConfig(call.outcome);
                  const Icon = oc.icon;
                  return (
                    <div key={call.id} className="bg-white rounded-lg border border-stone-200 px-3 py-2.5 flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-md ${oc.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon size={13} className={oc.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700">{call.summary}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{call.date} · {call.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-2">No calls recorded yet</p>
            )}
          </div>

          {/* Notes */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <StickyNote size={15} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700">Notes</h3>
              <span className="text-xs text-slate-400 bg-stone-200 px-1.5 py-0.5 rounded-full">{notes.length}</span>
            </div>
            {/* Add Note Input */}
            <div className="space-y-2 mb-2">
              <div className="flex flex-wrap gap-1" onClick={e => e.stopPropagation()}>
                {NOTE_TYPES.map(t => (
                  <button key={t.key} onClick={() => setNoteType(t.key)}
                    className={`px-2 py-1 rounded text-[10px] font-medium border transition
                      ${noteType === t.key ? `${t.bg} ${t.text} border-current` : "bg-white text-slate-400 border-stone-200 hover:border-stone-300"}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSubmitNote(); }}
                  onClick={e => e.stopPropagation()}
                  placeholder="Add a note..."
                  className="flex-1 px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
                <button onClick={e => { e.stopPropagation(); handleSubmitNote(); }}
                  disabled={!noteText.trim()}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed">
                  Add Note
                </button>
              </div>
              {/* Inline Reminder */}
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <button onClick={() => { setReminderOn(!reminderOn); if (reminderOn) { setReminderPreset(""); setReminderCustom(""); } }}
                  className={`w-8 h-5 rounded-full transition-colors flex items-center ${reminderOn ? "bg-amber-500 justify-end" : "bg-stone-300 justify-start"}`}>
                  <div className="w-4 h-4 bg-white rounded-full shadow mx-0.5" />
                </button>
                <Bell size={13} className={reminderOn ? "text-amber-500" : "text-slate-400"} />
                <span className="text-xs text-slate-500">Remind me</span>
              </div>
              {reminderOn && (
                <div className="flex flex-wrap items-center gap-1.5" onClick={e => e.stopPropagation()}>
                  {REMINDER_PRESETS.map(p => (
                    <button key={p.key} onClick={() => { setReminderPreset(p.key); setReminderCustom(""); }}
                      className={`px-2 py-1 rounded text-[10px] font-medium border transition
                        ${reminderPreset === p.key && !reminderCustom ? "bg-amber-100 text-amber-700 border-amber-300" : "bg-white text-slate-500 border-stone-200 hover:border-stone-300"}`}>
                      {p.label}
                    </button>
                  ))}
                  <input type="date" value={reminderCustom} onChange={e => { setReminderCustom(e.target.value); setReminderPreset(""); }}
                    className="px-2 py-1 bg-stone-50 border border-stone-200 rounded text-slate-800 text-[10px] focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
                  {getInlineReminder() && (
                    <span className="text-[10px] text-amber-600 flex items-center gap-1"><Bell size={10} />{formatReminderDate(getInlineReminder())}</span>
                  )}
                </div>
              )}
            </div>
            {notes.length > 0 ? (
              <div className="space-y-1.5">
                {notes.map(note => {
                  const ntc = noteTypeConfig(note.type);
                  return (
                    <div key={note.id} className="bg-white rounded-lg border border-stone-200 px-3 py-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${ntc.bg} ${ntc.text}`}>{ntc.label}</span>
                        {note.reminder && (
                          <span className="flex items-center gap-1 text-[10px] text-amber-500 font-medium">
                            <Bell size={10} />{formatReminderDate(note.reminder)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700">{note.text}</p>
                      <p className="text-xs text-slate-400 mt-1">{note.date} · {note.author}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-1">No notes yet – add one above</p>
            )}
          </div>

          {/* Deals */}
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Briefcase size={15} className="text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">Deals</h3>
                <span className="text-xs text-slate-400 bg-stone-200 px-1.5 py-0.5 rounded-full">{deals.length}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onNewDeal(contact.id); }}
                className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition">
                Add Deal
              </button>
            </div>
            {deals.length > 0 ? (
              <div className="space-y-1.5">
                {deals.map(d => {
                  const sc = stageConfig(d.stage);
                  return (
                    <div key={d.id} className="bg-white rounded-lg border border-stone-200 p-3">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-semibold text-slate-800">{d.title}</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>{sc.label}</span>
                      </div>
                      <p className="text-base font-bold text-slate-800">{formatCurrency(d.value)}</p>
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
                        <ArrowRight size={12} />
                        <span>{d.nextAction}</span>
                        <span className="ml-auto text-slate-400">{d.nextDate}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 bg-white rounded-lg border border-stone-200 border-dashed text-slate-400">
                <Briefcase size={18} className="mx-auto mb-1 opacity-50" />
                <p className="text-xs">No deals yet – use Add Deal above</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
