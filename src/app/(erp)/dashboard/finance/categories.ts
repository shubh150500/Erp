// Plain module (NOT "use server") so these constants can be imported by both
// the server action and client components. A "use server" file may only export
// async functions, so category lists must live outside actions.ts.
export const EXPENSE_CATEGORIES = [
  "RENT",
  "SALARY",
  "UTILITIES",
  "ELECTRICITY",
  "INTERNET",
  "SUPPLIES",
  "STATIONERY",
  "BOOKS",
  "FURNITURE",
  "MARKETING",
  "MAINTENANCE",
  "OTHER",
] as const;
