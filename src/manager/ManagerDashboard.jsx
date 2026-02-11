import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell, CartesianGrid } from "recharts";
import { Phone, Target, CheckCircle, XCircle, Calendar, Clock, UserPlus, FileText, Send, DollarSign, Users, User, Download, ChevronDown } from "lucide-react";
import { DAILY_TARGET, WEEKLY_TARGET, getStatus, statusConfig } from "../shared/constants";
import { formatCurrency } from "../shared/formatters";
import { computeRepMetrics } from "../supabaseData";
import StatusBadge from "../shared/StatusBadge";
import ActivityLogExplorer from "../shared/ActivityLogExplorer";

const DATE_PRESETS = [
  { key: "today", label: "Today" },
  { key: "this_week", label: "This Week" },
  { key: "last_7", label: "Last 7 Days" },
  { key: "last_14", label: "Last 14 Days" },
  { key: "last_30", label: "Last 30 Days" },
  { key: "last_60", label: "Last 60 Days" },
  { key: "last_90", label: "Last 90 Days" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "this_quarter", label: "This Quarter" },
  { key: "custom", label: "Custom" },
];

function getDateRange(presetKey, customFrom, customTo) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  switch (presetKey) {
    case "today":
      return { start: todayStart, end: todayEnd, label: "Today" };
    case "this_week": {
      const ws = new Date(todayStart);
      const dow = ws.getDay();
      ws.setDate(ws.getDate() - (dow === 0 ? 6 : dow - 1));
      return { start: ws, end: todayEnd, label: "This Week" };
    }
    case "last_7": {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - 7);
      return { start: d, end: todayEnd, label: "Last 7 Days" };
    }
    case "last_14": {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - 14);
      return { start: d, end: todayEnd, label: "Last 14 Days" };
    }
    case "last_30": {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - 30);
      return { start: d, end: todayEnd, label: "Last 30 Days" };
    }
    case "last_60": {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - 60);
      return { start: d, end: todayEnd, label: "Last 60 Days" };
    }
    case "last_90": {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - 90);
      return { start: d, end: todayEnd, label: "Last 90 Days" };
    }
    case "this_month": {
      const ms = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: ms, end: todayEnd, label: "This Month" };
    }
    case "last_month": {
      const ms = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const me = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: ms, end: me, label: "Last Month" };
    }
    case "this_quarter": {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      const qs = new Date(now.getFullYear(), qMonth, 1);
      return { start: qs, end: todayEnd, label: "This Quarter" };
    }
    case "custom": {
      const s = customFrom ? new Date(customFrom) : new Date(0);
      const e = customTo ? new Date(customTo + "T23:59:59.999") : todayEnd;
      const label = `${customFrom || "?"} – ${customTo || "?"}`;
      return { start: s, end: e, label };
    }
    default:
      return { start: todayStart, end: todayEnd, label: "Today" };
  }
}

