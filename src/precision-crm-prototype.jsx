import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell, CartesianGrid
} from "recharts";
import {
  Phone, Plus, Clock, FileText, Users, User, Target,
  CheckCircle, AlertTriangle, XCircle, Calendar, TrendingUp,
  Send, LayoutDashboard, Database, X, Activity, MessageSquare,
  ChevronRight, Eye, Settings, ArrowRight, Search, Building2,
  Mail, MapPin, DollarSign, Briefcase, BookOpen, StickyNote,
  Lock, Shield, Upload, Download, Columns, UserPlus, ToggleLeft,
  ToggleRight, LogOut, Bell
} from "lucide-react";

// ============================================================
// MOCK DATA
// ============================================================

const DAILY_TARGET = 20;
const WEEKLY_TARGET = 100;

const REPS = [
  { id: 1, name: "Sarah Mitchell", initials: "SM" },
  { id: 2, name: "James Cooper", initials: "JC" },
  { id: 3, name: "Emma Chen", initials: "EC" },
  { id: 4, name: "Marcus Webb", initials: "MW" },
  { id: 5, name: "Tanya Briggs", initials: "TB" },
];

const METRICS = {
  1: { callsToday: 18, callsWeek: 82, crmCompliance: 100, quoteOnTime: 100, oppWithNext: 95, pipelineClean: true, summaryDone: true },
  2: { callsToday: 22, callsWeek: 98, crmCompliance: 95, quoteOnTime: 85, oppWithNext: 90, pipelineClean: true, summaryDone: true },
  3: { callsToday: 12, callsWeek: 55, crmCompliance: 78, quoteOnTime: 60, oppWithNext: 70, pipelineClean: false, summaryDone: false },
  4: { callsToday: 20, callsWeek: 100, crmCompliance: 100, quoteOnTime: 95, oppWithNext: 92, pipelineClean: true, summaryDone: true },
  5: { callsToday: 8, callsWeek: 38, crmCompliance: 65, quoteOnTime: 50, oppWithNext: 60, pipelineClean: false, summaryDone: false },
};

const CONTACTS = [
  { id: 1, name: "David Harrison", company: "Apex Building Solutions", phone: "0412 345 678", email: "david@apexbuilding.com.au", location: "Sydney, NSW", owner: "Sarah Mitchell", deals: 2, lastContact: "Today", status: "active" },
  { id: 2, name: "Lisa Tran", company: "Pacific Coast Logistics", phone: "0423 456 789", email: "lisa.tran@paccoast.com.au", location: "Melbourne, VIC", owner: "Sarah Mitchell", deals: 1, lastContact: "Yesterday", status: "active" },
  { id: 3, name: "Mark O'Brien", company: "Southern Cross Engineering", phone: "0434 567 890", email: "mobrien@scengineering.com.au", location: "Brisbane, QLD", owner: "Sarah Mitchell", deals: 1, lastContact: "Today", status: "active" },
  { id: 4, name: "Priya Sharma", company: "Metro Health Services", phone: "0445 678 901", email: "priya.sharma@metrohealth.com.au", location: "Perth, WA", owner: "James Cooper", deals: 0, lastContact: "3 days ago", status: "active" },
  { id: 5, name: "Tom Kessler", company: "Greenfield Agricultural", phone: "0456 789 012", email: "tom@greenfieldagri.com.au", location: "Adelaide, SA", owner: "Sarah Mitchell", deals: 1, lastContact: "1 week ago", status: "stale" },
  { id: 7, name: "Steve Malone", company: "Eastside Commercial", phone: "0478 901 234", email: "steve.m@eastsidecommercial.com.au", location: "Melbourne, VIC", owner: "Marcus Webb", deals: 1, lastContact: "Yesterday", status: "active" },
  { id: 8, name: "Angela Wu", company: "Crystal Clear Windows", phone: "0489 012 345", email: "angela@crystalclear.com.au", location: "Gold Coast, QLD", owner: "Sarah Mitchell", deals: 0, lastContact: "2 days ago", status: "active" },
  { id: 9, name: "Jenny Park", company: "Summit Property Group", phone: "0490 123 456", email: "jpark@summitproperty.com.au", location: "Canberra, ACT", owner: "Tanya Briggs", deals: 0, lastContact: "Today", status: "new" },
  { id: 10, name: "Carlos Rivera", company: "Bayside Mechanical", phone: "0401 234 567", email: "carlos@baysidemech.com.au", location: "Darwin, NT", owner: "James Cooper", deals: 0, lastContact: "Never", status: "new" },
];

const DEALS = [
  { id: 1, title: "Bulk supply agreement", contact: "David Harrison", company: "Apex Building Solutions", stage: "quote_request", value: 48000, nextAction: "Send revised quote", nextDate: "2026-02-05", owner: "Sarah Mitchell", quoteRequestedAt: "2026-02-04T09:15:00" },
  { id: 2, title: "Fleet maintenance contract", contact: "Lisa Tran", company: "Pacific Coast Logistics", stage: "awaiting_approval", value: 32000, nextAction: "Confirm pricing terms", nextDate: "2026-02-06", owner: "Sarah Mitchell", quoteSentAt: "2026-02-03T14:00:00" },
  { id: 3, title: "Site equipment package", contact: "Mark O'Brien", company: "Southern Cross Engineering", stage: "discovery", value: 15500, nextAction: "Demo Thursday 2pm", nextDate: "2026-02-06", owner: "Sarah Mitchell" },
  { id: 4, title: "Annual supply renewal", contact: "Tom Kessler", company: "Greenfield Agricultural", stage: "discovery", value: 22000, nextAction: "Re-engage – send update", nextDate: "2026-02-04", owner: "Sarah Mitchell" },
  { id: 6, title: "Window hardware upgrade", contact: "Steve Malone", company: "Eastside Commercial", stage: "quote_request", value: 8750, nextAction: "Site assessment", nextDate: "2026-02-07", owner: "Marcus Webb", quoteRequestedAt: "2026-02-03T13:15:00" },
  { id: 7, title: "Facility maintenance", contact: "David Harrison", company: "Apex Building Solutions", stage: "quote_sent", value: 67000, nextAction: "Awaiting client review", nextDate: "2026-02-06", owner: "Sarah Mitchell", quoteRequestedAt: "2026-02-02T10:00:00", quoteSentAt: "2026-02-02T15:30:00" },
];

const CONTACT_CALLS = {
  1: [
    { id: 1, date: "4 Feb", time: "9:15 AM", outcome: "connected", summary: "Confirmed interest in 500-unit order. Wants revised quote by Thursday." },
    { id: 2, date: "31 Jan", time: "2:30 PM", outcome: "connected", summary: "Discussed bulk pricing tiers. Will review with procurement team." },
    { id: 3, date: "28 Jan", time: "10:00 AM", outcome: "voicemail", summary: "Left message re: January follow-up." },
  ],
  2: [
    { id: 1, date: "3 Feb", time: "10:35 AM", outcome: "voicemail", summary: "Left message re: quote follow-up" },
    { id: 2, date: "30 Jan", time: "3:00 PM", outcome: "connected", summary: "Quote sent for fleet maintenance. Lisa reviewing with ops manager." },
  ],
  3: [
    { id: 1, date: "4 Feb", time: "11:30 AM", outcome: "meeting", summary: "Demo confirmed for Thursday 2pm. 3 attendees from their side." },
    { id: 2, date: "1 Feb", time: "9:45 AM", outcome: "connected", summary: "Mark interested in site equipment package. Wants demo." },
  ],
  4: [
    { id: 1, date: "1 Feb", time: "2:30 PM", outcome: "connected", summary: "Discussed contract renewal. Priya checking internal budget." },
  ],
  5: [
    { id: 1, date: "28 Jan", time: "3:30 PM", outcome: "no_answer", summary: "No answer – will try again next week." },
    { id: 2, date: "20 Jan", time: "11:00 AM", outcome: "connected", summary: "Tom mentioned they're reviewing suppliers. Sent product update." },
  ],
  7: [
    { id: 1, date: "3 Feb", time: "1:15 PM", outcome: "connected", summary: "Steve confirmed interest in hardware upgrade. Needs site assessment." },
  ],
  8: [
    { id: 1, date: "2 Feb", time: "4:00 PM", outcome: "connected", summary: "Angela enquired about window hardware. Sent initial info pack." },
  ],
  9: [
    { id: 1, date: "4 Feb", time: "10:52 AM", outcome: "connected", summary: "New enquiry – needs site assessment for property group." },
  ],
  10: [],
};

