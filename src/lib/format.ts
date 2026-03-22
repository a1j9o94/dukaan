const inrFormatter = new Intl.NumberFormat("hi-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const inrFormatterDecimal = new Intl.NumberFormat("hi-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Convert paisa to rupees and format as ₹X,XX,XXX */
export function formatINR(paisa: number, showDecimal = false): string {
  const rupees = paisa / 100;
  return showDecimal ? inrFormatterDecimal.format(rupees) : inrFormatter.format(rupees);
}

/** Convert rupees input to paisa for storage */
export function toPaisa(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Convert paisa to rupees for display */
export function toRupees(paisa: number): number {
  return paisa / 100;
}

const HINDI_MONTHS = [
  "जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून",
  "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर",
];

export function formatHindiMonth(month: number, year: number): string {
  return `${HINDI_MONTHS[month]} ${year}`;
}

export function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const day = d.getDate();
  const month = HINDI_MONTHS[d.getMonth()];
  return `${day} ${month}`;
}

export function formatDateTime(timestamp: number): string {
  const d = new Date(timestamp);
  const day = d.getDate();
  const month = HINDI_MONTHS[d.getMonth()];
  const hours = d.getHours().toString().padStart(2, "0");
  const mins = d.getMinutes().toString().padStart(2, "0");
  return `${day} ${month}, ${hours}:${mins}`;
}

/** Get start/end timestamps for a given month (IST) */
export function getMonthRange(year: number, month: number): { start: number; end: number } {
  // IST is UTC+5:30
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  return { start: start.getTime(), end: end.getTime() };
}
