// Plain module (NOT "use server") so these constants can be imported by both
// the server action and client components. A "use server" file may only export
// async functions, so category lists must live outside actions.ts.
export const INCOME_CATEGORIES = [
  "DONATION",
  "BOOK_SALE",
  "UNIFORM",
  "EVENT",
  "RENT_INCOME",
  "OTHER",
] as const;
