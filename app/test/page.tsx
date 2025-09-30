import { supabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default async function TestPage() {
  const { data, error } = await supabase
    .from("demo_people")
    .select("id, name")
    .order("id", { ascending: true });

  if (error) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-xl font-semibold mb-2">Supabase test</h1>
        <pre className="text-red-600">{error.message}</pre>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-3">Supabase test</h1>
      <table className="w-full text-sm border">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-2 border">ID</th>
            <th className="text-left p-2 border">Name</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((r) => (
            <tr key={r.id}>
              <td className="p-2 border">{r.id}</td>
              <td className="p-2 border">{r.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {(!data || data.length === 0) && (
        <p className="mt-3 text-slate-600">No rows yet.</p>
      )}
    </div>
  );
}
