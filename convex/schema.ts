import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  products: defineTable({
    name: v.string(),
    sku: v.string(),
    category: v.string(), // "sari" | "bangles" | "faul"
    type: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_sku", ["sku"])
    .index("by_category", ["category"]),

  purchaseOrders: defineTable({
    supplierName: v.optional(v.string()),
    taxAmount: v.number(), // paisa
    note: v.optional(v.string()),
    purchasedAt: v.number(),
  })
    .index("by_purchasedAt", ["purchasedAt"]),

  purchaseItems: defineTable({
    orderId: v.id("purchaseOrders"),
    productId: v.id("products"),
    quantity: v.number(),
    costPerUnit: v.number(), // paisa, pre-tax
  })
    .index("by_orderId", ["orderId"])
    .index("by_productId", ["productId"]),

  saleTransactions: defineTable({
    note: v.optional(v.string()),
    soldAt: v.number(),
  })
    .index("by_soldAt", ["soldAt"]),

  saleItems: defineTable({
    transactionId: v.id("saleTransactions"),
    productId: v.id("products"),
    quantity: v.number(),
    salePricePerUnit: v.number(), // paisa
  })
    .index("by_transactionId", ["transactionId"])
    .index("by_productId", ["productId"]),

  expenses: defineTable({
    description: v.string(),
    category: v.string(), // "travel" | "shipping" | "other"
    amount: v.number(), // paisa
    date: v.number(),
    note: v.optional(v.string()),
  })
    .index("by_date", ["date"]),
});
