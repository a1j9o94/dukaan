import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

export const create = mutation({
  args: {
    name: v.string(),
    sku: v.string(),
    category: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    // Check SKU uniqueness
    const existing = await ctx.db
      .query("products")
      .withIndex("by_sku", (q) => q.eq("sku", args.sku))
      .unique();
    if (existing) {
      throw new Error(`SKU "${args.sku}" पहले से मौजूद है`);
    }
    return await ctx.db.insert("products", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.category) {
      return await ctx.db
        .query("products")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .take(200);
    }
    return await ctx.db.query("products").take(200);
  },
});

export const listWithStock = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const products = args.category
      ? await ctx.db
          .query("products")
          .withIndex("by_category", (q) => q.eq("category", args.category!))
          .take(200)
      : await ctx.db.query("products").take(200);

    const result = [];
    for (const product of products) {
      if (!product.isActive) continue;

      // Calculate stock: SUM(purchaseItems.qty) - SUM(saleItems.qty)
      const purchaseItems = await ctx.db
        .query("purchaseItems")
        .withIndex("by_productId", (q) => q.eq("productId", product._id))
        .take(1000);
      const totalPurchased = purchaseItems.reduce((sum, item) => sum + item.quantity, 0);

      const saleItems = await ctx.db
        .query("saleItems")
        .withIndex("by_productId", (q) => q.eq("productId", product._id))
        .take(1000);
      const totalSold = saleItems.reduce((sum, item) => sum + item.quantity, 0);

      const stock = totalPurchased - totalSold;

      // Calculate weighted average cost (including weighted tax allocation)
      let totalCost = 0;
      for (const pi of purchaseItems) {
        const order = await ctx.db.get(pi.orderId);
        if (!order) continue;
        // Weighted tax: this item's share of tax = (item cost / total order cost) * total tax
        const orderItems = await ctx.db
          .query("purchaseItems")
          .withIndex("by_orderId", (q) => q.eq("orderId", pi.orderId))
          .take(100);
        const totalOrderCost = orderItems.reduce((s, i) => s + i.quantity * i.costPerUnit, 0);
        const itemLineCost = pi.quantity * pi.costPerUnit;
        const taxForItem = totalOrderCost > 0 ? (itemLineCost / totalOrderCost) * order.taxAmount : 0;
        totalCost += itemLineCost + taxForItem;
      }
      const avgCost = totalPurchased > 0 ? Math.round(totalCost / totalPurchased) : 0;

      result.push({
        ...product,
        stock,
        avgCost, // paisa, includes tax
      });
    }

    return result;
  },
});

export const archive = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isActive: false });
  },
});
