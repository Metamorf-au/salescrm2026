import { CheckCircle } from "lucide-react";

export default function SuccessScreen({ message, sub }) {
  return (
    <div className="px-6 py-10 text-center">
      <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={28} className="text-emerald-600" />
      </div>
      <p className="text-lg font-semibold text-slate-800">{message}</p>
      {sub && <p className="text-sm text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}
