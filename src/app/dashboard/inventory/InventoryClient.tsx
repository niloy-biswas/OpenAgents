"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product, ProductVariant } from "@/lib/db";
import { cn } from "@/lib/utils";

type ProductStatus = "Healthy" | "Low stock" | "Critical" | "Out of stock";

function productStatus(p: Product): { label: ProductStatus; cls: string } {
  const min = p.variants && p.variants.length ? Math.min(...p.variants.map((v) => v.stock)) : p.quantity;
  if (min === 0) return { label: "Out of stock", cls: "bg-oa-surface-raise text-oa-text-faint border border-oa-line" };
  if (min <= 2) return { label: "Critical", cls: "bg-oa-red-dim text-oa-red" };
  if (min <= 5) return { label: "Low stock", cls: "bg-oa-gold-soft text-oa-gold" };
  return { label: "Healthy", cls: "bg-oa-green-dim text-oa-green" };
}

function statusFilterKey(label: ProductStatus): "healthy" | "low" | "critical" | "out" {
  switch (label) {
    case "Low stock":
      return "low";
    case "Critical":
      return "critical";
    case "Out of stock":
      return "out";
    default:
      return "healthy";
  }
}

function totalStock(p: Product) {
  if (p.variants && p.variants.length) return p.variants.reduce((s, v) => s + v.stock, 0);
  return p.quantity;
}

function value(p: Product) {
  return totalStock(p) * p.price;
}

const GRADIENTS = [
  ["#e8a33d", "#c46f1f"],
  ["#5b8def", "#2663c4"],
  ["#de6b6b", "#b33a3a"],
  ["#4dd0a7", "#2b9e7b"],
  ["#9b6add", "#6d3eb8"],
  ["#f1c357", "#c98f1e"],
  ["#ec7b9a", "#b84a6a"],
  ["#62b4f0", "#2e7abf"],
];

