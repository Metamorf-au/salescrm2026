import { useState } from "react";
import { Target, User, LogOut } from "lucide-react";

export default function MobileTabBar({ navItems, activeView, setActiveView, currentUser, onMyProfile, onLogout }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <nav className="bg-slate-900 border-b border-slate-800 flex-shrink-0">
      <div className="flex items-center px-3 py-2">
        <div className="flex flex-col items-center gap-0.5 px-2 py-1.5 mr-auto">
          <div className="w-5 h-5 rounded-md bg-amber-500 flex items-center justify-center">
            <Target size={12} className="text-white" />
          </div>
          <span className="text-[10px] font-bold text-white">Precision</span>
        </div>
        <div className="flex items-center gap-3">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = activeView === item.key;
            const shortLabel = { rep: item.label, contacts: item.label, pipeline: item.label, manager: "KPIs", admin: "Admin" }[item.key] || item.label;
            return (
              <button key={item.key} onClick={() => setActiveView(item.key)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition
                  ${active ? "text-amber-400 bg-slate-800" : "text-slate-500"}`}>
                <Icon size={18} />
                <span className="text-[10px] font-medium">{shortLabel}</span>
              </button>
            );
          })}
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-amber-400 hover:bg-slate-600 transition">
              {currentUser.initials}
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-10 z-50 bg-white rounded-xl shadow-lg border border-stone-200 py-1 w-44">
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
        </div>
      </div>
    </nav>
  );
}