export default function ManagerDashboard({ reps, deals, contacts, rawCalls, currentUser, isMobile }) {
  const isRepOnly = currentUser.role === "rep";
  const repUser = isRepOnly ? reps.find(r => r.name === currentUser.name) : null;
  const [selectedRep, setSelectedRep] = useState(isRepOnly && repUser ? repUser.id : "all");
  const [datePreset, setDatePreset] = useState("this_week");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // Primary date range filter — drives all dashboard data
  const dateRange = getDateRange(datePreset, customFrom, customTo);
  const isToday = datePreset === "today";
  const isThisWeek = datePreset === "this_week";

  // Only show reps (not managers/admins) in the dashboard
  const repList = reps.filter(r => r.role === "rep");
  const filteredReps = selectedRep === "all" ? repList : repList.filter(r => r.id === selectedRep);
  const isFiltered = selectedRep !== "all";

  // Compute metrics for each rep using the selected date range
  const metricsMap = {};
  for (const r of repList) {
    metricsMap[r.id] = computeRepMetrics(r.id, rawCalls, deals, contacts, { start: dateRange.start, end: dateRange.end });
  }

  const filteredMetrics = filteredReps.map(r => metricsMap[r.id]);
  const repCount = filteredReps.length || 1;

  const chartData = filteredReps.map(r => ({
    name: r.name.split(" ")[0],
    calls: metricsMap[r.id]?.callsInRange || 0,
    target: isToday ? DAILY_TARGET : isThisWeek ? WEEKLY_TARGET : null,
  }));

  const totalCallsInRange = filteredMetrics.reduce((s, m) => s + (m?.callsInRange || 0), 0);
  const totalCallsToday = filteredMetrics.reduce((s, m) => s + (m?.callsToday || 0), 0);
  const avgCompliance = Math.round(filteredMetrics.reduce((s, m) => s + (m?.crmCompliance || 0), 0) / repCount);
  const totalMeetings = filteredMetrics.reduce((s, m) => s + (m?.meetingsSet || 0), 0);
  const totalNewContacts = filteredMetrics.reduce((s, m) => s + (m?.newContacts || 0), 0);
  const greenCount = filteredReps.filter(r => getStatus(metricsMap[r.id]) === "green").length;

  // Pipeline-derived metrics — filtered by date range
  const repIds = filteredReps.map(r => r.id);
  const repDeals = isFiltered ? deals.filter(d => repIds.includes(d.ownerId)) : deals;
  const quotesRequested = repDeals.filter(d => d.quoteRequestedAt && new Date(d.quoteRequestedAt) >= dateRange.start && new Date(d.quoteRequestedAt) < dateRange.end).length;
  const quotesSent = repDeals.filter(d => d.quoteSentAt && new Date(d.quoteSentAt) >= dateRange.start && new Date(d.quoteSentAt) < dateRange.end).length;
  const turnaroundDeals = repDeals.filter(d => d.quoteRequestedAt && d.quoteSentAt && new Date(d.quoteSentAt) >= dateRange.start && new Date(d.quoteSentAt) < dateRange.end);
  const avgTurnaround = turnaroundDeals.length > 0
    ? Math.round(turnaroundDeals.reduce((s, d) => s + (new Date(d.quoteSentAt) - new Date(d.quoteRequestedAt)) / 3600000, 0) / turnaroundDeals.length * 10) / 10
    : null;
  const stageWeights = { discovery: 0.10, quote_request: 0.25, quote_sent: 0.75 };
  const activePipelineDeals = repDeals.filter(d => !["won", "lost", "closed"].includes(d.stage));
  const pipelineValue = activePipelineDeals.reduce((s, d) => s + d.value * (stageWeights[d.stage] || 0), 0);

  function handleExport() {
    const headers = ["Rep", `Calls (${dateRange.label})`, "Meetings Set", "New Contacts", "CRM Discipline %", "Quote Turnaround (h)", "Opp Progression %", "Pipeline Clean", "Status"];
    const rows = filteredReps.map(r => {
      const m = metricsMap[r.id] || {};
      const st = getStatus(m);
      const repTurnaroundDeals = deals.filter(d => d.ownerId === r.id && d.quoteRequestedAt && d.quoteSentAt && new Date(d.quoteSentAt) >= dateRange.start && new Date(d.quoteSentAt) < dateRange.end);
      const repTurnaround = repTurnaroundDeals.length > 0
        ? Math.round(repTurnaroundDeals.reduce((s, d) => s + (new Date(d.quoteSentAt) - new Date(d.quoteRequestedAt)) / 3600000, 0) / repTurnaroundDeals.length * 10) / 10
        : "";
      return [
        r.name,
        m.callsInRange || 0,
        m.meetingsSet || 0,
        m.newContacts || 0,
        m.crmCompliance || 0,
        repTurnaround,
        m.oppWithNext || 0,
        m.pipelineClean ? "Yes" : "No",
        st === "green" ? "On Track" : st === "amber" ? "Needs Attention" : "At Risk",
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kpi-export-${datePreset}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Dynamic card labels based on selected date range
  const rangeLabel = dateRange.label;
  const callsTarget = isToday ? DAILY_TARGET : isThisWeek ? WEEKLY_TARGET : null;
  const callsTargetTotal = callsTarget ? (isFiltered ? callsTarget : callsTarget * repList.length) : null;

  const summaryCards = [
    { label: isFiltered ? `Calls` : `Total Calls`, value: totalCallsInRange, sub: callsTargetTotal ? `Target: ${callsTargetTotal}` : rangeLabel, icon: Phone, accent: "bg-sky-50 text-sky-600" },
    { label: "Calls Today", value: totalCallsToday, sub: `Target: ${isFiltered ? DAILY_TARGET : DAILY_TARGET * repList.length}`, icon: Target, accent: "bg-sky-50 text-sky-600" },
    { label: "CRM Compliance", value: `${avgCompliance}%`, sub: isFiltered ? "Individual" : "Team average", icon: CheckCircle, accent: "bg-emerald-50 text-emerald-600" },
    { label: "Meetings Set", value: totalMeetings, sub: rangeLabel, icon: Calendar, accent: "bg-violet-50 text-violet-600" },
    { label: "New Contacts", value: totalNewContacts, sub: rangeLabel, icon: UserPlus, accent: "bg-sky-50 text-sky-600" },
    { label: "Quotes Requested", value: quotesRequested, sub: rangeLabel, icon: FileText, accent: "bg-violet-50 text-violet-600" },
    { label: "Quotes Sent", value: quotesSent, sub: rangeLabel, icon: Send, accent: "bg-amber-50 text-amber-600" },
    { label: "Quote Turnaround", value: avgTurnaround !== null ? `${avgTurnaround}h` : "\u2013", sub: "Avg hours", icon: Clock, accent: "bg-amber-50 text-amber-600" },
    { label: "Pipeline Value", value: formatCurrency(pipelineValue), sub: "Weighted", icon: DollarSign, accent: "bg-emerald-50 text-emerald-600" },
    { label: "Reps On Track", value: `${greenCount} / ${filteredReps.length}`, sub: "All KPIs met (today)", icon: Users, accent: "bg-violet-50 text-violet-600" },
  ];

  return (
    <div className={`max-w-6xl mx-auto ${isMobile ? "space-y-4" : "space-y-6"}`}>
      <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
        <div>
          <h1 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-slate-800`}>KPI Dashboard</h1>
          <p className="text-slate-500 mt-0.5 text-sm">{new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} – Real-time overview</p>
        </div>
        <div className={`flex items-center gap-2 ${isMobile ? "flex-wrap" : ""}`}>
          {!isRepOnly && (
            <>
              {/* Date range filter */}
              <div className="relative">
                <select value={datePreset} onChange={e => setDatePreset(e.target.value)}
                  className="appearance-none pl-7 pr-7 py-2 bg-white border border-stone-200 rounded-xl text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent cursor-pointer">
                  {DATE_PRESETS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
                <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              {datePreset === "custom" && (
                <>
                  <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                    className="px-2 py-2 bg-white border border-stone-200 rounded-xl text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 w-[130px]" />
                  <span className="text-xs text-slate-400">to</span>
                  <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                    className="px-2 py-2 bg-white border border-stone-200 rounded-xl text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 w-[130px]" />
                </>
              )}
              {/* Rep filter */}
              <div className="relative">
                <select value={selectedRep} onChange={e => setSelectedRep(e.target.value === "all" ? "all" : e.target.value)}
                  className="appearance-none pl-7 pr-7 py-2 bg-white border border-stone-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent cursor-pointer">
                  <option value="all">All Reps</option>
                  {repList.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              {/* Export CSV */}
              <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm text-slate-600 font-medium hover:bg-stone-50 transition">
                <Download size={15} />Export
              </button>
            </>
          )}
        </div>
      </div>

      <div className={`grid grid-cols-2 ${isMobile ? "gap-3" : "lg:grid-cols-5 gap-4"}`}>
        {summaryCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-stone-200 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.accent}`}><Icon size={18} /></div>
                <span className="text-sm text-slate-500">{c.label}</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{c.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{c.sub}</p>
            </div>
          );
        })}
      </div>

      <div className={`grid grid-cols-1 ${isMobile ? "gap-4" : "lg:grid-cols-5 gap-6"}`}>
        <div className="lg:col-span-3 bg-white rounded-xl border border-stone-200 p-5">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Calls {isToday ? "Today" : `(${rangeLabel})`} {callsTarget ? "vs Target" : "by Rep"}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#71717a" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#71717a" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e5e0", fontSize: "13px" }} />
              {callsTarget && <ReferenceLine y={callsTarget} stroke="#d97706" strokeDasharray="6 4" label={{ value: "Target", position: "right", fill: "#d97706", fontSize: 11 }} />}
              <Bar dataKey="calls" radius={[6, 6, 0, 0]} maxBarSize={40}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={callsTarget ? (d.calls >= callsTarget ? "#16a34a" : d.calls >= callsTarget * 0.8 ? "#d97706" : "#e11d48") : "#0284c7"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 p-5">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Status Board</h2>
          <div className="space-y-2">
            {filteredReps.map(r => {
              const m = metricsMap[r.id];
              const st = getStatus(m);
              const cfg = statusConfig(st);
              return (
                <div key={r.id} className={`flex items-center gap-3 p-3 rounded-xl border ${cfg.border} ${cfg.bg}`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: st === "green" ? "#16a34a" : st === "amber" ? "#d97706" : "#dc2626" }}>
                    {r.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{r.name}</p>
                    <p className="text-xs text-slate-500">{m?.callsToday || 0} calls · {m?.crmCompliance || 0}% CRM</p>
                  </div>
                  <StatusBadge status={st} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Weekly Scorecard */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200">
          <h2 className="text-base font-semibold text-slate-700">Scorecard – {rangeLabel}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 text-slate-500 text-left">
                <th className="px-5 py-3 font-medium">Rep</th>
                <th className="px-4 py-3 font-medium text-center">Calls</th>
                <th className="px-4 py-3 font-medium text-center">Meetings</th>
                <th className="px-4 py-3 font-medium text-center">New Contacts</th>
                <th className="px-4 py-3 font-medium text-center">CRM Discipline</th>
                <th className="px-4 py-3 font-medium text-center">Quote Turnaround</th>
                <th className="px-4 py-3 font-medium text-center">Opp. Progression</th>
                <th className="px-4 py-3 font-medium text-center">Pipeline</th>
                <th className="px-4 py-3 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredReps.map(r => {
                const m = metricsMap[r.id] || {};
                const st = getStatus(m);
                function cellColor(val, target) {
                  return val >= target ? "text-emerald-700 font-semibold" : val >= target * 0.8 ? "text-amber-600 font-semibold" : "text-rose-600 font-semibold";
                }
                const repTurnaroundDeals = deals.filter(d => d.ownerId === r.id && d.quoteRequestedAt && d.quoteSentAt && new Date(d.quoteSentAt) >= dateRange.start && new Date(d.quoteSentAt) < dateRange.end);
                const repTurnaround = repTurnaroundDeals.length > 0
                  ? Math.round(repTurnaroundDeals.reduce((s, d) => s + (new Date(d.quoteSentAt) - new Date(d.quoteRequestedAt)) / 3600000, 0) / repTurnaroundDeals.length * 10) / 10
                  : null;
                return (
                  <tr key={r.id} className="hover:bg-stone-50 transition">
                    <td className="px-5 py-3 font-medium text-slate-800">{r.name}</td>
                    <td className={`px-4 py-3 text-center ${callsTarget ? cellColor(m.callsInRange || 0, callsTarget) : "text-slate-700 font-semibold"}`}>{m.callsInRange || 0}</td>
                    <td className="px-4 py-3 text-center text-slate-700 font-semibold">{m.meetingsSet || 0}</td>
                    <td className="px-4 py-3 text-center text-slate-700 font-semibold">{m.newContacts || 0}</td>
                    <td className={`px-4 py-3 text-center ${cellColor(m.crmCompliance || 0, 100)}`}>{m.crmCompliance || 0}%</td>
                    <td className={`px-4 py-3 text-center ${repTurnaround !== null ? (repTurnaround <= 24 ? "text-emerald-700 font-semibold" : "text-rose-600 font-semibold") : "text-slate-400"}`}>{repTurnaround !== null ? `${repTurnaround}h` : "\u2013"}</td>
                    <td className={`px-4 py-3 text-center ${cellColor(m.oppWithNext || 0, 90)}`}>{m.oppWithNext || 0}%</td>
                    <td className="px-4 py-3 text-center">
                      {m.pipelineClean ? <CheckCircle size={16} className="inline text-emerald-600" /> : <XCircle size={16} className="inline text-rose-500" />}
                    </td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={st} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Log */}
      {!isRepOnly && <ActivityLogExplorer isMobile={isMobile} />}
    </div>
  );
}
