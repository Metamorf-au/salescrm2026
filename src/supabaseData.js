import { supabase } from "./supabaseClient";

// ============================================================
// DATE HELPERS
// ============================================================

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

// ============================================================
// FETCH CONTACTS (with company + owner joins)
// ============================================================

export async function fetchContacts() {
  const { data, error } = await supabase
    .from("contacts")
    .select(`
      id, first_name, last_name, email, phone, mobile, job_title, industry,
      address_line1, suburb, state, postcode, status, last_contact_at,
      company_id, owner_id, created_at,
      companies(id, name),
      profiles!contacts_owner_id_fkey(id, name)
    `)
    .order("last_name");
  if (error) { console.error("Error loading contacts:", error); return []; }
  return (data || []).map(c => ({
    id: c.id,
    name: `${c.first_name} ${c.last_name}`,
    firstName: c.first_name,
    lastName: c.last_name,
    company: c.companies?.name || "",
    companyId: c.company_id,
    phone: c.phone || "",
    mobile: c.mobile || "",
    email: c.email || "",
    jobTitle: c.job_title || "",
    industry: c.industry || "",
    addressLine1: c.address_line1 || "",
    suburb: c.suburb || "",
    state: c.state || "",
    postcode: c.postcode || "",
    location: [c.suburb, c.state, c.postcode].filter(Boolean).join(", ") || "",
    owner: c.profiles?.name || "",
    ownerId: c.owner_id,
    lastContact: formatRelativeDate(c.last_contact_at),
    lastContactRaw: c.last_contact_at || null,
    status: c.status,
    createdAt: c.created_at,
  }));
}

// ============================================================
// FETCH DEALS (with contact + company + owner joins)
// ============================================================

export async function fetchDeals() {
  const { data, error } = await supabase
    .from("deals")
    .select(`
      id, title, stage, value, next_action, next_date, todo_completed_at,
      quote_requested_at, quote_sent_at, won_at, lost_at, lost_reason, closed_reason,
      contact_id, company_id, owner_id, created_at,
      contacts(id, first_name, last_name),
      companies(id, name),
      profiles!deals_owner_id_fkey(id, name)
    `)
    .order("created_at", { ascending: false });
  if (error) { console.error("Error loading deals:", error); return []; }
  return (data || []).map(d => ({
    id: d.id,
    title: d.title,
    contact: d.contacts ? `${d.contacts.first_name} ${d.contacts.last_name}` : "",
    contactId: d.contact_id,
    company: d.companies?.name || "",
    companyId: d.company_id,
    stage: d.stage,
    value: Number(d.value),
    nextAction: d.next_action,
    nextDate: d.next_date,
    todoCompletedAt: d.todo_completed_at || null,
    owner: d.profiles?.name || "",
    ownerId: d.owner_id,
    quoteRequestedAt: d.quote_requested_at,
    quoteSentAt: d.quote_sent_at,
    lostReason: d.lost_reason,
    closedReason: d.closed_reason,
    createdAt: d.created_at,
  }));
}

// ============================================================
// FETCH ALL NOTES (grouped by contact_id)
// ============================================================

export async function fetchAllNotes() {
  const { data, error } = await supabase
    .from("notes")
    .select(`
      id, contact_id, type, text, reminder_at, completed_at, created_at,
      profiles!notes_author_id_fkey(name)
    `)
    .order("created_at", { ascending: false });
  if (error) { console.error("Error loading notes:", error); return {}; }
  const grouped = {};
  for (const n of (data || [])) {
    if (!grouped[n.contact_id]) grouped[n.contact_id] = [];
    grouped[n.contact_id].push({
      id: n.id,
      text: n.text,
      date: formatShortDate(n.created_at),
      author: n.profiles?.name || "",
      type: n.type,
      reminder: n.reminder_at || undefined,
      completedAt: n.completed_at || null,
    });
  }
  return grouped;
}

export async function completeNote(noteId) {
  const { error } = await supabase
    .from("notes")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", noteId);
  if (error) throw new Error(error.message);
}

export async function completeDealTodo(dealId) {
  const { error } = await supabase
    .from("deals")
    .update({ todo_completed_at: new Date().toISOString() })
    .eq("id", dealId);
  if (error) throw new Error(error.message);
}

// ============================================================
// FETCH ALL CALLS (raw array, plus grouped by contact)
// ============================================================

export async function fetchAllCalls() {
  const { data, error } = await supabase
    .from("calls")
    .select(`
      id, contact_id, caller_id, outcome, summary, called_at,
      contacts(first_name, last_name),
      profiles!calls_caller_id_fkey(name)
    `)
    .order("called_at", { ascending: false });
  if (error) { console.error("Error loading calls:", error); return []; }
  return (data || []).map(c => ({
    id: c.id,
    contactId: c.contact_id,
    callerId: c.caller_id,
    contactName: c.contacts ? `${c.contacts.first_name} ${c.contacts.last_name}` : "",
    callerName: c.profiles?.name || "",
    outcome: c.outcome,
    summary: c.summary || "",
    calledAt: c.called_at,
  }));
}

