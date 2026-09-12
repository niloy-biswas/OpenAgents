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
    ['Eid Premium Panjabi', '1650', '12', 'EP-101', "Men's Wear", '', '#d4a373', 'EP'],
    ['Classic Linen Shirt', '1100', '8', 'CL-205', "Men's Wear", '', '#5b8def', 'CL'],
    ['Silk Sharee — Maroon', '3200', '4', 'SS-88', "Women's Wear", '', '#d64b60', 'SR'],
    ['Cotton Polo T-shirt', '550', '28', 'CP-44', "Men's Wear", '', '#3fae7a', 'CP'],
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
