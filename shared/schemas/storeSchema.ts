import z from "zod";

const StoreSchema = z.object({
  theme: z
    .enum(["system", "light", "dark", "light-warm", "dark-warm"])
    .default("system"),
  "font-family": z
    .enum(["system", "arial", "verdana", "georgia", "garamond", "tahoma"])
    .default("system"),
  "font-size": z.enum(["12", "14", "16", "18", "20", "24"]).default("16"),
  "line-height": z
    .enum(["1.2", "1.3", "1.4", "1.5", "1.6", "1.7"])
    .default("1.5"),
  "code-theme": z
    .enum(["focus", "balanced", "eye-comfort"])
    .default("balanced"),
});
type AppSettings = z.infer<typeof StoreSchema>;
type Theme = AppSettings["theme"];
type FontFamily = AppSettings["font-family"];
type FontSize = AppSettings["font-size"];
type LineHeight = AppSettings["line-height"];
type CodeTheme = AppSettings["code-theme"];
export {
  StoreSchema,
  type AppSettings,
  type CodeTheme,
  type FontFamily,
  type FontSize,
  type LineHeight,
  type Theme,
};
