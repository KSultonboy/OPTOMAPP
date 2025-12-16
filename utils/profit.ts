// utils/profit.ts
import { Transaction } from "@/context/AppContext";

type AvgCostMap = Record<string, { qty: number; costTotal: number }>;

export function buildAvgCostMap(transactions: Transaction[]) {
    // acceptance: cost asosida o'rtacha tannarx to'planadi
    const map: AvgCostMap = {};

    for (const t of transactions) {
        if (!t.productId) continue;

        if (!map[t.productId]) map[t.productId] = { qty: 0, costTotal: 0 };

        if (t.type === "acceptance") {
            map[t.productId].qty += t.quantity;
            map[t.productId].costTotal += t.quantity * t.price;
        }
    }
    return map;
}

export function getAvgCost(map: AvgCostMap, productId: string) {
    const v = map[productId];
    if (!v || v.qty <= 0) return 0;
    return v.costTotal / v.qty;
}

export function calcProfit(transactions: Transaction[]) {
    const costMap = buildAvgCostMap(transactions);

    let revenue = 0;
    let cogs = 0;

    for (const t of transactions) {
        if (t.type === "sale") {
            revenue += t.total;
            const avg = getAvgCost(costMap, t.productId);
            cogs += avg * t.quantity; // o'rtacha tannarx bo'yicha
        }
    }

    return {
        revenue,
        cogs,
        profit: revenue - cogs,
    };
}
