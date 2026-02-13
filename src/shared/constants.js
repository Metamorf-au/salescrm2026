// ============================================================
// CONSTANTS & CONFIG OBJECTS
// ============================================================

import {
  Phone, CheckCircle, AlertTriangle, XCircle, Calendar,
  Send, UserPlus, Briefcase, MessageSquare, Activity,
  TrendingUp, DollarSign, Trophy
} from "lucide-react";

export const DAILY_TARGET = 20;
export const WEEKLY_TARGET = 100;

// Per-rep KPI defaults (used as fallback when no kpi_targets row exists)
export const DEFAULT_KPI_TARGETS = {
  weekly_calls: 100,
  weekly_meetings: 10,
  weekly_contacts: 5,
  weekly_quotes: 10,
};

export const PIPELINE_STAGES = ["discovery", "quote_request", "quote_sent", "won", "lost", "closed"];

export const NOTE_TYPES = [
  { key: "general", label: "General", bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  { key: "follow_up", label: "Follow-up", bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  { key: "meeting", label: "Meeting", bg: "bg-violet-100", text: "text-violet-700", dot: "bg-violet-500" },
  { key: "pricing", label: "Pricing", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  { key: "internal", label: "Internal", bg: "bg-sky-100", text: "text-sky-700", dot: "bg-sky-500" },
];

export const REMINDER_PRESETS = [
  { key: "1d", label: "1 Day" },
  { key: "2d", label: "2 Days" },
  { key: "3d", label: "3 Days" },
  { key: "1w", label: "1 Week" },
  { key: "2w", label: "2 Weeks" },
  { key: "1m", label: "1 Month" },
];

export const LOST_REASONS = [
  { key: "price", label: "Price" },
  { key: "incumbent", label: "Incumbent" },
  { key: "not_yet", label: "Not Yet" },
  { key: "other", label: "Other" },
];

export function noteTypeConfig(typeKey) {
  return NOTE_TYPES.find(t => t.key === typeKey) || NOTE_TYPES[0];
}

// 5-KPI pro-rated scoring engine
// Returns { status, onPaceCount, behind, kpis } for full scorecard detail
export function getScorecard(m, kpiTargets) {
  const allKpiNames = ["Calls", "Meetings", "Contacts", "Quotes", "Deal Health"];
  if (!m) return { status: "red", onPaceCount: 0, behind: allKpiNames, kpis: allKpiNames.map(name => ({ name, actual: 0, target: 0 })) };

  // Day of week: Mon=1 … Fri=5. Weekends use 5 (full weekly target).
  const jsDay = new Date().getDay();
  const dayOfWeek = jsDay === 0 || jsDay === 6 ? 5 : jsDay;

  const t = (typeof kpiTargets === "object" && kpiTargets) ? kpiTargets : {};
  const proRate = (weekly) => Math.round(weekly * dayOfWeek / 5);

  const kpis = [
    { name: "Calls", actual: m.callsWeek || 0, target: proRate(t.weeklyCalls || DEFAULT_KPI_TARGETS.weekly_calls) },
    { name: "Meetings", actual: m.meetingsSet || 0, target: proRate(t.weeklyMeetings || DEFAULT_KPI_TARGETS.weekly_meetings) },
    { name: "Contacts", actual: m.newContacts || 0, target: proRate(t.weeklyContacts || DEFAULT_KPI_TARGETS.weekly_contacts) },
    { name: "Quotes", actual: m.quotesSentCount || 0, target: proRate(t.weeklyQuotes || DEFAULT_KPI_TARGETS.weekly_quotes) },
    { name: "Deal Health", actual: m.dealsWithNextCount || 0, target: m.activeDealsCount || 0 },
  ];

  const behind = kpis.filter(k => k.actual < k.target).map(k => k.name);
  const onPaceCount = 5 - behind.length;

  let status;
  if (onPaceCount === 5) status = "green";
  else if (onPaceCount >= 3) status = "amber";
  else status = "red";

  return { status, onPaceCount, behind, kpis };
}

// Backward-compatible wrapper — returns just the traffic-light string
export function getStatus(m, kpiTargets) {
  return getScorecard(m, kpiTargets).status;
}

export function statusConfig(status) {
  const map = {
    green: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", label: "On Track", dot: "bg-emerald-500" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", label: "Needs Attention", dot: "bg-amber-500" },
    red: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", label: "At Risk", dot: "bg-rose-500" },
  };
  return map[status] || map.red;
}

export function outcomeConfig(outcome) {
  const map = {
    connected: { bg: "bg-emerald-100", color: "text-emerald-600", icon: Phone, label: "Connected" },
    voicemail: { bg: "bg-amber-100", color: "text-amber-600", icon: MessageSquare, label: "Voicemail" },
    no_answer: { bg: "bg-slate-100", color: "text-slate-500", icon: XCircle, label: "No Answer" },
    meeting: { bg: "bg-violet-100", color: "text-violet-600", icon: Calendar, label: "Meeting Set" },
  };
  return map[outcome] || map.connected;
}

export function stageConfig(stage) {
  const map = {
    discovery: { bg: "bg-sky-100", text: "text-sky-700", label: "Discovery" },
    quote_request: { bg: "bg-violet-100", text: "text-violet-700", label: "Quote Request" },
    quote_sent: { bg: "bg-amber-100", text: "text-amber-700", label: "Quote Sent" },
    won: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Won" },
    lost: { bg: "bg-rose-100", text: "text-rose-700", label: "Lost" },
    closed: { bg: "bg-slate-100", text: "text-slate-600", label: "Closed" },
  };
  return map[stage] || map.discovery;
}

export function contactStatusStyle(status) {
  const map = {
    active: { dot: "bg-emerald-500", label: "Active" },
    stale: { dot: "bg-amber-500", label: "Stale" },
    new: { dot: "bg-sky-500", label: "New" },
    inactive: { dot: "bg-slate-400", label: "Inactive" },
    archived: { dot: "bg-stone-400", label: "Archived" },
  };
  return map[status] || map.active;
}

const CALL_OUTCOME_ICONS = {
  connected: Phone,
  voicemail: MessageSquare,
  no_answer: XCircle,
  meeting: Calendar,
};

export function activityTypeConfig(type, outcome) {
  const map = {
    call: { bg: "bg-amber-100", color: "text-amber-600", icon: (outcome && CALL_OUTCOME_ICONS[outcome]) || Phone, label: "Call" },
    new_contact: { bg: "bg-violet-100", color: "text-violet-600", icon: UserPlus, label: "New Contact" },
    new_deal: { bg: "bg-emerald-100", color: "text-emerald-600", icon: Briefcase, label: "New Deal" },
    deal_won: { bg: "bg-emerald-100", color: "text-emerald-600", icon: Trophy, label: "Deal Won" },
    deal_lost: { bg: "bg-rose-100", color: "text-rose-600", icon: XCircle, label: "Deal Lost" },
    deal_voided: { bg: "bg-slate-100", color: "text-slate-500", icon: XCircle, label: "Voided" },
    quote_sent: { bg: "bg-emerald-100", color: "text-emerald-600", icon: Send, label: "Quote Sent" },
    quote_requested: { bg: "bg-emerald-100", color: "text-emerald-600", icon: Phone, label: "Quote Requested" },
    note_added: { bg: "bg-sky-100", color: "text-sky-600", icon: MessageSquare, label: "Note Added" },
    contact_updated: { bg: "bg-violet-100", color: "text-violet-600", icon: UserPlus, label: "Updated" },
    deal_updated: { bg: "bg-emerald-100", color: "text-emerald-600", icon: DollarSign, label: "Deal Updated" },
    todo_completed: { bg: "bg-emerald-100", color: "text-emerald-600", icon: CheckCircle, label: "To-Do Done" },
  };
  return map[type] || { bg: "bg-slate-100", color: "text-slate-500", icon: Activity, label: type };
}
