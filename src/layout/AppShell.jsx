import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { User, BookOpen, Columns, LayoutDashboard, Settings } from "lucide-react";
import logo from "../assets/my-day-logo.svg";
import {
  fetchContacts, fetchDeals, fetchAllNotes, fetchAllCalls, fetchReps,
  fetchActivityLog, groupCallsByContact,
  insertContact, updateContact, deleteContact, bulkDeleteContacts, bulkReassignContacts, bulkArchiveContacts, bulkUnarchiveContacts,
  insertCall, insertNote, insertDeal, updateDeal, insertActivity,
  completeNote, completeDealTodo,
} from "../supabaseData";

// Views
import RepView from "../rep/RepView";
import ContactsView from "../contacts/ContactsView";
import PipelineView from "../deals/PipelineView";
import ManagerDashboard from "../manager/ManagerDashboard";
import AdminView from "../admin/AdminView";

// Modals
import CallLogModal from "../contacts/CallLogModal";
import NewContactModal from "../contacts/NewContactModal";
import EditContactModal from "../contacts/EditContactModal";
import NewDealModal from "../deals/NewDealModal";
import EditDealModal from "../deals/EditDealModal";
import QuickNoteModal from "../contacts/QuickNoteModal";
import MyProfileModal from "../profile/MyProfileModal";

// Layout
import DesktopSidebar from "./DesktopSidebar";
import MobileTabBar from "./MobileTabBar";

// Auth
import LoginScreen from "../auth/LoginScreen";
import ResetPasswordScreen from "../auth/ResetPasswordScreen";

import { formatCurrency } from "../shared/formatters";

const VALID_VIEWS = ["rep", "contacts", "pipeline", "manager", "admin"];

function getViewFromHash() {
  const hash = window.location.hash.replace("#", "");
  return VALID_VIEWS.includes(hash) ? hash : null;
}