// Group raw calls by contact_id into the shape ContactsView expects
export function groupCallsByContact(rawCalls) {
  const grouped = {};
  for (const c of rawCalls) {
    if (!grouped[c.contactId]) grouped[c.contactId] = [];
    const d = new Date(c.calledAt);
    grouped[c.contactId].push({
      id: c.id,
      date: d.toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
      time: d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true }),
      outcome: c.outcome,
      summary: c.summary,
    });
  }
  return grouped;
}

// ============================================================
// FETCH REPS (active profiles for dropdowns/filters)
// ============================================================

export async function fetchReps() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, role")
    .eq("status", "active")
    .order("name");
  if (error) { console.error("Error loading reps:", error); return []; }
  return (data || []).map(p => ({
    id: p.id,
    name: p.name,
    initials: p.name.split(" ").map(n => n[0]).join("").toUpperCase(),
    role: p.role,
  }));
}

// ============================================================
// FETCH ACTIVITY LOG
// ============================================================

export async function fetchActivityLog(userId, isManagerOrAdmin) {
  let query = supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (!isManagerOrAdmin && userId) {
    query = query.eq("user_id", userId);
  }
  const { data, error } = await query;
  if (error) { console.error("Error loading activity log:", error); return []; }
  return (data || []).map(a => ({
    id: a.id,
    activityType: a.activity_type,
    contact: a.contact_name || "",
    company: a.company_name || "",
    summary: a.summary || "",
    outcome: a.metadata?.outcome,
    createdAt: a.created_at,
    time: new Date(a.created_at).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase(),
    userId: a.user_id,
  }));
}

// ============================================================
// INSERT HELPERS
// ============================================================

