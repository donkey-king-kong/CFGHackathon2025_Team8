"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/"); // redirect to home page
    } catch (e: any) {
      setErr(e.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block mb-1">Email</label>
          <input className="w-full border rounded p-2" type="email" required
                 value={email} onChange={(e)=>setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block mb-1">Password</label>
          <input className="w-full border rounded p-2" type="password" required
                 value={password} onChange={(e)=>setPassword(e.target.value)} />
        </div>
        <button disabled={loading}
                className="w-full border rounded p-2 bg-black text-white disabled:opacity-50">
          {loading ? "Signing in..." : "Log in"}
        </button>
      </form>
      {err && <p className="text-red-600">{err}</p>}
    </main>
  );
}
