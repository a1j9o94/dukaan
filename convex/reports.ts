import { v } from "convex/values";
import { query } from "./_generated/server";

export const todaySummary = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    // Compute midnight-to-midnight boundaries for today (local-ish via UTC)
    const todayStart = now - (now % 86_400_000);
    const todayEnd = todayStart + 86_400_000;

    const transactions = await ctx.db
      .query("saleTransactions")
      .withIndex("by_soldAt", (q) => q.gte("soldAt", todayStart).lt("soldAt", todayEnd))
      .take(500);

    let revenue = 0;
    let itemsSold = 0;

    for (const txn of transactions) {
      const items = await ctx.db
        .query("saleItems")
        .withIndex("by_transactionId", (q) => q.eq("transactionId", txn._id))
        .take(50);
      for (const item of items) {
        revenue += item.quantity * item.salePricePerUnit;
        itemsSold += item.quantity;
      }
    }

    return {
      salesCount: transactions.length,
      revenue,
      itemsSold,
    };
  },
});

export const monthlyPL = query({
  args: {
    start: v.number(),
    end: v.number(),
  },
  handler: async (ctx, args) => {
    // Get all sale transactions in the month
    const transactions = await ctx.db
      .query("saleTransactions")
      .withIndex("by_soldAt", (q) => q.gte("soldAt", args.start).lt("soldAt", args.end))
      .take(500);

    let totalRevenue = 0;
    let totalCOGS = 0;
    const categoryData: Record<string, { revenue: number; cogs: number }> = {};

    for (const txn of transactions) {
      const saleItems = await ctx.db
        .query("saleItems")
        .withIndex("by_transactionId", (q) => q.eq("transactionId", txn._id))
        .take(50);

      for (const si of saleItems) {
        const revenue = si.quantity * si.salePricePerUnit;
        totalRevenue += revenue;

        // Get product for category
        const product = await ctx.db.get(si.productId);
        const cat = product?.category ?? "unknown";

        if (!categoryData[cat]) {
          categoryData[cat] = { revenue: 0, cogs: 0 };
        }
        categoryData[cat].revenue += revenue;

        // Calculate COGS using weighted average cost (including tax)
        const purchaseItems = await ctx.db
          .query("purchaseItems")
          .withIndex("by_productId", (q) => q.eq("productId", si.productId))
          .take(1000);

        let totalPurchaseCost = 0;
        let totalPurchasedQty = 0;
        for (const pi of purchaseItems) {
          const order = await ctx.db.get(pi.orderId);
          if (!order) continue;
          const orderItems = await ctx.db
            .query("purchaseItems")
            .withIndex("by_orderId", (q) => q.eq("orderId", pi.orderId))
            .take(100);
          const totalQtyInOrder = orderItems.reduce((s, i) => s + i.quantity, 0);
          const taxPerUnit = totalQtyInOrder > 0 ? order.taxAmount / totalQtyInOrder : 0;
          totalPurchaseCost += pi.quantity * (pi.costPerUnit + taxPerUnit);
          totalPurchasedQty += pi.quantity;
        }

        const avgCost = totalPurchasedQty > 0 ? totalPurchaseCost / totalPurchasedQty : 0;
        const cogs = Math.round(si.quantity * avgCost);
        totalCOGS += cogs;
        categoryData[cat].cogs += cogs;
      }
    }

    // Get expenses for the month
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_date", (q) => q.gte("date", args.start).lt("date", args.end))
      .take(200);
    const totalOverhead = expenses.reduce((s, e) => s + e.amount, 0);

    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalOverhead;
    const margin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 10000) / 100 : 0;

    return {
      revenue: totalRevenue,
      cogs: totalCOGS,
      grossProfit,
      overhead: totalOverhead,
      netProfit,
      margin,
      categories: Object.entries(categoryData).map(([cat, data]) => ({
        category: cat,
        revenue: data.revenue,
        cogs: data.cogs,
        profit: data.revenue - data.cogs,
        margin: data.revenue > 0
          ? Math.round(((data.revenue - data.cogs) / data.revenue) * 10000) / 100
          : 0,
      })),
    };
  },
});

export const activityTimeline = query({
  args: {
    start: v.number(),
    end: v.number(),
  },
  handler: async (ctx, args) => {
    const events: Array<{
      type: "purchase" | "sale" | "expense";
      timestamp: number;
      description: string;
      amount: number; // paisa
      itemCount?: number;
    }> = [];

    // Purchases
    const orders = await ctx.db
      .query("purchaseOrders")
      .withIndex("by_purchasedAt", (q) => q.gte("purchasedAt", args.start).lt("purchasedAt", args.end))
      .take(100);
    for (const order of orders) {
      const items = await ctx.db
        .query("purchaseItems")
        .withIndex("by_orderId", (q) => q.eq("orderId", order._id))
        .take(50);
      let total = 0;
      const names: string[] = [];
      for (const item of items) {
        total += item.quantity * item.costPerUnit;
        const product = await ctx.db.get(item.productId);
        if (product) names.push(product.name);
      }
      events.push({
        type: "purchase",
        timestamp: order.purchasedAt,
        description: order.supplierName
          ? `${order.supplierName} — ${names.join(", ")}`
          : names.join(", "),
        amount: total + order.taxAmount,
        itemCount: items.reduce((s, i) => s + i.quantity, 0),
      });
    }

    // Sales
    const transactions = await ctx.db
      .query("saleTransactions")
      .withIndex("by_soldAt", (q) => q.gte("soldAt", args.start).lt("soldAt", args.end))
      .take(100);
    for (const txn of transactions) {
      const items = await ctx.db
        .query("saleItems")
        .withIndex("by_transactionId", (q) => q.eq("transactionId", txn._id))
        .take(50);
      let total = 0;
      const names: string[] = [];
      for (const item of items) {
        total += item.quantity * item.salePricePerUnit;
        const product = await ctx.db.get(item.productId);
        if (product) names.push(product.name);
      }
      events.push({
        type: "sale",
        timestamp: txn.soldAt,
        description: names.join(", "),
        amount: total,
        itemCount: items.reduce((s, i) => s + i.quantity, 0),
      });
    }

    // Expenses
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_date", (q) => q.gte("date", args.start).lt("date", args.end))
      .take(100);
    for (const exp of expenses) {
      events.push({
        type: "expense",
        timestamp: exp.date,
        description: exp.description,
        amount: exp.amount,
      });
    }

    // Sort by timestamp descending
    events.sort((a, b) => b.timestamp - a.timestamp);
    return events;
  },
});
