import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import Modal from "../shared/Modal";
import SuccessScreen from "../shared/SuccessScreen";
import AddUserModal from "./AddUserModal";
import EditUserModal from "./EditUserModal";
import EditKPIModal from "./EditKPIModal";
import { callAdminFn } from "./adminApi";
import { DEFAULT_KPI_TARGETS } from "../shared/constants";
import {
  CheckCircle, XCircle, X, Settings, Lock, Shield, Eye,
  UserPlus, Users, Building2, Target, Phone, Calendar, Send, ChevronDown
} from "lucide-react";

export default function AdminView({ isMobile, currentUser, reps, kpiTargets, onKpiTargetsSaved }) {
  const [showAddUser, setShowAddUser] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editKpiUser, setEditKpiUser] = useState(null);
  const [collapsed, setCollapsed] = useState({ users: false, kpi: false, import: true, security: true });
  const [userMenu, setUserMenu] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState(null); // { type, user }
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null); // { type: "success"|"error", message }

  async function loadUsers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, email, role, status, created_at, updated_at")
      .order("created_at", { ascending: true });
    if (data) setUsers(data);
    if (error) console.error("Error loading users:", error.message);
    setUsersLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  function showFeedback(type, message) {
    setActionFeedback({ type, message });
    setTimeout(() => setActionFeedback(null), 3000);
  }

  async function handleResetPassword(user) {
    setActionLoading(true);
    try {
      await callAdminFn("reset-password", { email: user.email });
      showFeedback("success", `Password reset email sent to ${user.email}`);
    } catch (err) {
      showFeedback("error", err.message);
    }
    setActionLoading(false);
    setConfirmAction(null);
  }

  async function handleDisableEnable(user) {
    setActionLoading(true);
    const isDisable = user.status === "active";
    try {
      await callAdminFn(isDisable ? "disable" : "enable", { userId: user.id });
      showFeedback("success", `${user.name} has been ${isDisable ? "disabled" : "enabled"}`);
      loadUsers();
    } catch (err) {
      showFeedback("error", err.message);
    }
    setActionLoading(false);
    setConfirmAction(null);
  }

  async function handleDelete(user) {
    setActionLoading(true);
    try {
      await callAdminFn("delete", { userId: user.id });
      showFeedback("success", `${user.name} has been deleted`);
      loadUsers();
    } catch (err) {
      showFeedback("error", err.message);
    }
    setActionLoading(false);
    setConfirmAction(null);
  }

  function formatDate(dateStr) {
    if (!dateStr) return "\u2014";
    return new Date(dateStr).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  }

  const roleBadge = (role) => {
    const map = {
      rep: { bg: "bg-sky-100", text: "text-sky-700", label: "Rep" },
      manager: { bg: "bg-violet-100", text: "text-violet-700", label: "Manager" },
      admin: { bg: "bg-amber-100", text: "text-amber-700", label: "Admin" },
    };
    const c = map[role] || map.rep;
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span>;
  };

  const isCurrentUser = (u) => u.id === currentUser?.id;
  const toggleSection = (key) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className={`max-w-6xl mx-auto ${isMobile ? "space-y-4" : "space-y-6"}`}>
      <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
        <div>
          <h1 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-slate-800`}>Admin</h1>
          <p className="text-slate-500 mt-0.5 text-sm">Manage users, import data, system settings</p>
        </div>
      </div>

      {/* Feedback banner */}
      {actionFeedback && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${actionFeedback.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {actionFeedback.type === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {actionFeedback.message}
        </div>
      )}

      {/* User Management */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-visible">
        <div className={`px-5 py-4 ${collapsed.users ? "" : "border-b border-stone-200"} flex items-center justify-between`}>
          <button onClick={() => toggleSection("users")} className="flex items-center gap-2 text-left flex-1 min-w-0">
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${collapsed.users ? "-rotate-90" : ""}`} />
            <div>
              <h2 className="text-base font-semibold text-slate-700">Users</h2>
              <p className="text-xs text-slate-400 mt-0.5">{users.filter(u => u.status === "active").length} active of {users.length} total</p>
            </div>
          </button>
          <button onClick={() => setShowAddUser(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition shadow-md shrink-0">
            <UserPlus size={16} />Add User
          </button>
        </div>
        {!collapsed.users && <div className={isMobile ? "divide-y divide-stone-100" : ""}>
          {usersLoading ? (
            <div className="px-5 py-8 text-center text-sm text-slate-400">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-400">No users found</div>
          ) : (
            <>
              {!isMobile && (
                <div className="grid grid-cols-12 gap-4 px-5 py-2.5 bg-stone-50 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <div className="col-span-3">Name</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-1">Role</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-2">Created</div>
                  <div className="col-span-1">Updated</div>
                  <div className="col-span-1"></div>
                </div>
              )}
              {users.map(u => (
                isMobile ? (
                  <div key={u.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${u.status === "active" ? "bg-slate-800 text-white" : "bg-stone-200 text-stone-500"}`}>
                          {u.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p onClick={() => setEditUser(u)} className="text-sm font-medium text-slate-800 hover:text-amber-600 cursor-pointer transition">{u.name} {isCurrentUser(u) && <span className="text-xs text-slate-400">(you)</span>}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                      {roleBadge(u.role)}
                    </div>
                    <div className="flex items-center justify-between mt-2 ml-11">
                      <span className="text-xs text-slate-400">Created: {formatDate(u.created_at)}</span>
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
                            <div className="absolute right-0 bottom-full mb-1 z-30 bg-white rounded-xl shadow-lg border border-stone-200 py-1 w-48">
                              <button onClick={() => { setConfirmAction({ type: "reset-password", user: u }); setUserMenu(null); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-stone-50 transition text-left">
                                <Lock size={14} className="text-slate-400" />Reset Password
                              </button>
                              {!isCurrentUser(u) && (
                                <>
                                  <button onClick={() => { setConfirmAction({ type: u.status === "active" ? "disable" : "enable", user: u }); setUserMenu(null); }}
                                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition text-left ${u.status === "active" ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"}`}>
                                    <XCircle size={14} />{u.status === "active" ? "Disable User" : "Enable User"}
                                  </button>
                                  <button onClick={() => { setConfirmAction({ type: "delete", user: u }); setUserMenu(null); }}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition text-left">
                                    <X size={14} />Delete User
                                  </button>
                                </>
                              )}
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
                      <span onClick={() => setEditUser(u)} className="text-sm font-medium text-slate-800 hover:text-amber-600 cursor-pointer transition">{u.name} {isCurrentUser(u) && <span className="text-xs text-slate-400">(you)</span>}</span>
                    </div>
                    <div className="col-span-3 text-sm text-slate-500">{u.email}</div>
                    <div className="col-span-1">{roleBadge(u.role)}</div>
                    <div className="col-span-1">
                      <div className={`flex items-center gap-1.5 text-xs ${u.status === "active" ? "text-emerald-600" : "text-slate-400"}`}>
                        <div className={`w-2 h-2 rounded-full ${u.status === "active" ? "bg-emerald-500" : "bg-slate-300"}`} />
                        {u.status === "active" ? "Active" : "Inactive"}
                      </div>
                    </div>
                    <div className="col-span-2 text-xs text-slate-400">{formatDate(u.created_at)}</div>
                    <div className="col-span-1 text-xs text-slate-400">{formatDate(u.updated_at)}</div>
                    <div className="col-span-1 text-right relative">
                      <button onClick={() => setUserMenu(userMenu === u.id ? null : u.id)} className="p-1.5 rounded-lg hover:bg-stone-100 text-slate-400 hover:text-slate-600 transition">
                        <Settings size={14} />
                      </button>
                      {userMenu === u.id && (
                        <div className="absolute right-0 bottom-full mb-1 z-30 bg-white rounded-xl shadow-lg border border-stone-200 py-1 w-48">
                          <button onClick={() => { setConfirmAction({ type: "reset-password", user: u }); setUserMenu(null); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-stone-50 transition text-left">
                            <Lock size={14} className="text-slate-400" />Reset Password
                          </button>
                          {!isCurrentUser(u) && (
                            <>
                              <button onClick={() => { setConfirmAction({ type: u.status === "active" ? "disable" : "enable", user: u }); setUserMenu(null); }}
                                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition text-left ${u.status === "active" ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"}`}>
                                <XCircle size={14} />{u.status === "active" ? "Disable User" : "Enable User"}
                              </button>
                              <button onClick={() => { setConfirmAction({ type: "delete", user: u }); setUserMenu(null); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition text-left">
                                <X size={14} />Delete User
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              ))}
            </>
          )}
        </div>}
      </div>

      {/* KPI Targets */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-visible">
        <div className={`px-5 py-4 ${collapsed.kpi ? "" : "border-b border-stone-200"}`}>
          <button onClick={() => toggleSection("kpi")} className="flex items-center gap-2 text-left w-full">
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${collapsed.kpi ? "-rotate-90" : ""}`} />
            <div>
              <h2 className="text-base font-semibold text-slate-700">KPI Targets</h2>
              <p className="text-xs text-slate-400 mt-0.5">Weekly targets per rep. Daily call target = weekly calls / 5.</p>
            </div>
          </button>
        </div>
        {!collapsed.kpi && (() => {
          const kpiReps = (reps || []).filter(r => r.role === "rep" || r.role === "manager");
          const defaults = {
            weeklyCalls: DEFAULT_KPI_TARGETS.weekly_calls,
            weeklyMeetings: DEFAULT_KPI_TARGETS.weekly_meetings,
            weeklyContacts: DEFAULT_KPI_TARGETS.weekly_contacts,
            weeklyQuotes: DEFAULT_KPI_TARGETS.weekly_quotes,
          };
          if (kpiReps.length === 0) {
            return <div className="px-5 py-8 text-center text-sm text-slate-400">No reps found</div>;
          }
          return (
            <>
              {!isMobile && (
                <div className="grid grid-cols-12 gap-4 px-5 py-2.5 bg-stone-50 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <div className="col-span-3">Rep</div>
                  <div className="col-span-2 text-center">Weekly Calls</div>
                  <div className="col-span-2 text-center">Meetings</div>
                  <div className="col-span-2 text-center">Contacts</div>
                  <div className="col-span-2 text-center">Quotes</div>
                  <div className="col-span-1"></div>
                </div>
              )}
              {kpiReps.map(r => {
                const t = (kpiTargets || {})[r.id] || defaults;
                return isMobile ? (
                  <div key={r.id} className="px-4 py-3 border-b border-stone-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">{r.initials}</div>
                        <span className="text-sm font-medium text-slate-800">{r.name}</span>
                      </div>
                      <button onClick={() => setEditKpiUser(r)} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition">
                        <Settings size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 ml-9">
                      <div className="text-center">
                        <p className="text-xs text-slate-400">Calls</p>
                        <p className="text-sm font-semibold text-slate-700">{t.weeklyCalls}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-400">Meetings</p>
                        <p className="text-sm font-semibold text-slate-700">{t.weeklyMeetings}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-400">Contacts</p>
                        <p className="text-sm font-semibold text-slate-700">{t.weeklyContacts}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-400">Quotes</p>
                        <p className="text-sm font-semibold text-slate-700">{t.weeklyQuotes}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={r.id} className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-stone-100 items-center hover:bg-stone-50 transition">
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">{r.initials}</div>
                      <span className="text-sm font-medium text-slate-800">{r.name}</span>
                    </div>
                    <div className="col-span-2 text-center text-sm font-semibold text-slate-700">{t.weeklyCalls}</div>
                    <div className="col-span-2 text-center text-sm font-semibold text-slate-700">{t.weeklyMeetings}</div>
                    <div className="col-span-2 text-center text-sm font-semibold text-slate-700">{t.weeklyContacts}</div>
                    <div className="col-span-2 text-center text-sm font-semibold text-slate-700">{t.weeklyQuotes}</div>
                    <div className="col-span-1 text-right">
                      <button onClick={() => setEditKpiUser(r)} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition">
                        <Settings size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          );
        })()}
      </div>

      {/* Data Import */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className={`px-5 py-4 ${collapsed.import ? "" : "border-b border-stone-200"}`}>
          <button onClick={() => toggleSection("import")} className="flex items-center gap-2 text-left w-full">
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${collapsed.import ? "-rotate-90" : ""}`} />
            <div>
              <h2 className="text-base font-semibold text-slate-700">Data Import</h2>
              <p className="text-xs text-slate-400 mt-0.5">Import contacts from CSV, Excel, or migrate from HubSpot</p>
            </div>
          </button>
        </div>
        {!collapsed.import && (
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
        )}
      </div>

      {/* Security */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className={`px-5 py-4 ${collapsed.security ? "" : "border-b border-stone-200"}`}>
          <button onClick={() => toggleSection("security")} className="flex items-center gap-2 text-left w-full">
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${collapsed.security ? "-rotate-90" : ""}`} />
            <h2 className="text-base font-semibold text-slate-700">Security</h2>
          </button>
        </div>
        {!collapsed.security && <div className="p-5 space-y-4">
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
        </div>}
      </div>

      {showAddUser && (
        <AddUserModal onClose={() => { setShowAddUser(false); loadUsers(); }} />
      )}

      {editUser && (
        <EditUserModal user={editUser} currentUser={currentUser} onClose={() => { setEditUser(null); loadUsers(); }} />
      )}

      {editKpiUser && (
        <EditKPIModal
          user={editKpiUser}
          targets={(kpiTargets || {})[editKpiUser.id]}
          onClose={() => setEditKpiUser(null)}
          onSaved={onKpiTargetsSaved}
        />
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <Modal title={`${confirmAction.type === "delete" ? "Delete" : confirmAction.type === "disable" ? "Disable" : confirmAction.type === "reset-password" ? "Reset Password" : "Enable"} User`} onClose={() => setConfirmAction(null)}>
          <div className="px-6 py-5 space-y-4">
            <div className={`p-4 rounded-xl ${confirmAction.type === "delete" ? "bg-rose-50 border border-rose-200" : confirmAction.type === "reset-password" ? "bg-sky-50 border border-sky-200" : confirmAction.type === "disable" ? "bg-amber-50 border border-amber-200" : "bg-emerald-50 border border-emerald-200"}`}>
              {confirmAction.type === "delete" ? (
                <p className="text-sm text-rose-700">
                  This will permanently delete <strong>{confirmAction.user.name}</strong> ({confirmAction.user.email}) and all their data. This action cannot be undone.
                </p>
              ) : confirmAction.type === "reset-password" ? (
                <p className="text-sm text-sky-700">
                  This will send a password reset email to <strong>{confirmAction.user.name}</strong> at {confirmAction.user.email}.
                </p>
              ) : confirmAction.type === "disable" ? (
                <p className="text-sm text-amber-700">
                  This will disable <strong>{confirmAction.user.name}</strong>'s account. They will not be able to log in until re-enabled.
                </p>
              ) : (
                <p className="text-sm text-emerald-700">
                  This will re-enable <strong>{confirmAction.user.name}</strong>'s account. They will be able to log in again.
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmAction(null)} disabled={actionLoading}
                className="flex-1 py-3 rounded-xl font-semibold text-slate-700 bg-stone-100 hover:bg-stone-200 transition disabled:opacity-50">
                Cancel
              </button>
              <button onClick={() => confirmAction.type === "delete" ? handleDelete(confirmAction.user) : confirmAction.type === "reset-password" ? handleResetPassword(confirmAction.user) : handleDisableEnable(confirmAction.user)}
                disabled={actionLoading}
                className={`flex-1 py-3 rounded-xl font-semibold text-white transition disabled:opacity-50 ${confirmAction.type === "delete" ? "bg-rose-500 hover:bg-rose-600" : confirmAction.type === "reset-password" ? "bg-sky-500 hover:bg-sky-600" : confirmAction.type === "disable" ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-500 hover:bg-emerald-600"}`}>
                {actionLoading ? "Processing..." : confirmAction.type === "delete" ? "Delete User" : confirmAction.type === "reset-password" ? "Send Reset Email" : confirmAction.type === "disable" ? "Disable User" : "Enable User"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
