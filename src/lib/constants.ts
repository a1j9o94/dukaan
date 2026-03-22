export type Category = "sari" | "bangles" | "faul";

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "sari", label: "साड़ी" },
  { value: "bangles", label: "चूड़ियाँ" },
  { value: "faul", label: "फॉल" },
];

export const CATEGORY_LABEL: Record<Category, string> = {
  sari: "साड़ी",
  bangles: "चूड़ियाँ",
  faul: "फॉल",
};

export const TYPES_BY_CATEGORY: Record<Category, string[]> = {
  sari: ["रेशमी", "सूती", "शिफॉन", "जॉर्जेट", "बनारसी", "अन्य"],
  bangles: ["काँच", "लाख", "सोना", "चांदी", "कुंदन", "प्लास्टिक", "अन्य"],
  faul: ["साड़ी फॉल", "ब्लाउज पीस", "अन्य"],
};

export const EXPENSE_CATEGORIES = [
  { value: "travel", label: "यात्रा" },
  { value: "shipping", label: "शिपिंग" },
  { value: "other", label: "अन्य" },
];

export const SKU_PREFIX: Record<Category, string> = {
  sari: "SAR",
  bangles: "BNG",
  faul: "FAL",
};
