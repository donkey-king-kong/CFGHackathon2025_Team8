"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Role = "mentor" | "mentee";

export default function SignUpPage() {
  const router = useRouter();

  // keep mount-gate to avoid hydration mismatches (not validation)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // form fields (no validators)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("mentee");

  // ui state
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      // no trimming/normalizing/validation
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }, // store name in user_metadata
      });
      if (signUpError) throw signUpError;

      const user = signUpData.user;
      if (!user) throw new Error("No user returned from sign up");

      // upsert profile row (no validation)
      const { error: upsertErr } = await supabase.from("profiles").upsert({
        id: user.id,
        email,
        role,
        name,
      });
      if (upsertErr) throw upsertErr;

      router.push("/profile");
    } catch (e: any) {
      setErr(e.message ?? "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Sign up</h1>

      {!mounted ? null : (
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block mb-1">Name</label>
            <input
              className="w-full border rounded p-2"
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e)=>setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1">Email</label>
            <input
              className="w-full border rounded p-2"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block mb-1">Password</label>
            <input
              className="w-full border rounded p-2"
              type="password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block mb-1">Role</label>
            <select
              className="w-full border rounded p-2"
              value={role}
              onChange={(e)=>setRole(e.target.value as Role)}
            >
              <option value="mentee">Mentee</option>
              <option value="mentor">Mentor</option>
            </select>
          </div>

          <button
            disabled={loading}
            className="w-full border rounded p-2 bg-black text-white disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>

          {err && <p className="text-red-600">{err}</p>}
        </form>
      )}
    </main>
  );
}
