export async function GET() {
  const headers = [
    "title",
    "price",
    "quantity",
    "sku",
    "category",
    "image_url",
    "swatch_color",
    "swatch_code",
  ];

  const sampleRows = [
    ["Tintin: The Blue Lotus", "450", "18", "TBL-001", "Comics", "https://covers.openlibrary.org/b/id/755245-L.jpg", "", ""],
    ["Harry Potter and the Philosopher's Stone", "650", "30", "HP1-004", "Fantasy", "https://covers.openlibrary.org/b/id/15155833-L.jpg", "", ""],
    ["1984", "400", "28", "OR-009", "Dystopian", "https://covers.openlibrary.org/b/id/9267242-L.jpg", "", ""],
    ["The Great Gatsby", "380", "40", "FG-010", "Classic", "https://covers.openlibrary.org/b/id/10590366-L.jpg", "", ""],
  ];

  const escape = (val: string) => {
    if (/[",\n]/.test(val)) return `"${val.replace(/"/g, '""')}"`;
    return val;
  };

  const lines = [
    headers.join(","),
    ...sampleRows.map((row) => row.map(escape).join(",")),
  ];

  const csv = lines.join("\n") + "\n";

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="openpage-catalog-template.csv"',
    },
  });
}