function gradientFor(p: Product) {
  const hash = p.title.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) + (p.id || 0) * 37;
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function productThumb(p: Product) {
  if (p.image_url) return p.image_url;
  const [start, end] = gradientFor(p);
  const code = (p.swatch_code || p.title).substring(0, 2).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><defs><linearGradient id="g" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="${start}"/><stop offset="100%" stop-color="${end}"/></linearGradient></defs><rect width="44" height="44" rx="10" fill="url(#g)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="600" fill="#f3f4f6">${code}</text></svg>`;
  const b64 =
    typeof window !== "undefined"
      ? window.btoa(svg)
      : (globalThis as any).Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${b64}`;
}

export default function InventoryClient({ products: initialProducts }: { products: Product[] }) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [filter, setFilter] = useState<"all" | "critical" | "low" | "out">("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  async function handleImportResult(result: { imported: number; products: Product[]; errors: { row: number; error: string }[] }) {
    setImportOpen(false);
    if (result.imported > 0) {
      setProducts((prev) => [...result.products, ...prev]);
      router.refresh();
    }
  }

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matches = filter === "all" || statusFilterKey(productStatus(p).label) === filter;
      return matches && p.title.toLowerCase().includes(search.toLowerCase());
    });
  }, [products, filter, search]);

  const skuCount = useMemo(() => products.reduce((s, p) => s + (p.variants?.length || 1), 0), [products]);
  const lowCount = products.filter((p) => {
    const st = productStatus(p).label;
    return st === "Low stock" || st === "Critical";
  }).length;
  const outCount = products.filter((p) => productStatus(p).label === "Out of stock").length;
  const totalValue = products.reduce((s, p) => s + value(p), 0);

  async function saveProduct(data: {
    id?: number;
    title: string;
    author: string;
    sku: string;
    category: string;
    price: number;
    quantity: number;
    maxDiscount: number;
    color: string;
    code: string;
    image?: string;
    variants: ProductVariant[];
  }) {
    const payload = {
      title: data.title,
      author: data.author || null,
      description: data.sku,
      price: data.price,
      // variants (if any) are the source of truth for stock; otherwise use
      // the quantity field directly — a product with no variants (e.g. a
      // book) must not have its stock silently zeroed on save.
      quantity: data.variants.length ? data.variants.reduce((s, v) => s + v.stock, 0) : data.quantity,
      max_discount: data.maxDiscount,
      category: data.category,
      swatch_color: data.color,
      swatch_code: data.code,
      image_url: data.image || null,
      variants: data.variants,
    };

    if (data.id) {
      await fetch(`/api/products/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setModalOpen(false);
    setEditing(null);
    router.refresh();
  }

  async function deleteProduct(id: number) {
    if (!confirm("Delete this product? This can't be undone.")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setModalOpen(false);
    setEditing(null);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Total SKUs" value={skuCount.toString()} sub="Across all variants" warn={false} />
        <Kpi label="Low stock" value={lowCount.toString()} sub="Needs restock soon" warn />
        <Kpi label="Inventory value" value={`৳${Math.round(totalValue).toLocaleString()}`} sub="At current stock" warn={false} />
        <Kpi label="Out of stock" value={outCount.toString()} sub="Unsellable variants" warn={false} />
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Inventory table */}
        <div className="col-span-12 bg-oa-surface border border-oa-line-soft rounded-oa-lg overflow-hidden">
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <svg className="h-4 w-4 text-oa-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 8l-9-5-9 5 9 5 9-5z" />
                <path d="M3 8v8l9 5 9-5V8" />
                <path d="M12 13v8" />
              </svg>
              Product inventory
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setImportOpen(true)}
                className="bg-oa-surface-raise border border-oa-line text-oa-text-dim text-xs font-semibold px-3 py-2 rounded-oa-sm flex items-center gap-1.5 hover:text-oa-text hover:border-oa-line-soft transition-all"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                  <path d="M7 11l5 5 5-5" />
                  <path d="M12 4v12" />
                </svg>
                Import CSV
              </button>
              <button
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
                className="bg-oa-primary text-white text-xs font-semibold px-3 py-2 rounded-oa-sm flex items-center gap-1.5 hover:brightness-110 transition-all"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add product
              </button>
            </div>
          </div>

          <div className="px-5 pb-3 flex flex-wrap gap-2">
            {(["all", "critical", "low", "out"] as const).map((f) => {
              const counts: Record<typeof f, number> = {
                all: products.filter((p) => productStatus(p)).length,
                critical: products.filter((p) => productStatus(p).label === "Critical").length,
                low: products.filter((p) => productStatus(p).label === "Low stock").length,
                out: products.filter((p) => productStatus(p).label === "Out of stock").length,
              };
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full border transition-colors",
                    filter === f
                      ? "bg-oa-surface-raise border-oa-line text-oa-text"
                      : "bg-transparent border-transparent text-oa-text-faint hover:bg-oa-surface-hi"
                  )}
                >
                  {f[0].toUpperCase() + f.slice(1)} <span className="font-mono text-oa-gold">{counts[f]}</span>
                </button>
              );
            })}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products"
              className="ml-auto bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-1.5 text-xs outline-none focus:border-oa-primary"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="border-b border-oa-line-soft text-xs text-oa-text-faint">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Product</th>
                  <th className="text-left px-5 py-3 font-medium">Category</th>
                  <th className="text-left px-5 py-3 font-medium">Stock</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-right px-5 py-3 font-medium">Price</th>
                  <th className="text-right px-5 py-3 font-medium">Max Discount</th>
                  <th className="text-right px-5 py-3 font-medium">Value</th>
                  <th className="text-right px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-oa-line-soft">
                {filtered.map((p) => {
                  const status = productStatus(p);
                  const image = productThumb(p);
                  return (
                    <tr key={p.id} className="hover:bg-oa-surface-hi transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <img src={image} alt={p.title} className="h-11 w-11 rounded-[10px] object-cover bg-oa-surface-raise border border-oa-line-soft" />
                          <div>
                            <div className="font-medium">{p.title}</div>
                            {p.author && (
                              <div className="text-[10.5px] text-oa-text-faint">by {p.author}</div>
                            )}
                            <div className="text-[10.5px] text-oa-text-faint font-mono">{p.description || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex bg-oa-surface-raise border border-oa-line rounded-full px-2.5 py-1 text-[11px] text-oa-text-dim">
                          {p.category || "Uncategorized"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-xs">{totalStock(p)} units</span>
                          <div className="h-[5px] w-20 bg-oa-surface-raise rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, (totalStock(p) / 20) * 100)}%`,
                                background:
                                  status.label === "Healthy"
                                    ? "var(--oa-green)"
                                    : status.label === "Low stock"
                                    ? "var(--oa-gold)"
                                    : "var(--oa-red)",
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn("inline-block rounded-full px-2.5 py-1 text-[10.5px] font-mono", status.cls)}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-mono">৳{Number(p.price).toLocaleString()}</td>
                      <td className="px-5 py-3 text-right font-mono text-oa-text-faint">
                        {Number(p.max_discount) > 0 ? `৳${Number(p.max_discount).toLocaleString()}` : "—"}
                      </td>
                      <td className="px-5 py-3 text-right font-mono">৳{Math.round(value(p)).toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditing(p);
                              setModalOpen(true);
                            }}
                            className="ml-1 text-[11px] bg-oa-surface-raise border border-oa-line rounded-oa-sm px-2.5 py-1 hover:bg-oa-primary-dim hover:border-oa-primary transition-colors"
                          >
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-oa-text-dim text-sm">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <ProductModal
          product={editing}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={saveProduct}
          onDelete={deleteProduct}
        />
      )}
      {importOpen && (
        <CsvImportModal
          onClose={() => setImportOpen(false)}
          onComplete={handleImportResult}
        />
      )}
    </div>
  );
}

