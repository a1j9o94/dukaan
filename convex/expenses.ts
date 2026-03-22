import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    description: v.string(),
    category: v.string(),
    amount: v.number(), // paisa
    date: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("expenses", args);
  },
});

export const listByMonth = query({
  args: {
    start: v.number(),
    end: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("expenses")
      .withIndex("by_date", (q) => q.gte("date", args.start).lt("date", args.end))
      .take(200);
  },
});
