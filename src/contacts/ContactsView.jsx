import { useState } from "react";
import { Search, Users, Trash2, UserCog, CheckSquare, Clock } from "lucide-react";
import ContactCard from "./ContactCard";

export default function ContactsView({ contacts, deals, callsByContact, notesByContact, reps, currentUser, onNewContact, onNewDeal, onAddNote, onLogCall, onAddInlineNote, onEditContact, onDeleteContact, onBulkDelete, onBulkReassign, isMobile }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [activityFilter, setActivityFilter] = useState("all");
  const [bulkAction, setBulkAction] = useState(null); // "delete" | "reassign"
  const [reassignTo, setReassignTo] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  const isRepOnly = currentUser.role === "rep";

  const now = new Date();
  const filtered = contacts.filter(c => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.company.toLowerCase().includes(q) && !(c.email || "").toLowerCase().includes(q)) return false;
    }
    if (ownerFilter !== "all" && c.owner !== ownerFilter) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (activityFilter !== "all") {
      const raw = c.lastContactRaw ? new Date(c.lastContactRaw) : null;
      const daysSince = raw ? Math.floor((now - raw) / 86400000) : Infinity;
      if (activityFilter === "never" && raw) return false;
      if (activityFilter === "30" && daysSince <= 30) return false;
      if (activityFilter === "60" && daysSince <= 60) return false;
      if (activityFilter === "90" && daysSince <= 90) return false;
    }
    return true;
  }).sort((a, b) => {
    if (activityFilter !== "all") {
      const aDate = a.lastContactRaw ? new Date(a.lastContactRaw).getTime() : 0;
      const bDate = b.lastContactRaw ? new Date(b.lastContactRaw).getTime() : 0;
      return aDate - bDate; // oldest first
    }
    return 0;
  });

  const filteredIds = new Set(filtered.map(c => c.id));
  const visibleSelectedCount = [...selectedIds].filter(id => filteredIds.has(id)).length;
  const allVisibleSelected = filtered.length > 0 && visibleSelectedCount === filtered.length;

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      // Deselect all visible
      setSelectedIds(prev => {
        const next = new Set(prev);
        filtered.forEach(c => next.delete(c.id));
        return next;
      });
    } else {
      // Select all visible
      setSelectedIds(prev => {
        const next = new Set(prev);
        filtered.forEach(c => next.add(c.id));
        return next;
      });
    }
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setBulkAction(null);
    setReassignTo("");
  }

  async function handleBulkDelete() {
    setBulkLoading(true);
    try {
      const ids = [...selectedIds];
      const selected = contacts.filter(c => selectedIds.has(c.id));
      await onBulkDelete(ids, selected);
      clearSelection();
    } catch (err) {
      console.error(err);
    }
    setBulkLoading(false);
  }

  async function handleBulkReassign() {
    if (!reassignTo) return;
    setBulkLoading(true);
    try {
      const ids = [...selectedIds];
      const rep = reps.find(r => r.id === reassignTo);
      await onBulkReassign(ids, reassignTo, rep?.name || "");
      clearSelection();
    } catch (err) {
      console.error(err);
    }
    setBulkLoading(false);
  }

  return (
    <div className={`max-w-6xl mx-auto ${isMobile ? "space-y-4" : "space-y-6"}`}>
      {/* Header */}
      <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
        <div>
          <h1 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-slate-800`}>Contacts</h1>
          <p className="text-slate-500 mt-0.5 text-sm">{contacts.length} contacts in database</p>
        </div>
        <div className={`${isMobile ? "grid grid-cols-2" : "flex items-center"} gap-2`}>
          <button onClick={onAddNote}
            className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl shadow-md transition text-sm">
            New Note
          </button>
          <button onClick={onNewDeal}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-md transition text-sm">
            New Deal
          </button>
          <button onClick={onNewContact}
            className="px-4 py-2.5 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-xl shadow-md transition text-sm">
            New Contact
          </button>
          <button onClick={onLogCall}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl shadow-md transition text-sm">
            Log Call
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={isMobile ? "space-y-2" : "flex items-center gap-3"}>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search contacts or companies..."
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
        </div>
        <div className="flex gap-2">
          {!isRepOnly && (
            <select value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)}
              className={`${isMobile ? "flex-1" : ""} px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent`}>
              <option value="all">All Owners</option>
              {reps.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
            </select>
          )}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className={`${isMobile ? "flex-1" : ""} px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent`}>
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="new">New</option>
            <option value="stale">Stale</option>
          </select>
          <select value={activityFilter} onChange={e => setActivityFilter(e.target.value)}
            className={`${isMobile ? "flex-1" : ""} px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent`}>
            <option value="all">Last Activity</option>
            <option value="never">No activity ever</option>
            <option value="30">No activity 30+ days</option>
            <option value="60">No activity 60+ days</option>
            <option value="90">No activity 90+ days</option>
          </select>
        </div>
      </div>

      {/* Select All + Bulk Actions */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={toggleSelectAll}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${allVisibleSelected ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-white border-stone-200 text-slate-500 hover:border-stone-300"}`}>
              <CheckSquare size={14} />
              {allVisibleSelected ? "Deselect All" : "Select All"}
            </button>
            {selectedIds.size > 0 && (
              <span className="text-xs text-slate-500">{selectedIds.size} selected</span>
            )}
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              {!bulkAction && (
                <>
                  {!isRepOnly && (
                    <button onClick={() => setBulkAction("reassign")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-medium text-slate-600 hover:border-sky-400 hover:text-sky-600 transition">
                      <UserCog size={13} /> Change Owner
                    </button>
                  )}
                  <button onClick={() => setBulkAction("delete")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-medium text-rose-600 hover:border-rose-400 hover:bg-rose-50 transition">
                    <Trash2 size={13} /> Delete
                  </button>
                </>
              )}

              {bulkAction === "delete" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-600 font-medium">Delete {selectedIds.size} contact{selectedIds.size > 1 ? "s" : ""}?</span>
                  <button onClick={handleBulkDelete} disabled={bulkLoading}
                    className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50">
                    {bulkLoading ? "Deleting..." : "Confirm"}
                  </button>
                  <button onClick={() => setBulkAction(null)} disabled={bulkLoading}
                    className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-stone-50 transition disabled:opacity-50">
                    Cancel
                  </button>
                </div>
              )}

              {bulkAction === "reassign" && (
                <div className="flex items-center gap-2">
                  <select value={reassignTo} onChange={e => setReassignTo(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent">
                    <option value="">Assign to...</option>
                    {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <button onClick={handleBulkReassign} disabled={bulkLoading || !reassignTo}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50">
                    {bulkLoading ? "Saving..." : "Confirm"}
                  </button>
                  <button onClick={() => { setBulkAction(null); setReassignTo(""); }} disabled={bulkLoading}
                    className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-stone-50 transition disabled:opacity-50">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Contact List */}
      <div className="space-y-2">
        {filtered.map(c => {
          const contactDeals = deals.filter(d => d.contactId === c.id);
          const contactCalls = callsByContact[c.id] || [];
          const contactNotes = notesByContact[c.id] || [];
          return (
            <ContactCard
              key={c.id}
              contact={c}
              deals={contactDeals}
              calls={contactCalls}
              notes={contactNotes}
              isExpanded={expandedId === c.id}
              onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
              onNewDeal={onNewDeal}
              onAddNote={onAddInlineNote}
              onEdit={onEditContact}
              onDelete={onDeleteContact}
              isSelected={selectedIds.has(c.id)}
              onSelect={toggleSelect}
              isMobile={isMobile}
            />
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Users size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No contacts match your filters</p>
          </div>
        )}
      </div>

    </div>
  );
}
