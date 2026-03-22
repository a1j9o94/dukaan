import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createOrder = mutation({
  args: {
    items: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
        costPerUnit: v.number(), // paisa
      })
    ),
    taxAmount: v.number(), // paisa
    supplierName: v.optional(v.string()),
    note: v.optional(v.string()),
    purchasedAt: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.items.length === 0) {
      throw new Error("कम से कम एक आइटम जोड़ें");
    }
    const orderId = await ctx.db.insert("purchaseOrders", {
      supplierName: args.supplierName,
      taxAmount: args.taxAmount,
      note: args.note,
      purchasedAt: args.purchasedAt,
    });
    for (const item of args.items) {
      await ctx.db.insert("purchaseItems", {
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        costPerUnit: item.costPerUnit,
      });
    }
    return orderId;
  },
});

export const deleteOrder = mutation({
  args: {
    orderId: v.id("purchaseOrders"),
  },
  handler: async (ctx, args) => {
    // Delete all purchaseItems for this order
    const items = await ctx.db
      .query("purchaseItems")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .take(500);
    for (const item of items) {
      await ctx.db.delete(item._id);
    }
    // Delete the order itself
    await ctx.db.delete(args.orderId);
  },
});

export const getLastPrice = query({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("purchaseItems")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .take(500);

    if (items.length === 0) {
      return null;
    }

    // For each item, look up the order to get purchasedAt
    let latest: { costPerUnit: number; purchasedAt: number } | null = null;
    for (const item of items) {
      const order = await ctx.db.get(item.orderId);
      if (!order) continue;
      if (latest === null || order.purchasedAt > latest.purchasedAt) {
        latest = { costPerUnit: item.costPerUnit, purchasedAt: order.purchasedAt };
      }
    }

    return latest ? latest.costPerUnit : null;
  },
});

export const listRecent = query({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db
      .query("purchaseOrders")
      .withIndex("by_purchasedAt")
      .order("desc")
      .take(10);

    const result = [];
    for (const order of orders) {
      const items = await ctx.db
        .query("purchaseItems")
        .withIndex("by_orderId", (q) => q.eq("orderId", order._id))
        .take(50);

      const enrichedItems = [];
      let subtotal = 0;
      for (const item of items) {
        const product = await ctx.db.get(item.productId);
        subtotal += item.quantity * item.costPerUnit;
        enrichedItems.push({
          ...item,
          productName: product?.name ?? "—",
          productSku: product?.sku ?? "—",
        });
      }

      result.push({
        ...order,
        items: enrichedItems,
        subtotal,
        total: subtotal + order.taxAmount,
        itemCount: items.reduce((s, i) => s + i.quantity, 0),
      });
    }
    return result;
  },
});