const NOTE_TYPES = [
  { key: "general", label: "General", bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  { key: "follow_up", label: "Follow-up", bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  { key: "meeting", label: "Meeting", bg: "bg-violet-100", text: "text-violet-700", dot: "bg-violet-500" },
  { key: "pricing", label: "Pricing", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  { key: "internal", label: "Internal", bg: "bg-sky-100", text: "text-sky-700", dot: "bg-sky-500" },
];

const REMINDER_PRESETS = [
  { key: "1d", label: "1 Day" },
  { key: "2d", label: "2 Days" },
  { key: "3d", label: "3 Days" },
  { key: "1w", label: "1 Week" },
  { key: "2w", label: "2 Weeks" },
  { key: "1m", label: "1 Month" },
];

function getReminderDate(presetKey, fromDate) {
  const d = fromDate ? new Date(fromDate) : new Date("2026-02-05");
  const map = { "1d": 1, "2d": 2, "3d": 3, "1w": 7, "2w": 14, "1m": 30 };
  d.setDate(d.getDate() + (map[presetKey] || 0));
  return d;
}

function formatReminderDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

function noteTypeConfig(typeKey) {
  return NOTE_TYPES.find(t => t.key === typeKey) || NOTE_TYPES[0];
}

const CONTACT_NOTES = {
  1: [
    { id: 1, text: "Key decision-maker for all building supplies. Prefers email communication.", date: "15 Jan", author: "Sarah Mitchell", type: "general" },
    { id: 2, text: "Met at Sydney trade show - very engaged, asked about volume discounts.", date: "10 Jan", author: "Sarah Mitchell", type: "general" },
    { id: 3, text: "David wants revised quote by Thursday - check margin with finance.", date: "4 Feb", author: "Sarah Mitchell", type: "pricing", reminder: "2026-02-06" },
  ],
  2: [
    { id: 1, text: "Lisa reports to ops director Michael Chen. Get Michael on next call.", date: "30 Jan", author: "Sarah Mitchell", type: "internal" },
    { id: 2, text: "Chase Lisa on fleet maintenance quote - needs response by Friday.", date: "3 Feb", author: "Sarah Mitchell", type: "follow_up", reminder: "2026-02-07" },
  ],
  3: [
    { id: 1, text: "Mark prefers phone over email. Best reached before 10am.", date: "1 Feb", author: "Sarah Mitchell", type: "general" },
    { id: 2, text: "Demo confirmed Thursday 2pm - prepare site equipment slides.", date: "4 Feb", author: "Sarah Mitchell", type: "meeting", reminder: "2026-02-06" },
  ],
  4: [],
  5: [
    { id: 1, text: "Been quiet since December. May be reviewing other suppliers - re-engage urgently.", date: "28 Jan", author: "Sarah Mitchell", type: "follow_up", reminder: "2026-02-05" },
  ],
  7: [
    { id: 1, text: "Steve managing 3 commercial sites in Melbourne. Potential for multi-site deal.", date: "3 Feb", author: "Marcus Webb", type: "general" },
    { id: 2, text: "Get pricing for 3-site hardware package from supplier.", date: "4 Feb", author: "Marcus Webb", type: "pricing", reminder: "2026-02-10" },
  ],
  8: [],
  9: [],
  10: [],
};

const FOLLOW_UPS = [
  { id: 1, contact: "David Harrison", company: "Apex Building Solutions", time: "9:00 AM", note: "Interested in bulk order - send pricing", priority: "high" },
  { id: 2, contact: "Lisa Tran", company: "Pacific Coast Logistics", time: "10:30 AM", note: "Follow up on quote sent Monday", priority: "medium" },
  { id: 3, contact: "Mark O'Brien", company: "Southern Cross Engineering", time: "1:00 PM", note: "Demo scheduled - confirm attendees", priority: "high" },
  { id: 4, contact: "Priya Sharma", company: "Metro Health Services", time: "2:30 PM", note: "Check contract renewal timeline", priority: "low" },
  { id: 5, contact: "Tom Kessler", company: "Greenfield Agricultural", time: "3:30 PM", note: "Reconnect - went quiet last month", priority: "medium" },
  { id: 6, contact: "David Harrison", company: "Apex Building Solutions", time: "--", note: "Revised quote margin check with finance", priority: "high", fromNote: true, noteType: "pricing", reminder: "06/02/26" },
  { id: 7, contact: "Tom Kessler", company: "Greenfield Agricultural", time: "--", note: "Re-engage - may be reviewing other suppliers", priority: "medium", fromNote: true, noteType: "follow_up", reminder: "05/02/26" },
];

const LOST_REASONS = [
  { key: "price", label: "Price" },
  { key: "incumbent", label: "Incumbent" },
  { key: "not_yet", label: "Not Yet" },
  { key: "other", label: "Other" },
];

const RECENT_CALLS = [
  { id: 1, contact: "David Harrison", company: "Apex Building Solutions", outcome: "connected", time: "9:15 AM", summary: "Confirmed interest in 500-unit order" },
  { id: 2, contact: "Cold Call", company: "Riverdale Imports", outcome: "no_answer", time: "9:32 AM", summary: "No answer – retry tomorrow" },
  { id: 3, contact: "Lisa Tran", company: "Pacific Coast Logistics", outcome: "voicemail", time: "10:35 AM", summary: "Left message re: quote follow-up" },
  { id: 4, contact: "Jenny Park", company: "Summit Property Group", outcome: "connected", time: "10:52 AM", summary: "New enquiry – needs site assessment" },
  { id: 5, contact: "Cold Call", company: "Bayside Mechanical", outcome: "no_answer", time: "11:10 AM", summary: "No answer" },
  { id: 6, contact: "Mark O'Brien", company: "Southern Cross Engineering", outcome: "meeting", time: "11:30 AM", summary: "Demo confirmed for Thursday 2pm" },
];

const ADMIN_USERS = [
  { id: 1, name: "Sarah Mitchell", email: "sarah.m@precisiongroup.com.au", role: "rep", status: "active", lastLogin: "Today, 8:15 AM", created: "12 Jan 2026" },
  { id: 2, name: "James Cooper", email: "james.c@precisiongroup.com.au", role: "rep", status: "active", lastLogin: "Today, 7:55 AM", created: "12 Jan 2026" },
  { id: 3, name: "Emma Chen", email: "emma.c@precisiongroup.com.au", role: "rep", status: "active", lastLogin: "Yesterday, 4:30 PM", created: "12 Jan 2026" },
  { id: 4, name: "Marcus Webb", email: "marcus.w@precisiongroup.com.au", role: "rep", status: "active", lastLogin: "Today, 8:02 AM", created: "12 Jan 2026" },
  { id: 5, name: "Tanya Briggs", email: "tanya.b@precisiongroup.com.au", role: "rep", status: "active", lastLogin: "3 days ago", created: "12 Jan 2026" },
  { id: 6, name: "Rachel Ford", email: "rachel.f@precisiongroup.com.au", role: "rep", status: "active", lastLogin: "Today, 8:30 AM", created: "15 Jan 2026" },
  { id: 7, name: "Daniel Yeo", email: "daniel.y@precisiongroup.com.au", role: "rep", status: "active", lastLogin: "Yesterday, 5:10 PM", created: "15 Jan 2026" },
  { id: 8, name: "Natalie Cruz", email: "natalie.c@precisiongroup.com.au", role: "rep", status: "inactive", lastLogin: "2 weeks ago", created: "15 Jan 2026" },
  { id: 9, name: "Chris Palmer", email: "chris.p@precisiongroup.com.au", role: "manager", status: "active", lastLogin: "Today, 7:45 AM", created: "10 Jan 2026" },
  { id: 10, name: "Bill Thompson", email: "bill.t@precisiongroup.com.au", role: "admin", status: "active", lastLogin: "Today, 6:30 AM", created: "10 Jan 2026" },
];

const PIPELINE_STAGES = ["discovery", "quote_request", "quote_sent", "awaiting_approval", "won", "lost", "closed"];

const PIPELINE_DEALS = [
  ...DEALS,
  { id: 8, title: "Office fit-out supplies", contact: "Jenny Park", company: "Summit Property Group", stage: "discovery", value: 12500, nextAction: "Initial meeting", nextDate: "2026-02-10", owner: "Tanya Briggs" },
  { id: 9, title: "Workshop equipment", contact: "Carlos Rivera", company: "Bayside Mechanical", stage: "discovery", value: 9800, nextAction: "Send catalogue", nextDate: "2026-02-07", owner: "James Cooper" },
  { id: 10, title: "Cleaning contract renewal", contact: "Angela Wu", company: "Crystal Clear Windows", stage: "won", value: 18500, nextAction: "Signed", nextDate: null, owner: "Sarah Mitchell" },
  { id: 11, title: "Safety gear bulk order", contact: "Priya Sharma", company: "Metro Health Services", stage: "lost", value: 14200, nextAction: "Went with competitor", nextDate: null, owner: "James Cooper", lostReason: "incumbent" },
  { id: 12, title: "Warehouse shelving", contact: "Tom Kessler", company: "Greenfield Agricultural", stage: "closed", value: 6800, nextAction: null, nextDate: null, owner: "Sarah Mitchell", closedReason: "Budget freeze – revisit Q3" },
];


// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getStatus(m) {
  const issues = [];
  if (m.callsToday < DAILY_TARGET * 0.8) issues.push("calls");
  if (m.crmCompliance < 90) issues.push("crm");
  if (m.quoteOnTime < 80) issues.push("quotes");
  if (m.oppWithNext < 85) issues.push("pipeline");
  if (!m.summaryDone) issues.push("summary");
  if (!m.pipelineClean) issues.push("hygiene");
  if (issues.length === 0) return "green";
  if (issues.length <= 2 && !issues.includes("calls")) return "amber";
  return issues.length >= 3 ? "red" : "amber";
}

function statusConfig(status) {
  const map = {
    green: { icon: CheckCircle, label: "On Track", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
    amber: { icon: AlertTriangle, label: "Attention", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
    red: { icon: XCircle, label: "Action Required", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
  };
  return map[status] || map.amber;
}

function outcomeConfig(outcome) {
  const map = {
    connected: { icon: Phone, label: "Connected", color: "text-sky-600", bg: "bg-sky-50" },
    voicemail: { icon: MessageSquare, label: "Voicemail", color: "text-amber-600", bg: "bg-amber-50" },
    no_answer: { icon: X, label: "No Answer", color: "text-slate-400", bg: "bg-slate-50" },
    meeting: { icon: Calendar, label: "Meeting Set", color: "text-emerald-600", bg: "bg-emerald-50" },
  };
  return map[outcome] || map.no_answer;
}

function priorityStyle(p) {
  if (p === "high") return "border-l-rose-400";
  if (p === "medium") return "border-l-amber-400";
  return "border-l-slate-300";
}

function stageConfig(stage) {
  const map = {
    discovery: { label: "Discovery", bg: "bg-sky-100", text: "text-sky-700" },
    quote_request: { label: "Quote Request", bg: "bg-violet-100", text: "text-violet-700" },
    quote_sent: { label: "Quote Sent", bg: "bg-amber-100", text: "text-amber-700" },
    awaiting_approval: { label: "Awaiting Approval", bg: "bg-orange-100", text: "text-orange-700" },
    won: { label: "Won", bg: "bg-emerald-100", text: "text-emerald-700" },
    lost: { label: "Lost", bg: "bg-rose-100", text: "text-rose-700" },
    closed: { label: "Closed", bg: "bg-slate-100", text: "text-slate-600" },
  };
  return map[stage] || map.discovery;
}

function contactStatusStyle(status) {
  const map = {
    active: { label: "Active", dot: "bg-emerald-500" },
    new: { label: "New", dot: "bg-sky-500" },
    stale: { label: "Stale", dot: "bg-amber-500" },
    inactive: { label: "Inactive", dot: "bg-slate-400" },
  };
  return map[status] || map.active;
}

function formatCurrency(val) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 0 }).format(val);
}


// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({ status, size = "sm" }) {
  const cfg = statusConfig(status);
  const Icon = cfg.icon;
  const sz = size === "lg" ? "text-sm px-3 py-1.5" : "text-xs px-2 py-1";
  const iconSz = size === "lg" ? 16 : 13;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${cfg.bg} ${cfg.text} ${sz}`}>
      <Icon size={iconSz} />
      {cfg.label}
    </span>
  );
}


// ============================================================
// MODAL WRAPPER
// ============================================================

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(15,23,42,0.5)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full overflow-hidden" style={{ maxWidth: "480px", maxHeight: "90vh" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-stone-100 text-slate-400 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}


// ============================================================
// SUCCESS SCREEN
// ============================================================

function SuccessScreen({ message, sub }) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={32} className="text-emerald-600" />
      </div>
      <p className="text-lg font-semibold text-slate-800">{message}</p>
      <p className="text-slate-500 mt-1">{sub}</p>
    </div>
  );
}


// ============================================================
// CALL LOG MODAL
// ============================================================

function CallLogModal({ onClose, onSave }) {
  const [contact, setContact] = useState("");
  const [outcome, setOutcome] = useState("");
  const [summary, setSummary] = useState("");
  const [clientNeed, setClientNeed] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [quoteRequested, setQuoteRequested] = useState(false);
  const [saved, setSaved] = useState(false);

  const outcomes = [
    { key: "connected", label: "Connected", icon: Phone, color: "border-sky-400 bg-sky-50 text-sky-700" },
    { key: "voicemail", label: "Voicemail", icon: MessageSquare, color: "border-amber-400 bg-amber-50 text-amber-700" },
    { key: "no_answer", label: "No Answer", icon: X, color: "border-slate-300 bg-slate-50 text-slate-600" },
    { key: "meeting", label: "Meeting Booked", icon: Calendar, color: "border-emerald-400 bg-emerald-50 text-emerald-700" },
  ];

  function handleSave() {
    setSaved(true);
    setTimeout(() => { onSave(); onClose(); }, 1200);
  }

  return (
    <Modal title="Log Call" onClose={onClose}>
      {saved ? (
        <SuccessScreen message="Call Logged" sub="10 seconds – that's all it takes." />
      ) : (
        <div className="px-6 py-5 space-y-5 overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Contact</label>
            <select value={contact} onChange={e => setContact(e.target.value)}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent">
              <option value="">Select contact...</option>
              {CONTACTS.map(c => <option key={c.id} value={c.id}>{c.name} – {c.company}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Outcome</label>
            <div className="grid grid-cols-2 gap-2">
              {outcomes.map(o => {
                const Icon = o.icon;
                const active = outcome === o.key;
                return (
                  <button key={o.key} onClick={() => setOutcome(o.key)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition
                      ${active ? o.color : "border-stone-200 bg-white text-slate-500 hover:border-stone-300"}`}>
                    <Icon size={18} />{o.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Discussion Summary</label>
            <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={2} placeholder="Brief summary of the conversation..."
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Client Need</label>
            <input type="text" value={clientNeed} onChange={e => setClientNeed(e.target.value)} placeholder="What does the client need?"
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Next Step</label>
              <input type="text" value={nextStep} onChange={e => setNextStep(e.target.value)} placeholder="e.g. Send quote"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Follow-up Date</label>
              <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
            </div>
          </div>
          <div className="flex items-center gap-3 py-2 px-1">
            <button onClick={() => setQuoteRequested(!quoteRequested)}
              className={`w-10 h-6 rounded-full transition-colors flex items-center ${quoteRequested ? "bg-amber-500 justify-end" : "bg-stone-300 justify-start"}`}>
              <div className="w-5 h-5 bg-white rounded-full shadow mx-0.5" />
            </button>
            <div>
              <span className="text-sm font-medium text-slate-700">Quote Requested</span>
              <p className="text-xs text-slate-400">Tick if the client asked for a quote on this call</p>
            </div>
          </div>
          <button onClick={handleSave} disabled={!contact || !outcome}
            className="w-full py-3 rounded-xl font-semibold text-white transition bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed">
            Save Call Log
          </button>
        </div>
      )}
    </Modal>
  );
}


