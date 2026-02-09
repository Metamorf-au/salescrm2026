// ============================================================
// FORMATTERS & HELPER FUNCTIONS
// ============================================================

export function formatCurrency(val) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
}

export function getReminderDate(presetKey, fromDate) {
  const d = fromDate ? new Date(fromDate) : new Date();
  const map = { "1d": 1, "2d": 2, "3d": 3, "1w": 7, "2w": 14, "1m": 30 };
  d.setDate(d.getDate() + (map[presetKey] || 0));
  return d;
}

export function formatReminderDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  const tom = new Date(now); tom.setDate(tom.getDate() + 1);
  const isTomorrow = d.getFullYear() === tom.getFullYear() && d.getMonth() === tom.getMonth() && d.getDate() === tom.getDate();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  const datePart = isToday ? "Today" : isTomorrow ? "Tomorrow" : `${dd}/${mm}/${yy}`;
  if (dateStr.includes("T")) {
    const hh = d.getHours();
    const min = String(d.getMinutes()).padStart(2, "0");
    const ampm = hh >= 12 ? "pm" : "am";
    const hh12 = hh % 12 || 12;
    return `${datePart} ${hh12}:${min}${ampm}`;
  }
  return datePart;
}

export function isOverdue(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return d < todayStart;
}

export function formatRelativeDate(dateStr) {
  if (!dateStr) return "Never";
  const d = new Date(dateStr);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  if (d >= todayStart) return "Today";
  if (d >= yesterdayStart) return "Yesterday";
  const diffDays = Math.floor((todayStart - d) / 86400000);
  if (diffDays <= 7) return `${diffDays} days ago`;
  if (diffDays <= 14) return "1 week ago";
  if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export function formatShortDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (d >= todayStart) return "Just now";
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}
