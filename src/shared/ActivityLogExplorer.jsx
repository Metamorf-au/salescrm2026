import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { fetchAdminActivityLog } from "../supabaseData";
import { activityTypeConfig } from "./constants";
import { ChevronDown, User, Calendar, Activity, Download } from "lucide-react";

const ACTIVITY_TYPES = [
  { key: "all", label: "All Types" },
  { key: "call", label: "Call" },
  { key: "new_contact", label: "New Contact" },
  { key: "new_deal", label: "New Deal" },
  { key: "deal_won", label: "Deal Won" },
  { key: "deal_lost", label: "Deal Lost" },
  { key: "deal_voided", label: "Voided" },
  { key: "quote_sent", label: "Quote Sent" },
  { key: "quote_requested", label: "Quote Requested" },
  { key: "note_added", label: "Note Added" },
  { key: "contact_updated", label: "Contact Updated" },
  { key: "deal_updated", label: "Deal Updated" },
];

const DATE_RANGES = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "3days", label: "Last 3 Days" },
  { key: "7days", label: "Last 7 Days" },
  { key: "14days", label: "Last 14 Days" },
  { key: "30days", label: "Last 30 Days" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "all", label: "All Time" },
  { key: "custom", label: "Custom" },
];

const REP_DATE_KEYS = new Set(["today", "yesterday", "3days", "7days", "14days"]);

function getDateRange(key, customFrom, customTo) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (key) {
    case "today":
      return { startDate: todayStart.toISOString(), endDate: null };
    case "yesterday": {
      const yStart = new Date(todayStart);
      yStart.setDate(yStart.getDate() - 1);
      return { startDate: yStart.toISOString(), endDate: todayStart.toISOString() };
    }
    case "3days": {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - 3);
      return { startDate: d.toISOString(), endDate: null };
    }
    case "7days": {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - 7);
      return { startDate: d.toISOString(), endDate: null };
    }
    case "14days": {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - 14);
      return { startDate: d.toISOString(), endDate: null };
    }
    case "30days": {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - 30);
      return { startDate: d.toISOString(), endDate: null };
    }
    case "this_month": {
      const ms = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: ms.toISOString(), endDate: null };
    }
    case "last_month": {
      const ms = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const me = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: ms.toISOString(), endDate: me.toISOString() };
    }
    case "custom": {
      const s = customFrom ? new Date(customFrom).toISOString() : null;
      const e = customTo ? new Date(customTo + "T23:59:59.999").toISOString() : null;
      return { startDate: s, endDate: e };
    }
    default:
      return { startDate: null, endDate: null };
  }
}

function formatActivityDateTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const time = d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();
  if (d >= todayStart) return time;
  const yesterday = new Date(todayStart);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d >= yesterday) return `Yesterday ${time}`;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" }) + ` ${time}`;
}

const PAGE_SIZE = 25;

