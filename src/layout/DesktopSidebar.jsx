import { useState } from "react";
import { Target, User, LogOut } from "lucide-react";

export default function DesktopSidebar({ navItems, activeView, setActiveView, currentUser, onMyProfile, onLogout }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
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

      <div className="px-3 pb-4 relative">
        <div onClick={() => setShowMenu(!showMenu)}
          className="px-3 py-3 rounded-xl bg-slate-800 text-slate-400 text-xs cursor-pointer hover:bg-slate-750 transition">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-amber-400 flex-shrink-0">
              {currentUser.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">{currentUser.name}</p>
              <p className="mt-0.5 truncate">{currentUser.role === "admin" ? "Administrator" : currentUser.role === "manager" ? "Sales Manager" : "Sales Representative"}</p>
            </div>
          </div>
        </div>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute left-3 bottom-full mb-2 z-50 bg-white rounded-xl shadow-lg border border-stone-200 py-1 w-48">
              <button onClick={() => { setShowMenu(false); onMyProfile(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-stone-50 transition text-left">
                <User size={14} className="text-slate-400" />My Profile
              </button>
              <button onClick={() => { setShowMenu(false); onLogout(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition text-left">
                <LogOut size={14} />Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
