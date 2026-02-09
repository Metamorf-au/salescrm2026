import { useEffect } from "react";
import { Trophy } from "lucide-react";
import { formatCurrency } from "../shared/formatters";

export default function WonCelebrationModal({ deal, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const confettiColors = ["#16a34a", "#facc15", "#f97316", "#06b6d4", "#a855f7", "#ec4899", "#22c55e"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confettiColors.flatMap((color, ci) =>
          Array.from({ length: 6 }, (_, i) => (
            <div key={`${ci}-${i}`} className="absolute w-2.5 h-2.5 rounded-full opacity-0"
              style={{
                backgroundColor: color,
                left: `${8 + ci * 13 + i * 3}%`,
                animation: `confettiFall ${1.8 + i * 0.3}s ease-out ${i * 0.1}s forwards`,
              }} />
          ))
        )}
      </div>
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center transform animate-bounce-in">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-200">
          <Trophy size={36} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Deal Won!</h2>
        <p className="text-slate-500 mb-5">Great work closing this one</p>
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200 p-5 mb-5">
          <p className="text-sm font-semibold text-slate-700">{deal.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{deal.contact} – {deal.company}</p>
          <p className="text-3xl font-bold text-emerald-600 mt-3">{formatCurrency(deal.value)}</p>
        </div>
        <p className="text-xs text-slate-400">This window will close automatically</p>
      </div>
      <style>{`
        @keyframes confettiFall {
          0% { top: -5%; opacity: 1; transform: rotate(0deg) scale(1); }
          50% { opacity: 1; transform: rotate(180deg) scale(1.2); }
          100% { top: 105%; opacity: 0; transform: rotate(360deg) scale(0.5); }
        }
        @keyframes bounceIn {
          0% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 1; transform: scale(1.05); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        .animate-bounce-in { animation: bounceIn 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
}
