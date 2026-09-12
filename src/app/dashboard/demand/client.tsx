"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DemandRow {
  product_name: string;
  total_requests: number;
  unique_users: number;
  last_requested: Date;
}

export default function DemandClient({ demands }: { demands: DemandRow[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(name: string) {
    setDeleting(name);
    await fetch(`/api/demand/${encodeURIComponent(name)}`, { method: "DELETE" });
    setDeleting(null);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Demand Products</h1>
          <p className="text-xs text-oa-text-faint mt-0.5">
            Products customers asked for that are not in your inventory
          </p>
        </div>
        <span className="text-xs font-mono text-oa-gold">{demands.length} unique products</span>
      </div>

      <div className="bg-oa-surface border border-oa-line-soft rounded-oa-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-oa-line-soft bg-oa-surface-raise">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-oa-text-faint">Product name</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-oa-text-faint">Requests</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-oa-text-faint">Unique users</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-oa-text-faint">Last asked</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-oa-line-soft">
            {demands.map((d) => (
              <tr key={d.product_name} className="hover:bg-oa-surface-hi transition-colors">
                <td className="px-4 py-3 font-medium capitalize">{d.product_name}</td>
                <td className="px-4 py-3 text-right font-mono text-oa-gold font-semibold">
                  {d.total_requests}
                </td>
                <td className="px-4 py-3 text-right font-mono text-oa-text-faint">
                  {d.unique_users}
                </td>
                <td className="px-4 py-3 text-right text-xs text-oa-text-faint font-mono">
                  {new Date(d.last_requested).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(d.product_name)}
                    disabled={deleting === d.product_name}
                    className="inline-flex items-center gap-1 text-xs text-oa-red hover:opacity-80 disabled:opacity-40 transition-opacity"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                    </svg>
                    {deleting === d.product_name ? "Deleting…" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
            {demands.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-oa-text-faint">
                  No demand signals yet. When customers ask for out-of-stock products, they appear here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
