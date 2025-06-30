export const CATEGORIES = [
  "Fight",
  "Date",
  "Fuck",
  "1:1 Hangout",
  "Co-op videogame (eg. split fiction)",
  "Cowork",
  "Hair Playing",
  "Platonic Cuddling",
  "Non-platonic Cuddling",
  "Kareoke",
  "Go to bar",
  "Have child with",
  "Pre-commit to exchange 1% of net worth in 2030",
  "Married at 2035 if not married yet",
  "Platonic anus touching",
] as const;
export type Category = (typeof CATEGORIES)[number];
