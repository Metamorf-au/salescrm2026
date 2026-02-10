import { useState } from "react";
import { Phone, Target, CheckCircle, Calendar, UserPlus, Send, Activity, AlertTriangle, Bell, Briefcase } from "lucide-react";
import { DAILY_TARGET, WEEKLY_TARGET, outcomeConfig, activityTypeConfig, noteTypeConfig, stageConfig } from "../shared/constants";
import { formatReminderDate, formatCurrency, isOverdue } from "../shared/formatters";

export default function RepView({ currentUser, contacts, deals, notesByContact, activityLog, rawCalls, onLogCall, onNewDeal, onAddNote, onNewContact, isMobile }) {
  // Persist checked to-dos in localStorage per user
  const storageKey = `crm_todos_${currentUser.id}`;
  const [checkedTodos, setCheckedTodos] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch { return {}; }
  });

  function toggleTodo(uid) {
    setCheckedTodos(prev => {
      const next = { ...prev, [uid]: !prev[uid] };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  // Compute KPIs from real data
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  const dayOfWeek = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const myCalls = rawCalls.filter(c => c.callerId === currentUser.id);
  const callsToday = myCalls.filter(c => new Date(c.calledAt) >= todayStart).length;
  const callsWeek = myCalls.filter(c => new Date(c.calledAt) >= weekStart).length;
  const meetingsSet = myCalls.filter(c => c.outcome === "meeting" && new Date(c.calledAt) >= weekStart).length;
  const newContactsCount = contacts.filter(c => c.ownerId === currentUser.id && c.createdAt && new Date(c.createdAt) >= weekStart).length;
  const quotesSent = deals.filter(d => d.quoteSentAt && d.ownerId === currentUser.id).length;

  const dailyPct = Math.min((callsToday / DAILY_TARGET) * 100, 100);
  const weeklyPct = Math.min((callsWeek / WEEKLY_TARGET) * 100, 100);

  // Build to-do list from follow_up/meeting notes + deal next dates
  const myTodos = [];
  for (const [contactId, notes] of Object.entries(notesByContact)) {
    const contact = contacts.find(c => String(c.id) === String(contactId));
    if (!contact) continue;
    for (const note of notes) {
      if (note.type === "follow_up" || note.type === "meeting") {
        myTodos.push({ ...note, uid: `${contactId}-${note.id}`, contactName: contact.name, company: contact.company, contactId });
      }
    }
  }
  // Add active deals with next dates as to-dos
  const myActiveDeals = deals.filter(d => d.ownerId === currentUser.id && d.nextDate && !["won", "lost", "closed"].includes(d.stage));
  for (const deal of myActiveDeals) {
    myTodos.push({
      uid: `deal-${deal.id}`,
      type: "deal",
      contactName: deal.contact,
      company: deal.company,
      text: `${deal.title}${deal.nextAction ? ` – ${deal.nextAction}` : ""}`,
      reminder: deal.nextDate,
      dealValue: deal.value,
      dealStage: deal.stage,
    });
  }

  const completedTodos = myTodos.filter(t => checkedTodos[t.uid]).length;
  const crmCompliance = myTodos.length > 0 ? Math.round((completedTodos / myTodos.length) * 100) : (activityLog.length > 0 ? 100 : 0);

  const userName = currentUser.name.split(" ")[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
        <div>
          <h1 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-slate-800`}>{(() => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; })()}, {userName}</h1>
          <p className="text-slate-500 mt-0.5 text-sm">{new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <div className={`${isMobile ? "grid grid-cols-2" : "flex items-center"} gap-2`}>
          <button onClick={onAddNote} className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl shadow-md transition text-sm">New Note</button>
          <button onClick={onNewDeal} className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-md transition text-sm">New Deal</button>
          <button onClick={onNewContact} className="px-4 py-2.5 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-xl shadow-md transition text-sm">New Contact</button>
          <button onClick={onLogCall} className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl shadow-md transition text-sm">Log Call</button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className={`grid ${isMobile ? "grid-cols-2" : "grid-cols-6"} gap-3`}>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-2 mb-2"><Phone size={14} className="text-sky-500" /><span className="text-xs font-medium text-slate-500">Daily Calls</span></div>
          <p className="text-xl font-bold text-slate-800">{callsToday}<span className="text-sm font-normal text-slate-400"> / {DAILY_TARGET}</span></p>
          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden mt-2">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${dailyPct}%`, background: dailyPct >= 100 ? "#16a34a" : dailyPct >= 75 ? "#d97706" : "#0ea5e9" }} />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-2 mb-2"><Target size={14} className="text-amber-500" /><span className="text-xs font-medium text-slate-500">Weekly Calls</span></div>
          <p className="text-xl font-bold text-slate-800">{callsWeek}<span className="text-sm font-normal text-slate-400"> / {WEEKLY_TARGET}</span></p>
          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden mt-2">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${weeklyPct}%`, background: weeklyPct >= 100 ? "#16a34a" : weeklyPct >= 75 ? "#d97706" : "#0ea5e9" }} />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-2 mb-2"><CheckCircle size={14} className="text-emerald-500" /><span className="text-xs font-medium text-slate-500">CRM Compliance</span></div>
          <p className="text-xl font-bold text-slate-800">{crmCompliance}<span className="text-sm font-normal text-slate-400">%</span></p>
          <p className="text-xs text-slate-400 mt-1">{crmCompliance >= 90 ? "On track" : "Needs attention"}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-2 mb-2"><Calendar size={14} className="text-violet-500" /><span className="text-xs font-medium text-slate-500">Meetings Set</span></div>
          <p className="text-xl font-bold text-slate-800">{meetingsSet}</p>
          <p className="text-xs text-slate-400 mt-1">This week</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-2 mb-2"><UserPlus size={14} className="text-sky-500" /><span className="text-xs font-medium text-slate-500">New Contacts</span></div>
          <p className="text-xl font-bold text-slate-800">{newContactsCount}</p>
          <p className="text-xs text-slate-400 mt-1">This week</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-2 mb-2"><Send size={14} className="text-amber-500" /><span className="text-xs font-medium text-slate-500">Quotes Sent</span></div>
          <p className="text-xl font-bold text-slate-800">{quotesSent}</p>
          <p className="text-xs text-slate-400 mt-1">Total</p>
        </div>
      </div>

      {/* To-Do's & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* My To-Do's */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-slate-400" />
            <h2 className="text-base font-semibold text-slate-700">My To-Do's</h2>
            <span className="ml-auto text-xs font-medium text-slate-400 bg-stone-100 px-2 py-0.5 rounded-full">{myTodos.length}</span>
          </div>
          {myTodos.length > 0 ? (
            <div className="space-y-2">
              {myTodos.map(todo => {
                const isDeal = todo.type === "deal";
                const ntc = isDeal ? null : noteTypeConfig(todo.type);
                const sc = isDeal ? stageConfig(todo.dealStage) : null;
                const done = checkedTodos[todo.uid];
                const overdue = !done && isOverdue(todo.reminder);
                return (
                  <div key={todo.uid} onClick={() => toggleTodo(todo.uid)}
                    className={`bg-white rounded-xl border p-4 hover:shadow-md transition cursor-pointer group ${overdue ? "border-red-300 bg-red-50/40" : "border-stone-200"} ${done ? "opacity-60" : ""}`}>
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${done ? "bg-emerald-500 border-emerald-500" : overdue ? "border-red-400 group-hover:border-red-500" : "border-stone-300 group-hover:border-amber-400"}`}>
                        {done && <CheckCircle size={14} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-semibold text-slate-800 ${done ? "line-through text-slate-400" : ""}`}>{todo.contactName}</p>
                          {isDeal ? (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${sc.bg} ${sc.text}`}>{sc.label}</span>
                          ) : (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${ntc.bg} ${ntc.text}`}>{ntc.label}</span>
                          )}
                          {overdue && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-600">Overdue</span>}
                        </div>
                        <p className={`text-sm text-slate-500 ${done ? "line-through" : ""}`}>{todo.company}</p>
                        <p className={`text-sm mt-1.5 ${done ? "line-through text-slate-400" : "text-slate-600"}`}>{todo.text}</p>

                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {todo.reminder && (
                          <span className={`flex items-center gap-1 text-xs font-medium whitespace-nowrap ${overdue ? "text-red-500" : "text-amber-500"}`}>
                            {overdue ? <AlertTriangle size={13} /> : <Bell size={13} />}{formatReminderDate(todo.reminder)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200 p-6 text-center">
              <p className="text-sm text-slate-400">No to-do's right now. Add a Follow-up, Meeting note, or set a Next Date on a deal to see it here.</p>
            </div>
          )}
        </div>

        {/* Today's Activity */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-slate-400" />
            <h2 className="text-base font-semibold text-slate-700">Today's Activity</h2>
            <span className="ml-auto text-xs font-medium text-slate-400 bg-stone-100 px-2 py-0.5 rounded-full">{activityLog.length}</span>
          </div>
          {activityLog.length > 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
              {activityLog.map(c => {
                const atc = c.activityType !== "call" ? activityTypeConfig(c.activityType) : null;
                const oc = c.activityType === "call" ? outcomeConfig(c.outcome) : null;
                const cfg = atc || oc;
                if (!cfg) return null;
                const Icon = cfg.icon;
                return (
                  <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={15} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-800 truncate">{c.contact}{c.company ? ` - ${c.company}` : ""}</p>
                        {atc && <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{c.summary}</p>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{c.time}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200 p-6 text-center">
              <p className="text-sm text-slate-400">No activity yet today. Log a call, add a contact, or create a deal to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-base font-semibold text-slate-700">Weekly Summary</h3>
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">Due Friday</span>
        </div>
        <textarea placeholder="Highlights, challenges, and plan for next week..." rows={3}
          className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none mb-3" />
        <div className="flex justify-start">
          <button className="py-2.5 px-8 rounded-xl font-medium text-white bg-amber-500 hover:bg-amber-600 transition text-sm shadow-md">
            Submit Weekly Summary
          </button>
        </div>
      </div>
    </div>
  );
}
