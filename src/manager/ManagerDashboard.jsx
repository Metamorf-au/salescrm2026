import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell, CartesianGrid } from "recharts";
import { Phone, Target, CheckCircle, XCircle, Calendar, Clock, UserPlus, FileText, Send, DollarSign, Users, User, Download } from "lucide-react";
import { DAILY_TARGET, WEEKLY_TARGET, getStatus, statusConfig } from "../shared/constants";
import { formatCurrency } from "../shared/formatters";
import { computeRepMetrics } from "../supabaseData";
import StatusBadge from "../shared/StatusBadge";

export default function ManagerDashboard({ reps, deals, contacts, rawCalls, currentUser, isMobile }) {
  const isRepOnly = currentUser.role === "rep";
  const repUser = isRepOnly ? reps.find(r => r.name === currentUser.name) : null;
  const [selectedRep, setSelectedRep] = useState(isRepOnly && repUser ? repUser.id : "all");

  // Only show reps (not managers/admins) in the dashboard
  const repList = reps.filter(r => r.role === "rep");
  const filteredReps = selectedRep === "all" ? repList : repList.filter(r => r.id === selectedRep);
  const isFiltered = selectedRep !== "all";

  // Compute metrics for each rep from real data
  const metricsMap = {};
  for (const r of repList) {
    metricsMap[r.id] = computeRepMetrics(r.id, rawCalls, deals, contacts);
  }

  const filteredMetrics = filteredReps.map(r => metricsMap[r.id]);
  const repCount = filteredReps.length || 1;

  const chartData = filteredReps.map(r => ({
    name: r.name.split(" ")[0],
    calls: metricsMap[r.id]?.callsToday || 0,
    target: DAILY_TARGET,
  }));

  const totalCallsToday = filteredMetrics.reduce((s, m) => s + (m?.callsToday || 0), 0);
  const totalCallsWeek = filteredMetrics.reduce((s, m) => s + (m?.callsWeek || 0), 0);
  const avgCompliance = Math.round(filteredMetrics.reduce((s, m) => s + (m?.crmCompliance || 0), 0) / repCount);
  const totalMeetings = filteredMetrics.reduce((s, m) => s + (m?.meetingsSet || 0), 0);
  const totalNewContacts = filteredMetrics.reduce((s, m) => s + (m?.newContacts || 0), 0);
  const greenCount = filteredReps.filter(r => getStatus(metricsMap[r.id]) === "green").length;

  // Pipeline-derived metrics
  const repIds = filteredReps.map(r => r.id);
  const repDeals = isFiltered ? deals.filter(d => repIds.includes(d.ownerId)) : deals;
  const quotesRequested = repDeals.filter(d => d.quoteRequestedAt).length;
  const quotesSent = repDeals.filter(d => d.quoteSentAt).length;
  const turnaroundDeals = repDeals.filter(d => d.quoteRequestedAt && d.quoteSentAt);
  const avgTurnaround = turnaroundDeals.length > 0
    ? Math.round(turnaroundDeals.reduce((s, d) => s + (new Date(d.quoteSentAt) - new Date(d.quoteRequestedAt)) / 3600000, 0) / turnaroundDeals.length * 10) / 10
    : null;
  const stageWeights = { discovery: 0.10, quote_request: 0.25, quote_sent: 0.75 };
  const activePipelineDeals = repDeals.filter(d => !["won", "lost", "closed"].includes(d.stage));
  const pipelineValue = activePipelineDeals.reduce((s, d) => s + d.value * (stageWeights[d.stage] || 0), 0);

  function handleExport() {
    const headers = ["Rep", "Calls Today", "Calls This Week", "CRM Discipline %", "Quote Turnaround (h)", "Opp Progression %", "Pipeline Clean", "Status"];
    const rows = filteredReps.map(r => {
      const m = metricsMap[r.id] || {};
      const st = getStatus(m);
      const repTurnaroundDeals = deals.filter(d => d.ownerId === r.id && d.quoteRequestedAt && d.quoteSentAt);
      const repTurnaround = repTurnaroundDeals.length > 0
        ? Math.round(repTurnaroundDeals.reduce((s, d) => s + (new Date(d.quoteSentAt) - new Date(d.quoteRequestedAt)) / 3600000, 0) / repTurnaroundDeals.length * 10) / 10
        : "";
      return [
        r.name,
        m.callsToday || 0,
        m.callsWeek || 0,
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
    a.download = `kpi-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const summaryCards = [
    { label: isFiltered ? "Calls Today" : "Total Calls Today", value: totalCallsToday, sub: `Target: ${isFiltered ? DAILY_TARGET : DAILY_TARGET * repList.length}`, icon: Phone, accent: "bg-sky-50 text-sky-600" },
    { label: isFiltered ? "Calls This Week" : "Total Calls Week", value: totalCallsWeek, sub: `Target: ${isFiltered ? WEEKLY_TARGET : WEEKLY_TARGET * repList.length}`, icon: Target, accent: "bg-sky-50 text-sky-600" },
    { label: "CRM Compliance", value: `${avgCompliance}%`, sub: isFiltered ? "Individual" : "Team average", icon: CheckCircle, accent: "bg-emerald-50 text-emerald-600" },
    { label: "Meetings Set", value: totalMeetings, sub: "This week", icon: Calendar, accent: "bg-violet-50 text-violet-600" },
    { label: "New Contacts", value: totalNewContacts, sub: "This week", icon: UserPlus, accent: "bg-sky-50 text-sky-600" },
    { label: "Quotes Requested", value: quotesRequested, sub: "Active", icon: FileText, accent: "bg-violet-50 text-violet-600" },
    { label: "Quotes Sent", value: quotesSent, sub: "Total", icon: Send, accent: "bg-amber-50 text-amber-600" },
    { label: "Quote Turnaround", value: avgTurnaround !== null ? `${avgTurnaround}h` : "\u2013", sub: "Avg hours", icon: Clock, accent: "bg-amber-50 text-amber-600" },
    { label: "Pipeline Value", value: formatCurrency(pipelineValue), sub: "Weighted", icon: DollarSign, accent: "bg-emerald-50 text-emerald-600" },
    { label: "Reps On Track", value: `${greenCount} / ${filteredReps.length}`, sub: "All KPIs met", icon: Users, accent: "bg-violet-50 text-violet-600" },
  ];

  return (
    <div className={`max-w-6xl mx-auto ${isMobile ? "space-y-4" : "space-y-6"}`}>
      <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
        <div>
          <h1 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-slate-800`}>KPI Dashboard</h1>
          <p className="text-slate-500 mt-0.5 text-sm">{new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} – Real-time overview</p>
        </div>
        <div className="flex items-center gap-2">
          {!isRepOnly && (
            <>
              <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm text-slate-600 font-medium hover:bg-stone-50 transition">
                <Download size={15} />Export
              </button>
              <User size={16} className="text-slate-400" />
              <select value={selectedRep} onChange={e => setSelectedRep(e.target.value === "all" ? "all" : e.target.value)}
                className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent cursor-pointer">
                <option value="all">All Reps</option>
                {repList.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
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
          <h2 className="text-base font-semibold text-slate-700 mb-4">Calls Today vs Target</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#71717a" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#71717a" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e5e0", fontSize: "13px" }} />
              <ReferenceLine y={DAILY_TARGET} stroke="#d97706" strokeDasharray="6 4" label={{ value: "Target", position: "right", fill: "#d97706", fontSize: 11 }} />
              <Bar dataKey="calls" radius={[6, 6, 0, 0]} maxBarSize={40}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.calls >= DAILY_TARGET ? "#16a34a" : d.calls >= DAILY_TARGET * 0.8 ? "#d97706" : "#e11d48"} />
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
          <h2 className="text-base font-semibold text-slate-700">Weekly Scorecard</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 text-slate-500 text-left">
                <th className="px-5 py-3 font-medium">Rep</th>
                <th className="px-4 py-3 font-medium text-center">Calls Today</th>
                <th className="px-4 py-3 font-medium text-center">Calls This Week</th>
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
                const repTurnaroundDeals = deals.filter(d => d.ownerId === r.id && d.quoteRequestedAt && d.quoteSentAt);
                const repTurnaround = repTurnaroundDeals.length > 0
                  ? Math.round(repTurnaroundDeals.reduce((s, d) => s + (new Date(d.quoteSentAt) - new Date(d.quoteRequestedAt)) / 3600000, 0) / repTurnaroundDeals.length * 10) / 10
                  : null;
                return (
                  <tr key={r.id} className="hover:bg-stone-50 transition">
                    <td className="px-5 py-3 font-medium text-slate-800">{r.name}</td>
                    <td className={`px-4 py-3 text-center ${cellColor(m.callsToday || 0, DAILY_TARGET)}`}>{m.callsToday || 0}</td>
                    <td className={`px-4 py-3 text-center ${cellColor(m.callsWeek || 0, WEEKLY_TARGET)}`}>{m.callsWeek || 0}</td>
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
    </div>
  );
}
