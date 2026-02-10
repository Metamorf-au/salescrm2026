import { useState, useEffect, useRef } from "react";
import { Phone, Target, CheckCircle, Calendar, UserPlus, Send, Activity, AlertTriangle, Bell, Briefcase, ChevronDown, Trash2, Filter } from "lucide-react";
import { DAILY_TARGET, WEEKLY_TARGET, activityTypeConfig, noteTypeConfig, stageConfig } from "../shared/constants";
import { formatReminderDate, isOverdue } from "../shared/formatters";

const TODO_FILTERS = [
  { key: "today", label: "Due Today", days: 0 },
  { key: "3days", label: "Next 3 Days", days: 3 },
  { key: "7days", label: "Next 7 Days", days: 7 },
  { key: "14days", label: "Next 14 Days", days: 14 },
  { key: "overdue", label: "Overdue", days: -1 },
];

const ACTIVITY_FILTERS = [
  { key: "today", label: "Today", days: 0 },
  { key: "yesterday", label: "Yesterday", days: 1 },
  { key: "3days", label: "Last 3 Days", days: 3 },
  { key: "7days", label: "Last 7 Days", days: 7 },
  { key: "14days", label: "Last 14 Days", days: 14 },
];

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export default function RepView({ currentUser, contacts, deals, notesByContact, activityLog, rawCalls, onLogCall, onNewDeal, onAddNote, onNewContact, onCompleteTodo, onClearCompleted, isMobile }) {
  // localStorage keys for this user
  const dealDoneKey = `crm_todo_deals_${currentUser.id}`;
  const clearedKey = `crm_todo_cleared_${currentUser.id}`;

  // Deal completion tracking (localStorage with timestamps)
  const [completedDeals, setCompletedDeals] = useState(() => {
    try { return JSON.parse(localStorage.getItem(dealDoneKey) || "{}"); } catch { return {}; }
  });

  // Timestamp of last "Clear Done" click
  const [lastCleared, setLastCleared] = useState(() => {
    try { return Number(localStorage.getItem(clearedKey)) || 0; } catch { return 0; }
  });

  const [todoFilter, setTodoFilter] = useState("3days");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activityFilter, setActivityFilter] = useState("3days");
  const [showActivityDropdown, setShowActivityDropdown] = useState(false);

  // Auto-expire deal to-dos older than 14 days (on mount)
  const hasAutoExpired = useRef(false);
  useEffect(() => {
    if (hasAutoExpired.current) return;
    hasAutoExpired.current = true;
    const nowMs = Date.now();
    const expired = [];
    const remaining = {};
    for (const [uid, ts] of Object.entries(completedDeals)) {
      if (nowMs - ts > FOURTEEN_DAYS_MS) {
        expired.push(uid);
      } else {
        remaining[uid] = ts;
      }
    }
    if (expired.length > 0) {
      // Find matching deal todos to commit to DB
      const expiredDealTodos = myActiveDealsRef.current
        .filter(d => expired.includes(`deal-${d.id}`))
        .map(d => ({ type: "deal", dealId: d.id }));
      if (expiredDealTodos.length > 0 && onClearCompleted) {
        onClearCompleted(expiredDealTodos);
      }
      setCompletedDeals(remaining);
      localStorage.setItem(dealDoneKey, JSON.stringify(remaining));
    }
  }, []);

  // Compute KPIs from real data
  const now = new Date();
  const nowMs = Date.now();
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
        if (note.completedAt) {
          const completedTime = new Date(note.completedAt).getTime();
          // Auto-expire: skip notes completed > 14 days ago
          if (nowMs - completedTime > FOURTEEN_DAYS_MS) continue;
          // Skip notes that were completed before last "Clear Done"
          if (completedTime <= lastCleared) continue;
        }
        const todo = { ...note, uid: `${contactId}-${note.id}`, noteId: note.id, contactName: contact.name, company: contact.company, contactId };
        if (note.completedAt) todo.dbCompleted = true;
        myTodos.push(todo);
      }
    }
  }

  // Active deals with next dates as to-dos
  const myActiveDeals = deals.filter(d => d.ownerId === currentUser.id && d.nextDate && !["won", "lost", "closed"].includes(d.stage));
  const myActiveDealsRef = useRef(myActiveDeals);
  myActiveDealsRef.current = myActiveDeals;

  for (const deal of myActiveDeals) {
    myTodos.push({
      uid: `deal-${deal.id}`,
      dealId: deal.id,
      type: "deal",
      contactName: deal.contact,
      company: deal.company,
      text: `${deal.title}${deal.nextAction ? ` – ${deal.nextAction}` : ""}`,
      reminder: deal.nextDate,
      dealStage: deal.stage,
    });
  }

  // Completion check: notes use DB completedAt, deals use localStorage
  function isCompleted(todo) {
    if (todo.dbCompleted) return true;
    if (todo.type === "deal") return !!completedDeals[todo.uid];
    return false;
  }

  // Filter to-dos based on selected filter
  function filterTodos(todos, filterKey) {
    return todos.filter(todo => {
      const done = isCompleted(todo);
      // Always show completed items (they get removed on "Clear Done")
      if (done) return true;

      const reminderDate = todo.reminder ? new Date(todo.reminder) : null;
      const overdueItem = reminderDate && reminderDate < todayStart;

      if (filterKey === "overdue") {
        return overdueItem;
      }

      // For forward-looking filters, always include overdue items
      if (overdueItem) return true;

      if (!reminderDate) {
        return true;
      }

      const filterDef = TODO_FILTERS.find(f => f.key === filterKey);
      const cutoff = new Date(todayStart);
      cutoff.setDate(cutoff.getDate() + filterDef.days + 1);

      return reminderDate < cutoff;
    });
  }

  const filteredTodos = filterTodos(myTodos, todoFilter);

  // Sort: overdue first, then by date ascending, completed last
  filteredTodos.sort((a, b) => {
    const aDone = isCompleted(a) ? 1 : 0;
    const bDone = isCompleted(b) ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    const aDate = a.reminder ? new Date(a.reminder) : new Date("9999-12-31");
    const bDate = b.reminder ? new Date(b.reminder) : new Date("9999-12-31");
    return aDate - bDate;
  });

  const pendingCount = myTodos.filter(t => !isCompleted(t)).length;
  const completedCount = myTodos.filter(t => isCompleted(t)).length;

  // CRM compliance based on all todos
  const totalTodos = myTodos.length;
  const crmCompliance = totalTodos > 0 ? Math.round((completedCount / totalTodos) * 100) : (activityLog.length > 0 ? 100 : 0);

  function handleToggleTodo(todo) {
    if (isCompleted(todo)) return;
    if (todo.type === "deal") {
      // Store deal completion in localStorage with timestamp
      const next = { ...completedDeals, [todo.uid]: Date.now() };
      setCompletedDeals(next);
      localStorage.setItem(dealDoneKey, JSON.stringify(next));
    }
    // Notes: completed_at written to DB by AppShell handler
    if (onCompleteTodo) onCompleteTodo(todo);
  }

  function handleClearCompleted() {
    // Collect deal todos that need DB writes
    const dealTodosToCommit = myTodos.filter(t => t.type === "deal" && completedDeals[t.uid]);

    // Set lastCleared timestamp to hide completed notes
    const clearedTs = Date.now();
    setLastCleared(clearedTs);
    localStorage.setItem(clearedKey, String(clearedTs));

    // Clear deal completions from localStorage
    setCompletedDeals({});
    localStorage.setItem(dealDoneKey, "{}");

    // Commit deal fields to DB + reload
    if (onClearCompleted) onClearCompleted(dealTodosToCommit);
  }

  const activeFilter = TODO_FILTERS.find(f => f.key === todoFilter);
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
          <div className="flex items-center gap-2 flex-wrap">
            <CheckCircle size={18} className="text-slate-400" />
            <h2 className="text-base font-semibold text-slate-700">My To-Do's</h2>
            {pendingCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full min-w-[24px] text-center shadow-sm animate-pulse">
                {pendingCount}
              </span>
            )}
            {pendingCount === 0 && myTodos.length > 0 && (
              <span className="bg-emerald-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full min-w-[24px] text-center">
                0
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              {completedCount > 0 && (
                <button onClick={handleClearCompleted}
                  className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-500 transition px-2 py-1 rounded-lg hover:bg-red-50">
                  <Trash2 size={12} />Clear Done
                </button>
              )}
              {/* Filter dropdown */}
              <div className="relative">
                <button onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-stone-100 hover:bg-stone-200 px-2.5 py-1.5 rounded-lg transition">
                  <Filter size={12} />{activeFilter.label}<ChevronDown size={12} />
                </button>
                {showFilterDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowFilterDropdown(false)} />
                    <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl border border-stone-200 shadow-lg z-20 py-1 overflow-hidden">
                      {TODO_FILTERS.map(f => (
                        <button key={f.key} onClick={() => { setTodoFilter(f.key); setShowFilterDropdown(false); }}
                          className={`w-full text-left px-3 py-2 text-xs font-medium transition ${todoFilter === f.key ? "bg-amber-50 text-amber-700" : "text-slate-600 hover:bg-stone-50"}`}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          {filteredTodos.length > 0 ? (
            <div className="space-y-2">
              {filteredTodos.map(todo => {
                const isDeal = todo.type === "deal";
                const ntc = isDeal ? null : noteTypeConfig(todo.type);
                const sc = isDeal ? stageConfig(todo.dealStage) : null;
                const done = isCompleted(todo);
                const overdue = !done && isOverdue(todo.reminder);
                return (
                  <div key={todo.uid}
                    className={`bg-white rounded-xl border p-4 transition group ${overdue ? "border-red-300 bg-red-50/40" : "border-stone-200"} ${done ? "opacity-60" : ""}`}>
                    <div className="flex items-start gap-3">
                      <button type="button" onClick={() => handleToggleTodo(todo)}
                        className={`mt-0.5 w-8 h-8 -m-1.5 rounded-lg flex items-center justify-center flex-shrink-0 transition ${done ? "" : "cursor-pointer hover:bg-stone-100 active:bg-stone-200"}`}
                        disabled={done}>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${done ? "bg-emerald-500 border-emerald-500" : overdue ? "border-red-400 group-hover:border-red-500" : "border-stone-300 group-hover:border-amber-400"}`}>
                          {done && <CheckCircle size={14} className="text-white" />}
                        </div>
                      </button>
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
              <p className="text-sm text-slate-400">
                {todoFilter === "overdue" ? "No overdue to-do's. Nice work!" : "No to-do's for this period. Add a Follow-up, Meeting note, or set a Next Date on a deal to see it here."}
              </p>
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div className="space-y-4">
          {(() => {
            // Filter activity log by selected date range
            const activeActivityFilter = ACTIVITY_FILTERS.find(f => f.key === activityFilter);
            const filteredActivity = activityLog.filter(a => {
              if (!a.createdAt) return activityFilter === "today";
              const actDate = new Date(a.createdAt);
              if (activityFilter === "today") {
                return actDate >= todayStart;
              }
              if (activityFilter === "yesterday") {
                const yesterdayStart = new Date(todayStart);
                yesterdayStart.setDate(yesterdayStart.getDate() - 1);
                return actDate >= yesterdayStart && actDate < todayStart;
              }
              const cutoff = new Date(todayStart);
              cutoff.setDate(cutoff.getDate() - activeActivityFilter.days);
              return actDate >= cutoff;
            });

            // Format time/date label for each entry
            function formatActivityTime(a) {
              if (!a.createdAt) return a.time;
              const actDate = new Date(a.createdAt);
              if (actDate >= todayStart) return a.time;
              const yesterday = new Date(todayStart);
              yesterday.setDate(yesterday.getDate() - 1);
              if (actDate >= yesterday) {
                return "Yesterday " + a.time;
              }
              return actDate.toLocaleDateString("en-AU", { day: "numeric", month: "short" }) + " " + a.time;
            }

            return (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <Activity size={18} className="text-slate-400" />
                  <h2 className="text-base font-semibold text-slate-700">My Activity</h2>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full min-w-[24px] text-center ${filteredActivity.length > 0 ? "bg-sky-500 text-white" : "bg-stone-100 text-slate-400"}`}>
                    {filteredActivity.length}
                  </span>
                  <div className="ml-auto relative">
                    <button onClick={() => setShowActivityDropdown(!showActivityDropdown)}
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-stone-100 hover:bg-stone-200 px-2.5 py-1.5 rounded-lg transition">
                      <Filter size={12} />{activeActivityFilter.label}<ChevronDown size={12} />
                    </button>
                    {showActivityDropdown && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowActivityDropdown(false)} />
                        <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl border border-stone-200 shadow-lg z-20 py-1 overflow-hidden">
                          {ACTIVITY_FILTERS.map(f => (
                            <button key={f.key} onClick={() => { setActivityFilter(f.key); setShowActivityDropdown(false); }}
                              className={`w-full text-left px-3 py-2 text-xs font-medium transition ${activityFilter === f.key ? "bg-amber-50 text-amber-700" : "text-slate-600 hover:bg-stone-50"}`}>
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {filteredActivity.length > 0 ? (
                  <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
                    {filteredActivity.map(c => {
                      const cfg = activityTypeConfig(c.activityType);
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
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{c.summary}</p>
                          </div>
                          <span className="text-xs text-slate-400 whitespace-nowrap">{formatActivityTime(c)}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-stone-200 p-6 text-center">
                    <p className="text-sm text-slate-400">
                      {activityFilter === "today" ? "No activity yet today. Log a call, add a contact, or create a deal to get started." : `No activity for ${activeActivityFilter.label.toLowerCase()}.`}
                    </p>
                  </div>
                )}
              </>
            );
          })()}
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
