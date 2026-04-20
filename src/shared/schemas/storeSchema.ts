import z from "zod";

const StoreSchema = z.object({
  theme: z
    .enum([
      "system",
      "light",
      "dark",
      "dark-glass",
      "light-glass",
      "paper",
      "cappuccino",
      "rainy-slate",
      "night-pine",
      "ashfall",
      "bronze",
    ])
    .default("system"),
  font: z
    .enum([
      "system",
      "arial",
      "verdana",
      "trebuchet",
      "georgia",
      "courier",
      "times",
      "palatino",
      "garamond",
      "tahoma",
      "century",
      "consolas",
    ])
    .default("system"),
  "code-theme": z
    .enum(["Focus", "Balanced", "Eye-Comfort"])
    .default("Balanced"),
});
export type Store = z.infer<typeof StoreSchema>;
export type AppTheme = Store["theme"];
export type AppFont = Store["font"];
export type CodeThemePreference = Store["code-theme"];
export { StoreSchema };
