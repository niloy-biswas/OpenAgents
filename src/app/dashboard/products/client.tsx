"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/db";

interface Props {
  products: Product[];
}

export default function ProductsClient({ products }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const data = {
      title: form.get("title") as string,
      author: form.get("author") as string,
      price: Number(form.get("price")),
      quantity: Number(form.get("quantity")),
      description: form.get("description") as string,
      image_url: form.get("image_url") as string,
      max_discount: Number(form.get("max_discount") || 0),
    };

    const url = editing ? `/api/products/${editing.id}` : "/api/products";
    const method = editing ? "PATCH" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setShowForm(false);
    setEditing(null);
    setLoading(false);
    router.refresh();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Products</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          + Add Product
        </button>
      </div>

      {(showForm || editing) && (
        <div className="bg-white border rounded-xl p-5 mb-6">
          <h2 className="font-semibold mb-4">{editing ? "Edit Product" : "New Product"}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <label className="col-span-2 text-xs font-medium text-gray-500">
              Title
              <input
                name="title"
                defaultValue={editing?.title}
                required
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm font-normal text-gray-900"
              />
            </label>
            <label className="col-span-2 text-xs font-medium text-gray-500">
              Author
              <input
                name="author"
                defaultValue={editing?.author ?? ""}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm font-normal text-gray-900"
              />
            </label>
            <label className="text-xs font-medium text-gray-500">
              Price (BDT)
              <input
                name="price"
                type="number"
                step="0.01"
                defaultValue={editing?.price}
                required
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm font-normal text-gray-900"
              />
            </label>
            <label className="text-xs font-medium text-gray-500">
              Quantity
              <input
                name="quantity"
                type="number"
                defaultValue={editing?.quantity}
                required
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm font-normal text-gray-900"
              />
            </label>
            <label className="text-xs font-medium text-gray-500">
              Max Discount (BDT)
              <input
                name="max_discount"
                type="number"
                step="0.01"
                defaultValue={editing?.max_discount ?? 0}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm font-normal text-gray-900"
              />
            </label>
            <label className="col-span-2 text-xs font-medium text-gray-500">
              Description
              <textarea
                name="description"
                defaultValue={editing?.description ?? ""}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm font-normal text-gray-900"
                rows={2}
              />
            </label>
            <label className="col-span-2 text-xs font-medium text-gray-500">
              Image URL
              <input
                name="image_url"
                type="url"
                defaultValue={editing?.image_url ?? ""}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm font-normal text-gray-900"
              />
            </label>
            <div className="col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditing(null); }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3" />
              <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Author</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Price</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Max Discount</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt={p.title} className="w-10 h-14 object-cover rounded" />
                  ) : (
                    <div className="w-10 h-14 bg-gray-100 rounded" />
                  )}
                </td>
                <td className="px-4 py-3 font-medium">{p.title}</td>
                <td className="px-4 py-3 text-gray-500">{p.author}</td>
                <td className="px-4 py-3 text-right">{Number(p.price).toFixed(2)} ৳</td>
                <td className={`px-4 py-3 text-right ${p.quantity < 5 ? "text-red-600 font-semibold" : ""}`}>
                  {p.quantity}
                </td>
                <td className="px-4 py-3 text-right text-gray-500">{Number(p.max_discount).toFixed(2)} ৳</td>
                <td className="px-4 py-3 text-gray-500 truncate max-w-xs">{p.description}</td>
                <td className="px-4 py-3 flex gap-2 justify-end">
                  <button
                    onClick={() => { setEditing(p); setShowForm(false); }}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-500 hover:underline text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  No products yet. Add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
