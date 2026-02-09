import { useState } from "react";
import { Search, Users } from "lucide-react";
import ContactCard from "./ContactCard";

export default function ContactsView({ contacts, deals, callsByContact, notesByContact, reps, currentUser, onNewContact, onNewDeal, onAddNote, onLogCall, onAddInlineNote, onEditContact, onDeleteContact, isMobile }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const isRepOnly = currentUser.role === "rep";

  const filtered = contacts.filter(c => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.company.toLowerCase().includes(q) && !(c.email || "").toLowerCase().includes(q)) return false;
    }
    if (ownerFilter !== "all" && c.owner !== ownerFilter) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    return true;
  });

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
        </div>
      </div>

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