function Kpi({ label, value, sub, warn }: { label: string; value: string; sub: string; warn: boolean }) {
  return (
    <div className="bg-oa-surface border border-oa-line-soft rounded-oa-md p-4">
      <div className="text-xs text-oa-text-faint">{label}</div>
      <div className={cn("text-[26px] font-semibold font-mono mt-2", warn ? "text-oa-gold" : "text-oa-text")}>{value}</div>
      <div className="text-[11.5px] text-oa-text-faint mt-1">{sub}</div>
    </div>
  );
}

function ProductModal({
  product,
  onClose,
  onSave,
  onDelete,
}: {
  product: Product | null;
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete: (id: number) => void;
}) {
  const [title, setTitle] = useState(product?.title || "");
  const [author, setAuthor] = useState(product?.author || "");
  const [sku, setSku] = useState(product?.description || "");
  const [category, setCategory] = useState(product?.category || "");
  const [price, setPrice] = useState(product?.price?.toString() || "");
  const [quantity, setQuantity] = useState(product?.quantity?.toString() || "0");
  const [maxDiscount, setMaxDiscount] = useState(product?.max_discount?.toString() || "0");
  const [color, setColor] = useState(product?.swatch_color || "#e8a33d");
  const [code, setCode] = useState(product?.swatch_code || "");
  const [image, setImage] = useState(product?.image_url || "");
  const [variants, setVariants] = useState<ProductVariant[]>(product?.variants && product.variants.length ? product.variants : [{ label: "", stock: 0 }]);

  function addVariant() {
    setVariants([...variants, { label: "", stock: 0 }]);
  }

  function removeVariant(idx: number) {
    setVariants(variants.filter((_, i) => i !== idx));
  }

  function updateVariant(idx: number, field: keyof ProductVariant, value: string | number) {
    setVariants(variants.map((v, i) => (i === idx ? { ...v, [field]: value } : v)));
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-oa-surface border border-oa-line rounded-oa-lg w-full max-w-lg max-h-[90vh] overflow-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-oa-line-soft">
          <div className="font-semibold">{product ? "Edit product" : "Add product"}</div>
          <button onClick={onClose} className="text-oa-text-dim hover:text-oa-text">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-oa-text-faint mb-1">Product name</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-2 text-sm outline-none focus:border-oa-primary" />
            </div>
            <div>
              <label className="block text-[11px] text-oa-text-faint mb-1">SKU</label>
              <input value={sku} onChange={(e) => setSku(e.target.value)} className="w-full bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-2 text-sm outline-none focus:border-oa-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-oa-text-faint mb-1">Author</label>
              <input value={author} onChange={(e) => setAuthor(e.target.value)} className="w-full bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-2 text-sm outline-none focus:border-oa-primary" />
            </div>
            <div>
              <label className="block text-[11px] text-oa-text-faint mb-1">Category</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} list="cats" className="w-full bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-2 text-sm outline-none focus:border-oa-primary" />
              <datalist id="cats">
                <option value="Men's Wear" />
                <option value="Women's Wear" />
                <option value="Kids" />
                <option value="Footwear" />
                <option value="Accessories" />
              </datalist>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] text-oa-text-faint mb-1">Unit price (৳)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-2 text-sm outline-none focus:border-oa-primary" />
            </div>
            <div>
              <label className="block text-[11px] text-oa-text-faint mb-1">
                Quantity{variants.filter((v) => v.label.trim()).length > 0 ? " (uses variants below)" : ""}
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={variants.filter((v) => v.label.trim()).length > 0}
                className="w-full bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-2 text-sm outline-none focus:border-oa-primary disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-[11px] text-oa-text-faint mb-1">Max discount (৳)</label>
              <input type="number" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} className="w-full bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-2 text-sm outline-none focus:border-oa-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-oa-text-faint mb-1">Swatch color</label>
              <input value={color} onChange={(e) => setColor(e.target.value)} className="w-full bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-2 text-sm outline-none focus:border-oa-primary" />
            </div>
            <div>
              <label className="block text-[11px] text-oa-text-faint mb-1">Swatch code (2 letters)</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={2} className="w-full bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-2 text-sm outline-none focus:border-oa-primary" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-oa-text-faint mb-1">Image URL (optional)</label>
            <input value={image} onChange={(e) => setImage(e.target.value)} className="w-full bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-2 text-sm outline-none focus:border-oa-primary" />
          </div>
          <div>
            <label className="block text-[11px] text-oa-text-faint mb-1">Variants</label>
            {variants.map((v, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input value={v.label} onChange={(e) => updateVariant(i, "label", e.target.value)} placeholder="Label" className="flex-1 bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-2 text-sm outline-none" />
                <input type="number" value={v.stock} onChange={(e) => updateVariant(i, "stock", Number(e.target.value))} placeholder="Stock" className="w-24 bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-2 text-sm outline-none font-mono" />
                <button onClick={() => removeVariant(i)} className="text-oa-red px-2">Remove</button>
              </div>
            ))}
            <button onClick={addVariant} className="w-full border border-dashed border-oa-line text-oa-text-dim rounded-oa-sm py-2 text-xs hover:border-oa-primary hover:text-oa-primary transition-colors">
              + Add variant
            </button>
          </div>
        </div>
        <div className="p-5 border-t border-oa-line-soft flex items-center justify-between gap-3">
          {product ? (
            <button
              onClick={() => onDelete(product.id)}
              className="px-4 py-2 text-sm text-oa-red border border-oa-red/30 rounded-oa-sm hover:bg-oa-red/10"
            >
              Delete product
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-oa-line rounded-oa-sm hover:bg-oa-surface-hi">Cancel</button>
          <button
            onClick={() =>
              onSave({
                id: product?.id,
                title,
                author,
                sku,
                category,
                price: Number(price),
                quantity: Number(quantity),
                maxDiscount: Number(maxDiscount),
                color,
                code: code.toUpperCase(),
                image,
                variants: variants.filter((v) => v.label.trim()),
              })
            }
            className="px-4 py-2 text-sm bg-oa-primary text-white rounded-oa-sm font-semibold hover:brightness-110"
          >
            Save product
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CsvImportModal({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: (result: { imported: number; products: Product[]; errors: { row: number; error: string }[] }) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; products: Product[]; errors: { row: number; error: string }[] } | null>(null);

  async function upload() {
    if (!file) return;
    setImporting(true);
    setResult(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/settings/catalog/import", { method: "POST", body: form });
    const data = await res.json();
    if (res.ok) {
      setResult(data);
    } else {
      setResult({ imported: 0, products: [], errors: [{ row: 0, error: data.error || "Upload failed" }] });
    }
    setImporting(false);
  }

  function downloadTemplate() {
    const columns = [
      "title",
      "sku",
      "author",
      "category",
      "price",
      "quantity",
      "max_discount",
      "image_url",
      "swatch_color",
      "swatch_code",
      "variants",
    ];
    const example = [
      "Classic Linen Shirt",
      "CL-205",
      "",
      "Men's Wear",
      "1100",
      "8",
      "0",
      "",
      "#5b8def",
      "CL",
      `[{"label":"M","stock":3},{"label":"L","stock":5}]`,
    ];
    const csv = [columns.join(","), example.map((v) => (v.includes(",") ? `"${v}"` : v)).join(",")].join("\n") + "\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product-import-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-oa-surface border border-oa-line rounded-oa-lg w-full max-w-md max-h-[90vh] overflow-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-oa-line-soft">
          <div>
            <div className="font-semibold">Import products from CSV</div>
            <p className="text-xs text-oa-text-faint mt-0.5">Download the template, fill your products, then upload.</p>
          </div>
          <button onClick={onClose} className="text-oa-text-dim hover:text-oa-text">×</button>
        </div>

        <div className="p-5 space-y-5">
          <div className="bg-oa-bg border border-oa-line-soft rounded-oa-md p-4 space-y-3">
            <div className="text-xs text-oa-text-faint">1. Download the template</div>
            <p className="text-[11px] text-oa-text-faint">
              Required columns: <span className="text-oa-text-dim">title, price, quantity</span>. All other columns are optional.
            </p>
            <button
              onClick={downloadTemplate}
              className="bg-oa-surface-raise border border-oa-line text-oa-text-dim hover:text-oa-text hover:border-oa-line-soft text-xs px-3 py-2 rounded-oa-sm flex items-center gap-1.5 transition-colors"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                <path d="M7 11l5 5 5-5" />
                <path d="M12 4v12" />
              </svg>
              Download template
            </button>
          </div>

          <div className="space-y-3">
            <div className="text-xs text-oa-text-faint">2. Upload your CSV</div>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-xs text-oa-text-dim file:mr-3 file:py-2 file:px-3 file:rounded-oa-sm file:border-0 file:bg-oa-surface-raise file:text-oa-text hover:file:bg-oa-surface-hi file:transition-colors"
            />
            <div className="text-[10.5px] text-oa-text-faint font-mono bg-oa-bg border border-oa-line-soft rounded-oa-md p-3">
              Supported columns: title, sku, author, category, price, quantity, max_discount, image_url, swatch_color, swatch_code, variants
            </div>
          </div>

          {result && (
            <div className="bg-oa-bg border border-oa-line-soft rounded-oa-md p-4 space-y-3 text-sm">
              <div className={cn(result.imported > 0 ? "text-oa-green" : "text-oa-text-dim")}>
                Imported {result.imported} product{result.imported === 1 ? "" : "s"}.
              </div>
              {result.errors.length > 0 && (
                <div className="space-y-1">
                  <div className="text-oa-red text-xs">Errors ({result.errors.length})</div>
                  <ul className="max-h-40 overflow-y-auto text-[11px] text-oa-text-dim space-y-1">
                    {result.errors.map((e, i) => (
                      <li key={i}>Row {e.row}: {e.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-oa-line-soft flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-oa-line rounded-oa-sm hover:bg-oa-surface-hi">
            {result && result.imported > 0 ? "Close" : "Cancel"}
          </button>
          {!result && (
            <button
              onClick={upload}
              disabled={importing || !file}
              className="px-4 py-2 text-sm bg-oa-primary text-white rounded-oa-sm font-semibold hover:brightness-110 disabled:opacity-50"
            >
              {importing ? "Importing…" : "Import products"}
            </button>
          )}
          {result && result.imported > 0 && (
            <button
              onClick={() => onComplete(result)}
              className="px-4 py-2 text-sm bg-oa-primary text-white rounded-oa-sm font-semibold hover:brightness-110"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