export default function ActivityLogExplorer({ isMobile, userId }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(userId ? "today" : "7days");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [repFilter, setRepFilter] = useState(userId || "all");
  const [activities, setActivities] = useState([]);
  const [reps, setReps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Load reps for filter dropdown (skip when locked to a single user)
  useEffect(() => {
    if (userId) return;
    async function loadReps() {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, role")
        .eq("status", "active")
        .in("role", ["rep", "manager"])
        .order("name");
      if (data) setReps(data);
    }
    loadReps();
  }, [userId]);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange(dateFilter, customFrom, customTo);
    const data = await fetchAdminActivityLog({
      activityType: typeFilter === "all" ? null : typeFilter,
      startDate,
      endDate,
      userId: repFilter === "all" ? null : repFilter,
    });
    setActivities(data.filter(a => a.activityType !== "todo_completed"));
    setVisibleCount(PAGE_SIZE);
    setLoading(false);
  }, [typeFilter, dateFilter, customFrom, customTo, repFilter]);

  useEffect(() => { loadActivities(); }, [loadActivities]);

  function handleExportCsv() {
    if (activities.length === 0) return;
    const headers = ["Date/Time", "User", "Type", "Contact", "Company", "Summary"];
    const rows = activities.map(a => [
      new Date(a.createdAt).toLocaleString("en-AU"),
      a.userName,
      ACTIVITY_TYPES.find(t => t.key === a.activityType)?.label || a.activityType,
      a.contact,
      a.company,
      a.summary,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${(v || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-log-${dateFilter}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-visible">
      <div className="px-5 py-4 border-b border-stone-200">
        <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-700">Activity Log</h2>
            {!loading && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">
                {activities.length}
              </span>
            )}
          </div>
          <div className={isMobile ? "grid grid-cols-2 gap-2" : "flex items-center gap-2"}>
            {/* Activity Type Filter */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className={`appearance-none pl-7 pr-7 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent cursor-pointer${isMobile ? " w-full" : ""}`}
              >
                {ACTIVITY_TYPES.map(t => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
              <Activity size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Date Range Filter */}
            <div className="relative">
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className={`appearance-none pl-7 pr-7 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent cursor-pointer${isMobile ? " w-full" : ""}`}
              >
                {(userId ? DATE_RANGES.filter(d => REP_DATE_KEYS.has(d.key)) : DATE_RANGES).map(d => (
                  <option key={d.key} value={d.key}>{d.label}</option>
                ))}
              </select>
              <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Custom date inputs (manager/admin only) */}
            {!userId && dateFilter === "custom" && (
              <div className={isMobile ? "col-span-2 flex items-center gap-2" : "contents"}>
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                  className={`px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400${isMobile ? " flex-1" : " w-[120px]"}`} />
                <span className="text-[10px] text-slate-400">to</span>
                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                  className={`px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400${isMobile ? " flex-1" : " w-[120px]"}`} />
              </div>
            )}

            {/* Per-Rep Filter (hidden when locked to a single user) */}
            {!userId && (
              <div className="relative">
                <select
                  value={repFilter}
                  onChange={e => setRepFilter(e.target.value)}
                  className={`appearance-none pl-7 pr-7 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent cursor-pointer${isMobile ? " w-full" : ""}`}
                >
                  <option value="all">All Reps</option>
                  {reps.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <User size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}

            {/* Export CSV (manager/admin only) */}
            {!userId && (
              <button
                onClick={handleExportCsv}
                disabled={activities.length === 0}
                className={`flex items-center gap-1.5 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-stone-100 transition disabled:opacity-40 disabled:cursor-not-allowed${isMobile ? " w-full justify-center" : ""}`}
              >
                <Download size={13} />Export
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="px-5 py-8 text-center text-sm text-slate-400">Loading activity log...</div>
      ) : activities.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-400">No activity found for the selected filters.</div>
      ) : (
        <>
          {/* Desktop table */}
          {!isMobile ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-50 text-slate-500 text-left text-xs font-medium uppercase tracking-wide">
                    <th className="px-5 py-2.5">Time</th>
                    {!userId && <th className="px-4 py-2.5">User</th>}
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Contact</th>
                    <th className="px-4 py-2.5">Company</th>
                    <th className="px-4 py-2.5">Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {activities.slice(0, visibleCount).map(a => {
                    const cfg = activityTypeConfig(a.activityType, a.outcome);
                    const Icon = cfg.icon;
                    return (
                      <tr key={a.id} className="hover:bg-stone-50 transition">
                        <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">{formatActivityDateTime(a.createdAt)}</td>
                        {!userId && <td className="px-4 py-3 text-sm font-medium text-slate-700 whitespace-nowrap">{a.userName}</td>}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.bg} ${cfg.color}`}>
                            <Icon size={12} />{cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{a.contact}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{a.company}</td>
                        <td className="px-4 py-3 text-sm text-slate-500 max-w-xs truncate">{a.summary}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Mobile card list */
            <div className="divide-y divide-stone-100">
              {activities.slice(0, visibleCount).map(a => {
                const cfg = activityTypeConfig(a.activityType, a.outcome);
                const Icon = cfg.icon;
                return (
                  <div key={a.id} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon size={15} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {a.contact}{a.company ? ` – ${a.company}` : ""}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{a.summary}</p>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                            {!userId && <span className="text-xs text-slate-400">{a.userName}</span>}
                          </div>
                          <span className="text-xs text-slate-400 whitespace-nowrap">{formatActivityDateTime(a.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {visibleCount < activities.length && (
            <div className="text-center pt-2 pb-4">
              <button onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                className="px-6 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-medium text-slate-600 hover:border-amber-400 hover:text-amber-600 transition">
                Show more ({activities.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