// ============================================================
// NEW CONTACT MODAL
// ============================================================

function NewContactModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [owner, setOwner] = useState("1");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => { onSave({ name, company, phone, email, location, owner }); onClose(); }, 1200);
  }

  return (
    <Modal title="New Contact" onClose={onClose}>
      {saved ? (
        <SuccessScreen message="Contact Created" sub={`${name} at ${company} has been added.`} />
      ) : (
        <div className="px-6 py-5 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Contact Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full name"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Company *</label>
              <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="Company name"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="04XX XXX XXX"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@company.com"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Location</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="City, State"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Contact Owner *</label>
              <select value={owner} onChange={e => setOwner(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent">
                {REPS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Any initial notes about this contact..."
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none" />
            </div>
          </div>
          <button onClick={handleSave} disabled={!name || !company}
            className="w-full py-3 rounded-xl font-semibold text-white transition bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed">
            Create Contact
          </button>
        </div>
      )}
    </Modal>
  );
}


// ============================================================
// NEW DEAL MODAL
// ============================================================

function NewDealModal({ onClose, onSave, defaultContact }) {
  const [title, setTitle] = useState("");
  const [contact, setContact] = useState(defaultContact ? String(defaultContact) : "");
  const [stage, setStage] = useState("discovery");
  const [value, setValue] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [saved, setSaved] = useState(false);

  const stages = [
    { key: "discovery", label: "Discovery" },
    { key: "quote_request", label: "Quote Request" },
    { key: "quote_sent", label: "Quote Sent" },
    { key: "awaiting_approval", label: "Awaiting Approval" },
    { key: "won", label: "Won" },
    { key: "lost", label: "Lost" },
  ];

  function handleSave() {
    setSaved(true);
    setTimeout(() => { onSave({ title, contact, stage, value, nextAction, nextDate }); onClose(); }, 1200);
  }

  const selectedContact = CONTACTS.find(c => c.id === Number(contact));

  return (
    <Modal title="New Deal" onClose={onClose}>
      {saved ? (
        <SuccessScreen message="Deal Created" sub={`"${title}" has been added to your pipeline.`} />
      ) : (
        <div className="px-6 py-5 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Contact *</label>
            <select value={contact} onChange={e => setContact(e.target.value)}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent">
              <option value="">Select contact...</option>
              {CONTACTS.map(c => <option key={c.id} value={c.id}>{c.name} – {c.company}</option>)}
            </select>
          </div>
          {selectedContact && (
            <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 rounded-lg border border-stone-200">
              <Building2 size={14} className="text-slate-400" />
              <span className="text-xs text-slate-600">{selectedContact.company} · {selectedContact.location}</span>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Deal Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Annual supply contract"
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Stage</label>
              <select value={stage} onChange={e => setStage(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent">
                {stages.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Value (AUD)</label>
              <input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="0"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Next Action *</label>
              <input type="text" value={nextAction} onChange={e => setNextAction(e.target.value)} placeholder="e.g. Send proposal"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Action Date</label>
              <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
            </div>
          </div>
          <button onClick={handleSave} disabled={!contact || !title || !nextAction}
            className="w-full py-3 rounded-xl font-semibold text-white transition bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed">
            Create Deal
          </button>
        </div>
      )}
    </Modal>
  );
}


// ============================================================
// QUICK NOTE MODAL
// ============================================================

function QuickNoteModal({ onClose, currentUser }) {
  const [contact, setContact] = useState("");
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState("general");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderPreset, setReminderPreset] = useState("");
  const [reminderCustom, setReminderCustom] = useState("");
  const [saved, setSaved] = useState(false);

  const selectedContact = contact ? CONTACTS.find(c => String(c.id) === String(contact)) : null;

  const computedReminder = reminderEnabled
    ? (reminderCustom || (reminderPreset ? getReminderDate(reminderPreset).toISOString().split("T")[0] : ""))
    : "";

  function handleSave() {
    if (!selectedContact || !noteText.trim()) return;
    const cId = selectedContact.id;
    if (!CONTACT_NOTES[cId]) CONTACT_NOTES[cId] = [];
    CONTACT_NOTES[cId].unshift({
      id: Date.now(),
      text: noteText.trim(),
      date: "Just now",
      author: currentUser?.name || "Unknown",
      type: noteType,
      ...(computedReminder ? { reminder: computedReminder } : {}),
    });
    setSaved(true);
    setTimeout(() => onClose(), 1200);
  }

  return (
    <Modal title="Quick Note" onClose={onClose}>
      {saved ? (
        <SuccessScreen message="Note Saved" sub={`Note added to ${selectedContact?.name}.`} />
      ) : (
        <div className="px-6 py-5 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Contact *</label>
            <select value={contact} onChange={e => setContact(e.target.value)}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent">
              <option value="">Select contact...</option>
              {CONTACTS.map(c => <option key={c.id} value={c.id}>{c.name} - {c.company}</option>)}
            </select>
          </div>
          {selectedContact && (
            <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 rounded-lg border border-stone-200">
              <Building2 size={14} className="text-slate-400" />
              <span className="text-xs text-slate-600">{selectedContact.company} \u00b7 {selectedContact.location}</span>
            </div>
          )}
          {/* Note Type Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Note Type</label>
            <div className="flex flex-wrap gap-1.5">
              {NOTE_TYPES.map(t => (
                <button key={t.key} onClick={() => setNoteType(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition
                    ${noteType === t.key ? `${t.bg} ${t.text} border-current` : "bg-white text-slate-500 border-stone-200 hover:border-stone-300"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Note *</label>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={3}
              placeholder="What do you need to remember about this contact?"
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none" />
          </div>
          {/* Reminder Toggle + Options */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-1">
              <button onClick={() => { setReminderEnabled(!reminderEnabled); if (reminderEnabled) { setReminderPreset(""); setReminderCustom(""); } }}
                className={`w-10 h-6 rounded-full transition-colors flex items-center ${reminderEnabled ? "bg-amber-500 justify-end" : "bg-stone-300 justify-start"}`}>
                <div className="w-5 h-5 bg-white rounded-full shadow mx-0.5" />
              </button>
              <div className="flex items-center gap-2">
                <Bell size={15} className={reminderEnabled ? "text-amber-500" : "text-slate-400"} />
                <span className="text-sm font-medium text-slate-700">Remind me</span>
              </div>
            </div>
            {reminderEnabled && (
              <div className="space-y-2 pl-1">
                <div className="flex flex-wrap gap-1.5">
                  {REMINDER_PRESETS.map(p => (
                    <button key={p.key} onClick={() => { setReminderPreset(p.key); setReminderCustom(""); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition
                        ${reminderPreset === p.key && !reminderCustom ? "bg-amber-100 text-amber-700 border-amber-300" : "bg-white text-slate-500 border-stone-200 hover:border-stone-300"}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">or pick a date:</span>
                  <input type="date" value={reminderCustom} onChange={e => { setReminderCustom(e.target.value); setReminderPreset(""); }}
                    className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
                </div>
                {computedReminder && (
                  <p className="text-xs text-amber-600 flex items-center gap-1.5">
                    <Bell size={12} /> Reminder set for {formatReminderDate(computedReminder)}
                  </p>
                )}
              </div>
            )}
          </div>
          {selectedContact && (CONTACT_NOTES[selectedContact.id] || []).length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1.5">Previous notes for {selectedContact.name}</p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {(CONTACT_NOTES[selectedContact.id] || []).map(n => {
                  const ntc = noteTypeConfig(n.type);
                  return (
                    <div key={n.id} className="px-3 py-2 bg-stone-50 rounded-lg border border-stone-100 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${ntc.bg} ${ntc.text}`}>{ntc.label}</span>
                        {n.reminder && <span className="flex items-center gap-1 text-amber-500"><Bell size={10} />{formatReminderDate(n.reminder)}</span>}
                      </div>
                      {n.text} <span className="text-slate-400 ml-1">\u00b7 {n.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <button onClick={handleSave} disabled={!contact || !noteText.trim()}
            className="w-full py-3 rounded-xl font-semibold text-white transition bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed">
            Save Note
          </button>
        </div>
      )}
    </Modal>
  );
}


// ============================================================
// CONTACTS VIEW
// ============================================================

function ContactsView({ onNewContact, onNewDeal, onAddNote, onLogCall, isMobile, currentUser }) {
  const isRepOnly = currentUser?.role === "rep";
  const [searchTerm, setSearchTerm] = useState("");
  const [ownerFilter, setOwnerFilter] = useState(isRepOnly ? currentUser.name : "all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [noteInputs, setNoteInputs] = useState({});
  const [noteTypeInputs, setNoteTypeInputs] = useState({});
  const [reminderToggles, setReminderToggles] = useState({});
  const [reminderPresets, setReminderPresets] = useState({});
  const [reminderCustoms, setReminderCustoms] = useState({});

  const filtered = CONTACTS.filter(c => {
    const matchesSearch = !searchTerm ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOwner = ownerFilter === "all" || c.owner === ownerFilter;
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesOwner && matchesStatus;
  });

  function getInlineReminder(contactId) {
    if (!reminderToggles[contactId]) return "";
    if (reminderCustoms[contactId]) return reminderCustoms[contactId];
    if (reminderPresets[contactId]) return getReminderDate(reminderPresets[contactId]).toISOString().split("T")[0];
    return "";
  }

  function handleAddNote(contactId) {
    const text = noteInputs[contactId];
    if (!text?.trim()) return;
    const reminder = getInlineReminder(contactId);
    const newNote = {
      id: Date.now(),
      text: text.trim(),
      date: "Just now",
      author: currentUser?.name || "Unknown",
      type: noteTypeInputs[contactId] || "general",
      ...(reminder ? { reminder } : {}),
    };
    if (!CONTACT_NOTES[contactId]) CONTACT_NOTES[contactId] = [];
    CONTACT_NOTES[contactId].unshift(newNote);
    setNoteInputs(prev => ({ ...prev, [contactId]: "" }));
    setNoteTypeInputs(prev => ({ ...prev, [contactId]: "general" }));
    setReminderToggles(prev => ({ ...prev, [contactId]: false }));
    setReminderPresets(prev => ({ ...prev, [contactId]: "" }));
    setReminderCustoms(prev => ({ ...prev, [contactId]: "" }));
  }

  return (
    <div className={`max-w-4xl mx-auto ${isMobile ? "space-y-4" : "space-y-6"}`}>
      {/* Header */}
      <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
        <div>
          <h1 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-slate-800`}>Contacts</h1>
          <p className="text-slate-500 mt-0.5 text-sm">{CONTACTS.length} contacts in database</p>
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
              {REPS.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
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
          const cs = contactStatusStyle(c.status);
          const isExpanded = expandedId === c.id;
          const contactDeals = DEALS.filter(d => d.contact === c.name);
          const contactCalls = CONTACT_CALLS[c.id] || [];
          const contactNotes = CONTACT_NOTES[c.id] || [];

          return (
            <div key={c.id} className={`bg-white rounded-xl border overflow-hidden transition-all ${isExpanded ? "border-amber-400 ring-1 ring-amber-200" : "border-stone-200"}`}>

              {/* —— Collapsed Tile – always visible —— */}
              <div className="p-4 cursor-pointer hover:bg-stone-50 transition"
                onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
                      {c.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800">{c.name}</p>
                        <div className="flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${cs.dot}`} />
                          <span className="text-xs text-slate-500">{cs.label}</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 size={13} /> {c.company}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs text-slate-400">
                      <p>{c.lastContact}</p>
                      {c.deals > 0 && <p className="mt-1 font-medium text-amber-600">{c.deals} deal{c.deals > 1 ? "s" : ""}</p>}
                    </div>
                    <ChevronRight size={16} className={`text-slate-300 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </div>
                </div>
                {/* Phone, email, location, owner – always visible */}
                <div className={`grid ${isMobile ? "grid-cols-1 gap-1.5" : "grid-cols-2 gap-x-4 gap-y-1.5"} mt-3 text-xs text-slate-500`}>
                  <span className="flex items-center gap-1"><Phone size={12} /> {c.phone}</span>
                  <span className="flex items-center gap-1"><Mail size={12} /> {c.email}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} /> {c.location}</span>
                  <span className="flex items-center gap-1"><User size={12} /> {c.owner}</span>
                </div>
              </div>

              {/* —— Expanded Section – Calls · Notes · Deals —— */}
              {isExpanded && (
                <div className="border-t border-amber-200 bg-stone-50/60">

                  {/* Recent Calls */}
                  <div className="px-4 pt-4 pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone size={15} className="text-slate-400" />
                      <h3 className="text-sm font-semibold text-slate-700">Recent Calls</h3>
                      <span className="text-xs text-slate-400 bg-stone-200 px-1.5 py-0.5 rounded-full">{contactCalls.length}</span>
                    </div>
                    {contactCalls.length > 0 ? (
                      <div className="space-y-1.5">
                        {contactCalls.map(call => {
                          const oc = outcomeConfig(call.outcome);
                          const Icon = oc.icon;
                          return (
                            <div key={call.id} className="bg-white rounded-lg border border-stone-200 px-3 py-2.5 flex items-start gap-3">
                              <div className={`w-7 h-7 rounded-md ${oc.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                <Icon size={13} className={oc.color} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-700">{call.summary}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{call.date} · {call.time}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 py-2">No calls recorded yet</p>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="px-4 pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <StickyNote size={15} className="text-slate-400" />
                      <h3 className="text-sm font-semibold text-slate-700">Notes</h3>
                      <span className="text-xs text-slate-400 bg-stone-200 px-1.5 py-0.5 rounded-full">{contactNotes.length}</span>
                    </div>
                    {/* Add Note Input */}
                    <div className="space-y-2 mb-2">
                      <div className="flex flex-wrap gap-1" onClick={e => e.stopPropagation()}>
                        {NOTE_TYPES.map(t => (
                          <button key={t.key} onClick={() => setNoteTypeInputs(prev => ({ ...prev, [c.id]: t.key }))}
                            className={`px-2 py-1 rounded text-[10px] font-medium border transition
                              ${(noteTypeInputs[c.id] || "general") === t.key ? `${t.bg} ${t.text} border-current` : "bg-white text-slate-400 border-stone-200 hover:border-stone-300"}`}>
                            {t.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={noteInputs[c.id] || ""}
                          onChange={e => setNoteInputs(prev => ({ ...prev, [c.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === "Enter") handleAddNote(c.id); }}
                          onClick={e => e.stopPropagation()}
                          placeholder="Add a note..."
                          className="flex-1 px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                        />
                        <button
                          onClick={e => { e.stopPropagation(); handleAddNote(c.id); }}
                          disabled={!noteInputs[c.id]?.trim()}
                          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Add Note
                        </button>
                      </div>
                      {/* Inline Reminder Toggle */}
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setReminderToggles(prev => ({ ...prev, [c.id]: !prev[c.id] })); if (reminderToggles[c.id]) { setReminderPresets(prev => ({ ...prev, [c.id]: "" })); setReminderCustoms(prev => ({ ...prev, [c.id]: "" })); } }}
                          className={`w-8 h-5 rounded-full transition-colors flex items-center ${reminderToggles[c.id] ? "bg-amber-500 justify-end" : "bg-stone-300 justify-start"}`}>
                          <div className="w-4 h-4 bg-white rounded-full shadow mx-0.5" />
                        </button>
                        <Bell size={13} className={reminderToggles[c.id] ? "text-amber-500" : "text-slate-400"} />
                        <span className="text-xs text-slate-500">Remind me</span>
                      </div>
                      {reminderToggles[c.id] && (
                        <div className="flex flex-wrap items-center gap-1.5" onClick={e => e.stopPropagation()}>
                          {REMINDER_PRESETS.map(p => (
                            <button key={p.key} onClick={() => { setReminderPresets(prev => ({ ...prev, [c.id]: p.key })); setReminderCustoms(prev => ({ ...prev, [c.id]: "" })); }}
                              className={`px-2 py-1 rounded text-[10px] font-medium border transition
                                ${reminderPresets[c.id] === p.key && !reminderCustoms[c.id] ? "bg-amber-100 text-amber-700 border-amber-300" : "bg-white text-slate-500 border-stone-200 hover:border-stone-300"}`}>
                              {p.label}
                            </button>
                          ))}
                          <input type="date" value={reminderCustoms[c.id] || ""} onChange={e => { setReminderCustoms(prev => ({ ...prev, [c.id]: e.target.value })); setReminderPresets(prev => ({ ...prev, [c.id]: "" })); }}
                            className="px-2 py-1 bg-stone-50 border border-stone-200 rounded text-slate-800 text-[10px] focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
                          {getInlineReminder(c.id) && (
                            <span className="text-[10px] text-amber-600 flex items-center gap-1"><Bell size={10} />{formatReminderDate(getInlineReminder(c.id))}</span>
                          )}
                        </div>
                      )}
                    </div>
                    {contactNotes.length > 0 ? (
                      <div className="space-y-1.5">
                        {contactNotes.map(note => {
                          const ntc = noteTypeConfig(note.type);
                          return (
                            <div key={note.id} className="bg-white rounded-lg border border-stone-200 px-3 py-2.5">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${ntc.bg} ${ntc.text}`}>{ntc.label}</span>
                                {note.reminder && (
                                  <span className="flex items-center gap-1 text-[10px] text-amber-500 font-medium">
                                    <Bell size={10} />{formatReminderDate(note.reminder)}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-700">{note.text}</p>
                              <p className="text-xs text-slate-400 mt-1">{note.date} · {note.author}</p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 py-1">No notes yet – add one above</p>
                    )}
                  </div>

                  {/* Deals */}
                  <div className="px-4 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Briefcase size={15} className="text-slate-400" />
                        <h3 className="text-sm font-semibold text-slate-700">Deals</h3>
                        <span className="text-xs text-slate-400 bg-stone-200 px-1.5 py-0.5 rounded-full">{contactDeals.length}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); onNewDeal(c.id); }}
                        className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition">
                        Add Deal
                      </button>
                    </div>
                    {contactDeals.length > 0 ? (
                      <div className="space-y-1.5">
                        {contactDeals.map(d => {
                          const sc = stageConfig(d.stage);
                          return (
                            <div key={d.id} className="bg-white rounded-lg border border-stone-200 p-3">
                              <div className="flex items-start justify-between mb-1">
                                <p className="text-sm font-semibold text-slate-800">{d.title}</p>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>{sc.label}</span>
                              </div>
                              <p className="text-base font-bold text-slate-800">{formatCurrency(d.value)}</p>
                              <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
                                <ArrowRight size={12} />
                                <span>{d.nextAction}</span>
                                <span className="ml-auto text-slate-400">{d.nextDate}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-white rounded-lg border border-stone-200 border-dashed text-slate-400">
                        <Briefcase size={18} className="mx-auto mb-1 opacity-50" />
                        <p className="text-xs">No deals yet – use Add Deal above</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
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


// ============================================================
// REP VIEW
// ============================================================

function RepView({ callsLogged, onLogCall, onNewDeal, onAddNote, onNewContact, isMobile, userName, currentUser }) {
  const repEntry = REPS.find(r => r.name === currentUser?.name);
  const repMetrics = repEntry ? METRICS[repEntry.id] : null;
  const dailyPct = Math.min((callsLogged / DAILY_TARGET) * 100, 100);
  const weeklyPct = repMetrics ? Math.min((repMetrics.callsWeek / WEEKLY_TARGET) * 100, 100) : 0;
  const meetingsSet = RECENT_CALLS.filter(c => c.outcome === "meeting").length;
  const quoteRequests = PIPELINE_DEALS.filter(d => d.stage === "quote_request" && d.owner === currentUser?.name).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
        <div>
          <h1 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-slate-800`}>Good morning, {userName}</h1>
          <p className="text-slate-500 mt-0.5 text-sm">Wednesday, 4 February 2026</p>
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

      {/* KPI-lite Strip */}
      <div className={`grid ${isMobile ? "grid-cols-2" : "grid-cols-6"} gap-3`}>
        {/* Daily Calls */}
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Phone size={14} className="text-sky-500" />
            <span className="text-xs font-medium text-slate-500">Daily Calls</span>
          </div>
          <p className="text-xl font-bold text-slate-800">{callsLogged}<span className="text-sm font-normal text-slate-400"> / {DAILY_TARGET}</span></p>
          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden mt-2">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${dailyPct}%`, background: dailyPct >= 100 ? "#16a34a" : dailyPct >= 75 ? "#d97706" : "#0ea5e9" }} />
          </div>
        </div>
        {/* Weekly Calls */}
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={14} className="text-amber-500" />
            <span className="text-xs font-medium text-slate-500">Weekly Calls</span>
          </div>
          <p className="text-xl font-bold text-slate-800">{repMetrics?.callsWeek || 0}<span className="text-sm font-normal text-slate-400"> / {WEEKLY_TARGET}</span></p>
          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden mt-2">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${weeklyPct}%`, background: weeklyPct >= 100 ? "#16a34a" : weeklyPct >= 75 ? "#d97706" : "#0ea5e9" }} />
          </div>
        </div>
        {/* CRM Compliance */}
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={14} className="text-emerald-500" />
            <span className="text-xs font-medium text-slate-500">CRM Compliance</span>
          </div>
          <p className="text-xl font-bold text-slate-800">{repMetrics?.crmCompliance || 0}<span className="text-sm font-normal text-slate-400">%</span></p>
          <p className="text-xs text-slate-400 mt-1">{repMetrics?.crmCompliance >= 90 ? "On track" : "Needs attention"}</p>
        </div>
        {/* Meetings Set */}
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={14} className="text-violet-500" />
            <span className="text-xs font-medium text-slate-500">Meetings Set</span>
          </div>
          <p className="text-xl font-bold text-slate-800">{meetingsSet}</p>
          <p className="text-xs text-slate-400 mt-1">This week</p>
        </div>
        {/* New Contacts */}
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus size={14} className="text-sky-500" />
            <span className="text-xs font-medium text-slate-500">New Contacts</span>
          </div>
          <p className="text-xl font-bold text-slate-800">{CONTACTS.filter(c => c.status === "new" && c.owner === currentUser?.name).length}</p>
          <p className="text-xs text-slate-400 mt-1">This week</p>
        </div>
        {/* Quote Requests */}
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={14} className="text-rose-500" />
            <span className="text-xs font-medium text-slate-500">Quote Requests</span>
          </div>
          <p className="text-xl font-bold text-slate-800">{quoteRequests}</p>
          <p className="text-xs text-slate-400 mt-1">Pending</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Follow-ups */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-slate-400" />
            <h2 className="text-base font-semibold text-slate-700">Today's Follow-Ups</h2>
            <span className="ml-auto text-xs font-medium text-slate-400 bg-stone-100 px-2 py-0.5 rounded-full">{FOLLOW_UPS.length}</span>
          </div>
          <div className="space-y-2">
            {FOLLOW_UPS.map(f => {
              const isFromNote = f.fromNote;
              const ntc = isFromNote ? noteTypeConfig(f.noteType) : null;
              return (
                <div key={f.id} className={`bg-white rounded-xl border border-stone-200 border-l-4 ${priorityStyle(f.priority)} p-4 hover:shadow-md transition cursor-pointer group`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800">{f.contact}</p>
                        {isFromNote && ntc && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${ntc.bg} ${ntc.text}`}>{ntc.label}</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{f.company}</p>
                      <p className="text-sm text-slate-600 mt-1.5">{f.note}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isFromNote && f.reminder ? (
                        <span className="flex items-center gap-1 text-xs text-amber-500 font-medium whitespace-nowrap">
                          <Bell size={13} />{f.reminder}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 whitespace-nowrap">{f.time}</span>
                      )}
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-amber-500 transition" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Activity */}
          <div className="flex items-center gap-2 mt-6">
            <Activity size={18} className="text-slate-400" />
            <h2 className="text-base font-semibold text-slate-700">Today's Activity</h2>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
            {RECENT_CALLS.map(c => {
              const oc = outcomeConfig(c.outcome);
              const Icon = oc.icon;
              return (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-8 h-8 rounded-lg ${oc.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={15} className={oc.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{c.contact} – {c.company}</p>
                    <p className="text-xs text-slate-500 truncate">{c.summary}</p>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{c.time}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700">Weekly Summary</h3>
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">Due Friday</span>
            </div>
            <textarea placeholder="Highlights, challenges, and plan for next week..." rows={3}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none mb-3" />
            <button className="w-full py-2.5 rounded-xl font-medium text-white bg-amber-500 hover:bg-amber-600 transition text-sm shadow-md">
              Submit Weekly Summary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// MANAGER DASHBOARD
// ============================================================

function ManagerDashboard({ isMobile, currentUser }) {
  const isRepOnly = currentUser.role === "rep";
  const repUser = isRepOnly ? REPS.find(r => r.name === currentUser.name) : null;
  const [selectedRep, setSelectedRep] = useState(isRepOnly && repUser ? String(repUser.id) : "all");

  const filteredReps = selectedRep === "all" ? REPS : REPS.filter(r => r.id === Number(selectedRep));
  const filteredMetrics = filteredReps.map(r => METRICS[r.id]);

  const chartData = filteredReps.map(r => ({
    name: r.name.split(" ")[0],
    calls: METRICS[r.id].callsToday,
    target: DAILY_TARGET,
  }));

  const repCount = filteredReps.length;
  const totalCalls = filteredMetrics.reduce((s, m) => s + m.callsToday, 0);
  const avgCompliance = Math.round(filteredMetrics.reduce((s, m) => s + m.crmCompliance, 0) / repCount);
  const avgQuote = Math.round(filteredMetrics.reduce((s, m) => s + m.quoteOnTime, 0) / repCount);
  const greenCount = filteredReps.filter(r => getStatus(METRICS[r.id]) === "green").length;

  const isFiltered = selectedRep !== "all";
  const summaryCards = [
    { label: isFiltered ? "Calls Today" : "Total Calls Today", value: totalCalls, sub: isFiltered ? `Target: ${DAILY_TARGET}` : `Target: ${DAILY_TARGET * REPS.length}`, icon: Phone, accent: "bg-sky-50 text-sky-600" },
    { label: "CRM Compliance", value: `${avgCompliance}%`, sub: isFiltered ? "Individual" : "Team average", icon: CheckCircle, accent: "bg-emerald-50 text-emerald-600" },
    { label: "Quotes On Time", value: `${avgQuote}%`, sub: "Under 24h", icon: FileText, accent: "bg-amber-50 text-amber-600" },
    { label: "Reps On Track", value: `${greenCount} / ${filteredReps.length}`, sub: "All KPIs met", icon: Users, accent: "bg-violet-50 text-violet-600" },
  ];

  return (
    <div className={`max-w-6xl mx-auto ${isMobile ? "space-y-4" : "space-y-6"}`}>
      <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
        <div>
          <h1 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-slate-800`}>KPI Dashboard</h1>
          <p className="text-slate-500 mt-0.5 text-sm">Wednesday, 4 February 2026 – Real-time overview</p>
        </div>
        <div className="flex items-center gap-2">
          {!isRepOnly && (
          <>
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm text-slate-600 font-medium hover:bg-stone-50 transition">
            <Download size={15} />Export
          </button>
          <User size={16} className="text-slate-400" />
          <select value={selectedRep} onChange={e => setSelectedRep(e.target.value)}
            className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent cursor-pointer">
            <option value="all">All Reps</option>
            {REPS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          </>
          )}
        </div>
      </div>

      <div className={`grid grid-cols-2 ${isMobile ? "gap-3" : "lg:grid-cols-4 gap-4"}`}>
        {summaryCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-stone-200 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.accent}`}>
                  <Icon size={18} />
                </div>
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
              const m = METRICS[r.id];
              const st = getStatus(m);
              const cfg = statusConfig(st);
              return (
                <div key={r.id} className={`flex items-center gap-3 p-3 rounded-xl border ${cfg.border} ${cfg.bg}`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: st === "green" ? "#16a34a" : st === "amber" ? "#d97706" : "#dc2626" }}>
                    {r.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{r.name}</p>
                    <p className="text-xs text-slate-500">{m.callsToday} calls · {m.crmCompliance}% CRM</p>
                  </div>
                  <StatusBadge status={st} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

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
                <th className="px-4 py-3 font-medium text-center">Quotes On Time</th>
                <th className="px-4 py-3 font-medium text-center">Opp. Progression</th>
                <th className="px-4 py-3 font-medium text-center">Pipeline</th>
                <th className="px-4 py-3 font-medium text-center">Weekly Summary</th>
                <th className="px-4 py-3 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredReps.map(r => {
                const m = METRICS[r.id];
                const st = getStatus(m);
                function cellColor(val, target) {
                  return val >= target ? "text-emerald-700 font-semibold" : val >= target * 0.8 ? "text-amber-600 font-semibold" : "text-rose-600 font-semibold";
                }
                return (
                  <tr key={r.id} className="hover:bg-stone-50 transition">
                    <td className="px-5 py-3 font-medium text-slate-800">{r.name}</td>
                    <td className={`px-4 py-3 text-center ${cellColor(m.callsToday, DAILY_TARGET)}`}>{m.callsToday}</td>
                    <td className={`px-4 py-3 text-center ${cellColor(m.callsWeek, WEEKLY_TARGET)}`}>{m.callsWeek}</td>
                    <td className={`px-4 py-3 text-center ${cellColor(m.crmCompliance, 100)}`}>{m.crmCompliance}%</td>
                    <td className={`px-4 py-3 text-center ${cellColor(m.quoteOnTime, 80)}`}>{m.quoteOnTime}%</td>
                    <td className={`px-4 py-3 text-center ${cellColor(m.oppWithNext, 90)}`}>{m.oppWithNext}%</td>
                    <td className="px-4 py-3 text-center">
                      {m.pipelineClean ? <CheckCircle size={16} className="inline text-emerald-600" /> : <XCircle size={16} className="inline text-rose-500" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {m.summaryDone ? <CheckCircle size={16} className="inline text-emerald-600" /> : <XCircle size={16} className="inline text-rose-500" />}
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


// ============================================================
// PIPELINE VIEW
// ============================================================

function PipelineView({ isMobile, currentUser }) {
  const isRepOnly = currentUser.role === "rep";
  const [selectedRep, setSelectedRep] = useState(isRepOnly ? currentUser.name : "all");
  const [timePeriod, setTimePeriod] = useState("all");
  const [lostModal, setLostModal] = useState(null);
  const [closeModal, setCloseModal] = useState(null);
  const [showGraveyard, setShowGraveyard] = useState(false);

  const timePeriods = [
    { key: "all", label: "All Time" },
    { key: "7d", label: "7 Days", days: 7 },
    { key: "30d", label: "30 Days", days: 30 },
    { key: "3m", label: "3 Months", days: 90 },
    { key: "6m", label: "6 Months", days: 180 },
    { key: "1y", label: "1 Year", days: 365 },
  ];

  const stages = [
    { key: "discovery", label: "Discovery", color: "border-sky-400", bg: "bg-sky-50", text: "text-sky-700" },
    { key: "quote_request", label: "Quote Request", color: "border-violet-400", bg: "bg-violet-50", text: "text-violet-700" },
    { key: "quote_sent", label: "Quote Sent", color: "border-amber-400", bg: "bg-amber-50", text: "text-amber-700" },
    { key: "awaiting_approval", label: "Awaiting Approval", color: "border-orange-400", bg: "bg-orange-50", text: "text-orange-700" },
    { key: "won", label: "Won", color: "border-emerald-400", bg: "bg-emerald-50", text: "text-emerald-700" },
    { key: "lost", label: "Lost", color: "border-rose-400", bg: "bg-rose-50", text: "text-rose-700" },
  ];

  const now = new Date("2026-02-04T14:00:00");
  const selectedPeriod = timePeriods.find(p => p.key === timePeriod);
  const cutoffDate = selectedPeriod?.days ? new Date(now.getTime() - selectedPeriod.days * 86400000) : null;
  const filteredDeals = PIPELINE_DEALS.filter(d => {
    if (selectedRep !== "all" && d.owner !== selectedRep) return false;
    if (cutoffDate && d.nextDate && new Date(d.nextDate) < cutoffDate) return false;
    return true;
  });
  const activeDeals = filteredDeals.filter(d => !["won", "lost", "closed"].includes(d.stage));
  const totalActive = activeDeals.reduce((s, d) => s + d.value, 0);
  const wonDeals = filteredDeals.filter(d => d.stage === "won");
  const totalWon = wonDeals.reduce((s, d) => s + d.value, 0);
  const lostDeals = filteredDeals.filter(d => d.stage === "lost");
  const totalLost = lostDeals.reduce((s, d) => s + d.value, 0);
  const closedDeals = filteredDeals.filter(d => d.stage === "closed");

  const repNames = [...new Set(PIPELINE_DEALS.map(d => d.owner))].sort();

  return (
    <div className={`max-w-6xl mx-auto ${isMobile ? "space-y-4" : "space-y-6"}`}>
      {/* Header + Metric Tiles */}
      <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
        <div>
          <h1 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-slate-800`}>Deal Pipeline</h1>
          <p className="text-slate-500 mt-0.5 text-sm">Visual overview of all deals by stage</p>
        </div>
        <div className={`flex ${isMobile ? "flex-wrap" : "items-center"} gap-3`}>
          <div className="bg-white border border-stone-200 rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-slate-400">Active Pipeline</p>
            <p className="text-lg font-bold text-slate-800">{formatCurrency(totalActive)}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-emerald-600">Won This Month</p>
            <p className="text-lg font-bold text-emerald-700">{formatCurrency(totalWon)}</p>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-rose-600">Lost This Month</p>
            <p className="text-lg font-bold text-rose-700">{formatCurrency(totalLost)}</p>
          </div>
          {closedDeals.length > 0 && (
            <button onClick={() => setShowGraveyard(!showGraveyard)} className={`border rounded-xl px-4 py-2 text-center transition ${showGraveyard ? "bg-slate-200 border-slate-400" : "bg-slate-50 border-slate-200 hover:border-slate-300"}`}>
              <p className="text-xs text-slate-500">Closed</p>
              <p className="text-lg font-bold text-slate-600">{closedDeals.length}</p>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        {!isRepOnly && (
          <div className="flex items-center gap-2">
            <User size={16} className="text-slate-400" />
            <select value={selectedRep} onChange={e => setSelectedRep(e.target.value)}
              className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent cursor-pointer">
              <option value="all">All Reps</option>
              {repNames.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-slate-400" />
          <select value={timePeriod} onChange={e => setTimePeriod(e.target.value)}
            className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent cursor-pointer">
            {timePeriods.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>
      </div>

      {isMobile ? (
        <div className="space-y-4">
          {stages.map(s => {
            const deals = filteredDeals.filter(d => d.stage === s.key);
            if (deals.length === 0) return null;
            const stageTotal = deals.reduce((sum, d) => sum + d.value, 0);
            return (
              <div key={s.key} className={`bg-white rounded-xl border border-stone-200 overflow-hidden`}>
                <div className={`px-4 py-2.5 border-l-4 ${s.color} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${s.text}`}>{s.label}</span>
                    <span className="text-xs bg-stone-100 text-slate-500 px-1.5 py-0.5 rounded-full">{deals.length}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{formatCurrency(stageTotal)}</span>
                </div>
                <div className="divide-y divide-stone-100">
                  {deals.map(d => (
                    <div key={d.id} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-800">{d.title}</p>
                        <span className="text-sm font-bold text-slate-700">{formatCurrency(d.value)}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{d.contact} – {d.company}</p>
                      {d.nextAction && <p className="text-xs text-slate-400 mt-1">{d.nextAction}</p>}
                      {d.stage === "lost" && d.lostReason && (
                        <p className="text-xs text-rose-500 mt-1">Reason: {LOST_REASONS.find(r => r.key === d.lostReason)?.label || d.lostReason}</p>
                      )}
                      {d.stage === "closed" && d.closedReason && (
                        <p className="text-xs text-slate-500 mt-1">Note: {d.closedReason}</p>
                      )}
                      {["discovery", "quote_request", "quote_sent"].includes(d.stage) && (
                        <button onClick={() => setCloseModal(d)} className="mt-2 w-full py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition">
                          Close Deal
                        </button>
                      )}
                      {d.stage === "awaiting_approval" && (
                        <div className="flex gap-1.5 mt-2">
                          <button onClick={() => setLostModal(d)} className="flex-1 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition">Lost</button>
                          <button className="flex-1 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md transition">Won</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {stages.map(s => {
            const deals = filteredDeals.filter(d => d.stage === s.key);
            const stageTotal = deals.reduce((sum, d) => sum + d.value, 0);
            return (
              <div key={s.key} className="flex-1 min-w-[180px]">
                <div className={`rounded-t-xl px-3 py-2 border-t-4 ${s.color} ${s.bg} flex items-center justify-between`}>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold ${s.text}`}>{s.label}</span>
                    <span className="text-xs bg-white/70 text-slate-500 px-1.5 py-0.5 rounded-full">{deals.length}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-600">{formatCurrency(stageTotal)}</span>
                </div>
                <div className="bg-stone-100 rounded-b-xl p-2 space-y-2 min-h-[200px]">
                  {deals.length === 0 && (
                    <div className="text-xs text-slate-400 text-center py-8">No deals</div>
                  )}
                  {deals.map(d => (
                    <div key={d.id} className="bg-white rounded-lg p-3 shadow-sm border border-stone-200 hover:shadow-md transition cursor-pointer">
                      <p className="text-sm font-semibold text-slate-800 leading-tight">{d.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{d.contact}</p>
                      <p className="text-xs text-slate-400">{d.company}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                        <span className="text-sm font-bold text-slate-700">{formatCurrency(d.value)}</span>
                        <span className="text-xs text-slate-400">{d.owner?.split(" ")[0]}</span>
                      </div>
                      {d.nextAction && !["won", "lost", "closed"].includes(d.stage) && (
                        <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                          <ArrowRight size={10} />{d.nextAction}
                        </p>
                      )}
                      {d.stage === "lost" && d.lostReason && (
                        <p className="text-xs text-rose-500 mt-1.5">Reason: {LOST_REASONS.find(r => r.key === d.lostReason)?.label || d.lostReason}</p>
                      )}
                      {d.stage === "closed" && d.closedReason && (
                        <p className="text-xs text-slate-500 mt-1.5">Note: {d.closedReason}</p>
                      )}
                      {["discovery", "quote_request", "quote_sent"].includes(d.stage) && (
                        <div className="mt-2 pt-2 border-t border-stone-100">
                          <button onClick={() => setCloseModal(d)} className="w-full py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition">
                            Close Deal
                          </button>
                        </div>
                      )}
                      {d.stage === "awaiting_approval" && (
                        <div className="flex gap-1.5 mt-2 pt-2 border-t border-stone-100">
                          <button onClick={() => setLostModal(d)} className="flex-1 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition">
                            Lost
                          </button>
                          <button className="flex-1 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md transition">
                            Won
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Closed Deals Graveyard */}
      {showGraveyard && closedDeals.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-700">Closed Deals</h2>
              <p className="text-xs text-slate-400 mt-0.5">{closedDeals.length} deal{closedDeals.length !== 1 ? "s" : ""} – {formatCurrency(closedDeals.reduce((s, d) => s + d.value, 0))} total value</p>
            </div>
            <button onClick={() => setShowGraveyard(false)} className="p-2 rounded-lg hover:bg-stone-100 text-slate-400 hover:text-slate-600 transition">
              <X size={18} />
            </button>
          </div>
          <div className="divide-y divide-stone-100">
            {closedDeals.map(d => (
              <div key={d.id} className="px-5 py-3 flex items-center justify-between hover:bg-stone-50 transition">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{d.title}</p>
                  <p className="text-xs text-slate-500">{d.contact} – {d.company}</p>
                  {d.closedReason && <p className="text-xs text-slate-400 mt-0.5">{d.closedReason}</p>}
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-sm font-bold text-slate-700">{formatCurrency(d.value)}</p>
                  <p className="text-xs text-slate-400">{d.owner?.split(" ")[0]}</p>
                  <button className="mt-1 text-xs font-medium text-amber-600 hover:text-amber-700 transition">
                    Reopen ↗
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lost Reason Modal */}
      {lostModal && (
        <LostReasonModal deal={lostModal} onClose={() => setLostModal(null)} />
      )}

      {/* Close Deal Modal */}
      {closeModal && (
        <CloseDealModal deal={closeModal} onClose={() => setCloseModal(null)} />
      )}
    </div>
  );
}


// ============================================================
// LOST REASON MODAL
// ============================================================

function LostReasonModal({ deal, onClose }) {
  const [reason, setReason] = useState("");
  const [otherText, setOtherText] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => onClose(), 1200);
  }

  return (
    <Modal title="Mark Deal as Lost" onClose={onClose}>
      {saved ? (
        <SuccessScreen message="Deal Marked as Lost" sub={`"${deal.title}" has been moved to Lost.`} />
      ) : (
        <div className="px-6 py-5 space-y-5 overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
          <div className="bg-rose-50 rounded-xl border border-rose-200 p-4">
            <p className="text-sm font-semibold text-slate-800">{deal.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{deal.contact} – {deal.company}</p>
            <p className="text-base font-bold text-slate-800 mt-2">{formatCurrency(deal.value)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Why was this deal lost?</label>
            <div className="grid grid-cols-2 gap-2">
              {LOST_REASONS.map(r => (
                <button key={r.key} onClick={() => setReason(r.key)}
                  className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition
                    ${reason === r.key ? "border-rose-400 bg-rose-50 text-rose-700" : "border-stone-200 bg-white text-slate-500 hover:border-stone-300"}`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          {reason === "other" && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Details</label>
              <input type="text" value={otherText} onChange={e => setOtherText(e.target.value)} placeholder="Please specify..."
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
            </div>
          )}
          <button onClick={handleSave} disabled={!reason}
            className="w-full py-3 rounded-xl font-semibold text-white transition bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed">
            Confirm Lost
          </button>
        </div>
      )}
    </Modal>
  );
}


// ============================================================
// CLOSE DEAL MODAL
// ============================================================

function CloseDealModal({ deal, onClose }) {
  const [reason, setReason] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => onClose(), 1200);
  }

  return (
    <Modal title="Close Deal" onClose={onClose}>
      {saved ? (
        <SuccessScreen message="Deal Closed" sub={`"${deal.title}" has been moved to closed deals.`} />
      ) : (
        <div className="px-6 py-5 space-y-5 overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-800">{deal.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{deal.contact} – {deal.company}</p>
            <p className="text-base font-bold text-slate-800 mt-2">{formatCurrency(deal.value)}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stageConfig(deal.stage).bg} ${stageConfig(deal.stage).text}`}>
                {stageConfig(deal.stage).label}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-3">This deal will be moved to closed deals where it can be filtered and re-evaluated at a later date.</p>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Reason for closing (optional)</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
              placeholder="e.g. Budget freeze, contact left company, revisit Q3..."
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none" />
          </div>
          <button onClick={handleSave}
            className="w-full py-3 rounded-xl font-semibold text-white transition bg-slate-600 hover:bg-slate-700">
            Close Deal
          </button>
        </div>
      )}
    </Modal>
  );
}


// ============================================================
// ADMIN VIEW
// ============================================================

function AdminView({ isMobile }) {
  const [showAddUser, setShowAddUser] = useState(false);
  const [userMenu, setUserMenu] = useState(null);

  const roleBadge = (role) => {
    const map = {
      rep: { bg: "bg-sky-100", text: "text-sky-700", label: "Rep" },
      manager: { bg: "bg-violet-100", text: "text-violet-700", label: "Manager" },
      admin: { bg: "bg-amber-100", text: "text-amber-700", label: "Admin" },
    };
    const c = map[role] || map.rep;
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span>;
  };

  return (
    <div className={`max-w-6xl mx-auto ${isMobile ? "space-y-4" : "space-y-6"}`}>
      <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
        <div>
          <h1 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-slate-800`}>Admin</h1>
          <p className="text-slate-500 mt-0.5 text-sm">Manage users, import data, system settings</p>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-700">Users</h2>
            <p className="text-xs text-slate-400 mt-0.5">{ADMIN_USERS.filter(u => u.status === "active").length} active of {ADMIN_USERS.length} total</p>
          </div>
          <button onClick={() => setShowAddUser(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition shadow-md">
            <UserPlus size={16} />Add User
          </button>
        </div>
        <div className={isMobile ? "divide-y divide-stone-100" : ""}>
          {!isMobile && (
            <div className="grid grid-cols-12 gap-4 px-5 py-2.5 bg-stone-50 text-xs font-medium text-slate-500 uppercase tracking-wide">
              <div className="col-span-3">Name</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-1">Role</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2">Created</div>
              <div className="col-span-1">Last Login</div>
              <div className="col-span-1"></div>
            </div>
          )}
          {ADMIN_USERS.map(u => (
            isMobile ? (
              <div key={u.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${u.status === "active" ? "bg-slate-800 text-white" : "bg-stone-200 text-stone-500"}`}>
                      {u.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                  </div>
                  {roleBadge(u.role)}
                </div>
                <div className="flex items-center justify-between mt-2 ml-11">
                  <span className="text-xs text-slate-400">Last login: {u.lastLogin}</span>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1 text-xs ${u.status === "active" ? "text-emerald-600" : "text-slate-400"}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${u.status === "active" ? "bg-emerald-500" : "bg-slate-300"}`} />
                      {u.status === "active" ? "Active" : "Inactive"}
                    </div>
                    <div className="relative">
                      <button onClick={() => setUserMenu(userMenu === u.id ? null : u.id)} className="p-1 rounded-lg hover:bg-stone-100 text-slate-400 hover:text-slate-600 transition">
                        <Settings size={14} />
                      </button>
                      {userMenu === u.id && (
                        <div className="absolute right-0 top-7 z-30 bg-white rounded-xl shadow-lg border border-stone-200 py-1 w-44">
                          <button onClick={() => setUserMenu(null)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-stone-50 transition text-left">
                            <Lock size={14} className="text-slate-400" />Reset Password
                          </button>
                          <button onClick={() => setUserMenu(null)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 transition text-left">
                            <XCircle size={14} />Disable User
                          </button>
                          <button onClick={() => setUserMenu(null)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition text-left">
                            <X size={14} />Delete User
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div key={u.id} className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-stone-100 items-center hover:bg-stone-50 transition">
                <div className="col-span-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${u.status === "active" ? "bg-slate-800 text-white" : "bg-stone-200 text-stone-500"}`}>
                    {u.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <span className="text-sm font-medium text-slate-800">{u.name}</span>
                </div>
                <div className="col-span-3 text-sm text-slate-500">{u.email}</div>
                <div className="col-span-1">{roleBadge(u.role)}</div>
                <div className="col-span-1">
                  <div className={`flex items-center gap-1.5 text-xs ${u.status === "active" ? "text-emerald-600" : "text-slate-400"}`}>
                    <div className={`w-2 h-2 rounded-full ${u.status === "active" ? "bg-emerald-500" : "bg-slate-300"}`} />
                    {u.status === "active" ? "Active" : "Inactive"}
                  </div>
                </div>
                <div className="col-span-2 text-xs text-slate-400">{u.created}</div>
                <div className="col-span-1 text-xs text-slate-400">{u.lastLogin}</div>
                <div className="col-span-1 text-right relative">
                  <button onClick={() => setUserMenu(userMenu === u.id ? null : u.id)} className="p-1.5 rounded-lg hover:bg-stone-100 text-slate-400 hover:text-slate-600 transition">
                    <Settings size={14} />
                  </button>
                  {userMenu === u.id && (
                    <div className="absolute right-0 top-8 z-30 bg-white rounded-xl shadow-lg border border-stone-200 py-1 w-44">
                      <button onClick={() => setUserMenu(null)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-stone-50 transition text-left">
                        <Lock size={14} className="text-slate-400" />Reset Password
                      </button>
                      <button onClick={() => setUserMenu(null)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 transition text-left">
                        <XCircle size={14} />Disable User
                      </button>
                      <button onClick={() => setUserMenu(null)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition text-left">
                        <X size={14} />Delete User
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Data Import */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200">
          <h2 className="text-base font-semibold text-slate-700">Data Import</h2>
          <p className="text-xs text-slate-400 mt-0.5">Import contacts from CSV, Excel, or migrate from HubSpot</p>
        </div>
        <div className={`p-5 ${isMobile ? "space-y-4" : "grid grid-cols-2 gap-5"}`}>
          <div className="border-2 border-dashed border-stone-300 rounded-xl p-6 text-center hover:border-amber-400 hover:bg-amber-50/30 transition cursor-pointer">
            <Users size={32} className="mx-auto text-stone-400 mb-3" />
            <p className="text-sm font-medium text-slate-700">Upload Contacts</p>
            <p className="text-xs text-slate-400 mt-1">Drag and drop or click to browse</p>
            <p className="text-xs text-slate-400 mt-0.5">Supports .csv, .xlsx, .xls</p>
          </div>
          <div className="border-2 border-dashed border-stone-300 rounded-xl p-6 text-center hover:border-amber-400 hover:bg-amber-50/30 transition cursor-pointer">
            <Building2 size={32} className="mx-auto text-stone-400 mb-3" />
            <p className="text-sm font-medium text-slate-700">Upload Companies</p>
            <p className="text-xs text-slate-400 mt-1">Drag and drop or click to browse</p>
            <p className="text-xs text-slate-400 mt-0.5">Supports .csv, .xlsx, .xls</p>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200">
          <h2 className="text-base font-semibold text-slate-700">Security</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Shield size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Two-Factor Authentication</p>
                <p className="text-xs text-slate-400">Require 2FA for all users</p>
              </div>
            </div>
            <div className="w-10 h-6 rounded-full bg-emerald-500 flex items-center justify-end cursor-pointer">
              <div className="w-5 h-5 bg-white rounded-full shadow mx-0.5" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center">
                <Lock size={18} className="text-sky-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Data Encryption</p>
                <p className="text-xs text-slate-400">AES-256 encryption at rest and in transit</p>
              </div>
            </div>
            <div className="w-10 h-6 rounded-full bg-emerald-500 flex items-center justify-end cursor-pointer">
              <div className="w-5 h-5 bg-white rounded-full shadow mx-0.5" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                <Eye size={18} className="text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Audit Logging</p>
                <p className="text-xs text-slate-400">All actions logged with user and timestamp</p>
              </div>
            </div>
            <div className="w-10 h-6 rounded-full bg-emerald-500 flex items-center justify-end cursor-pointer">
              <div className="w-5 h-5 bg-white rounded-full shadow mx-0.5" />
            </div>
          </div>
        </div>
      </div>

      {showAddUser && (
        <AddUserModal onClose={() => setShowAddUser(false)} />
      )}
    </div>
  );
}


// ============================================================
// ADD USER MODAL
// ============================================================

function AddUserModal({ onClose }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("rep");
  const [sendInvite, setSendInvite] = useState(true);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => onClose(), 1500);
  }

  return (
    <Modal title="Add User" onClose={onClose}>
      {saved ? (
        <SuccessScreen message="User Created" sub={`${firstName} ${lastName} has been added.${sendInvite ? " Invite email sent." : ""}`} />
      ) : (
        <div className="px-6 py-5 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">First Name *</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="e.g. Sarah"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Last Name *</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="e.g. Mitchell"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Email *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. sarah.m@precisiongroup.com.au"
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 0412 345 678"
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Role *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "rep", label: "Rep", color: "border-sky-400 bg-sky-50 text-sky-700" },
                { key: "manager", label: "Manager", color: "border-violet-400 bg-violet-50 text-violet-700" },
                { key: "admin", label: "Admin", color: "border-amber-400 bg-amber-50 text-amber-700" },
              ].map(r => (
                <button key={r.key} onClick={() => setRole(r.key)}
                  className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition
                    ${role === r.key ? r.color : "border-stone-200 bg-white text-slate-500 hover:border-stone-300"}`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 py-1 px-1">
            <button onClick={() => setSendInvite(!sendInvite)}
              className={`w-10 h-6 rounded-full transition-colors flex items-center ${sendInvite ? "bg-amber-500 justify-end" : "bg-stone-300 justify-start"}`}>
              <div className="w-5 h-5 bg-white rounded-full shadow mx-0.5" />
            </button>
            <div>
              <span className="text-sm font-medium text-slate-700">Send invite email</span>
              <p className="text-xs text-slate-400">User will receive a link to set their password</p>
            </div>
          </div>
          <button onClick={handleSave} disabled={!firstName || !lastName || !email}
            className="w-full py-3 rounded-xl font-semibold text-white transition bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed">
            Create User
          </button>
        </div>
      )}
    </Modal>
  );
}


// ============================================================
// MAIN APP
// ============================================================

export default function PrecisionCRM() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: "Bill Thompson", email: "bill.t@precisiongroup.com.au", role: "admin", initials: "BT" });
  const [activeView, setActiveView] = useState("rep");
  const [callsLogged, setCallsLogged] = useState(14);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [dealContactId, setDealContactId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function openDealModal(contactId) {
    setDealContactId(contactId || null);
    setShowDealModal(true);
  }

  function handleLogin(user) {
    setCurrentUser(user);
    setActiveView(user.role === "admin" ? "manager" : "rep");
    setIsLoggedIn(true);
    setCallsLogged(14);
  }

  function handleLogout() {
    setActiveView("rep");
    setIsLoggedIn(false);
  }

  const isAdmin = currentUser.role === "admin";
  const isManager = currentUser.role === "manager" || isAdmin;

  const LOGIN_USERS = [
    { name: "Bill Thompson", email: "bill.t@precisiongroup.com.au", role: "admin", title: "Admin", initials: "BT" },
    { name: "Chris Palmer", email: "chris.p@precisiongroup.com.au", role: "manager", title: "Manager", initials: "CP" },
    { name: "Sarah Mitchell", email: "sarah.m@precisiongroup.com.au", role: "rep", title: "Rep", initials: "SM" },
  ];

  const isRep = currentUser.role === "rep";
  const allNavItems = [
    { key: "rep", label: "My Day", icon: User, desc: "Daily workflow", hideForAdmin: true },
    { key: "contacts", label: isRep ? "My Contacts" : "Contacts", icon: BookOpen, desc: "Client database" },
    { key: "pipeline", label: isRep ? "My Deals" : "Deals", icon: Columns, desc: "Deal stages" },
    { key: "manager", label: "KPI Dashboard", icon: LayoutDashboard, desc: "Performance KPIs", hideForRep: true },
    { key: "admin", label: "Admin", icon: Settings, desc: "System settings", adminOnly: true },
  ];

  const navItems = allNavItems.filter(item => (!item.adminOnly || isAdmin) && (!item.hideForAdmin || !isAdmin) && (!item.hideForRep || !isRep));

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');`}</style>
      {!isLoggedIn ? (
        <div style={{ fontFamily: "'Outfit', sans-serif" }} className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
                <Target size={32} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Precision</h1>
              <p className="text-slate-400 text-sm mt-1">Sales CRM</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-2xl">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Sign in as</label>
                  <select value={currentUser.email} onChange={e => { const u = LOGIN_USERS.find(u => u.email === e.target.value); if (u) setCurrentUser(u); }}
                    className="w-full px-3 pr-8 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent cursor-pointer">
                    {LOGIN_USERS.map(u => { const parts = u.name.split(" "); return <option key={u.email} value={u.email}>{parts[0]} {parts[1][0]}. – {u.title}</option>; })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
                  <input type="email" value={currentUser.email} readOnly className="w-full px-3 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-slate-600 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Password</label>
                  <input type="password" defaultValue="••••••••••" className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
                </div>
                <button onClick={() => handleLogin(currentUser)}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-amber-500 hover:bg-amber-600 transition shadow-md">
                  Sign In
                </button>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-100">
                <a href="#" className="text-xs text-amber-600 hover:text-amber-700 font-medium">Forgot password?</a>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Shield size={12} className="text-emerald-500" />
                  Secured with 2FA
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-slate-500 mt-6">&copy; 2026 Precision Group. All rights reserved.</p>
          </div>
        </div>
      ) : (
      <div style={{ fontFamily: "'Outfit', sans-serif" }} className={`flex ${isMobile ? "flex-col" : "flex-row"} h-screen bg-stone-50`}>

        {/* Sidebar - desktop only */}
        {!isMobile && (
          <nav className="w-56 bg-slate-900 flex flex-col flex-shrink-0">
            <div className="px-5 py-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                  <Target size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">Precision</p>
                  <p className="text-slate-400 text-xs leading-tight">Sales CRM</p>
                </div>
              </div>
            </div>

            <div className="flex-1 px-3 space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const active = activeView === item.key;
                return (
                  <button key={item.key} onClick={() => setActiveView(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition
                      ${active ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
                    <Icon size={18} />
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className={`text-xs ${active ? "text-slate-400" : "text-slate-500"}`}>{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="px-3 pb-4">
              <div className="px-3 py-3 rounded-xl bg-slate-800 text-slate-400 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium text-sm">{currentUser.name}</p>
                    <p className="mt-0.5">{currentUser.role === "admin" ? "Administrator" : currentUser.role === "manager" ? "Sales Manager" : "Sales Representative"}</p>
                  </div>
                  <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition" title="Sign out">
                    <LogOut size={14} />
                  </button>
                </div>
              </div>
            </div>
          </nav>
        )}

        {/* Top Tab Bar - mobile only */}
        {isMobile && (
          <nav className="bg-slate-900 border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
                  <Target size={14} className="text-white" />
                </div>
                <span className="text-white font-bold text-sm">Precision</span>
              </div>
              <div className="flex items-center gap-2">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const active = activeView === item.key;
                  const shortLabel = { "rep": item.label, "contacts": isRep ? "My Contacts" : "Contacts", "pipeline": isRep ? "My Deals" : "Deals", "manager": "KPIs", "admin": "Admin" }[item.key] || item.label;
                  return (
                    <button key={item.key} onClick={() => setActiveView(item.key)}
                      className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition
                        ${active ? "text-amber-400 bg-slate-800" : "text-slate-500"}`}>
                      <Icon size={18} />
                      <span className="text-[10px] font-medium">{shortLabel}</span>
                    </button>
                  );
                })}
                <button onClick={handleLogout}
                  className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition text-slate-500 hover:text-rose-400">
                  <LogOut size={18} />
                  <span className="text-[10px] font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </nav>
        )}

        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto ${isMobile ? "p-4" : "p-6 lg:p-8"}`}>
          {activeView === "rep" && (
            <RepView callsLogged={callsLogged} onLogCall={() => setShowCallModal(true)} onNewDeal={() => openDealModal()} onAddNote={() => setShowNoteModal(true)} onNewContact={() => setShowContactModal(true)} isMobile={isMobile} userName={currentUser.name.split(" ")[0]} currentUser={currentUser} />
          )}
          {activeView === "contacts" && (
            <ContactsView onNewContact={() => setShowContactModal(true)} onNewDeal={(contactId) => openDealModal(contactId)} onAddNote={() => setShowNoteModal(true)} onLogCall={() => setShowCallModal(true)} isMobile={isMobile} currentUser={currentUser} />
          )}
          {activeView === "pipeline" && <PipelineView isMobile={isMobile} currentUser={currentUser} />}
          {activeView === "manager" && <ManagerDashboard isMobile={isMobile} currentUser={currentUser} />}
          {activeView === "admin" && <AdminView isMobile={isMobile} />}
        </main>

        {/* Modals */}
        {showCallModal && (
          <CallLogModal onClose={() => setShowCallModal(false)} onSave={() => setCallsLogged(prev => prev + 1)} />
        )}
        {showContactModal && (
          <NewContactModal onClose={() => setShowContactModal(false)} onSave={(data) => { console.log("New contact:", data); }} />
        )}
        {showDealModal && (
          <NewDealModal onClose={() => { setShowDealModal(false); setDealContactId(null); }} onSave={(data) => { console.log("New deal:", data); }} defaultContact={dealContactId} />
        )}
        {showNoteModal && (
          <QuickNoteModal onClose={() => setShowNoteModal(false)} currentUser={currentUser} />
        )}
      </div>
      )}
    </>
  );
}
