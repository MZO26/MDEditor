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
    .enum(["focus", "balanced", "eye-comfort"])
    .default("balanced"),
});
export type StoreType = z.infer<typeof StoreSchema>;
export type AppTheme = StoreType["theme"];
export type AppFont = StoreType["font"];
export type CodeThemePreference = StoreType["code-theme"];
export { StoreSchema };
