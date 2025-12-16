// utils/reportHtml.ts
import { Product, Transaction } from "@/context/AppContext";

export function buildReportHtml(products: Product[], transactions: Transaction[]) {
    const totalInventoryValue = products.reduce(
        (sum, p) => sum + p.stock * (p.salePrice ?? p.price ?? 0),
        0
    );

    const salesTransactions = transactions.filter((t) => t.type === "sale");
    const acceptanceTransactions = transactions.filter((t) => t.type === "acceptance");

    const totalSalesValue = salesTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalAcceptanceValue = acceptanceTransactions.reduce(
        (sum, t) => sum + t.total,
        0
    );

    const netProfit = totalSalesValue - totalAcceptanceValue;

    const rows = transactions
        .slice(0, 20)
        .map((t) => {
            const typeLabel = t.type === "sale" ? "Sotuv" : "Qabul";
            const sign = t.type === "sale" ? "+" : "-";
            const color = t.type === "sale" ? "#4CAF50" : "#2196F3";
            return `
        <tr>
          <td class="date">${new Date(t.date).toLocaleString("uz-UZ")}</td>
          <td>${typeLabel}</td>
          <td>${t.productName}</td>
          <td>${t.quantity}</td>
          <td class="amount" style="color:${color}">${sign}${t.total.toLocaleString()}</td>
        </tr>
      `;
        })
        .join("");

    return `
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body { font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial; padding: 20px; color: #222; }
        h1 { text-align: center; margin: 0 0 18px; }
        .muted { color:#666; font-size: 12px; text-align:center; margin-bottom: 18px; }
        .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
        .box { border:1px solid #e6e6e6; padding:12px; border-radius:12px; background:#fafafa; }
        .k { color:#666; font-weight:600; font-size: 12px; }
        .v { font-weight:800; font-size: 18px; margin-top: 6px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #eee; padding: 10px; font-size: 12px; }
        th { background: #f3f3f3; text-align:left; }
        .amount { text-align:right; font-weight:700; }
        .profit { color:#2e7d32; }
        .loss { color:#c62828; }
      </style>
    </head>
    <body>
      <h1>OptomApp — Moliyaviy Hisobot</h1>
      <div class="muted">Sana: ${new Date().toLocaleDateString("uz-UZ")}</div>

      <div class="grid">
        <div class="box">
          <div class="k">Ombor qiymati (sotuv narxi bo'yicha)</div>
          <div class="v">${totalInventoryValue.toLocaleString()} so'm</div>
        </div>
        <div class="box">
          <div class="k">Umumiy sotuv</div>
          <div class="v">${totalSalesValue.toLocaleString()} so'm</div>
        </div>
        <div class="box">
          <div class="k">Umumiy qabul</div>
          <div class="v">${totalAcceptanceValue.toLocaleString()} so'm</div>
        </div>
        <div class="box">
          <div class="k">Sof foyda (sotuv - qabul)</div>
          <div class="v ${netProfit >= 0 ? "profit" : "loss"}">${netProfit.toLocaleString()} so'm</div>
        </div>
      </div>

      <h3>So'nggi tranzaksiyalar (Top 20)</h3>
      <table>
        <thead>
          <tr>
            <th>Sana</th>
            <th>Tur</th>
            <th>Mahsulot</th>
            <th>Miqdor</th>
            <th>Summa</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </body>
  </html>
  `;
}
