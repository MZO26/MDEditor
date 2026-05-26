import z from "zod";

const StoreSchema = z.object({
  theme: z
    .enum(["system", "light", "dark", "light-warm", "dark-warm"])
    .catch("system"),
  "font-family": z
    .enum(["system", "arial", "georgia", "garamond"])
    .catch("system"),
  "font-size": z.enum(["16", "18", "20"]).catch("18"),
  "line-height": z.enum(["1.4", "1.5", "1.6"]).catch("1.5"),
  "editor-focus": z.boolean().catch(false),
  spellcheck: z.boolean().catch(false),
  "delete-confirmation": z.boolean().catch(false),
  "code-theme": z.enum(["focus", "balanced", "colorless"]).catch("balanced"),
  highlight: z.enum(["info", "idea", "focus"]).catch("info"),
  "note-item-display": z.enum(["tags", "snippet", "minimal"]).catch("tags"),
  "window-bounds": z
    .object({
      width: z.number().min(1100).catch(1100),
      height: z.number().min(600).catch(600),
      x: z.number().optional(),
      y: z.number().optional(),
    })
    .catch({ width: 1100, height: 600 }),
});

type AppSettings = z.infer<typeof StoreSchema>;
type Spellcheck = AppSettings["spellcheck"];
type DeleteConfirmation = AppSettings["delete-confirmation"];
type EditorFocus = AppSettings["editor-focus"];
type NoteItemDisplay = AppSettings["note-item-display"];
type HighlightTheme = AppSettings["highlight"];
type Theme = AppSettings["theme"];
type FontFamily = AppSettings["font-family"];
type FontSize = AppSettings["font-size"];
type LineHeight = AppSettings["line-height"];
type CodeTheme = AppSettings["code-theme"];
type StyleKeys = Extract<
  keyof AppSettings,
  "theme" | "font-family" | "font-size" | "line-height" | "code-theme"
>;

export {
  StoreSchema,
  type AppSettings,
  type CodeTheme,
  type DeleteConfirmation,
  type EditorFocus,
  type FontFamily,
  type FontSize,
  type HighlightTheme,
  type LineHeight,
  type NoteItemDisplay,
  type Spellcheck,
  type StyleKeys,
  type Theme,
};
