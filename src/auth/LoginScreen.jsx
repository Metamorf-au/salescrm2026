import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Shield } from "lucide-react";
import logo from "../assets/my-day-logo.svg";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  }

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif" }} className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={logo} alt="Precision Sales CRM" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Precision Group</h1>
          <p className="text-slate-400 text-sm mt-1">Sales CRM</p>
        </div>
        <form onSubmit={handleLogin} className="bg-white rounded-2xl p-6 shadow-2xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@thepg.com.au"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-base focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="Enter your password"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-800 text-base focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
            </div>
            {error && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white bg-amber-500 hover:bg-amber-600 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>
          <div className="flex items-center justify-center mt-4 pt-4 border-t border-stone-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Shield size={12} className="text-emerald-500" />
              Secured by Supabase
            </div>
          </div>
        </form>
        <p className="text-center text-xs text-slate-500 mt-6">&copy; 2026 Precision Group. All rights reserved.</p>
      </div>
    </div>
  );
}
