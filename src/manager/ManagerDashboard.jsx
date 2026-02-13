import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell, CartesianGrid } from "recharts";
import { Phone, Target, CheckCircle, Calendar, Clock, UserPlus, FileText, Send, DollarSign, Users, User, Download, ChevronDown } from "lucide-react";
import { DAILY_TARGET, WEEKLY_TARGET, DEFAULT_KPI_TARGETS, getStatus, getScorecard, statusConfig } from "../shared/constants";
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

export default function ManagerDashboard({ reps, deals, contacts, rawCalls, kpiTargets, currentUser, isMobile }) {
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

  // Managers are player-coaches — they sell AND manage, so include them alongside reps
  const repList = reps.filter(r => r.role === "rep" || r.role === "manager");
  const filteredReps = selectedRep === "all" ? repList : repList.filter(r => r.id === selectedRep);
  const isFiltered = selectedRep !== "all";

  // Per-rep KPI target lookup
  const getRepTargets = (repId) => (kpiTargets || {})[repId] || {
    weeklyCalls: DEFAULT_KPI_TARGETS.weekly_calls,
    weeklyMeetings: DEFAULT_KPI_TARGETS.weekly_meetings,
    weeklyContacts: DEFAULT_KPI_TARGETS.weekly_contacts,
    weeklyQuotes: DEFAULT_KPI_TARGETS.weekly_quotes,
  };
  const getRepDailyTarget = (repId) => Math.round(getRepTargets(repId).weeklyCalls / 5);

  // Compute metrics for each rep using the selected date range
  const metricsMap = {};
  for (const r of repList) {
    metricsMap[r.id] = computeRepMetrics(r.id, rawCalls, deals, contacts, { start: dateRange.start, end: dateRange.end });
  }

  const filteredMetrics = filteredReps.map(r => metricsMap[r.id]);
  const repCount = filteredReps.length || 1;

  // Build short display names — append last initial when first names clash
  const firstNameCounts = {};
  filteredReps.forEach(r => {
    const first = r.name.split(" ")[0];
    firstNameCounts[first] = (firstNameCounts[first] || 0) + 1;
  });
  const shortName = (r) => {
    const parts = r.name.split(" ");
    const first = parts[0];
    return firstNameCounts[first] > 1 && parts.length > 1 ? `${first} ${parts[parts.length - 1][0]}.` : first;
  };

  // Chart targets only shown when a single rep is selected — per-rep KPI targets
  // don't make sense as a single reference line across all reps
  const chartData = filteredReps.map(r => {
    const rt = getRepTargets(r.id);
    return {
      name: shortName(r),
      calls: metricsMap[r.id]?.callsInRange || 0,
      target: isFiltered ? (isToday ? getRepDailyTarget(r.id) : isThisWeek ? rt.weeklyCalls : null) : null,
    };
  });

  const meetingsChartData = filteredReps.map(r => {
    const rt = getRepTargets(r.id);
    return {
      name: shortName(r),
      meetings: metricsMap[r.id]?.meetingsSet || 0,
      target: isFiltered && isThisWeek ? rt.weeklyMeetings : null,
    };
  });

  const contactsChartData = filteredReps.map(r => {
    const rt = getRepTargets(r.id);
    return {
      name: shortName(r),
      contacts: metricsMap[r.id]?.newContacts || 0,
      target: isFiltered && isThisWeek ? rt.weeklyContacts : null,
    };
  });

  const quotesChartData = filteredReps.map(r => {
    const rt = getRepTargets(r.id);
    const count = deals.filter(d => d.ownerId === r.id && d.quoteSentAt && new Date(d.quoteSentAt) >= dateRange.start && new Date(d.quoteSentAt) < dateRange.end).length;
    return {
      name: shortName(r),
      quotes: count,
      target: isFiltered && isThisWeek ? rt.weeklyQuotes : null,
    };
  });

  const totalCallsInRange = filteredMetrics.reduce((s, m) => s + (m?.callsInRange || 0), 0);
  const totalCallsToday = filteredMetrics.reduce((s, m) => s + (m?.callsToday || 0), 0);
  const avgDealHealth = Math.round(filteredMetrics.reduce((s, m) => s + (m?.oppWithNext || 0), 0) / repCount);
  const totalMeetings = filteredMetrics.reduce((s, m) => s + (m?.meetingsSet || 0), 0);
  const totalNewContacts = filteredMetrics.reduce((s, m) => s + (m?.newContacts || 0), 0);
  const greenCount = filteredReps.filter(r => getStatus(metricsMap[r.id], getRepTargets(r.id)) === "green").length;

  // Pro-rated targets for colour-coding (same logic as getScorecard)
  const jsDay = new Date().getDay();
  const dayOfWeek = jsDay === 0 || jsDay === 6 ? 5 : jsDay;
  const proRate = (weekly) => Math.round(weekly * dayOfWeek / 5);

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
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const repLabel = selectedRep === "all" ? "All Reps" : (filteredReps[0]?.name || "Unknown");
    const lines = [
      [esc("Date Range"), esc(dateRange.label)].join(","),
      [esc("Rep"), esc(repLabel)].join(","),
      "",
      summaryCards.map(c => esc(c.label)).join(","),
      summaryCards.map(c => esc(c.value)).join(","),
    ];
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kpi-snapshot-${datePreset}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Dynamic card labels based on selected date range
  const rangeLabel = dateRange.label;
  const barColor = (pct) => pct >= 90 ? "#16a34a" : pct >= 75 ? "#d97706" : "#ef4444";

  // Aggregate targets — sum across reps (or individual when filtered)
  const dailyTargetAll = isFiltered ? getRepDailyTarget(filteredReps[0]?.id) : repList.reduce((s, r) => s + getRepDailyTarget(r.id), 0);
  const weeklyCallsTargetAll = isFiltered ? getRepTargets(filteredReps[0]?.id).weeklyCalls : repList.reduce((s, r) => s + getRepTargets(r.id).weeklyCalls, 0);
  const callsTargetTotal = isToday ? dailyTargetAll : isThisWeek ? weeklyCallsTargetAll : null;
  const meetingsTargetAll = isFiltered ? getRepTargets(filteredReps[0]?.id).weeklyMeetings : repList.reduce((s, r) => s + getRepTargets(r.id).weeklyMeetings, 0);
  const contactsTargetAll = isFiltered ? getRepTargets(filteredReps[0]?.id).weeklyContacts : repList.reduce((s, r) => s + getRepTargets(r.id).weeklyContacts, 0);
  const quotesTargetAll = isFiltered ? getRepTargets(filteredReps[0]?.id).weeklyQuotes : repList.reduce((s, r) => s + getRepTargets(r.id).weeklyQuotes, 0);

  const summaryCards = [
    { label: "Calls Today", value: totalCallsToday, sub: `Target: ${dailyTargetAll}`, icon: Phone, accent: "bg-sky-50 text-sky-600", pct: dailyTargetAll > 0 ? (totalCallsToday / dailyTargetAll) * 100 : null },
    { label: isThisWeek ? "Weekly Calls" : "Total Calls", value: totalCallsInRange, sub: callsTargetTotal ? `Target: ${callsTargetTotal}` : rangeLabel, icon: Target, accent: "bg-sky-50 text-sky-600", pct: callsTargetTotal && callsTargetTotal > 0 ? (totalCallsInRange / callsTargetTotal) * 100 : null },
    { label: "Meetings Set", value: totalMeetings, sub: isThisWeek ? `Target: ${meetingsTargetAll}` : rangeLabel, icon: Calendar, accent: "bg-violet-50 text-violet-600", pct: isThisWeek && meetingsTargetAll > 0 ? (totalMeetings / meetingsTargetAll) * 100 : null },
    { label: "New Contacts", value: totalNewContacts, sub: isThisWeek ? `Target: ${contactsTargetAll}` : rangeLabel, icon: UserPlus, accent: "bg-sky-50 text-sky-600", pct: isThisWeek && contactsTargetAll > 0 ? (totalNewContacts / contactsTargetAll) * 100 : null },
    { label: "Deal Health", value: `${avgDealHealth}%`, sub: isFiltered ? "Individual" : "Team average", icon: CheckCircle, accent: "bg-emerald-50 text-emerald-600", pct: avgDealHealth },
    { label: "Quotes Requested", value: quotesRequested, sub: rangeLabel, icon: FileText, accent: "bg-violet-50 text-violet-600" },
    { label: "Quotes Sent", value: quotesSent, sub: isThisWeek ? `Target: ${quotesTargetAll}` : rangeLabel, icon: Send, accent: "bg-amber-50 text-amber-600", pct: isThisWeek && quotesTargetAll > 0 ? (quotesSent / quotesTargetAll) * 100 : null },
    { label: "Quote Turnaround", value: avgTurnaround !== null ? `${avgTurnaround}h` : "\u2013", sub: "Avg hours", icon: Clock, accent: "bg-amber-50 text-amber-600" },
    { label: "Pipeline Value", value: formatCurrency(pipelineValue), sub: "Weighted", icon: DollarSign, accent: "bg-emerald-50 text-emerald-600" },
    { label: "Reps On Track", value: `${greenCount} / ${filteredReps.length}`, sub: "Rep KPI tracking", icon: Users, accent: "bg-violet-50 text-violet-600" },
  ];

  return (
    <div className={`max-w-6xl mx-auto ${isMobile ? "space-y-4" : "space-y-6"}`}>
      <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
        <div>
          <h1 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-slate-800`}>KPI Dashboard</h1>
          <p className="text-slate-500 mt-0.5 text-sm">{new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} – Real-time overview</p>
        </div>
        <div className={isMobile ? "grid grid-cols-2 gap-2" : "flex items-center gap-2"}>
          {!isRepOnly && (
            <>
              {/* Date range filter */}
              <div className="relative">
                <select value={datePreset} onChange={e => setDatePreset(e.target.value)}
                  className={`appearance-none pl-7 pr-7 py-2 bg-white border border-stone-200 rounded-xl text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent cursor-pointer${isMobile ? " w-full" : ""}`}>
                  {DATE_PRESETS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
                <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              {/* Rep filter */}
              <div className="relative">
                <select value={selectedRep} onChange={e => setSelectedRep(e.target.value === "all" ? "all" : e.target.value)}
                  className={`appearance-none pl-7 pr-7 py-2 bg-white border border-stone-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent cursor-pointer${isMobile ? " w-full" : ""}`}>
                  <option value="all">All Reps</option>
                  {repList.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              {datePreset === "custom" && (
                <div className={isMobile ? "col-span-2 flex items-center gap-2" : "contents"}>
                  <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                    className={`px-2 py-2 bg-white border border-stone-200 rounded-xl text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400${isMobile ? " flex-1" : " w-[130px]"}`} />
                  <span className="text-xs text-slate-400">to</span>
                  <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                    className={`px-2 py-2 bg-white border border-stone-200 rounded-xl text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400${isMobile ? " flex-1" : " w-[130px]"}`} />
                </div>
              )}
              {/* Export CSV */}
              {!isMobile && (
                <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm text-slate-600 font-medium hover:bg-stone-50 transition">
                  <Download size={15} />Export
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className={`grid grid-cols-2 ${isMobile ? "gap-3" : "lg:grid-cols-5 gap-4"}`}>
        {summaryCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-stone-200 p-3">
              <div className="flex items-center gap-3 mb-1">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${c.accent}`}><Icon size={16} /></div>
                <span className="text-sm text-slate-500">{c.label}</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{c.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{c.sub}</p>
              {c.pct != null && (
                <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden mt-2">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(c.pct, 100)}%`, background: barColor(c.pct) }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 2x2 Chart Grid */}
      <div className={`grid grid-cols-1 ${isMobile ? "gap-4" : "lg:grid-cols-2 gap-4"}`}>
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <h2 className="text-base font-semibold text-slate-700 mb-3">Calls {isToday ? "Today" : `(${rangeLabel})`} {isFiltered && (isToday || isThisWeek) ? "vs Target" : "by Rep"}</h2>
          <div className={isMobile ? "overflow-x-auto -mx-5 px-5" : ""}>
            <div style={isMobile ? { minWidth: Math.max(300, chartData.length * 60) } : undefined}>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} barCategoryGap={isMobile ? "15%" : "25%"} margin={isMobile ? { left: 10, right: 5 } : { left: -15, right: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" vertical={false} />
                  <XAxis dataKey="name" interval={0} tick={{ fontSize: isMobile ? 11 : 12, fill: "#71717a" }} axisLine={false} tickLine={false} />
                  {!isMobile && <YAxis width={30} tick={{ fontSize: 12, fill: "#71717a" }} axisLine={false} tickLine={false} allowDecimals={false} />}
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e5e0", fontSize: "13px" }} />
                  {isFiltered && chartData[0]?.target && <ReferenceLine y={chartData[0].target} stroke="#d97706" strokeDasharray="6 4" label={{ value: "Target", position: "right", fill: "#d97706", fontSize: 11 }} />}
                  <Bar dataKey="calls" radius={[6, 6, 0, 0]} maxBarSize={isMobile ? 60 : 40}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.target ? (d.calls >= d.target ? "#16a34a" : d.calls >= d.target * 0.8 ? "#d97706" : "#e11d48") : "#0284c7"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <h2 className="text-base font-semibold text-slate-700 mb-3">Meetings Set ({rangeLabel}) {isFiltered && isThisWeek ? "vs Target" : "by Rep"}</h2>
          <div className={isMobile ? "overflow-x-auto -mx-5 px-5" : ""}>
            <div style={isMobile ? { minWidth: Math.max(300, meetingsChartData.length * 60) } : undefined}>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={meetingsChartData} barCategoryGap={isMobile ? "15%" : "25%"} margin={isMobile ? { left: 10, right: 5 } : { left: -15, right: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" vertical={false} />
                  <XAxis dataKey="name" interval={0} tick={{ fontSize: isMobile ? 11 : 12, fill: "#71717a" }} axisLine={false} tickLine={false} />
                  {!isMobile && <YAxis width={30} tick={{ fontSize: 12, fill: "#71717a" }} axisLine={false} tickLine={false} allowDecimals={false} />}
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e5e0", fontSize: "13px" }} />
                  {isFiltered && meetingsChartData[0]?.target && <ReferenceLine y={meetingsChartData[0].target} stroke="#d97706" strokeDasharray="6 4" label={{ value: "Target", position: "right", fill: "#d97706", fontSize: 11 }} />}
                  <Bar dataKey="meetings" radius={[6, 6, 0, 0]} maxBarSize={isMobile ? 60 : 40}>
                    {meetingsChartData.map((d, i) => (
                      <Cell key={i} fill={d.target ? (d.meetings >= d.target ? "#16a34a" : d.meetings >= d.target * 0.8 ? "#d97706" : "#e11d48") : "#8b5cf6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <h2 className="text-base font-semibold text-slate-700 mb-3">New Contacts ({rangeLabel}) {isFiltered && isThisWeek ? "vs Target" : "by Rep"}</h2>
          <div className={isMobile ? "overflow-x-auto -mx-5 px-5" : ""}>
            <div style={isMobile ? { minWidth: Math.max(300, contactsChartData.length * 60) } : undefined}>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={contactsChartData} barCategoryGap={isMobile ? "15%" : "25%"} margin={isMobile ? { left: 10, right: 5 } : { left: -15, right: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" vertical={false} />
                  <XAxis dataKey="name" interval={0} tick={{ fontSize: isMobile ? 11 : 12, fill: "#71717a" }} axisLine={false} tickLine={false} />
                  {!isMobile && <YAxis width={30} tick={{ fontSize: 12, fill: "#71717a" }} axisLine={false} tickLine={false} allowDecimals={false} />}
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e5e0", fontSize: "13px" }} />
                  {isFiltered && contactsChartData[0]?.target && <ReferenceLine y={contactsChartData[0].target} stroke="#d97706" strokeDasharray="6 4" label={{ value: "Target", position: "right", fill: "#d97706", fontSize: 11 }} />}
                  <Bar dataKey="contacts" radius={[6, 6, 0, 0]} maxBarSize={isMobile ? 60 : 40}>
                    {contactsChartData.map((d, i) => (
                      <Cell key={i} fill={d.target ? (d.contacts >= d.target ? "#16a34a" : d.contacts >= d.target * 0.8 ? "#d97706" : "#e11d48") : "#0284c7"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <h2 className="text-base font-semibold text-slate-700 mb-3">Quotes Sent ({rangeLabel}) {isFiltered && isThisWeek ? "vs Target" : "by Rep"}</h2>
          <div className={isMobile ? "overflow-x-auto -mx-5 px-5" : ""}>
            <div style={isMobile ? { minWidth: Math.max(300, quotesChartData.length * 60) } : undefined}>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={quotesChartData} barCategoryGap={isMobile ? "15%" : "25%"} margin={isMobile ? { left: 10, right: 5 } : { left: -15, right: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" vertical={false} />
                  <XAxis dataKey="name" interval={0} tick={{ fontSize: isMobile ? 11 : 12, fill: "#71717a" }} axisLine={false} tickLine={false} />
                  {!isMobile && <YAxis width={30} tick={{ fontSize: 12, fill: "#71717a" }} axisLine={false} tickLine={false} allowDecimals={false} />}
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e5e0", fontSize: "13px" }} />
                  {isFiltered && quotesChartData[0]?.target && <ReferenceLine y={quotesChartData[0].target} stroke="#d97706" strokeDasharray="6 4" label={{ value: "Target", position: "right", fill: "#d97706", fontSize: 11 }} />}
                  <Bar dataKey="quotes" radius={[6, 6, 0, 0]} maxBarSize={isMobile ? 60 : 40}>
                    {quotesChartData.map((d, i) => (
                      <Cell key={i} fill={d.target ? (d.quotes >= d.target ? "#16a34a" : d.quotes >= d.target * 0.8 ? "#d97706" : "#e11d48") : "#8b5cf6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Team Scoreboard + Scorecard Table — side by side on desktop, stacked on mobile */}
      <div className={`${isMobile ? "space-y-4" : "lg:flex lg:gap-4"}`}>
        <div className={`bg-white rounded-xl border border-stone-200 overflow-hidden ${isMobile ? "" : "lg:w-[35%] lg:flex-shrink-0"}`}>
          <div className="px-5 py-4 border-b border-stone-200">
            <h2 className="text-base font-semibold text-slate-700">Team Scoreboard – {rangeLabel}</h2>
          </div>
          <div className="p-5 space-y-2">
            {filteredReps.map(r => {
              const m = metricsMap[r.id];
              const sc = getScorecard(m, getRepTargets(r.id));
              const cfg = statusConfig(sc.status);
              return (
                <div key={r.id} className={`p-3 rounded-xl border ${cfg.border} ${cfg.bg}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: sc.status === "green" ? "#16a34a" : sc.status === "amber" ? "#d97706" : "#dc2626" }}>
                        {r.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{r.name}</p>
                        {sc.behind.length > 0 && <p className="text-xs text-slate-500 truncate">Behind: {sc.behind.join(", ")}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={sc.status} />
                      <span className="text-sm font-bold text-slate-700">{sc.onPaceCount}/5</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`bg-white rounded-xl border border-stone-200 overflow-hidden ${isMobile ? "" : "lg:w-[65%]"}`}>
          <div className="px-5 py-4 border-b border-stone-200">
            <h2 className="text-base font-semibold text-slate-700">Scorecard – {rangeLabel}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 text-slate-500 text-left">
                  <th className="px-5 py-3 font-medium">Rep</th>
                  <th className="px-4 py-3 font-medium text-center">Calls logged</th>
                  <th className="px-4 py-3 font-medium text-center">Meetings set</th>
                  <th className="px-4 py-3 font-medium text-center">New contacts</th>
                  <th className="px-4 py-3 font-medium text-center">Quotes sent</th>
                  <th className="px-4 py-3 font-medium text-center">Deal health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredReps.map(r => {
                  const m = metricsMap[r.id] || {};
                  const rt = getRepTargets(r.id);
                  const repCallTarget = isToday ? getRepDailyTarget(r.id) : isThisWeek ? proRate(rt.weeklyCalls) : null;
                  const meetingTarget = isThisWeek ? proRate(rt.weeklyMeetings) : null;
                  const contactTarget = isThisWeek ? proRate(rt.weeklyContacts) : null;
                  const quoteTarget = isThisWeek ? proRate(rt.weeklyQuotes) : null;
                  function cellColor(val, target) {
                    if (target == null) return "text-slate-700 font-semibold";
                    return val >= target ? "text-emerald-700 font-semibold" : "text-amber-600 font-semibold";
                  }
                  return (
                    <tr key={r.id} className="hover:bg-stone-50 transition">
                      <td className="px-5 py-3 font-medium text-slate-800">{r.name}</td>
                      <td className={`px-4 py-3 text-center ${cellColor(m.callsInRange || 0, repCallTarget)}`}>{m.callsInRange || 0}</td>
                      <td className={`px-4 py-3 text-center ${cellColor(m.meetingsSet || 0, meetingTarget)}`}>{m.meetingsSet || 0}</td>
                      <td className={`px-4 py-3 text-center ${cellColor(m.newContacts || 0, contactTarget)}`}>{m.newContacts || 0}</td>
                      <td className={`px-4 py-3 text-center ${cellColor(m.quotesSentCount || 0, quoteTarget)}`}>{m.quotesSentCount || 0}</td>
                      <td className={`px-4 py-3 text-center ${cellColor(m.dealsWithNextCount || 0, m.activeDealsCount || 0)}`}>{m.dealsWithNextCount || 0}/{m.activeDealsCount || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      {!isRepOnly && <ActivityLogExplorer isMobile={isMobile} />}
    </div>
  );
}
