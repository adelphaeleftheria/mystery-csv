import { toCSV } from "./csv";
import type { Row } from "../types";
export const samples = [
  {
    id: "mystery",
    name: "The midnight anomaly",
    kind: "FEATURED CASE",
    description: "An ordinary month. One extraordinary night.",
    rows: 720,
    level: "Medium",
    color: "lime",
  },
  {
    id: "sales",
    name: "Beyond the receipt",
    kind: "SALES & ORDERS",
    description: "Follow the money. Find the unexpected.",
    rows: 480,
    level: "Easy",
    color: "peach",
  },
  {
    id: "website",
    name: "The traffic that didn’t convert",
    kind: "WEBSITE ANALYTICS",
    description: "More visitors. A different story underneath.",
    rows: 600,
    level: "Medium",
    color: "purple",
  },
  {
    id: "expenses",
    name: "Something doesn’t add up",
    kind: "PERSONAL EXPENSES",
    description: "Small transactions can leave big clues.",
    rows: 360,
    level: "Easy",
    color: "blue",
  },
];
export function sampleCSV(kind: string, seed = 42) {
  let state = seed >>> 0;
  const rand = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const rows: Row[] = [];
  const count = samples.find((s) => s.id === kind)?.rows || 720;
  for (let i = 0; i < count; i++) {
    const day = 1 + Math.floor(i / 24),
      date = `2025-03-${String(day).padStart(2, "0")}`;
    const region = ["North", "South", "East", "West"][i % 4];
    const spike = kind === "mystery" && day === 17 && region === "West";
    if (kind === "website") {
      const visitors = Math.round(100 + rand() * 300) * (day === 17 ? 9 : 1);
      rows.push({
        date,
        source: ["Organic", "Direct", "Referral", "Social"][i % 4],
        country: ["US", "UK", "DE"][i % 3],
        device: ["Desktop", "Mobile", "Tablet"][i % 3],
        visitors: String(visitors),
        conversions: String(
          Math.round(visitors * (day === 17 ? 0.005 : 0.05 + rand() * 0.04)),
        ),
        revenue: String(
          Math.round(visitors * (day === 17 ? 0.03 : 0.8 + rand())),
        ),
      });
    } else if (kind === "expenses") {
      rows.push({
        date,
        category: ["Food", "Travel", "Home", "Shopping", "Health"][i % 5],
        merchant: [
          "Market & Co",
          "Metro",
          "House Supply",
          "Studio Nine",
          "Pharmacy",
        ][i % 5],
        amount: (i === 188 ? 1890 : 5 + rand() * 95).toFixed(2),
        payment_method: i % 3 ? "Card" : "Cash",
      });
    } else {
      const quantity = spike
          ? 30 + Math.floor(rand() * 20)
          : 1 + Math.floor(rand() * 5),
        unit_price = spike ? 249 : [29, 49, 79, 99][i % 4];
      rows.push({
        date,
        customer: spike
          ? `Customer ${180 + (i % 3)}`
          : `Customer ${1 + Math.floor(rand() * 160)}`,
        product: spike ? "Nocturne" : ["Atlas", "Orbit", "Forma", "Arc"][i % 4],
        category: spike
          ? "Limited edition"
          : ["Essentials", "Accessories"][i % 2],
        region,
        quantity: String(quantity),
        unit_price: String(unit_price),
        revenue: String(quantity * unit_price),
      });
    }
  }
  if (kind === "expenses") {
    rows.push({ ...rows[42] });
    rows[13].amount = "";
    rows[28].amount = "";
  }
  return toCSV(rows, Object.keys(rows[0]));
}