export async function insertContact({ firstName, lastName, email, phone, mobile, jobTitle, industry, companyName, addressLine1, suburb, state, postcode, ownerId }) {
  // Find or create company
  let companyId = null;
  if (companyName?.trim()) {
    const { data: existing } = await supabase
      .from("companies")
      .select("id")
      .ilike("name", companyName.trim())
      .limit(1)
      .single();
    if (existing) {
      companyId = existing.id;
    } else {
      const { data: newCo, error: coErr } = await supabase
        .from("companies")
        .insert({
          name: companyName.trim(),
          owner_id: ownerId,
          city: suburb?.trim() || null,
          state: state?.trim() || null,
          industry: industry?.trim() || null,
        })
        .select("id")
        .single();
      if (coErr) console.error("Error creating company:", coErr);
      else companyId = newCo.id;
    }
  }
  const { data, error } = await supabase
    .from("contacts")
    .insert({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      mobile: mobile?.trim() || null,
      job_title: jobTitle?.trim() || null,
      industry: industry?.trim() || null,
      company_id: companyId,
      owner_id: ownerId,
      address_line1: addressLine1?.trim() || null,
      suburb: suburb?.trim() || null,
      state: state?.trim() || null,
      postcode: postcode?.trim() || null,
      status: "new",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { contactId: data.id, companyId };
}

export async function updateContact(contactId, { firstName, lastName, email, phone, mobile, jobTitle, industry, companyName, addressLine1, suburb, state, postcode, ownerId }) {
  // Find or create company
  let companyId = null;
  if (companyName?.trim()) {
    const { data: existing } = await supabase
      .from("companies")
      .select("id")
      .ilike("name", companyName.trim())
      .limit(1)
      .single();
    if (existing) {
      companyId = existing.id;
    } else {
      const { data: newCo, error: coErr } = await supabase
        .from("companies")
        .insert({
          name: companyName.trim(),
          owner_id: ownerId,
          city: suburb?.trim() || null,
          state: state?.trim() || null,
          industry: industry?.trim() || null,
        })
        .select("id")
        .single();
      if (coErr) console.error("Error creating company:", coErr);
      else companyId = newCo.id;
    }
  }
  const { error } = await supabase
    .from("contacts")
    .update({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      mobile: mobile?.trim() || null,
      job_title: jobTitle?.trim() || null,
      industry: industry?.trim() || null,
      company_id: companyId,
      address_line1: addressLine1?.trim() || null,
      suburb: suburb?.trim() || null,
      state: state?.trim() || null,
      postcode: postcode?.trim() || null,
    })
    .eq("id", contactId);
  if (error) throw new Error(error.message);
}

export async function deleteContact(contactId) {
  // Delete associated notes and calls first (cascade should handle this, but be explicit)
  await supabase.from("notes").delete().eq("contact_id", contactId);
  await supabase.from("calls").delete().eq("contact_id", contactId);
  // Nullify deals referencing this contact (don't delete deals)
  await supabase.from("deals").update({ contact_id: null }).eq("contact_id", contactId);
  const { error } = await supabase.from("contacts").delete().eq("id", contactId);
  if (error) throw new Error(error.message);
}

export async function bulkDeleteContacts(contactIds) {
  // Clean up associated data
  await supabase.from("notes").delete().in("contact_id", contactIds);
  await supabase.from("calls").delete().in("contact_id", contactIds);
  await supabase.from("deals").update({ contact_id: null }).in("contact_id", contactIds);
  const { error } = await supabase.from("contacts").delete().in("id", contactIds);
  if (error) throw new Error(error.message);
}

export async function bulkReassignContacts(contactIds, newOwnerId) {
  const { error } = await supabase
    .from("contacts")
    .update({ owner_id: newOwnerId })
    .in("id", contactIds);
  if (error) throw new Error(error.message);
}

export async function bulkArchiveContacts(contactIds) {
  const { error } = await supabase
    .from("contacts")
    .update({ status: "archived" })
    .in("id", contactIds);
  if (error) throw new Error(error.message);
}

export async function bulkUnarchiveContacts(contactIds) {
  const { error } = await supabase
    .from("contacts")
    .update({ status: "active" })
    .in("id", contactIds);
  if (error) throw new Error(error.message);
}

export async function insertCall({ contactId, callerId, outcome, summary, calledAt }) {
  const { data, error } = await supabase
    .from("calls")
    .insert({
      contact_id: contactId,
      caller_id: callerId,
      outcome,
      summary: summary || null,
      called_at: calledAt || new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  // Update last_contact_at on the contact
  await supabase
    .from("contacts")
    .update({ last_contact_at: calledAt || new Date().toISOString() })
    .eq("id", contactId);
  return data;
}

export async function insertNote({ contactId, authorId, type, text, reminderAt }) {
  const { data, error } = await supabase
    .from("notes")
    .insert({
      contact_id: contactId,
      author_id: authorId,
      type: type || "general",
      text,
      reminder_at: reminderAt || null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function insertDeal({ title, contactId, companyId, stage, value, nextAction, nextDate, ownerId, quoteRequestedAt, quoteSentAt }) {
  const { data, error } = await supabase
    .from("deals")
    .insert({
      title,
      contact_id: contactId,
      company_id: companyId || null,
      stage: stage || "discovery",
      value: value || 0,
      next_action: nextAction || null,
      next_date: nextDate || null,
      owner_id: ownerId,
      quote_requested_at: quoteRequestedAt || null,
      quote_sent_at: quoteSentAt || null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateDeal(dealId, updates) {
  const dbUpdates = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.value !== undefined) dbUpdates.value = updates.value;
  if (updates.stage !== undefined) dbUpdates.stage = updates.stage;
  if (updates.lostReason !== undefined) dbUpdates.lost_reason = updates.lostReason;
  if (updates.closedReason !== undefined) dbUpdates.closed_reason = updates.closedReason;
  if (updates.wonAt !== undefined) dbUpdates.won_at = updates.wonAt;
  if (updates.lostAt !== undefined) dbUpdates.lost_at = updates.lostAt;
  if (updates.nextAction !== undefined) dbUpdates.next_action = updates.nextAction;
  if (updates.nextDate !== undefined) {
    dbUpdates.next_date = updates.nextDate;
    // Reset completion when a new next date is set (new todo cycle)
    if (updates.nextDate) dbUpdates.todo_completed_at = null;
  }
  if (updates.quoteSentAt !== undefined) dbUpdates.quote_sent_at = updates.quoteSentAt;
  if (updates.quoteRequestedAt !== undefined) dbUpdates.quote_requested_at = updates.quoteRequestedAt;
  const { error } = await supabase.from("deals").update(dbUpdates).eq("id", dealId);
  if (error) throw new Error(error.message);
}

export async function insertActivity({ userId, activityType, contactName, companyName, summary, metadata }) {
  const { error } = await supabase.from("activity_log").insert({
    user_id: userId,
    activity_type: activityType,
    contact_name: contactName || null,
    company_name: companyName || null,
    summary: summary || null,
    metadata: metadata || {},
  });
  if (error) console.error("Error logging activity:", error);
}

// ============================================================
// WEEKLY SUMMARIES
// ============================================================

export function getCurrentWeekStart() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = todayStart.getDay();
  todayStart.setDate(todayStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Monday
  return todayStart.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export async function fetchWeeklySummary(userId, weekStart) {
  const { data, error } = await supabase
    .from("weekly_summaries")
    .select("id, summary")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();
  if (error) { console.error("Error loading weekly summary:", error); return ""; }
  return data?.summary || "";
}

export async function upsertWeeklySummary(userId, weekStart, summary) {
  const { error } = await supabase
    .from("weekly_summaries")
    .upsert(
      { user_id: userId, week_start: weekStart, summary },
      { onConflict: "user_id,week_start" }
    );
  if (error) throw new Error(error.message);
}

// ============================================================
// FETCH ADMIN ACTIVITY LOG (with server-side filters)
// ============================================================

export async function fetchAdminActivityLog({ activityType, startDate, endDate, userId, limit = 500 } = {}) {
  let query = supabase
    .from("activity_log")
    .select(`
      id, user_id, activity_type, contact_name, company_name, summary, metadata, created_at,
      profiles!activity_log_user_id_fkey(name)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (activityType) {
    query = query.eq("activity_type", activityType);
  }
  if (startDate) {
    query = query.gte("created_at", startDate);
  }
  if (endDate) {
    query = query.lte("created_at", endDate);
  }
  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;
  if (error) { console.error("Error loading admin activity log:", error); return []; }
  return (data || []).map(a => ({
    id: a.id,
    userId: a.user_id,
    userName: a.profiles?.name || "",
    activityType: a.activity_type,
    contact: a.contact_name || "",
    company: a.company_name || "",
    summary: a.summary || "",
    outcome: a.metadata?.outcome,
    createdAt: a.created_at,
  }));
}

// ============================================================
// KPI TARGETS (per-rep weekly targets)
// ============================================================

export async function fetchKpiTargets() {
  const { data, error } = await supabase
    .from("kpi_targets")
    .select("user_id, weekly_calls, weekly_meetings, weekly_contacts, weekly_quotes");
  if (error) { console.error("Error loading KPI targets:", error); return {}; }
  const map = {};
  for (const row of (data || [])) {
    map[row.user_id] = {
      weeklyCalls: row.weekly_calls,
      weeklyMeetings: row.weekly_meetings,
      weeklyContacts: row.weekly_contacts,
      weeklyQuotes: row.weekly_quotes,
    };
  }
  return map;
}

export async function upsertKpiTargets(userId, targets) {
  const { error } = await supabase
    .from("kpi_targets")
    .upsert(
      {
        user_id: userId,
        weekly_calls: targets.weeklyCalls,
        weekly_meetings: targets.weeklyMeetings,
        weekly_contacts: targets.weeklyContacts,
        weekly_quotes: targets.weeklyQuotes,
      },
      { onConflict: "user_id" }
    );
  if (error) throw new Error(error.message);
}

// ============================================================
// COMPUTE REP METRICS (for Manager Dashboard)
// ============================================================

export function computeRepMetrics(repId, rawCalls, deals, contacts, dateRange) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  const dayOfWeek = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Monday start

  // Use provided date range or default to this week
  const rangeStart = dateRange?.start || weekStart;
  const rangeEnd = dateRange?.end || null; // null = up to now

  const repCalls = rawCalls.filter(c => c.callerId === repId);

  // Always compute today's calls (used for status traffic-light)
  const callsToday = repCalls.filter(c => new Date(c.calledAt) >= todayStart).length;
  const callsWeek = repCalls.filter(c => new Date(c.calledAt) >= weekStart).length;

  // Range-filtered metrics
  const callsInRange = repCalls.filter(c => {
    const d = new Date(c.calledAt);
    return d >= rangeStart && (!rangeEnd || d < rangeEnd);
  }).length;

  const meetingsSet = repCalls.filter(c => {
    const d = new Date(c.calledAt);
    return c.outcome === "meeting" && d >= rangeStart && (!rangeEnd || d < rangeEnd);
  }).length;

  const newContacts = contacts.filter(c => {
    const d = c.createdAt ? new Date(c.createdAt) : null;
    return c.ownerId === repId && d && d >= rangeStart && (!rangeEnd || d < rangeEnd);
  }).length;

  const repDeals = deals.filter(d => d.ownerId === repId);
  const activeDeals = repDeals.filter(d => !["won", "lost", "closed"].includes(d.stage));
  const dealsWithNext = activeDeals.filter(d => d.nextAction);
  const oppWithNext = activeDeals.length > 0 ? Math.round((dealsWithNext.length / activeDeals.length) * 100) : 100;
  const pipelineClean = activeDeals.length === 0 || activeDeals.every(d => d.nextAction);

  // Quotes sent within the date range
  const quotesSentCount = repDeals.filter(d => {
    if (!d.quoteSentAt) return false;
    const sent = new Date(d.quoteSentAt);
    return sent >= rangeStart && (!rangeEnd || sent < rangeEnd);
  }).length;

  return {
    callsToday,
    callsWeek,
    callsInRange,
    meetingsSet,
    newContacts,
    oppWithNext,
    pipelineClean,
    activeDealsCount: activeDeals.length,
    dealsWithNextCount: dealsWithNext.length,
    quotesSentCount,
    summaryDone: false,
  };
}