export default function AppShell() {
  // Auth state
  const [authLoading, setAuthLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [recoveryMode, setRecoveryMode] = useState(false);

  // Navigation
  const [activeView, setActiveView] = useState("rep");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  function navigateTo(view) {
    setActiveView(view);
    window.location.hash = view;
  }

  // Data state
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [notesByContact, setNotesByContact] = useState({});
  const [rawCalls, setRawCalls] = useState([]);
  const [reps, setReps] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Modal state
  const [showCallModal, setShowCallModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showMyProfile, setShowMyProfile] = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [editDeal, setEditDeal] = useState(null);
  const [dealContactId, setDealContactId] = useState(null);

  // Responsive
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Hash-based routing: sync activeView from browser back/forward
  useEffect(() => {
    function onHashChange() {
      const view = getViewFromHash();
      if (view) setActiveView(view);
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // ============================================================
  // AUTH
  // ============================================================

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
        setAuthLoading(false);
        return;
      }
      if (event === "USER_UPDATED" && session) {
        await supabase.from("profiles").update({ email: session.user.email }).eq("id", session.user.id);
      }
      if (session) loadProfile(session.user.id);
      else {
        setCurrentUser(null);
        setIsLoggedIn(false);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId) {
    const { data } = await supabase
      .from("profiles")
      .select("name, email, role, status")
      .eq("id", userId)
      .single();
    if (data) {
      const names = data.name.split(" ");
      const initials = names.map(n => n[0]).join("").toUpperCase();
      const user = { id: userId, name: data.name, email: data.email, role: data.role, initials };
      setCurrentUser(user);
      // Restore view from URL hash, or use role-based default
      const hashView = getViewFromHash();
      const roleDefault = user.role === "admin" ? "manager" : "rep";
      const view = hashView || roleDefault;
      setActiveView(view);
      window.location.hash = view;
      setIsLoggedIn(true);
    }
    setAuthLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setActiveView("rep");
    window.location.hash = "";
    setIsLoggedIn(false);
    setCurrentUser(null);
    setContacts([]);
    setDeals([]);
    setNotesByContact({});
    setRawCalls([]);
    setReps([]);
    setActivityLog([]);
  }

  // ============================================================
  // DATA LOADING
  // ============================================================

  const loadAllData = useCallback(async () => {
    if (!currentUser) return;
    setDataLoading(true);
    const isManagerOrAdmin = currentUser.role === "manager" || currentUser.role === "admin";
    const [c, d, n, calls, r, a] = await Promise.all([
      fetchContacts(),
      fetchDeals(),
      fetchAllNotes(),
      fetchAllCalls(),
      fetchReps(),
      fetchActivityLog(currentUser.id, isManagerOrAdmin),
    ]);
    setContacts(c);
    setDeals(d);
    setNotesByContact(n);
    setRawCalls(calls);
    setReps(r);
    setActivityLog(a);
    setDataLoading(false);
  }, [currentUser]);

  useEffect(() => {
    if (isLoggedIn && currentUser) loadAllData();
  }, [isLoggedIn, currentUser, loadAllData]);

  // Derived data
  const callsByContact = groupCallsByContact(rawCalls);

  // ============================================================
  // MUTATION HANDLERS
  // ============================================================

  async function handleSaveCall(data) {
    const contact = contacts.find(c => c.id === data.contactId);
    await insertCall({
      contactId: data.contactId,
      callerId: currentUser.id,
      outcome: data.outcome,
      summary: data.summary,
    });
    await insertActivity({
      userId: currentUser.id,
      activityType: "call",
      contactName: contact?.name,
      companyName: contact?.company,
      summary: data.summary || "Call logged",
      metadata: { outcome: data.outcome },
    });
    // Create meeting note if outcome is meeting
    if (data.outcome === "meeting" && data.meetingDate && data.meetingTime && contact) {
      const meetingText = data.meetingNote || `Meeting with ${contact.name}`;
      const reminder = `${data.meetingDate}T${data.meetingTime}:00`;
      await insertNote({
        contactId: data.contactId,
        authorId: currentUser.id,
        type: "meeting",
        text: meetingText,
        reminderAt: reminder,
      });
    }
    // Create follow-up note if next step provided
    if (data.nextStep && contact) {
      await insertNote({
        contactId: data.contactId,
        authorId: currentUser.id,
        type: "follow_up",
        text: data.nextStep,
        reminderAt: data.nextDate || null,
      });
    }
    await loadAllData();
  }

  async function handleSaveContact(data) {
    const result = await insertContact({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      mobile: data.mobile,
      jobTitle: data.jobTitle,
      industry: data.industry,
      companyName: data.company,
      addressLine1: data.addressLine1,
      suburb: data.suburb,
      state: data.state,
      postcode: data.postcode,
      ownerId: currentUser.id,
    });
    await insertActivity({
      userId: currentUser.id,
      activityType: "new_contact",
      contactName: `${data.firstName} ${data.lastName}`,
      companyName: data.company,
      summary: "New contact added",
    });
    await loadAllData();
    return result;
  }

  async function handleEditContact(contactId, data) {
    await updateContact(contactId, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      mobile: data.mobile,
      jobTitle: data.jobTitle,
      industry: data.industry,
      companyName: data.company,
      addressLine1: data.addressLine1,
      suburb: data.suburb,
      state: data.state,
      postcode: data.postcode,
      ownerId: currentUser.id,
    });
    await insertActivity({
      userId: currentUser.id,
      activityType: "contact_updated",
      contactName: `${data.firstName} ${data.lastName}`,
      companyName: data.company,
      summary: "Contact updated",
    });
    await loadAllData();
  }

  async function handleDeleteContact(contactId, contactName, companyName) {
    await deleteContact(contactId);
    await insertActivity({
      userId: currentUser.id,
      activityType: "contact_updated",
      contactName,
      companyName,
      summary: `Contact deleted: ${contactName}`,
    });
    await loadAllData();
  }

  async function handleBulkDelete(ids, selectedContacts) {
    await bulkDeleteContacts(ids);
    await insertActivity({
      userId: currentUser.id,
      activityType: "contact_updated",
      contactName: `${ids.length} contacts`,
      summary: `Bulk deleted ${ids.length} contacts`,
    });
    await loadAllData();
  }

  async function handleBulkArchive(ids) {
    await bulkArchiveContacts(ids);
    await insertActivity({
      userId: currentUser.id,
      activityType: "contact_updated",
      contactName: `${ids.length} contacts`,
      summary: `Archived ${ids.length} contacts`,
    });
    await loadAllData();
  }

  async function handleBulkUnarchive(ids) {
    await bulkUnarchiveContacts(ids);
    await insertActivity({
      userId: currentUser.id,
      activityType: "contact_updated",
      contactName: `${ids.length} contacts`,
      summary: `Restored ${ids.length} contacts from archive`,
    });
    await loadAllData();
  }

  async function handleBulkReassign(ids, newOwnerId, newOwnerName) {
    await bulkReassignContacts(ids, newOwnerId);
    await insertActivity({
      userId: currentUser.id,
      activityType: "contact_updated",
      contactName: `${ids.length} contacts`,
      summary: `Reassigned ${ids.length} contacts to ${newOwnerName}`,
    });
    await loadAllData();
  }

  async function handleSaveDeal(data) {
    await insertDeal({
      title: data.title,
      contactId: data.contactId,
      companyId: data.companyId,
      stage: data.stage,
      value: data.value,
      nextAction: data.nextAction,
      nextDate: data.nextDate,
      ownerId: currentUser.id,
      quoteRequestedAt: data.quoteRequestedAt,
      quoteSentAt: data.quoteSentAt,
    });
    const contact = contacts.find(c => c.id === data.contactId);
    await insertActivity({
      userId: currentUser.id,
      activityType: "new_deal",
      contactName: contact?.name,
      companyName: contact?.company,
      summary: `New deal: ${data.title}`,
    });
    if (data.stage === "quote_sent") {
      await insertActivity({
        userId: currentUser.id,
        activityType: "quote_sent",
        contactName: contact?.name,
        companyName: contact?.company,
        summary: `Quote sent for "${data.title}"`,
      });
    }
    await loadAllData();
  }

  async function handleSaveNote(data) {
    await insertNote({
      contactId: data.contactId,
      authorId: currentUser.id,
      type: data.type,
      text: data.text,
      reminderAt: data.reminderAt,
    });
    const contact = contacts.find(c => c.id === data.contactId);
    await insertActivity({
      userId: currentUser.id,
      activityType: "note_added",
      contactName: contact?.name,
      companyName: contact?.company,
      summary: `Note added: ${data.text.substring(0, 60)}`,
    });
    await loadAllData();
  }

  async function handleAddInlineNote(data) {
    await insertNote({
      contactId: data.contactId,
      authorId: currentUser.id,
      type: data.type,
      text: data.text,
      reminderAt: data.reminderAt,
    });
    await loadAllData();
  }

  async function handleDealWon(deal) {
    await updateDeal(deal.id, { stage: "won", wonAt: new Date().toISOString() });
    await insertActivity({
      userId: currentUser.id,
      activityType: "deal_won",
      contactName: deal.contact,
      companyName: deal.company,
      summary: `Deal won: "${deal.title}" – ${formatCurrency(deal.value)}`,
    });
    await loadAllData();
  }

  async function handleDealLost(deal, reason, otherText) {
    await updateDeal(deal.id, { stage: "lost", lostReason: reason, lostAt: new Date().toISOString() });
    await insertActivity({
      userId: currentUser.id,
      activityType: "deal_lost",
      contactName: deal.contact,
      companyName: deal.company,
      summary: `Deal lost: "${deal.title}" – ${formatCurrency(deal.value)}`,
      metadata: { reason },
    });
    await loadAllData();
  }

  async function handleDealVoid(deal, reason) {
    await updateDeal(deal.id, { stage: "closed", closedReason: reason || null });
    await insertActivity({
      userId: currentUser.id,
      activityType: "deal_voided",
      contactName: deal.contact,
      companyName: deal.company,
      summary: `Deal voided: "${deal.title}"`,
    });
    await loadAllData();
  }

  async function handleEditDeal(deal, updates) {
    await updateDeal(deal.id, updates);
    const parts = [];
    if (updates.title && updates.title !== deal.title) parts.push("title");
    if (updates.value !== undefined && updates.value !== deal.value) parts.push("value");
    if (updates.nextAction !== undefined && updates.nextAction !== deal.nextAction) parts.push("next action");
    if (updates.nextDate !== undefined && updates.nextDate !== deal.nextDate) parts.push("next date");
    if (updates.stage && updates.stage !== deal.stage) {
      await insertActivity({
        userId: currentUser.id,
        activityType: "deal_updated",
        contactName: deal.contact,
        companyName: deal.company,
        summary: `Deal "${deal.title}" advanced to ${updates.stage.replace("_", " ")}`,
        metadata: { fromStage: deal.stage, toStage: updates.stage },
      });
      if (updates.stage === "quote_request") {
        await insertActivity({
          userId: currentUser.id,
          activityType: "quote_requested",
          contactName: deal.contact,
          companyName: deal.company,
          summary: `Quote requested for "${deal.title}"`,
        });
      } else if (updates.stage === "quote_sent") {
        await insertActivity({
          userId: currentUser.id,
          activityType: "quote_sent",
          contactName: deal.contact,
          companyName: deal.company,
          summary: `Quote sent for "${deal.title}"`,
        });
      }
    } else if (parts.length > 0) {
      await insertActivity({
        userId: currentUser.id,
        activityType: "deal_updated",
        contactName: deal.contact,
        companyName: deal.company,
        summary: `Deal "${deal.title}" updated: ${parts.join(", ")}`,
      });
    }
    await loadAllData();
  }

  async function handleCompleteTodo(todo) {
    try {
      // Notes: write completed_at to DB immediately so it persists across refresh
      if (todo.type !== "deal") {
        await completeNote(todo.noteId);
      }
      await insertActivity({
        userId: currentUser.id,
        activityType: "todo_completed",
        contactName: todo.contactName,
        companyName: todo.company,
        summary: `To-do completed: ${todo.text.substring(0, 60)}`,
      });
    } catch (err) {
      console.error("Error completing todo:", err);
    }
  }

  async function handleClearCompleted(dealTodos) {
    try {
      // Only deal to-dos need DB writes on clear (notes already have completed_at)
      for (const todo of dealTodos) {
        await completeDealTodo(todo.dealId);
      }
    } catch (err) {
      console.error("Error clearing completed todos:", err);
    }
    await loadAllData();
  }

  function openDealModal(contactId) {
    setDealContactId(contactId || null);
    setShowDealModal(true);
  }

  // ============================================================
  // NAVIGATION CONFIG
  // ============================================================

  const isAdmin = currentUser?.role === "admin";
  const isManager = currentUser?.role === "manager" || isAdmin;
  const isRep = currentUser?.role === "rep";

  const allNavItems = [
    { key: "rep", label: "My Day", icon: User, desc: "Daily workflow", hideForAdmin: true },
    { key: "contacts", label: isRep ? "My Contacts" : "Contacts", icon: BookOpen, desc: "Client database" },
    { key: "pipeline", label: isRep ? "My Deals" : "Deals", icon: Columns, desc: "Deal stages" },
    { key: "manager", label: "KPI Dashboard", icon: LayoutDashboard, desc: "Performance KPIs", hideForRep: true },
    { key: "admin", label: "Admin", icon: Settings, desc: "System settings", adminOnly: true },
  ];

  const navItems = allNavItems.filter(item =>
    (!item.adminOnly || isAdmin) &&
    (!item.hideForAdmin || !isAdmin) &&
    (!item.hideForRep || !isRep)
  );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');`}</style>
      {authLoading ? (
        <div style={{ fontFamily: "'Outfit', sans-serif" }} className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <img src={logo} alt="Loading" className="w-16 h-16 mx-auto mb-4 animate-pulse" />
            <p className="text-slate-400 text-sm">Loading...</p>
          </div>
        </div>
      ) : recoveryMode ? (
        <ResetPasswordScreen onDone={() => setRecoveryMode(false)} />
      ) : !isLoggedIn ? (
        <LoginScreen />
      ) : (
        <div style={{ fontFamily: "'Outfit', sans-serif" }} className={`flex ${isMobile ? "flex-col" : "flex-row"} h-screen bg-stone-50`}>
          {!isMobile && (
            <DesktopSidebar
              navItems={navItems} activeView={activeView} setActiveView={navigateTo}
              currentUser={currentUser} onMyProfile={() => setShowMyProfile(true)} onLogout={handleLogout}
            />
          )}
          {isMobile && (
            <MobileTabBar
              navItems={navItems} activeView={activeView} setActiveView={navigateTo}
              currentUser={currentUser} onMyProfile={() => setShowMyProfile(true)} onLogout={handleLogout}
            />
          )}

          <main className={`flex-1 overflow-y-auto ${isMobile ? "p-4" : "p-6 lg:p-8"}`}>
            {dataLoading && contacts.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <img src={logo} alt="Loading" className="w-10 h-10 mx-auto mb-3 animate-pulse" />
                  <p className="text-sm text-slate-400">Loading data...</p>
                </div>
              </div>
            ) : (
              <>
                {activeView === "rep" && (
                  <RepView
                    currentUser={currentUser} contacts={contacts} deals={deals}
                    notesByContact={notesByContact} activityLog={activityLog} rawCalls={rawCalls}
                    onLogCall={() => setShowCallModal(true)}
                    onNewDeal={() => openDealModal()}
                    onAddNote={() => setShowNoteModal(true)}
                    onNewContact={() => setShowContactModal(true)}
                    onCompleteTodo={handleCompleteTodo}
                    onClearCompleted={handleClearCompleted}
                    isMobile={isMobile}
                  />
                )}
                {activeView === "contacts" && (
                  <ContactsView
                    contacts={contacts} deals={deals} callsByContact={callsByContact}
                    notesByContact={notesByContact} reps={reps} currentUser={currentUser}
                    onNewContact={() => setShowContactModal(true)}
                    onNewDeal={(contactId) => openDealModal(contactId)}
                    onAddNote={() => setShowNoteModal(true)}
                    onLogCall={() => setShowCallModal(true)}
                    onAddInlineNote={handleAddInlineNote}
                    onEditContact={(contact) => setEditContact(contact)}
                    onDeleteContact={handleDeleteContact}
                    onBulkDelete={handleBulkDelete}
                    onBulkReassign={handleBulkReassign}
                    onBulkArchive={handleBulkArchive}
                    onBulkUnarchive={handleBulkUnarchive}
                    isMobile={isMobile}
                  />
                )}
                {activeView === "pipeline" && (
                  <PipelineView
                    deals={deals} reps={reps} currentUser={currentUser}
                    onDealWon={handleDealWon} onDealLost={handleDealLost} onDealVoid={handleDealVoid}
                    onEditDeal={(deal) => setEditDeal(deal)}
                    onDealStageChange={handleEditDeal}
                    isMobile={isMobile}
                  />
                )}
                {activeView === "manager" && (
                  <ManagerDashboard
                    reps={reps} deals={deals} contacts={contacts} rawCalls={rawCalls}
                    currentUser={currentUser} isMobile={isMobile}
                  />
                )}
                {activeView === "admin" && (
                  <AdminView isMobile={isMobile} currentUser={currentUser} />
                )}
              </>
            )}
          </main>

          {/* Global Modals */}
          {showMyProfile && (
            <MyProfileModal currentUser={currentUser} onClose={() => setShowMyProfile(false)} onProfileUpdate={() => loadProfile(currentUser.id)} />
          )}
          {showCallModal && (
            <CallLogModal contacts={contacts} currentUser={currentUser} onSave={handleSaveCall} onClose={() => setShowCallModal(false)} />
          )}
          {showContactModal && (
            <NewContactModal currentUser={currentUser} onSave={handleSaveContact} onClose={() => setShowContactModal(false)} />
          )}
          {showDealModal && (
            <NewDealModal contacts={contacts} currentUser={currentUser} defaultContact={dealContactId}
              onSave={handleSaveDeal} onClose={() => { setShowDealModal(false); setDealContactId(null); }} />
          )}
          {showNoteModal && (
            <QuickNoteModal contacts={contacts} currentUser={currentUser} onSave={handleSaveNote} onClose={() => setShowNoteModal(false)} />
          )}
          {editContact && (
            <EditContactModal contact={editContact} onSave={handleEditContact} onClose={() => setEditContact(null)} />
          )}
          {editDeal && (
            <EditDealModal deal={editDeal} onSave={handleEditDeal} onClose={() => setEditDeal(null)} />
          )}
        </div>
      )}
    </>
  );
}
