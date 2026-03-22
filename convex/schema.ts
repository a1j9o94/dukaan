import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  products: defineTable({
    name: v.string(),
    sku: v.string(),
    category: v.string(),
    type: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_sku", ["sku"])
    .index("by_category", ["category"]),
});
