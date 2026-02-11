import { useState, useEffect, useRef, useCallback } from "react";
import { Phone, Target, CheckCircle, Calendar, UserPlus, Send, Activity, AlertTriangle, Bell, Briefcase, ChevronDown, Trash2, Filter, Save } from "lucide-react";
import { DAILY_TARGET, WEEKLY_TARGET, activityTypeConfig, noteTypeConfig, stageConfig } from "../shared/constants";
import { formatReminderDate, isOverdue } from "../shared/formatters";
import { fetchWeeklySummary, upsertWeeklySummary, getCurrentWeekStart } from "../supabaseData";

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
  // localStorage key for "Clear Done" timestamp (shared for notes + deals)
  const clearedKey = `crm_todo_cleared_${currentUser.id}`;

  // Local state for instant UI feedback on check (DB is source of truth after reload)
  const [completedNotes, setCompletedNotes] = useState({});
  const [completedDeals, setCompletedDeals] = useState({});

  // Timestamp of last "Clear Done" click
  const [lastCleared, setLastCleared] = useState(() => {
    try { return Number(localStorage.getItem(clearedKey)) || 0; } catch { return 0; }
  });

  // UIDs of items removed by "Clear Done" (persists until data refresh replaces them)
  const [clearedUIDs, setClearedUIDs] = useState(new Set());

  const [todoFilter, setTodoFilter] = useState("3days");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activityFilter, setActivityFilter] = useState("3days");
  const [showActivityDropdown, setShowActivityDropdown] = useState(false);

  // Weekly summary persistence
  const [weeklySummary, setWeeklySummary] = useState("");
  const [summarySaving, setSummarySaving] = useState(false);
  const [summarySaved, setSummarySaved] = useState(false);
  const summaryTimerRef = useRef(null);
  const summaryWeekStart = getCurrentWeekStart();

  useEffect(() => {
    fetchWeeklySummary(currentUser.id, summaryWeekStart).then(text => setWeeklySummary(text));
  }, [currentUser.id, summaryWeekStart]);

  const saveWeeklySummary = useCallback(async (text) => {
    setSummarySaving(true);
    try {
      await upsertWeeklySummary(currentUser.id, summaryWeekStart, text);
      setSummarySaved(true);
      setTimeout(() => setSummarySaved(false), 2000);
    } catch (err) {
      console.error("Error saving weekly summary:", err);
    }
    setSummarySaving(false);
  }, [currentUser.id, summaryWeekStart]);

  function handleSummaryChange(text) {
    setWeeklySummary(text);
    setSummarySaved(false);
    // Debounced auto-save after 1.5s of no typing
    if (summaryTimerRef.current) clearTimeout(summaryTimerRef.current);
    summaryTimerRef.current = setTimeout(() => saveWeeklySummary(text), 1500);
  }


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
      if (note.reminder) {
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

  // Active deals with next dates as to-dos (same pattern as notes: use DB todoCompletedAt)
  const myActiveDeals = deals.filter(d => d.ownerId === currentUser.id && d.nextDate && !["won", "lost", "closed"].includes(d.stage));

  for (const deal of myActiveDeals) {
    if (deal.todoCompletedAt) {
      const completedTime = new Date(deal.todoCompletedAt).getTime();
      // Auto-expire: skip deals completed > 14 days ago
      if (nowMs - completedTime > FOURTEEN_DAYS_MS) continue;
      // Skip deals that were completed before last "Clear Done"
      if (completedTime <= lastCleared) continue;
    }
    const todo = {
      uid: `deal-${deal.id}`,
      dealId: deal.id,
      type: "deal",
      contactName: deal.contact,
      company: deal.company,
      text: `${deal.title}${deal.nextAction ? ` – ${deal.nextAction}` : ""}`,
      reminder: deal.nextDate,
      dealStage: deal.stage,
    };
    if (deal.todoCompletedAt) todo.dbCompleted = true;
    myTodos.push(todo);
  }

  // Completion check: DB completedAt is source of truth, local state for instant feedback
  function isCompleted(todo) {
    if (todo.dbCompleted) return true;
    if (todo.type === "deal" && completedDeals[todo.uid]) return true;
    if (todo.noteId && completedNotes[todo.noteId]) return true;
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

  const filteredTodos = filterTodos(myTodos, todoFilter).filter(t => !clearedUIDs.has(t.uid));

  // Sort: overdue first, then by date ascending, completed last
  filteredTodos.sort((a, b) => {
    const aDone = isCompleted(a) ? 1 : 0;
    const bDone = isCompleted(b) ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    const aDate = a.reminder ? new Date(a.reminder) : new Date("9999-12-31");
    const bDate = b.reminder ? new Date(b.reminder) : new Date("9999-12-31");
    return aDate - bDate;
  });

  const visibleTodos = myTodos.filter(t => !clearedUIDs.has(t.uid));
  const pendingCount = visibleTodos.filter(t => !isCompleted(t)).length;
  const completedCount = visibleTodos.filter(t => isCompleted(t)).length;

  // CRM compliance based on all todos
  const totalTodos = myTodos.length;
  const crmCompliance = totalTodos > 0 ? Math.round((completedCount / totalTodos) * 100) : (activityLog.length > 0 ? 100 : 0);

  function handleToggleTodo(todo) {
    if (isCompleted(todo)) return;
    // Instant visual feedback (DB write happens via AppShell handler for both types)
    if (todo.type === "deal") {
      setCompletedDeals(prev => ({ ...prev, [todo.uid]: true }));
    } else if (todo.noteId) {
      setCompletedNotes(prev => ({ ...prev, [todo.noteId]: true }));
    }
    if (onCompleteTodo) onCompleteTodo(todo);
  }

  function handleClearCompleted() {
    // Set lastCleared timestamp so completed items stay hidden after data reload
    const clearedTs = Date.now();
    setLastCleared(clearedTs);
    localStorage.setItem(clearedKey, String(clearedTs));

    // Immediately remove all completed items from the visible list
    const uidsToRemove = new Set(clearedUIDs);
    for (const todo of myTodos) {
      if (isCompleted(todo)) uidsToRemove.add(todo.uid);
    }
    setClearedUIDs(uidsToRemove);

    // Clear local feedback state (items are now hidden via clearedUIDs)
    setCompletedDeals({});
    setCompletedNotes({});

    // Reload data from DB
    if (onClearCompleted) onClearCompleted();
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
                    className={`bg-white rounded-xl border flex items-center gap-3 px-4 py-3 transition group ${overdue ? "border-red-300 bg-red-50/40" : "border-stone-200"} ${done ? "opacity-60" : ""}`}>
                    <button type="button" onClick={() => handleToggleTodo(todo)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${done ? "bg-emerald-500 border-emerald-500" : overdue ? "border-red-400 group-hover:border-red-500" : "border-stone-300 group-hover:border-amber-400"} ${done ? "" : "cursor-pointer"}`}
                      disabled={done}>
                      {done && <CheckCircle size={14} className="text-white" />}
                    </button>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium text-slate-800 truncate ${done ? "line-through text-slate-400" : ""}`}>{todo.contactName}{todo.company ? ` - ${todo.company}` : ""}</p>
                        {isDeal ? (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${sc.bg} ${sc.text}`}>{sc.label}</span>
                        ) : (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${ntc.bg} ${ntc.text}`}>{ntc.label}</span>
                        )}
                        {overdue && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 bg-red-100 text-red-600">Overdue</span>}
                      </div>
                      <p className={`text-[13px] text-slate-500 truncate ${done ? "line-through" : ""}`}>{todo.text}</p>
                    </div>
                    {todo.reminder && (
                      <span className={`flex items-center gap-1 text-[13px] font-medium whitespace-nowrap flex-shrink-0 self-end ${overdue ? "text-red-500" : "text-amber-500"}`}>
                        {overdue ? <AlertTriangle size={14} /> : <Bell size={14} />}{formatReminderDate(todo.reminder, todo.type === 'meeting')}
                      </span>
                    )}
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
          {summarySaving && <span className="text-xs text-slate-400">Saving...</span>}
          {summarySaved && <span className="text-xs text-emerald-500 flex items-center gap-1"><CheckCircle size={12} />Saved</span>}
        </div>
        <textarea
          placeholder="Highlights, challenges, and plan for next week..."
          rows={3}
          value={weeklySummary}
          onChange={e => handleSummaryChange(e.target.value)}
          className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none mb-3"
        />
        <div className="flex justify-start">
          <button
            onClick={() => saveWeeklySummary(weeklySummary)}
            disabled={summarySaving}
            className="flex items-center gap-2 py-2.5 px-8 rounded-xl font-medium text-white bg-amber-500 hover:bg-amber-600 transition text-sm shadow-md disabled:opacity-50"
          >
            <Save size={15} />Submit Weekly Summary
          </button>
        </div>
      </div>
    </div>
  );
}
