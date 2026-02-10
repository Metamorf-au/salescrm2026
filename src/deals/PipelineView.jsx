import { useState } from "react";
import { User, Clock, AlertTriangle, ArrowRight, Send, X, Pencil } from "lucide-react";
import { LOST_REASONS } from "../shared/constants";
import { formatCurrency, formatReminderDate } from "../shared/formatters";
import LostReasonModal from "./LostReasonModal";
import CloseDealModal from "./CloseDealModal";
import WonCelebrationModal from "./WonCelebrationModal";

export default function PipelineView({ deals, reps, currentUser, onDealWon, onDealLost, onDealVoid, onEditDeal, onDealStageChange, isMobile }) {
  const isRepOnly = currentUser.role === "rep";
  const [selectedRep, setSelectedRep] = useState(isRepOnly ? currentUser.name : "all");
  const [timePeriod, setTimePeriod] = useState("all");
  const [lostModal, setLostModal] = useState(null);
  const [closeModal, setCloseModal] = useState(null);
  const [wonModal, setWonModal] = useState(null);
  const [showGraveyard, setShowGraveyard] = useState(false);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [dragDeal, setDragDeal] = useState(null);

  const timePeriods = [
    { key: "all", label: "All Time" },
    { key: "7d", label: "7 Days", days: 7 },
    { key: "30d", label: "30 Days", days: 30 },
    { key: "3m", label: "3 Months", days: 90 },
    { key: "6m", label: "6 Months", days: 180 },
    { key: "1y", label: "1 Year", days: 365 },
  ];

  const stages = [
    { key: "discovery", label: "Discovery", color: "border-sky-400", bg: "bg-sky-50", text: "text-sky-700", weight: 0.10 },
    { key: "quote_request", label: "Quote Request", color: "border-violet-400", bg: "bg-violet-50", text: "text-violet-700", weight: 0.25 },
    { key: "quote_sent", label: "Quote Sent", color: "border-amber-400", bg: "bg-amber-50", text: "text-amber-700", weight: 0.75 },
    { key: "won", label: "Won", color: "border-emerald-400", bg: "bg-emerald-50", text: "text-emerald-700", weight: 1.0 },
    { key: "lost", label: "Lost", color: "border-rose-400", bg: "bg-rose-50", text: "text-rose-700", weight: 0 },
  ];

  const now = new Date();
  const selectedPeriod = timePeriods.find(p => p.key === timePeriod);
  const cutoffDate = selectedPeriod?.days ? new Date(now.getTime() - selectedPeriod.days * 86400000) : null;
  const filteredDeals = deals.filter(d => {
    if (selectedRep !== "all" && d.owner !== selectedRep) return false;
    if (cutoffDate && d.nextDate && new Date(d.nextDate) < cutoffDate) return false;
    return true;
  });
  const activeDeals = filteredDeals.filter(d => !["won", "lost", "closed"].includes(d.stage));
  const totalActive = activeDeals.reduce((s, d) => s + d.value, 0);
  const weightedTotal = activeDeals.reduce((s, d) => {
    const stageObj = stages.find(st => st.key === d.stage);
    return s + d.value * (stageObj?.weight || 0);
  }, 0);
  const wonDeals = filteredDeals.filter(d => d.stage === "won");
  const totalWon = wonDeals.reduce((s, d) => s + d.value, 0);
  const lostDeals = filteredDeals.filter(d => d.stage === "lost");
  const totalLost = lostDeals.reduce((s, d) => s + d.value, 0);
  const closedDeals = filteredDeals.filter(d => d.stage === "closed");

  const repNames = [...new Set(deals.map(d => d.owner).filter(Boolean))].sort();

  function getDealAge(deal) {
    if (["won", "lost", "closed"].includes(deal.stage)) return null;
    if (!deal.nextDate) return null;
    const nextDate = new Date(deal.nextDate);
    const diffDays = Math.floor((now - nextDate) / 86400000);
    if (diffDays >= 14) return { level: "critical", label: `${diffDays}d overdue`, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-300" };
    if (diffDays >= 7) return { level: "warning", label: `${diffDays}d overdue`, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-300" };
    if (diffDays >= 1) return { level: "stale", label: `${diffDays}d overdue`, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-300" };
    return null;
  }

  const staleCount = activeDeals.filter(d => getDealAge(d)).length;

  // Drag & drop (desktop only)
  const draggableStages = ["discovery", "quote_request", "quote_sent"];
  const droppableStages = ["discovery", "quote_request", "quote_sent", "won", "lost"];

  function handleDragStart(e, deal) {
    setDragDeal(deal);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(deal.id));
  }

  function handleDragEnd() {
    setDragDeal(null);
    setDragOverStage(null);
  }

  function handleDragOver(e, stageKey) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStage !== stageKey) setDragOverStage(stageKey);
  }

  function handleDragLeave(e, stageKey) {
    // Only clear if actually leaving the column (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverStage(null);
    }
  }

  function handleDrop(e, targetStage) {
    e.preventDefault();
    setDragOverStage(null);
    if (!dragDeal || dragDeal.stage === targetStage) { setDragDeal(null); return; }

    // Won/Lost have special flows via modals
    if (targetStage === "won") {
      setWonModal(dragDeal);
      onDealWon(dragDeal);
      setDragDeal(null);
      return;
    }
    if (targetStage === "lost") {
      setLostModal(dragDeal);
      setDragDeal(null);
      return;
    }

    // Active stage transition
    if (onDealStageChange && draggableStages.includes(targetStage)) {
      const updates = { stage: targetStage };
      if (targetStage === "quote_request" && !dragDeal.quoteRequestedAt) {
        updates.quoteRequestedAt = new Date().toISOString();
      }
      if (targetStage === "quote_sent" && !dragDeal.quoteSentAt) {
        updates.quoteSentAt = new Date().toISOString();
      }
      onDealStageChange(dragDeal, updates);
    }
    setDragDeal(null);
  }

  const nextStageMap = { discovery: "Quote Request", quote_request: "Quote Sent" };

  function renderDealCard(d, isColumn) {
    const age = getDealAge(d);
    const isActive = !["won", "lost", "closed"].includes(d.stage);
    const canEdit = isActive && onEditDeal;
    const canDrag = isColumn && isActive && !isMobile;
    return (
      <div key={d.id}
        draggable={canDrag}
        onDragStart={canDrag ? (e) => handleDragStart(e, d) : undefined}
        onDragEnd={canDrag ? handleDragEnd : undefined}
        className={`${isColumn ? "bg-white rounded-lg p-3 shadow-sm border hover:shadow-md transition" : "px-4 py-3"} ${age ? (isColumn ? age.border : age.bg) : (isColumn ? "border-stone-200" : "")} ${canDrag ? "cursor-grab active:cursor-grabbing" : ""} ${dragDeal?.id === d.id ? "opacity-40" : ""}`}>
        {age && (
          <div className={`flex items-center gap-1 mb-1${isColumn ? ".5" : ""} ${isColumn ? `px-1.5 py-0.5 rounded ${age.bg} w-fit` : ""}`}>
            <AlertTriangle size={10} className={age.color} />
            <span className={`text-[10px] font-semibold ${age.color}`}>{age.label}</span>
          </div>
        )}
        <div className={isColumn ? "" : "flex items-center justify-between"} onClick={() => canEdit && onEditDeal(d)} style={canEdit ? { cursor: "pointer" } : undefined}>
          <p className="text-sm font-semibold text-slate-800 leading-tight">{d.title}</p>
          {!isColumn && <span className="text-sm font-bold text-slate-700">{formatCurrency(d.value)}</span>}
        </div>
        <div onClick={() => canEdit && onEditDeal(d)} style={canEdit ? { cursor: "pointer" } : undefined}>
          <p className="text-xs text-slate-500 mt-1">{d.contact}{isColumn ? "" : ` – ${d.company}`}</p>
          {isColumn && <p className="text-xs text-slate-400">{d.company}</p>}
        </div>
        {isColumn && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
            <span className="text-sm font-bold text-slate-700">{formatCurrency(d.value)}</span>
            <span className="text-xs text-slate-400">{d.owner?.split(" ")[0]}</span>
          </div>
        )}
        {d.quoteSentAt && (
          <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
            <Send size={10} />Sent {formatReminderDate(d.quoteSentAt)}
          </p>
        )}
        {d.quoteRequestedAt && !d.quoteSentAt && (
          <p className="text-xs text-violet-500 mt-1.5 flex items-center gap-1">
            <Clock size={10} />Requested {formatReminderDate(d.quoteRequestedAt)}
          </p>
        )}
        {d.nextAction && isActive && (
          <p className={`text-xs ${isColumn ? "text-amber-600 mt-1.5 flex items-center gap-1" : "text-slate-400 mt-1"}`}>
            {isColumn && <ArrowRight size={10} />}{d.nextAction}
          </p>
        )}
        {d.stage === "lost" && d.lostReason && (
          <p className="text-xs text-rose-500 mt-1.5">Reason: {LOST_REASONS.find(r => r.key === d.lostReason)?.label || d.lostReason}</p>
        )}
        {d.stage === "closed" && d.closedReason && (
          <p className="text-xs text-slate-500 mt-1.5">Note: {d.closedReason}</p>
        )}
        {["discovery", "quote_request"].includes(d.stage) && (
          <div className={`${isColumn ? "mt-2 pt-2 border-t border-stone-100 space-y-1.5" : "mt-2 space-y-1.5"}`}>
            {canEdit && (
              <button onClick={() => onEditDeal(d)} className="w-full py-1.5 text-xs font-medium text-slate-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-md transition flex items-center justify-center gap-1.5">
                <Pencil size={10} />Edit Deal
              </button>
            )}
            <button onClick={() => setCloseModal(d)} className="w-full py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition">
              Void Deal
            </button>
          </div>
        )}
        {d.stage === "quote_sent" && (
          <div className={`${isColumn ? "mt-2 pt-2 border-t border-stone-100 space-y-1.5" : "mt-2 space-y-1.5"}`}>
            {canEdit && (
              <button onClick={() => onEditDeal(d)} className="w-full py-1.5 text-xs font-medium text-slate-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-md transition flex items-center justify-center gap-1.5">
                <Pencil size={10} />Edit Deal
              </button>
            )}
            <div className="flex gap-1.5">
              <button onClick={() => setLostModal(d)} className="flex-1 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition">Lost</button>
              <button onClick={() => { setWonModal(d); onDealWon(d); }} className="flex-1 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md transition">Won</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto ${isMobile ? "space-y-4" : "space-y-6"}`}>
      {/* Header + Metric Tiles */}
      <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
        <div>
          <h1 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-slate-800`}>Deal Pipeline</h1>
          <p className="text-slate-500 mt-0.5 text-sm">Visual overview of all deals by stage</p>
        </div>
        <div className={isMobile ? "space-y-3" : "flex items-center gap-4"}>
          <div className={`grid grid-cols-2 ${isMobile ? "gap-3" : "flex gap-4 contents"}`}>
            <div className="bg-white border border-stone-200 rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-slate-400">Active Pipeline</p>
              <p className="text-lg font-bold text-slate-800">{formatCurrency(totalActive)}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-amber-600">Weighted Pipeline</p>
              <p className="text-lg font-bold text-amber-700">{formatCurrency(weightedTotal)}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-emerald-600">Won This Month</p>
              <p className="text-lg font-bold text-emerald-700">{formatCurrency(totalWon)}</p>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-rose-600">Lost This Month</p>
              <p className="text-lg font-bold text-rose-700">{formatCurrency(totalLost)}</p>
            </div>
          </div>
          {(staleCount > 0 || closedDeals.length > 0) && (
            <div className={`flex ${isMobile ? "" : ""} gap-3`}>
              {staleCount > 0 && (
                <div className={`bg-orange-50 border border-orange-200 rounded-xl px-4 py-2 text-center ${isMobile ? "flex-1" : ""}`}>
                  <p className="text-xs text-orange-600 flex items-center justify-center gap-1"><AlertTriangle size={10} /> Overdue</p>
                  <p className="text-lg font-bold text-orange-700">{staleCount}</p>
                </div>
              )}
              {closedDeals.length > 0 && (
                <button onClick={() => setShowGraveyard(!showGraveyard)} className={`border rounded-xl px-4 py-2 text-center transition ${isMobile ? "flex-1" : ""} ${showGraveyard ? "bg-slate-200 border-slate-400" : "bg-slate-50 border-slate-200 hover:border-slate-300"}`}>
                  <p className="text-xs text-slate-500">Voided</p>
                  <p className="text-lg font-bold text-slate-600">{closedDeals.length}</p>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
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

      {/* Pipeline Columns / Mobile List */}
      {isMobile ? (
        <div className="space-y-4">
          {stages.map(s => {
            const stageDeals = filteredDeals.filter(d => d.stage === s.key);
            if (stageDeals.length === 0) return null;
            const stageTotal = stageDeals.reduce((sum, d) => sum + d.value, 0);
            return (
              <div key={s.key} className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                <div className={`px-4 py-2.5 border-l-4 ${s.color}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${s.text}`}>{s.label}</span>
                      <span className="text-xs bg-stone-100 text-slate-500 px-1.5 py-0.5 rounded-full">{stageDeals.length}</span>
                      {!["won", "lost"].includes(s.key) && <span className="text-[10px] text-slate-400">{Math.round(s.weight * 100)}%</span>}
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{formatCurrency(stageTotal)}</span>
                  </div>
                </div>
                <div className="divide-y divide-stone-100">
                  {stageDeals.map(d => renderDealCard(d, false))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map(s => {
            const stageDeals = filteredDeals.filter(d => d.stage === s.key);
            const stageTotal = stageDeals.reduce((sum, d) => sum + d.value, 0);
            const isDropTarget = droppableStages.includes(s.key);
            const isDraggedOver = dragOverStage === s.key && dragDeal?.stage !== s.key;
            return (
              <div key={s.key} className="flex-1 min-w-[180px]"
                onDragOver={isDropTarget ? (e) => handleDragOver(e, s.key) : undefined}
                onDragLeave={isDropTarget ? (e) => handleDragLeave(e, s.key) : undefined}
                onDrop={isDropTarget ? (e) => handleDrop(e, s.key) : undefined}
              >
                <div className={`rounded-t-xl px-3 py-2 border-t-4 ${s.color} ${s.bg}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold ${s.text}`}>{s.label}</span>
                      <span className="text-xs bg-white/70 text-slate-500 px-1.5 py-0.5 rounded-full">{stageDeals.length}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{formatCurrency(stageTotal)}</span>
                  </div>
                  {!["won", "lost"].includes(s.key) && <p className="text-[10px] text-slate-400 mt-0.5">{Math.round(s.weight * 100)}% weighted</p>}
                </div>
                <div className={`rounded-b-xl p-3 space-y-2 min-h-[200px] transition-colors duration-150 ${isDraggedOver ? "bg-amber-100 ring-2 ring-amber-400 ring-inset" : "bg-stone-100"}`}>
                  {stageDeals.length === 0 && <div className="text-xs text-slate-400 text-center py-8">{isDraggedOver ? "Drop here" : "No deals"}</div>}
                  {stageDeals.map(d => renderDealCard(d, true))}
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
              <h2 className="text-base font-semibold text-slate-700">Voided Deals</h2>
              <p className="text-xs text-slate-400 mt-0.5">{closedDeals.length} deal{closedDeals.length !== 1 ? "s" : ""} – {formatCurrency(closedDeals.reduce((s, d) => s + d.value, 0))} total value</p>
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
                  <p className="text-xs text-slate-500">{d.contact} – {d.company}</p>
                  {d.closedReason && <p className="text-xs text-slate-400 mt-0.5">{d.closedReason}</p>}
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-sm font-bold text-slate-700">{formatCurrency(d.value)}</p>
                  <p className="text-xs text-slate-400">{d.owner?.split(" ")[0]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {lostModal && <LostReasonModal deal={lostModal} onClose={() => setLostModal(null)} onSave={onDealLost} />}
      {closeModal && <CloseDealModal deal={closeModal} onClose={() => setCloseModal(null)} onSave={onDealVoid} />}
      {wonModal && <WonCelebrationModal deal={wonModal} onClose={() => setWonModal(null)} />}
    </div>
  );
}
