import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createTransaction = mutation({
  args: {
    items: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
        salePricePerUnit: v.number(), // paisa
      })
    ),
    note: v.optional(v.string()),
    soldAt: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.items.length === 0) {
      throw new Error("कम से कम एक आइटम जोड़ें");
    }

    // Validate stock for each item
    for (const item of args.items) {
      const purchased = await ctx.db
        .query("purchaseItems")
        .withIndex("by_productId", (q) => q.eq("productId", item.productId))
        .take(1000);
      const totalPurchased = purchased.reduce((s, i) => s + i.quantity, 0);

      const sold = await ctx.db
        .query("saleItems")
        .withIndex("by_productId", (q) => q.eq("productId", item.productId))
        .take(1000);
      const totalSold = sold.reduce((s, i) => s + i.quantity, 0);

      const stock = totalPurchased - totalSold;
      if (item.quantity > stock) {
        const product = await ctx.db.get(item.productId);
        throw new Error(
          `"${product?.name ?? "उत्पाद"}" का स्टॉक कम है (उपलब्ध: ${stock}, माँगा: ${item.quantity})`
        );
      }
    }

    const transactionId = await ctx.db.insert("saleTransactions", {
      note: args.note,
      soldAt: args.soldAt,
    });
    for (const item of args.items) {
      await ctx.db.insert("saleItems", {
        transactionId,
        productId: item.productId,
        quantity: item.quantity,
        salePricePerUnit: item.salePricePerUnit,
      });
    }
    return transactionId;
  },
});

export const listRecent = query({
  args: {},
  handler: async (ctx) => {
    const transactions = await ctx.db
      .query("saleTransactions")
      .withIndex("by_soldAt")
      .order("desc")
      .take(10);

    const result = [];
    for (const txn of transactions) {
      const items = await ctx.db
        .query("saleItems")
        .withIndex("by_transactionId", (q) => q.eq("transactionId", txn._id))
        .take(50);

      const enrichedItems = [];
      let total = 0;
      for (const item of items) {
        const product = await ctx.db.get(item.productId);
        total += item.quantity * item.salePricePerUnit;
        enrichedItems.push({
          ...item,
          productName: product?.name ?? "—",
          productSku: product?.sku ?? "—",
        });
      }

      result.push({
        ...txn,
        items: enrichedItems,
        total,
        itemCount: items.reduce((s, i) => s + i.quantity, 0),
      });
    }
    return result;
  },
});
